# BPM Techno — native Android

Jetpack Compose app for phones and tablets. Tempo detection uses
[Realtime BPM Analyzer for Java/Kotlin](https://www.realtime-bpm-analyzer.com/guide/java)
(`io.github.dlepaux:realtime-bpm-analyzer:6.3.0`).

## Features

- Record a microphone clip and analyze BPM on-device
- Analyze local audio files (`MediaCodec` → `analyzeChannelData`)
- Tap tempo with vibration
- Metronome
- Share sheet for results

The JVM library is offline / whole-buffer analysis. Live continuous Web Audio
detection from the website is replaced here by record-then-analyze.

## Open in Android Studio

```shell
npm run android:verify
# File → Open → android/
```

See [`ANDROID.md`](../ANDROID.md) for package ID, SDK levels, and release notes.
