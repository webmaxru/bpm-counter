import AVFoundation
import Combine
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
    private var engine: AVAudioEngine?
    private var player: AVAudioPlayerNode?
    private var accentBuffer: AVAudioPCMBuffer?
    private var clickBuffer: AVAudioPCMBuffer?

    static func clamp(_ value: Double) -> Double {
        min(maxBpm, max(minBpm, (value * 10).rounded() / 10))
    }

    func start() {
        stop()
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)

            let engine = AVAudioEngine()
            let player = AVAudioPlayerNode()
            engine.attach(player)
            let format = engine.mainMixerNode.outputFormat(forBus: 0)
            engine.connect(player, to: engine.mainMixerNode, format: format)
            accentBuffer = Self.makeClickBuffer(format: format, frequency: 1760, amplitude: 0.45)
            clickBuffer = Self.makeClickBuffer(format: format, frequency: 1175, amplitude: 0.28)
            try engine.start()
            player.play()

            self.engine = engine
            self.player = player
        } catch {
            stop()
            return
        }

        beatIndex = 0
        currentBeat = -1
        isRunning = true
        tick()
        scheduleTimer(interval: 60.0 / Self.clamp(bpm))
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        player?.stop()
        engine?.stop()
        if let player {
            engine?.detach(player)
        }
        player = nil
        engine = nil
        accentBuffer = nil
        clickBuffer = nil
        isRunning = false
        currentBeat = -1
        beatIndex = 0
    }

    private func scheduleTimer(interval: TimeInterval) {
        timer?.invalidate()
        let timer = Timer(timeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.tick()
            }
        }
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }

    private func tick() {
        guard isRunning else { return }
        let accented = beatIndex % max(beatsPerBar, 1) == 0
        if let buffer = accented ? accentBuffer : clickBuffer {
            player?.scheduleBuffer(buffer, at: nil, options: [])
        }
        currentBeat = beatIndex % max(beatsPerBar, 1)
        beatIndex += 1

        let interval = 60.0 / Self.clamp(bpm)
        if let timer, abs(timer.timeInterval - interval) > 0.001 {
            scheduleTimer(interval: interval)
        }
    }

    private static func makeClickBuffer(
        format: AVAudioFormat,
        frequency: Double,
        amplitude: Float
    ) -> AVAudioPCMBuffer? {
        let sampleRate = format.sampleRate
        guard sampleRate > 0 else { return nil }

        let duration = 0.05
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            return nil
        }
        buffer.frameLength = frameCount
        guard let channels = buffer.floatChannelData else { return nil }

        for frame in 0..<Int(frameCount) {
            let t = Double(frame) / sampleRate
            let envelope = Float(exp(-t * 40))
            let sample = Float(sin(2 * Double.pi * frequency * t)) * amplitude * envelope
            for channel in 0..<Int(format.channelCount) {
                channels[channel][frame] = sample
            }
        }
        return buffer
    }
}
