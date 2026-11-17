import SwiftUI
import UIKit

struct TapTempoView: View {
    @State private var engine = TapTempoService()
    @State private var displayedBpm: Double?
    @State private var tapCount = 0

    private let haptic = UIImpactFeedbackGenerator(style: .medium)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    VStack(spacing: 8) {
                        Text(displayedBpm.map { format($0) } ?? "--")
                            .font(.system(size: 84, weight: .bold, design: .rounded))
                            .foregroundStyle(BPMTheme.text)
                            .minimumScaleFactor(0.5)
                            .lineLimit(1)
                            .contentTransition(.numericText())
                            .accessibilityLabel(
                                displayedBpm.map { "\($0) beats per minute" } ?? "No tempo yet"
                            )

                        Text("BPM")
                            .font(.title3.weight(.medium))
                            .foregroundStyle(BPMTheme.textMuted)
                    }
                    .padding(.top, 24)

                    Text(
                        tapCount == 0
                            ? "Tap along with the beat. Tempo resets after a short pause."
                            : "Recent taps: \(tapCount) of \(TapTempoService.maxTaps)"
                    )
                    .font(.subheadline)
                    .foregroundStyle(BPMTheme.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                    Button("Tap the beat") {
                        haptic.impactOccurred()
                        engine.tap()
                        tapCount = engine.tapTimes.count
                        withAnimation(.snappy) {
                            displayedBpm = engine.bpm
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .padding(.horizontal, 24)

                    HStack(spacing: 12) {
                        Button("Reset") {
                            engine.reset()
                            tapCount = 0
                            withAnimation {
                                displayedBpm = nil
                            }
                        }
                        .buttonStyle(PrimaryButtonStyle(filled: false))
                        .disabled(tapCount == 0)

                        if let displayedBpm {
                            let result = AnalysisResult(
                                bpm: Int(displayedBpm.rounded()),
                                bpmExact: displayedBpm,
                                confidence: nil,
                                candidates: [],
                                mode: .tap,
                                sourceName: nil
                            )
                            ShareLink(item: result.shareText) {
                                Label("Share", systemImage: "square.and.arrow.up")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                            }
                            .buttonStyle(.plain)
                            .foregroundStyle(BPMTheme.text)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .strokeBorder(BPMTheme.textFaint.opacity(0.35), lineWidth: 1)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                                            .fill(BPMTheme.surfaceStrong)
                                    )
                            )
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 24)
                }
                .frame(maxWidth: .infinity)
            }
            .background(BPMTheme.backgroundGradient.ignoresSafeArea())
            .navigationTitle("Tap tempo")
            .onAppear { haptic.prepare() }
        }
    }

    private func format(_ value: Double) -> String {
        if value == value.rounded() {
            return String(Int(value))
        }
        return String(format: "%.1f", value)
    }
}
