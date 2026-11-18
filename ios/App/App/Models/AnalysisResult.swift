import Foundation
import RealtimeBpmAnalyzer

struct AnalysisResult: Equatable, Identifiable {
    let id = UUID()
    let bpm: Int
    let bpmExact: Double
    let confidence: Double?
    let candidates: [Candidate]
    let mode: Mode
    let sourceName: String?

    enum Mode: String, Equatable {
        case file
        case recording
        case tap

        var title: String {
            switch self {
            case .file: return "File analysis"
            case .recording: return "Recording analysis"
            case .tap: return "Tap tempo"
            }
        }
    }

    struct Candidate: Equatable, Identifiable {
        let id = UUID()
        let bpm: Int
        let relation: String
    }

    init(
        bpm: Int,
        bpmExact: Double,
        confidence: Double?,
        candidates: [Candidate],
        mode: Mode,
        sourceName: String?
    ) {
        self.bpm = bpm
        self.bpmExact = bpmExact
        self.confidence = confidence
        self.candidates = candidates
        self.mode = mode
        self.sourceName = sourceName
    }

    init(reading: Reading, mode: Mode, sourceName: String?) {
        self.bpm = reading.bpm
        self.bpmExact = reading.bpmExact
        self.confidence = reading.confidence
        self.candidates = reading.candidates.map { candidate in
            AnalysisResult.Candidate(
                bpm: candidate.bpm,
                relation: Self.relationLabel(candidate.relation)
            )
        }
        self.mode = mode
        self.sourceName = sourceName
    }

    private static func relationLabel(_ relation: CandidateRelation) -> String {
        switch relation {
        case .top: return "primary"
        case .half: return "half"
        case .double: return "double"
        case .other: return "other"
        @unknown default: return "other"
        }
    }

    var shareText: String {
        var lines = ["BPM Techno detected \(bpm) BPM (\(mode.title.lowercased()))."]
        if let confidence {
            lines.append(String(format: "Confidence: %.0f%%", confidence * 100))
        }
        if let sourceName, !sourceName.isEmpty {
            lines.append("Source: \(sourceName)")
        }
        lines.append("https://bpmtech.no")
        return lines.joined(separator: "\n")
    }
}
