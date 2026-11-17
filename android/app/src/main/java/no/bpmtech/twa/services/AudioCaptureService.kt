package no.bpmtech.twa.services

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.max

class AudioCaptureService(
    private val scope: CoroutineScope,
) {
    sealed class State {
        data object Idle : State()
        data object Preparing : State()
        data class Recording(val startedAtMs: Long) : State()
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
    private val pcmStream = ByteArrayOutputStream()
    private var sampleRateHz: Int = TARGET_SAMPLE_RATE

    val isRecording: Boolean
        get() = _state.value is State.Recording

    fun hasMicPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED

    fun startRecording(context: Context) {
        if (!hasMicPermission(context)) {
            _state.value = State.Unauthorized
            return
        }

        cancelInternal(clearState = false)
        _state.value = State.Preparing
        _elapsedSeconds.value = 0.0
        pcmStream.reset()

        val minBuffer = AudioRecord.getMinBufferSize(
            TARGET_SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        if (minBuffer <= 0) {
            _state.value = State.Failed("The microphone could not start recording.")
            return
        }

        val audioRecord = try {
            AudioRecord(
                MediaRecorder.AudioSource.MIC,
                TARGET_SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                max(minBuffer, TARGET_SAMPLE_RATE),
            )
        } catch (error: SecurityException) {
            _state.value = State.Unauthorized
            return
        }

        if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
            audioRecord.release()
            _state.value = State.Failed("The microphone could not start recording.")
            return
        }

        sampleRateHz = audioRecord.sampleRate
        recording.set(true)
        val startedAt = System.currentTimeMillis()
        _state.value = State.Recording(startedAt)

        timerJob = scope.launch {
            while (isActive && recording.get()) {
                _elapsedSeconds.value = (System.currentTimeMillis() - startedAt) / 1000.0
                delay(200)
            }
        }

        recordJob = scope.launch(Dispatchers.IO) {
            val buffer = ShortArray(minBuffer / 2)
            try {
                audioRecord.startRecording()
                while (recording.get()) {
                    val read = audioRecord.read(buffer, 0, buffer.size)
                    if (read > 0) {
                        val bytes = ByteBuffer.allocate(read * 2)
                            .order(ByteOrder.LITTLE_ENDIAN)
                        for (i in 0 until read) {
                            bytes.putShort(buffer[i])
                        }
                        synchronized(pcmStream) {
                            pcmStream.write(bytes.array())
                        }
                    } else if (read < 0) {
                        _state.value = State.Failed("Microphone read failed.")
                        break
                    }
                }
            } catch (error: Exception) {
                _state.value = State.Failed(error.message ?: "Recording failed.")
            } finally {
                try {
                    audioRecord.stop()
                } catch (_: Exception) {
                }
                audioRecord.release()
            }
        }
    }

    suspend fun stopRecording(): DecodedAudio? {
        recording.set(false)
        recordJob?.join()
        timerJob?.cancel()
        recordJob = null
        timerJob = null

        val bytes = synchronized(pcmStream) { pcmStream.toByteArray() }
        pcmStream.reset()
        _elapsedSeconds.value = 0.0
        _state.value = State.Idle

        if (bytes.isEmpty()) return null

        return withContext(Dispatchers.Default) {
            val shortCount = bytes.size / 2
            val samples = FloatArray(shortCount)
            val buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
            for (i in 0 until shortCount) {
                samples[i] = buffer.short / 32768f
            }
            DecodedAudio(samples = samples, sampleRate = sampleRateHz.toDouble())
        }
    }

    fun cancel() {
        cancelInternal(clearState = true)
    }

    private fun cancelInternal(clearState: Boolean) {
        recording.set(false)
        recordJob?.cancel()
        timerJob?.cancel()
        recordJob = null
        timerJob = null
        synchronized(pcmStream) { pcmStream.reset() }
        _elapsedSeconds.value = 0.0
        if (clearState) {
            _state.value = State.Idle
        }
    }

    companion object {
        const val TARGET_SAMPLE_RATE = 44_100
    }
}
