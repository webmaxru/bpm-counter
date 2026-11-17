import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            AnalyzeView()
                .tabItem {
                    Label("Analyze", systemImage: "waveform")
                }

            TapTempoView()
                .tabItem {
                    Label("Tap", systemImage: "hand.tap")
                }

            MetronomeView()
                .tabItem {
                    Label("Metronome", systemImage: "metronome")
                }
        }
        .tint(BPMTheme.accent)
        .background(BPMTheme.ink.ignoresSafeArea())
    }
}

#Preview {
    RootView()
}
