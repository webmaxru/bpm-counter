import SwiftUI

struct MetronomeView: View {
    @StateObject private var metronome = MetronomeEngine()
    @State private var draft = "120"

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                Spacer(minLength: 8)

                Text(String(format: "%.0f", metronome.bpm))
                    .font(.system(size: 84, weight: .bold, design: .rounded))
                    .foregroundStyle(BPMTheme.text)
                    .monospacedDigit()

                Text("BPM")
                    .font(.title3.weight(.medium))
                    .foregroundStyle(BPMTheme.textMuted)

                beatDots

                Slider(
                    value: $metronome.bpm,
                    in: MetronomeEngine.minBpm...MetronomeEngine.maxBpm,
                    step: 1
                )
                .accessibilityLabel("Tempo")
                .accessibilityValue("\(Int(metronome.bpm.rounded())) beats per minute")
                .tint(BPMTheme.signal)
                .padding(.horizontal, 28)
                .onChange(of: metronome.bpm) { _, newValue in
                    draft = String(format: "%.0f", newValue)
                }

                HStack(spacing: 12) {
                    TextField("BPM", text: $draft)
                        .keyboardType(.numbersAndPunctuation)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { commitDraft() }

                    Stepper("Beats \(metronome.beatsPerBar)", value: $metronome.beatsPerBar, in: 1...8)
                        .labelsHidden()
                    Text("\(metronome.beatsPerBar)/4")
                        .foregroundStyle(BPMTheme.textMuted)
                        .frame(minWidth: 44)
                }
                .padding(.horizontal, 28)

                Button(metronome.isRunning ? "Stop" : "Start") {
                    commitDraft()
                    if metronome.isRunning {
                        metronome.stop()
                    } else {
                        metronome.start()
                    }
                }
                .buttonStyle(PrimaryButtonStyle(filled: !metronome.isRunning))
                .padding(.horizontal, 28)

                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(BPMTheme.backgroundGradient.ignoresSafeArea())
            .navigationTitle("Metronome")
            .onDisappear { metronome.stop() }
        }
    }

    private var beatDots: some View {
        HStack(spacing: 14) {
            ForEach(0..<metronome.beatsPerBar, id: \.self) { index in
                Circle()
                    .fill(index == metronome.currentBeat ? BPMTheme.accent : BPMTheme.surfaceStrong)
                    .frame(width: 18, height: 18)
                    .overlay(
                        Circle()
                            .strokeBorder(BPMTheme.signal.opacity(0.35), lineWidth: 1)
                    )
                    .scaleEffect(index == metronome.currentBeat ? 1.2 : 1)
                    .animation(.easeOut(duration: 0.08), value: metronome.currentBeat)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Beat \(max(metronome.currentBeat, 0) + 1) of \(metronome.beatsPerBar)")
    }

    private func commitDraft() {
        if let value = Double(draft.trimmingCharacters(in: .whitespacesAndNewlines)) {
            metronome.bpm = value
            draft = String(format: "%.0f", metronome.bpm)
        } else {
            draft = String(format: "%.0f", metronome.bpm)
        }
    }
}
