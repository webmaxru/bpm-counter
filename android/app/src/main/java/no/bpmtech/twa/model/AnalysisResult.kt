package no.bpmtech.twa.model

import io.github.dlepaux.realtimebpmanalyzer.Reading
import io.github.dlepaux.realtimebpmanalyzer.Relation
import java.util.UUID

data class AnalysisResult(
    val id: String = UUID.randomUUID().toString(),
    val bpm: Int,
    val bpmExact: Double,
    val confidence: Double?,
    val candidates: List<Candidate>,
    val mode: Mode,
    val sourceName: String?,
) {
    enum class Mode {
        FILE,
        RECORDING,
        TAP,
        ;

        val title: String
            get() = when (this) {
                FILE -> "File analysis"
                RECORDING -> "Recording analysis"
                TAP -> "Tap tempo"
            }
    }

    data class Candidate(
        val id: String = UUID.randomUUID().toString(),
        val bpm: Int,
        val relation: String,
    )

    val shareText: String
        get() = buildString {
            appendLine("BPM Techno detected $bpm BPM (${mode.title.lowercase()}).")
            confidence?.let { appendLine("Confidence: ${(it * 100).toInt()}%") }
            if (!sourceName.isNullOrBlank()) {
                appendLine("Source: $sourceName")
            }
            append("https://bpmtech.no")
        }

    companion object {
        fun fromReading(
            reading: Reading,
            mode: Mode,
            sourceName: String?,
        ): AnalysisResult = AnalysisResult(
            bpm = reading.bpm(),
            bpmExact = reading.bpmExact(),
            confidence = reading.confidence(),
            candidates = reading.candidates().map { candidate ->
                Candidate(
                    bpm = candidate.bpm(),
                    relation = relationLabel(candidate.relation()),
                )
            },
            mode = mode,
            sourceName = sourceName,
        )

        private fun relationLabel(relation: Relation): String = when (relation) {
            Relation.TOP -> "primary"
            Relation.HALF -> "half"
            Relation.DOUBLE -> "double"
            Relation.OTHER -> "other"
        }
    }
}
