package no.bpmtech.twa.services

import android.media.AudioManager
import android.media.ToneGenerator
import android.os.SystemClock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.min
import kotlin.math.round

class MetronomeEngine(
    private val scope: CoroutineScope,
) {
    private val _bpm = MutableStateFlow(120.0)
    val bpm: StateFlow<Double> = _bpm.asStateFlow()

    private val _beatsPerBar = MutableStateFlow(4)
    val beatsPerBar: StateFlow<Int> = _beatsPerBar.asStateFlow()

    private val _isRunning = MutableStateFlow(false)
    val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()

    private val _currentBeat = MutableStateFlow(-1)
    val currentBeat: StateFlow<Int> = _currentBeat.asStateFlow()

    private var tickJob: Job? = null
    private var beatIndex = 0
    private var toneGenerator: ToneGenerator? = null

    fun setBpm(value: Double) {
        _bpm.value = clamp(value)
    }

    fun setBeatsPerBar(value: Int) {
        _beatsPerBar.value = value.coerceIn(1, 8)
    }

    fun start() {
        stop()
        toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 85)
        beatIndex = 0
        _currentBeat.value = -1
        _isRunning.value = true

        tickJob = scope.launch {
            var nextAt = SystemClock.elapsedRealtime()
            while (isActive && _isRunning.value) {
                tick()
                val intervalMs = (60_000.0 / clamp(_bpm.value)).toLong().coerceAtLeast(1L)
                nextAt += intervalMs
                val delayMs = nextAt - SystemClock.elapsedRealtime()
                if (delayMs > 0) {
                    delay(delayMs)
                } else {
                    nextAt = SystemClock.elapsedRealtime()
                }
            }
        }
    }

    fun stop() {
        tickJob?.cancel()
        tickJob = null
        _isRunning.value = false
        _currentBeat.value = -1
        beatIndex = 0
        toneGenerator?.release()
        toneGenerator = null
    }

    fun release() {
        stop()
    }

    private fun tick() {
        val bar = max(_beatsPerBar.value, 1)
        val accented = beatIndex % bar == 0
        val tone = if (accented) {
            ToneGenerator.TONE_PROP_BEEP
        } else {
            ToneGenerator.TONE_PROP_BEEP2
        }
        toneGenerator?.startTone(tone, 35)
        _currentBeat.value = beatIndex % bar
        beatIndex += 1
    }

    companion object {
        const val MIN_BPM = 30.0
        const val MAX_BPM = 300.0

        fun clamp(value: Double): Double =
            min(MAX_BPM, max(MIN_BPM, round(value * 10.0) / 10.0))
    }
}
