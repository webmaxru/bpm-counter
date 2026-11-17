import SwiftUI

struct BpmResultView: View {
    let result: AnalysisResult

    var body: some View {
        VStack(spacing: 12) {
            Text(result.mode.title.uppercased())
                .font(.caption.weight(.semibold))
                .tracking(1.2)
                .foregroundStyle(BPMTheme.signal)

            Text("\(result.bpm)")
                .font(.system(size: 72, weight: .bold, design: .rounded))
                .foregroundStyle(BPMTheme.text)
                .contentTransition(.numericText())
                .accessibilityLabel("\(result.bpm) beats per minute")

            Text("BPM")
                .font(.title3.weight(.medium))
                .foregroundStyle(BPMTheme.textMuted)

            if let confidence = result.confidence {
                Text(String(format: "Confidence %.0f%%", confidence * 100))
                    .font(.subheadline)
                    .foregroundStyle(BPMTheme.textFaint)
            }

            if let sourceName = result.sourceName, !sourceName.isEmpty {
                Text(sourceName)
                    .font(.footnote)
                    .foregroundStyle(BPMTheme.textFaint)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }

            if result.candidates.count > 1 {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(result.candidates.dropFirst()) { candidate in
                            Text("\(candidate.bpm) · \(candidate.relation)")
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(BPMTheme.surfaceStrong, in: Capsule())
                                .foregroundStyle(BPMTheme.textMuted)
                        }
                    }
                }
            }

            ShareLink(item: result.shareText) {
                Label("Share BPM", systemImage: "square.and.arrow.up")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.plain)
            .foregroundStyle(BPMTheme.ink)
            .background(BPMTheme.signal, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(BPMTheme.inkSoft)
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(BPMTheme.signal.opacity(0.22), lineWidth: 1)
                )
        )
    }
}
