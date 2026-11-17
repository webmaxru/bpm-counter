import Foundation

struct TapTempoService {
    static let maxTaps = 8
    static let resetGap: TimeInterval = 2.5

    private(set) var tapTimes: [TimeInterval] = []

    mutating func tap(at time: TimeInterval = ProcessInfo.processInfo.systemUptime) {
        if let last = tapTimes.last, time - last > Self.resetGap {
            tapTimes = [time]
            return
        }

        tapTimes.append(time)
        if tapTimes.count > Self.maxTaps {
            tapTimes.removeFirst(tapTimes.count - Self.maxTaps)
        }
    }

    mutating func reset() {
        tapTimes.removeAll()
    }

    var bpm: Double? {
        Self.calculateBpm(from: tapTimes)
    }

    static func calculateBpm(from tapTimes: [TimeInterval]) -> Double? {
        guard tapTimes.count >= 2 else { return nil }

        let intervals = zip(tapTimes.dropFirst(), tapTimes).map { $0 - $1 }
        let average = intervals.reduce(0, +) / Double(intervals.count)
        guard average > 0, average.isFinite else { return nil }

        return (round((60.0 / average) * 10) / 10)
    }
}
