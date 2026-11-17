import AVFoundation
import Foundation
import RealtimeBpmAnalyzer

enum BpmAnalysisError: LocalizedError, Equatable {
    case cannotOpenFile
    case cannotDecodeAudio
    case noTempoFound
    case analysisFailed(String)

    var errorDescription: String? {
        switch self {
        case .cannotOpenFile:
            return "The selected audio file could not be opened."
        case .cannotDecodeAudio:
            return "Audio decoding failed."
        case .noTempoFound:
            return "No clear tempo was found. Try a longer clip with a steadier beat."
        case .analysisFailed(let message):
            return message
        }
    }
}

struct BpmAnalysisService: Sendable {
    func analyzeFile(
        at url: URL,
        mode: AnalysisResult.Mode,
        sourceName: String?,
        options: AnalysisOptions = AnalysisOptions()
    ) async throws -> AnalysisResult {
        try await Task.detached(priority: .userInitiated) {
            let needsAccess = url.startAccessingSecurityScopedResource()
            defer {
                if needsAccess {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            let file: AVAudioFile
            do {
                file = try AVAudioFile(forReading: url)
            } catch {
                throw BpmAnalysisError.cannotOpenFile
            }

            guard
                let buffer = AVAudioPCMBuffer(
                    pcmFormat: file.processingFormat,
                    frameCapacity: AVAudioFrameCount(file.length)
                ),
                let channels = buffer.floatChannelData
            else {
                throw BpmAnalysisError.cannotDecodeAudio
            }

            do {
                try file.read(into: buffer)
            } catch {
                throw BpmAnalysisError.cannotDecodeAudio
            }

            let sampleCount = Int(buffer.frameLength)
            guard sampleCount > 0 else {
                throw BpmAnalysisError.cannotDecodeAudio
            }

            var selectedChannel = 0
            var maximumEnergy = 0.0
            for channelIndex in 0..<Int(buffer.format.channelCount) {
                let samples = UnsafeBufferPointer(start: channels[channelIndex], count: sampleCount)
                let energy = samples.reduce(0.0) { total, sample in
                    total + Double(sample) * Double(sample)
                }
                if energy > maximumEnergy {
                    maximumEnergy = energy
                    selectedChannel = channelIndex
                }
            }
            let samples = UnsafeBufferPointer(start: channels[selectedChannel], count: sampleCount)

            do {
                guard let reading = try analyzeChannelData(
                    samples,
                    sampleRate: file.processingFormat.sampleRate,
                    options: options
                ) else {
                    throw BpmAnalysisError.noTempoFound
                }

                return AnalysisResult(
                    reading: reading,
                    mode: mode,
                    sourceName: sourceName
                )
            } catch let error as AnalysisError {
                throw BpmAnalysisError.analysisFailed(error.localizedDescription)
            } catch let error as BpmAnalysisError {
                throw error
            } catch {
                throw BpmAnalysisError.analysisFailed("Audio BPM analysis failed.")
            }
        }.value
    }
}
