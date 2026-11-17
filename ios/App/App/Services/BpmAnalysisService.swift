import AVFoundation
import Foundation
import RealtimeBpmAnalyzer

enum BpmAnalysisError: LocalizedError, Equatable {
    case cannotOpenFile
    case cannotDecodeAudio
    case fileTooLong
    case noTempoFound
    case analysisFailed(String)

    var errorDescription: String? {
        switch self {
        case .cannotOpenFile:
            return "The selected audio file could not be opened."
        case .cannotDecodeAudio:
            return "Audio decoding failed."
        case .fileTooLong:
            return "That audio file is too long to analyze in memory. Trim it to about 10 minutes or shorter."
        case .noTempoFound:
            return "No clear tempo was found. Try a longer clip with a steadier beat."
        case .analysisFailed(let message):
            return message
        }
    }
}

struct BpmAnalysisService: Sendable {
    /// Cap decoded PCM so a long mix cannot OOM the process (~10 min mono float @ 48 kHz ≈ 110 MB/channel).
    static let maximumAnalysisDuration: TimeInterval = 10 * 60

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

            let sampleRate = file.processingFormat.sampleRate
            guard sampleRate > 0 else {
                throw BpmAnalysisError.cannotDecodeAudio
            }

            let maximumFrames = AVAudioFrameCount(
                min(
                    Double(AVAudioFrameCount.max),
                    Self.maximumAnalysisDuration * sampleRate
                )
            )
            let fileLength = AVAudioFramePosition(file.length)
            guard fileLength > 0 else {
                throw BpmAnalysisError.cannotDecodeAudio
            }
            if fileLength > AVAudioFramePosition(maximumFrames) {
                throw BpmAnalysisError.fileTooLong
            }

            let framesToRead = AVAudioFrameCount(fileLength)
            guard
                let buffer = AVAudioPCMBuffer(
                    pcmFormat: file.processingFormat,
                    frameCapacity: framesToRead
                ),
                let channels = buffer.floatChannelData
            else {
                throw BpmAnalysisError.cannotDecodeAudio
            }

            do {
                try file.read(into: buffer, frameCount: framesToRead)
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
                let channelSamples = UnsafeBufferPointer(
                    start: channels[channelIndex],
                    count: sampleCount
                )
                let energy = channelSamples.reduce(0.0) { total, sample in
                    total + Double(sample) * Double(sample)
                }
                if energy > maximumEnergy {
                    maximumEnergy = energy
                    selectedChannel = channelIndex
                }
            }
            let samples = UnsafeBufferPointer(
                start: channels[selectedChannel],
                count: sampleCount
            )

            do {
                guard let reading = try analyzeChannelData(
                    samples,
                    sampleRate: sampleRate,
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
