package no.bpmtech.twa.services

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.max

class AudioCaptureService(
    private val scope: CoroutineScope,
) {
    sealed class State {
        data object Idle : State()
        data object Preparing : State()
        data class Recording(val startedAtMs: Long) : State()
        data class LimitReached(val message: String) : State()
        data object Unauthorized : State()
        data class Failed(val message: String) : State()
    }

    private val _state = MutableStateFlow<State>(State.Idle)
    val state: StateFlow<State> = _state.asStateFlow()

    private val _elapsedSeconds = MutableStateFlow(0.0)
    val elapsedSeconds: StateFlow<Double> = _elapsedSeconds.asStateFlow()

    private var recordJob: Job? = null
    private var timerJob: Job? = null
    private val recording = AtomicBoolean(false)
    private val sessionGeneration = AtomicLong(0)
    private val sessionMutex = Mutex()
    private val pcmStream = ByteArrayOutputStream()
    private var sampleRateHz: Int = TARGET_SAMPLE_RATE

    val isRecording: Boolean
        get() = _state.value is State.Recording

    val hasCaptureToAnalyze: Boolean
        get() = _state.value is State.Recording || _state.value is State.LimitReached

    val isBusy: Boolean
        get() = _state.value is State.Preparing || isRecording

    fun hasMicPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED

    fun startRecording(context: Context) {
        if (!hasMicPermission(context)) {
            _state.value = State.Unauthorized
            return
        }
        if (_state.value is State.Preparing || _state.value is State.Recording) {
            return
        }

        _state.value = State.Preparing
        _elapsedSeconds.value = 0.0

        scope.launch {
            sessionMutex.withLock {
                stopActiveSessionLocked()

                val minBuffer = AudioRecord.getMinBufferSize(
                    TARGET_SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                )
                if (minBuffer <= 0) {
                    _state.value = State.Failed("The microphone could not start recording.")
                    return@withLock
                }

                val audioRecord = try {
                    AudioRecord(
                        MediaRecorder.AudioSource.MIC,
                        TARGET_SAMPLE_RATE,
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        max(minBuffer, TARGET_SAMPLE_RATE),
                    )
                } catch (_: SecurityException) {
                    _state.value = State.Unauthorized
                    return@withLock
                }

                if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
                    audioRecord.release()
                    _state.value = State.Failed("The microphone could not start recording.")
                    return@withLock
                }

                val generation = sessionGeneration.incrementAndGet()
                sampleRateHz = audioRecord.sampleRate
                val maxBytes = bytesForDuration(sampleRateHz, MAX_RECORDING_SECONDS)
                synchronized(pcmStream) { pcmStream.reset() }
                recording.set(true)
                val startedAt = System.currentTimeMillis()
                _state.value = State.Recording(startedAt)

                timerJob = scope.launch {
                    while (isActive && recording.get() && sessionGeneration.get() == generation) {
                        _elapsedSeconds.value = (System.currentTimeMillis() - startedAt) / 1000.0
                        delay(200)
                    }
                }

                recordJob = scope.launch(Dispatchers.IO) {
                    val buffer = ShortArray(minBuffer / 2)
                    try {
                        audioRecord.startRecording()
                        while (
                            recording.get() &&
                            sessionGeneration.get() == generation &&
                            isActive
                        ) {
                            val read = audioRecord.read(buffer, 0, buffer.size)
                            if (read > 0) {
                                val bytes = ByteBuffer.allocate(read * 2)
                                    .order(ByteOrder.LITTLE_ENDIAN)
                                for (i in 0 until read) {
                                    bytes.putShort(buffer[i])
                                }
                                val chunk = bytes.array()
                                val shouldStop: Boolean
                                synchronized(pcmStream) {
                                    if (pcmStream.size() + chunk.size > maxBytes) {
                                        val remaining = (maxBytes - pcmStream.size()).coerceAtLeast(0)
                                        if (remaining > 0) {
                                            pcmStream.write(chunk, 0, remaining)
                                        }
                                        shouldStop = true
                                    } else {
                                        pcmStream.write(chunk)
                                        shouldStop = false
                                    }
                                }
                                if (shouldStop) {
                                    recording.set(false)
                                    _state.value = State.LimitReached(
                                        "Recording stopped at the ${MAX_RECORDING_SECONDS / 60}-minute limit. Analyze the clip or start a shorter take.",
                                    )
                                    break
                                }
                            } else if (read < 0) {
                                _state.value = State.Failed("Microphone read failed.")
                                break
                            }
                        }
                    } catch (error: Exception) {
                        if (sessionGeneration.get() == generation) {
                            _state.value = State.Failed(error.message ?: "Recording failed.")
                        }
                    } finally {
                        try {
                            audioRecord.stop()
                        } catch (_: Exception) {
                        }
                        audioRecord.release()
                    }
                }
            }
        }
    }

    suspend fun stopRecording(): DecodedAudio? {
        return sessionMutex.withLock {
            val previous = _state.value
            val bytes = stopActiveSessionLocked()
            _elapsedSeconds.value = 0.0
            if (previous !is State.Failed) {
                _state.value = State.Idle
            }
            if (bytes.isEmpty()) return@withLock null

            withContext(Dispatchers.Default) {
                val shortCount = bytes.size / 2
                val samples = FloatArray(shortCount)
                val buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
                for (i in 0 until shortCount) {
                    samples[i] = buffer.short / 32768f
                }
                DecodedAudio(samples = samples, sampleRate = sampleRateHz.toDouble())
            }
        }
    }

    fun cancel() {
        scope.launch {
            sessionMutex.withLock {
                stopActiveSessionLocked()
                _elapsedSeconds.value = 0.0
                _state.value = State.Idle
            }
        }
    }

    private suspend fun stopActiveSessionLocked(): ByteArray {
        recording.set(false)
        sessionGeneration.incrementAndGet()
        val activeRecordJob = recordJob
        val activeTimerJob = timerJob
        recordJob = null
        timerJob = null
        activeTimerJob?.cancel()
        activeRecordJob?.join()
        return synchronized(pcmStream) {
            val bytes = pcmStream.toByteArray()
            pcmStream.reset()
            bytes
        }
    }

    companion object {
        const val TARGET_SAMPLE_RATE = 44_100
        const val MAX_RECORDING_SECONDS = 10 * 60

        private fun bytesForDuration(sampleRate: Int, seconds: Int): Int =
            sampleRate * seconds * 2 // mono PCM16
    }
}
