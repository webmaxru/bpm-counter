import RealtimeBpmAnalyzer
import SwiftUI
import UIKit
import UniformTypeIdentifiers

struct AnalyzeView: View {
    @StateObject private var capture = AudioCaptureService()
    @State private var result: AnalysisResult?
    @State private var isAnalyzing = false
    @State private var errorMessage: String?
    @State private var showImporter = false
    @State private var usePeaksEngine = false

    private let analyzer = BpmAnalysisService()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    header

                    if let result {
                        BpmResultView(result: result)
                            .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }

                    recordingCard
                    fileCard

                    if isAnalyzing {
                        ProgressView("Analyzing on-device…")
                            .tint(BPMTheme.signal)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.subheadline)
                            .foregroundStyle(BPMTheme.danger)
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(BPMTheme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }

                    Text("Tempo is detected on this device with Realtime BPM Analyzer for Swift. Audio is never uploaded.")
                        .font(.footnote)
                        .foregroundStyle(BPMTheme.textFaint)
                }
                .padding(20)
                .animation(.easeOut(duration: 0.25), value: result?.id)
            }
            .background(BPMTheme.backgroundGradient.ignoresSafeArea())
            .navigationTitle("BPM Techno")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Toggle("Peaks engine", isOn: $usePeaksEngine)
                    } label: {
                        Image(systemName: "slider.horizontal.3")
                    }
                    .accessibilityLabel("Analysis options")
                }
            }
            .fileImporter(
                isPresented: $showImporter,
                allowedContentTypes: Self.audioTypes,
                allowsMultipleSelection: false
            ) { selection in
                handleImport(selection)
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Native tempo tools")
                .font(.largeTitle.weight(.bold))
                .foregroundStyle(BPMTheme.text)
                .lineLimit(2)

            Text("Record a clip or open a track. Analysis uses the same Realtime BPM Analyzer engine as the web app.")
                .font(.body)
                .foregroundStyle(BPMTheme.textMuted)
        }
    }

    private var recordingCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Label("Record & analyze", systemImage: "mic.fill")
                .font(.headline)
                .foregroundStyle(BPMTheme.text)

            Text("Capture at least a few bars, then stop to read the tempo.")
                .font(.subheadline)
                .foregroundStyle(BPMTheme.textMuted)

            if capture.isRecording {
                Text(timeLabel(capture.elapsedSeconds))
                    .font(.system(size: 36, weight: .semibold, design: .rounded))
                    .foregroundStyle(BPMTheme.signal)
                    .monospacedDigit()
            }

            HStack(spacing: 12) {
                if capture.isRecording {
                    Button("Stop & analyze") {
                        Task { await finishRecording() }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(isAnalyzing)

                    Button("Cancel") {
                        capture.cancel()
                    }
                    .buttonStyle(PrimaryButtonStyle(filled: false))
                } else {
                    Button("Start recording") {
                        errorMessage = nil
                        Task { await capture.startRecording() }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(isAnalyzing)
                }
            }

            if case .unauthorized = capture.state {
                Text("Microphone access is required to record. Enable it in Settings.")
                    .font(.footnote)
                    .foregroundStyle(BPMTheme.danger)
            }

            if case .failed(let message) = capture.state {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(BPMTheme.danger)
            }
        }
        .padding(20)
        .background(cardBackground)
    }

    private var fileCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Label("Analyze a file", systemImage: "folder")
                .font(.headline)
                .foregroundStyle(BPMTheme.text)

            Text("MP3, WAV, M4A, AAC, FLAC, and CAF are supported.")
                .font(.subheadline)
                .foregroundStyle(BPMTheme.textMuted)

            Button("Choose audio file") {
                errorMessage = nil
                showImporter = true
            }
            .buttonStyle(PrimaryButtonStyle(filled: false))
            .disabled(isAnalyzing || capture.isRecording)
        }
        .padding(20)
        .background(cardBackground)
    }

    private var cardBackground: some View {
        RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(BPMTheme.surface.opacity(0.92))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(Color.white.opacity(0.08), lineWidth: 1)
            )
    }

    private var analysisOptions: AnalysisOptions {
        AnalysisOptions(
            engine: usePeaksEngine ? .peaks : .tempogram,
            tempoRange: .default
        )
    }

    private static let audioTypes: [UTType] = {
        var types: [UTType] = [.audio, .mp3, .wav, .aiff, .mpeg4Audio]
        if let flac = UTType(filenameExtension: "flac") {
            types.append(flac)
        }
        if let caf = UTType(filenameExtension: "caf") {
            types.append(caf)
        }
        if let m4a = UTType(filenameExtension: "m4a") {
            types.append(m4a)
        }
        return types
    }()

    private func handleImport(_ selection: Result<[URL], Error>) {
        switch selection {
        case .failure(let error):
            errorMessage = error.localizedDescription
        case .success(let urls):
            guard let url = urls.first else { return }
            Task { await analyze(url: url, mode: .file, sourceName: url.lastPathComponent) }
        }
    }

    private func finishRecording() async {
        guard let url = capture.stopRecording() else { return }
        defer { try? FileManager.default.removeItem(at: url) }
        await analyze(url: url, mode: .recording, sourceName: "Microphone recording")
    }

    private func analyze(url: URL, mode: AnalysisResult.Mode, sourceName: String) async {
        isAnalyzing = true
        errorMessage = nil
        result = nil
        defer { isAnalyzing = false }

        do {
            let next = try await analyzer.analyzeFile(
                at: url,
                mode: mode,
                sourceName: sourceName,
                options: analysisOptions
            )
            result = next
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            errorMessage = error.localizedDescription
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
    }

    private func timeLabel(_ seconds: TimeInterval) -> String {
        let total = Int(seconds)
        return String(format: "%d:%02d", total / 60, total % 60)
    }
}
