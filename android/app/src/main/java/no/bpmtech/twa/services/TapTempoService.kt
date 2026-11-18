package no.bpmtech.twa.services

class TapTempoService {
    private val taps = ArrayList<Double>()

    val tapTimes: List<Double>
        get() = taps.toList()

    fun tap(atSeconds: Double = System.nanoTime() / 1_000_000_000.0) {
        val last = taps.lastOrNull()
        if (last != null && atSeconds - last > RESET_GAP_SECONDS) {
            taps.clear()
            taps.add(atSeconds)
            return
        }

        taps.add(atSeconds)
        if (taps.size > MAX_TAPS) {
            taps.subList(0, taps.size - MAX_TAPS).clear()
        }
    }

    fun reset() {
        taps.clear()
    }

    val bpm: Double?
        get() = calculateBpm(taps)

    companion object {
        const val MAX_TAPS = 8
        const val RESET_GAP_SECONDS = 2.5

        fun calculateBpm(tapTimes: List<Double>): Double? {
            if (tapTimes.size < 2) return null
            val intervals = tapTimes.zipWithNext { a, b -> b - a }
            val average = intervals.average()
            if (!average.isFinite() || average <= 0.0) return null
            return kotlin.math.round((60.0 / average) * 10.0) / 10.0
        }
    }
}
