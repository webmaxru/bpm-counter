package no.bpmtech.twa.services

import android.content.Context
import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.min

data class DecodedAudio(
    val samples: FloatArray,
    val sampleRate: Double,
)

/**
 * Decodes an audio Uri to mono float PCM in [-1, 1] for Realtime BPM Analyzer.
 */
object AudioDecoder {
    private const val TIMEOUT_US = 10_000L
    private const val MAX_DURATION_SECONDS = 3 * 60
    private const val TARGET_ANALYSIS_RATE = 44_100.0
    private const val MAX_ANALYSIS_SAMPLES =
        (TARGET_ANALYSIS_RATE * MAX_DURATION_SECONDS).toInt()

    fun decodeMono(context: Context, uri: Uri): DecodedAudio {
        val extractor = MediaExtractor()
        var codec: MediaCodec? = null
        try {
            extractor.setDataSource(context, uri, null)
            val trackIndex = selectAudioTrack(extractor)
                ?: throw AudioDecodeException("No audio track found in the selected file.")
            extractor.selectTrack(trackIndex)

            val trackFormat = extractor.getTrackFormat(trackIndex)
            val mime = trackFormat.getString(MediaFormat.KEY_MIME)
                ?: throw AudioDecodeException("Unsupported audio format.")

            codec = MediaCodec.createDecoderByType(mime)
            codec.configure(trackFormat, null, null, 0)
            codec.start()

            var sampleRate = if (trackFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
                trackFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE).toDouble()
            } else {
                TARGET_ANALYSIS_RATE
            }
            var channelCount = if (trackFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
                trackFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
            } else {
                1
            }
            var pcmEncoding = AudioFormat.ENCODING_PCM_16BIT

            // Single growable buffer avoids retaining pcmChunks + a second full-track copy.
            var samples = FloatArray(min(MAX_ANALYSIS_SAMPLES, sampleRate.toInt() * 8))
            var totalSamples = 0
            val bufferInfo = MediaCodec.BufferInfo()
            var inputDone = false
            var outputDone = false
            var hitLimit = false

            while (!outputDone) {
                if (!inputDone) {
                    val inputIndex = codec.dequeueInputBuffer(TIMEOUT_US)
                    if (inputIndex >= 0) {
                        val inputBuffer = codec.getInputBuffer(inputIndex)
                            ?: throw AudioDecodeException("Audio decoding failed.")
                        val sampleSize = extractor.readSampleData(inputBuffer, 0)
                        if (sampleSize < 0) {
                            codec.queueInputBuffer(
                                inputIndex,
                                0,
                                0,
                                0L,
                                MediaCodec.BUFFER_FLAG_END_OF_STREAM,
                            )
                            inputDone = true
                        } else {
                            codec.queueInputBuffer(
                                inputIndex,
                                0,
                                sampleSize,
                                extractor.sampleTime,
                                0,
                            )
                            extractor.advance()
                        }
                    }
                }

                when (val outputIndex = codec.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)) {
                    MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
                    MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        val outputFormat = codec.outputFormat
                        if (outputFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
                            sampleRate = outputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE).toDouble()
                        }
                        if (outputFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
                            channelCount = outputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
                        }
                        if (outputFormat.containsKey(MediaFormat.KEY_PCM_ENCODING)) {
                            pcmEncoding = outputFormat.getInteger(MediaFormat.KEY_PCM_ENCODING)
                        }
                    }

                    else -> {
                        if (outputIndex >= 0) {
                            if (bufferInfo.size > 0) {
                                val outputBuffer = codec.getOutputBuffer(outputIndex)
                                    ?: throw AudioDecodeException("Audio decoding failed.")
                                val chunk = pcmToMonoFloat(
                                    outputBuffer,
                                    bufferInfo.offset,
                                    bufferInfo.size,
                                    channelCount,
                                    pcmEncoding,
                                )
                                if (chunk.isNotEmpty()) {
                                    val remaining = MAX_ANALYSIS_SAMPLES - totalSamples
                                    if (remaining <= 0) {
                                        hitLimit = true
                                        outputDone = true
                                    } else {
                                        val toCopy = min(chunk.size, remaining)
                                        if (totalSamples + toCopy > samples.size) {
                                            val next = FloatArray(
                                                min(
                                                    MAX_ANALYSIS_SAMPLES,
                                                    maxOf(samples.size * 2, totalSamples + toCopy),
                                                ),
                                            )
                                            System.arraycopy(samples, 0, next, 0, totalSamples)
                                            samples = next
                                        }
                                        System.arraycopy(chunk, 0, samples, totalSamples, toCopy)
                                        totalSamples += toCopy
                                        if (toCopy < chunk.size) {
                                            hitLimit = true
                                            outputDone = true
                                        }
                                    }
                                }
                            }
                            codec.releaseOutputBuffer(outputIndex, false)
                            if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                                outputDone = true
                            }
                        }
                    }
                }
            }

            if (totalSamples == 0) {
                throw AudioDecodeException("Audio decoding produced no samples.")
            }
            if (hitLimit && totalSamples < MAX_ANALYSIS_SAMPLES / 4) {
                throw AudioDecodeException(
                    "That audio file is too long to analyze in memory. Trim it to about ${MAX_DURATION_SECONDS / 60} minutes or shorter.",
                )
            }

            val mono = if (totalSamples == samples.size) samples else samples.copyOf(totalSamples)
            val analysisRate = if (sampleRate > TARGET_ANALYSIS_RATE * 1.1) {
                // Downsample high-rate inputs so analyzer working set stays bounded.
                downsample(mono, sampleRate, TARGET_ANALYSIS_RATE)
            } else {
                DecodedAudio(mono, sampleRate)
            }
            return analysisRate
        } catch (error: AudioDecodeException) {
            throw error
        } catch (error: Exception) {
            throw AudioDecodeException(
                error.message ?: "The selected audio file could not be decoded.",
                error,
            )
        } finally {
            try {
                codec?.stop()
            } catch (_: Exception) {
            }
            try {
                codec?.release()
            } catch (_: Exception) {
            }
            extractor.release()
        }
    }

    private fun selectAudioTrack(extractor: MediaExtractor): Int? {
        for (i in 0 until extractor.trackCount) {
            val mime = extractor.getTrackFormat(i).getString(MediaFormat.KEY_MIME) ?: continue
            if (mime.startsWith("audio/")) {
                return i
            }
        }
        return null
    }

    private fun pcmToMonoFloat(
        buffer: ByteBuffer,
        offset: Int,
        size: Int,
        channelCount: Int,
        pcmEncoding: Int,
    ): FloatArray {
        val ordered = buffer.order(ByteOrder.nativeOrder())
        ordered.position(offset)
        ordered.limit(offset + size)
        val channels = channelCount.coerceAtLeast(1)

        return when (pcmEncoding) {
            AudioFormat.ENCODING_PCM_FLOAT -> {
                val floatCount = size / 4
                if (floatCount == 0) return FloatArray(0)
                val frameCount = floatCount / channels
                val mono = FloatArray(frameCount)
                var index = 0
                for (frame in 0 until frameCount) {
                    var sum = 0f
                    for (channel in 0 until channels) {
                        if (index >= floatCount) break
                        sum += ordered.getFloat(offset + index * 4)
                        index++
                    }
                    mono[frame] = sum / channels
                }
                mono
            }

            else -> {
                val shortCount = size / 2
                if (shortCount == 0) return FloatArray(0)
                val frameCount = shortCount / channels
                val mono = FloatArray(frameCount)
                var shortIndex = 0
                for (frame in 0 until frameCount) {
                    var sum = 0f
                    for (channel in 0 until channels) {
                        if (shortIndex >= shortCount) break
                        sum += ordered.getShort(offset + shortIndex * 2) / 32768f
                        shortIndex++
                    }
                    mono[frame] = sum / channels
                }
                mono
            }
        }
    }

    private fun downsample(
        samples: FloatArray,
        sourceRate: Double,
        targetRate: Double,
    ): DecodedAudio {
        if (sourceRate <= targetRate || samples.isEmpty()) {
            return DecodedAudio(samples, sourceRate)
        }
        val ratio = sourceRate / targetRate
        val outCount = min(MAX_ANALYSIS_SAMPLES, (samples.size / ratio).toInt().coerceAtLeast(1))
        val out = FloatArray(outCount)
        var sourceIndex = 0.0
        for (i in 0 until outCount) {
            val index = sourceIndex.toInt().coerceIn(0, samples.lastIndex)
            out[i] = samples[index]
            sourceIndex += ratio
        }
        return DecodedAudio(out, targetRate)
    }
}

class AudioDecodeException(
    message: String,
    cause: Throwable? = null,
) : Exception(message, cause)
