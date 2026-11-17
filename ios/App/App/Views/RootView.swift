import SwiftUI

struct RootView: View {
    @StateObject private var capture = AudioCaptureService()
    @StateObject private var metronome = MetronomeEngine()

    var body: some View {
        TabView {
            AnalyzeView()
                .tabItem {
                    Label("Analyze", systemImage: "waveform")
                }
                .tag(AppTab.analyze)

            TapTempoView()
                .tabItem {
                    Label("Tap", systemImage: "hand.tap")
                }
                .tag(AppTab.tap)

            MetronomeView()
                .tabItem {
                    Label("Metronome", systemImage: "metronome")
                }
                .tag(AppTab.metronome)
        }
        .environmentObject(capture)
        .environmentObject(metronome)
        .tint(BPMTheme.accent)
        .background(BPMTheme.ink.ignoresSafeArea())
        .onChange(of: metronome.isRunning) { _, isRunning in
            if isRunning, capture.isBusy {
                capture.cancel()
            }
        }
    }
}

private enum AppTab {
    case analyze
    case tap
    case metronome
}

#Preview {
    RootView()
}
