package no.bpmtech.twa.services

import android.content.Context
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
    private const val MAX_DURATION_SECONDS = 10 * 60

    fun decodeMono(context: Context, uri: Uri): DecodedAudio {
        val extractor = MediaExtractor()
        try {
            extractor.setDataSource(context, uri, null)
            val trackIndex = selectAudioTrack(extractor)
                ?: throw AudioDecodeException("No audio track found in the selected file.")
            extractor.selectTrack(trackIndex)

            val format = extractor.getTrackFormat(trackIndex)
            val mime = format.getString(MediaFormat.KEY_MIME)
                ?: throw AudioDecodeException("Unsupported audio format.")
            val sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE).toDouble()
            val channelCount = if (format.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
                format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
            } else {
                1
            }

            val codec = MediaCodec.createDecoderByType(mime)
            codec.configure(format, null, null, 0)
            codec.start()

            val pcmChunks = ArrayList<FloatArray>()
            var totalSamples = 0
            val maxSamples = (sampleRate * MAX_DURATION_SECONDS).toInt()
            val bufferInfo = MediaCodec.BufferInfo()
            var inputDone = false
            var outputDone = false

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
                    MediaCodec.INFO_TRY_AGAIN_LATER,
                    MediaCodec.INFO_OUTPUT_FORMAT_CHANGED,
                    -> Unit

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
                                )
                                if (chunk.isNotEmpty()) {
                                    val remaining = maxSamples - totalSamples
                                    if (remaining <= 0) {
                                        outputDone = true
                                    } else {
                                        val clipped = if (chunk.size > remaining) {
                                            chunk.copyOf(remaining)
                                        } else {
                                            chunk
                                        }
                                        pcmChunks.add(clipped)
                                        totalSamples += clipped.size
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

            codec.stop()
            codec.release()

            if (totalSamples == 0) {
                throw AudioDecodeException("Audio decoding produced no samples.")
            }

            val samples = FloatArray(totalSamples)
            var offset = 0
            for (chunk in pcmChunks) {
                System.arraycopy(chunk, 0, samples, offset, chunk.size)
                offset += chunk.size
            }

            return DecodedAudio(samples = samples, sampleRate = sampleRate)
        } catch (error: AudioDecodeException) {
            throw error
        } catch (error: Exception) {
            throw AudioDecodeException(
                error.message ?: "The selected audio file could not be decoded.",
                error,
            )
        } finally {
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
    ): FloatArray {
        val ordered = buffer.order(ByteOrder.nativeOrder())
        ordered.position(offset)
        ordered.limit(offset + size)

        val shortCount = size / 2
        if (shortCount == 0) return FloatArray(0)

        val channels = channelCount.coerceAtLeast(1)
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
        return mono
    }
}

class AudioDecodeException(
    message: String,
    cause: Throwable? = null,
) : Exception(message, cause)
