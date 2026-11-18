# BPM Techno — native iOS

SwiftUI app for iPhone and iPad (iOS 17+). Tempo detection uses
[Realtime BPM Analyzer for Swift](https://www.realtime-bpm-analyzer.com/guide/swift)
(`RealtimeBpmAnalyzer` via Swift Package Manager).

## Features

- Record a microphone clip and analyze BPM on-device
- Analyze local audio files (`AVAudioFile` → `analyzeChannelData`)
- Tap tempo with haptics
- Metronome
- Share Sheet for results

The Swift library is offline / whole-buffer analysis. Live continuous Web Audio
detection from the website is replaced here by record-then-analyze.

## Open in Xcode

```shell
npm run ios:prepare
npm run ios:open
```

See [`IOS_RELEASE.md`](../IOS_RELEASE.md) for TestFlight and App Store signing.
