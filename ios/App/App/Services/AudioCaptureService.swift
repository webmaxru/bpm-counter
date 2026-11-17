import AVFoundation
import Combine
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
    private var interruptionObserver: NSObjectProtocol?

    var isRecording: Bool {
        if case .recording = state { return true }
        return false
    }

    var isBusy: Bool {
        if case .preparing = state { return true }
        return isRecording
    }

    init() {
        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in
            Task { @MainActor in
                self?.handleInterruption(notification)
            }
        }
    }

    deinit {
        if let interruptionObserver {
            NotificationCenter.default.removeObserver(interruptionObserver)
        }
    }

    func prepareSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .measurement,
            // `.allowBluetooth` is available on Xcode 16; `.allowBluetoothHFP` needs newer SDKs.
            options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers]
        )
        try session.setActive(true)
    }

    func startRecording() async {
        guard state != .preparing, !isRecording else { return }
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

        // Another start or cancel may have won while we awaited permission.
        guard case .preparing = state else { return }

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
        // Drop preparing starts as well as active recordings.
        if case .preparing = state {
            state = .idle
            elapsedSeconds = 0
            return
        }

        let url = stopRecording()
        if let url {
            try? FileManager.default.removeItem(at: url)
        }
    }

    private func handleInterruption(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else {
            return
        }

        switch type {
        case .began:
            guard isRecording || state == .preparing else { return }
            cancel()
            state = .failed("Recording stopped because audio was interrupted.")
        case .ended:
            break
        @unknown default:
            break
        }
    }

    private func startTimer(from startedAt: Date) {
        timer?.invalidate()
        let timer = Timer(timeInterval: 0.2, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.elapsedSeconds = Date().timeIntervalSince(startedAt)
            }
        }
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }
}
