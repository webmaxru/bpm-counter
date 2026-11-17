import AudioToolbox
import AVFoundation
import Foundation

@MainActor
final class MetronomeEngine: ObservableObject {
    static let minBpm = 30.0
    static let maxBpm = 300.0

    @Published var bpm: Double = 120 {
        didSet { bpm = Self.clamp(bpm) }
    }

    @Published var beatsPerBar: Int = 4
    @Published private(set) var isRunning = false
    @Published private(set) var currentBeat = -1

    private var timer: Timer?
    private var beatIndex = 0

    static func clamp(_ value: Double) -> Double {
        min(maxBpm, max(minBpm, (value * 10).rounded() / 10))
    }

    func start() {
        stop()
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            return
        }

        beatIndex = 0
        currentBeat = -1
        isRunning = true
        tick()
        let interval = 60.0 / Self.clamp(bpm)
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.tick()
            }
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        isRunning = false
        currentBeat = -1
        beatIndex = 0
    }

    private func tick() {
        guard isRunning else { return }
        let accented = beatIndex % max(beatsPerBar, 1) == 0
        // 1057 = soft tick, 1104 = sharper tap; both are system sounds.
        AudioServicesPlaySystemSound(SystemSoundID(accented ? 1104 : 1057))
        currentBeat = beatIndex % max(beatsPerBar, 1)
        beatIndex += 1

        let interval = 60.0 / Self.clamp(bpm)
        if let timer, abs(timer.timeInterval - interval) > 0.001 {
            timer.invalidate()
            self.timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
                Task { @MainActor in
                    self?.tick()
                }
            }
        }
    }
}
