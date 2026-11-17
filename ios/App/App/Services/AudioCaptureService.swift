import AVFoundation
import Foundation

@MainActor
final class AudioCaptureService: ObservableObject {
    enum State: Equatable {
        case idle
        case preparing
        case recording(startedAt: Date)
        case unauthorized
        case failed(String)
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var elapsedSeconds: TimeInterval = 0

    private var recorder: AVAudioRecorder?
    private var timer: Timer?
    private var recordingURL: URL?

    var isRecording: Bool {
        if case .recording = state { return true }
        return false
    }

    func prepareSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .measurement,
            options: [.defaultToSpeaker, .allowBluetoothHFP, .mixWithOthers]
        )
        try session.setActive(true)
    }

    func startRecording() async {
        state = .preparing
        elapsedSeconds = 0

        let granted: Bool
        if #available(iOS 17.0, *) {
            granted = await AVAudioApplication.requestRecordPermission()
        } else {
            granted = await withCheckedContinuation { continuation in
                AVAudioSession.sharedInstance().requestRecordPermission { allowed in
                    continuation.resume(returning: allowed)
                }
            }
        }

        guard granted else {
            state = .unauthorized
            return
        }

        do {
            try prepareSession()

            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("bpm-techno-capture-\(UUID().uuidString).caf")
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatLinearPCM),
                AVSampleRateKey: 44_100,
                AVNumberOfChannelsKey: 1,
                AVLinearPCMBitDepthKey: 32,
                AVLinearPCMIsFloatKey: true,
                AVLinearPCMIsBigEndianKey: false,
            ]

            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.isMeteringEnabled = true
            guard recorder.record() else {
                state = .failed("The microphone could not start recording.")
                return
            }

            self.recorder = recorder
            self.recordingURL = url
            let startedAt = Date()
            state = .recording(startedAt: startedAt)
            startTimer(from: startedAt)
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    func stopRecording() -> URL? {
        timer?.invalidate()
        timer = nil
        recorder?.stop()
        recorder = nil

        let url = recordingURL
        recordingURL = nil
        state = .idle
        elapsedSeconds = 0
        return url
    }

    func cancel() {
        let url = stopRecording()
        if let url {
            try? FileManager.default.removeItem(at: url)
        }
    }

    private func startTimer(from startedAt: Date) {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.elapsedSeconds = Date().timeIntervalSince(startedAt)
            }
        }
    }
}
