package no.bpmtech.twa.services

import android.content.Context
import android.net.Uri
import io.github.dlepaux.realtimebpmanalyzer.AnalysisOptions
import io.github.dlepaux.realtimebpmanalyzer.BpmAnalyzer
import io.github.dlepaux.realtimebpmanalyzer.Engine
import io.github.dlepaux.realtimebpmanalyzer.OutOfRangeException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import no.bpmtech.twa.model.AnalysisResult

sealed class BpmAnalysisError(message: String) : Exception(message) {
    class CannotDecode : BpmAnalysisError("Audio decoding failed.")
    class NoTempoFound :
        BpmAnalysisError("No clear tempo was found. Try a longer clip with a steadier beat.")

    class AnalysisFailed(detail: String) : BpmAnalysisError(detail)
}

class BpmAnalysisService {
    suspend fun analyzeUri(
        context: Context,
        uri: Uri,
        mode: AnalysisResult.Mode,
        sourceName: String?,
        usePeaksEngine: Boolean = false,
    ): AnalysisResult = withContext(Dispatchers.Default) {
        val decoded = try {
            AudioDecoder.decodeMono(context, uri)
        } catch (error: AudioDecodeException) {
            throw BpmAnalysisError.CannotDecode().also { it.initCause(error) }
        }

        analyzeSamples(
            samples = decoded.samples,
            sampleRate = decoded.sampleRate,
            mode = mode,
            sourceName = sourceName,
            usePeaksEngine = usePeaksEngine,
        )
    }

    suspend fun analyzeSamples(
        samples: FloatArray,
        sampleRate: Double,
        mode: AnalysisResult.Mode,
        sourceName: String?,
        usePeaksEngine: Boolean = false,
    ): AnalysisResult = withContext(Dispatchers.Default) {
        if (samples.isEmpty()) {
            throw BpmAnalysisError.CannotDecode()
        }

        val options = if (usePeaksEngine) {
            AnalysisOptions.DEFAULT.withEngine(Engine.PEAKS)
        } else {
            AnalysisOptions.DEFAULT
        }

        try {
            val reading = BpmAnalyzer.analyzeChannelData(samples, sampleRate, options)
                ?: throw BpmAnalysisError.NoTempoFound()
            AnalysisResult.fromReading(reading, mode, sourceName)
        } catch (error: BpmAnalysisError) {
            throw error
        } catch (error: OutOfRangeException) {
            throw BpmAnalysisError.AnalysisFailed(error.message ?: "Sample rate out of range.")
        } catch (error: IllegalArgumentException) {
            throw BpmAnalysisError.AnalysisFailed(error.message ?: "Invalid audio samples.")
        } catch (error: Exception) {
            throw BpmAnalysisError.AnalysisFailed("Audio BPM analysis failed.")
                .also { it.initCause(error) }
        }
    }
}
