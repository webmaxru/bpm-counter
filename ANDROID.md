# Android app (native Kotlin)

BPM Techno on Android is a **native Jetpack Compose** app. Tempo detection uses
[`realtime-bpm-analyzer`](https://www.realtime-bpm-analyzer.com/guide/java) on
Maven Central (`io.github.dlepaux:realtime-bpm-analyzer:6.3.0`).

The Trusted Web Activity / Bubblewrap shell has been removed.

## App identity

- Package ID: `no.bpmtech.twa` (unchanged — updates the existing Google Play listing)
- Version name: `4.0.0`
- Version code: `4`
- `minSdk`: 24
- `compileSdk` / `targetSdk`: 36

## Native functionality

The Java/Kotlin library is **offline / whole-buffer** analysis only (`analyzeChannelData`).
There is no live microphone graph port.

- **Record & analyze** — capture a short mic clip, decode to mono PCM, analyze on-device
- **File analysis** — document picker; `MediaExtractor` / `MediaCodec` → mono floats → analyzer
- Optional **peaks** vs default **tempogram** engine
- **Tap tempo** with vibration feedback
- **Metronome**
- Native Android share sheet for BPM results

Audio never leaves the device.

## Local development

Requires JDK 17+ and Android SDK 36 (Android Studio recommended).

```shell
# From the repository root
echo "sdk.dir=$ANDROID_HOME" > android/local.properties   # if needed
npm run android:verify
cd android && ./gradlew :app:assembleDebug
```

Open `android/` in Android Studio, sync Gradle, and run the `app` configuration on
an emulator or device. Grant microphone permission for recording.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run android:verify` | Structural checks (package ID, library dep, Compose entry, Asset Links) |
| `npm run android:assemble` | `./gradlew :app:assembleDebug` |
| `npm run android:bundle` | `./gradlew :app:bundleRelease` (unsigned unless signing is configured) |

Bubblewrap (`android:generate`, `android:doctor`, fingerprint helpers) is no longer
used for the app shell. Digital Asset Links under
`public/.well-known/assetlinks.json` still identify package `no.bpmtech.twa` for
App Links / Play integrity continuity.

## Release notes

Paste Play Console English release notes from `android/release-notes-v4.txt` when
uploading the AAB for version code 4.
