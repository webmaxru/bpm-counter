# iOS and TestFlight release

For the team-wide versus app-specific credential model and instructions for
reusing this setup in future apps, see
[`APPLE_APP_STORE_REUSE.md`](APPLE_APP_STORE_REUSE.md).

BPM Techno ships on iOS as a **native SwiftUI** application. Tempo detection uses
[`RealtimeBpmAnalyzer`](https://www.realtime-bpm-analyzer.com/guide/swift) for
Swift (the offline `analyzeChannelData` port of the same library as the web
app). The Capacitor web-wrapper shell has been removed.

## App identity

- Display name: `BPM Techno`
- Default bundle ID: `no.bpmtech.app`
- Version: `4.0.0`
- Minimum iOS version: iOS 15
- Device families: iPhone and iPad

Register `no.bpmtech.app` in Apple Developer and App Store Connect before the
first signed build. If another bundle ID is required, update both Xcode build
configurations. The release workflow can override the build setting with the
`IOS_BUNDLE_ID` repository variable, but the checked-in value should still match
the registered app.

## Native functionality

- **Record & analyze**: capture a short microphone clip, then run on-device BPM
  analysis with Realtime BPM Analyzer for Swift. The Swift library is offline /
  whole-buffer analysis (not a live Web Audio graph), so recording a clip is
  the native equivalent of the web live detector.
- **File analysis**: local MP3, WAV, M4A, AAC, FLAC, or CAF via the document
  picker, decoded with `AVAudioFile` and analyzed with `analyzeChannelData`.
- Optional peaks vs tempogram engine toggle.
- Tap tempo with haptic feedback.
- Native metronome.
- Native Share Sheet for BPM results.

The microphone permission text states that rhythm analysis happens on the
device and audio is not uploaded.

## Local development

A Mac with Xcode 16+ (Swift 5.9+) is required for native compilation. Swift
Package Manager pulls
[dlepaux/realtime-bpm-analyzer-swift](https://github.com/dlepaux/realtime-bpm-analyzer-swift)
(`from: 6.3.0`).

```shell
npm run ios:prepare
npm run ios:open
```

Select the `App` scheme in Xcode and run it on an iPhone or iPad simulator.
Microphone recording, file import, haptics, and the Share Sheet must also be
checked on physical hardware.

`npm run ios:branding` synchronizes the 1024 × 1024 store icon into Xcode.
`npm run ios:verify` checks bundle ID, version, Swift package wiring, and icon
sync.

## GitHub Actions

`.github/workflows/ios-ci.yml` verifies native metadata, resolves Swift
packages, and compiles an unsigned simulator app on the pinned `macos-26`
runner.

`.github/workflows/ios-release.yml` is manually dispatched. It imports signing
material into a temporary keychain, archives and exports a signed IPA, stores
the IPA as a GitHub artifact, and optionally uploads it to TestFlight.

Configure these GitHub Actions secrets:

| Secret | Value |
| --- | --- |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Base64-encoded Apple Distribution `.p12` |
| `IOS_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded App Store provisioning profile |
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect API issuer ID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Base64-encoded App Store Connect `.p8` key |

The optional repository variable `IOS_BUNDLE_ID` defaults to
`no.bpmtech.app`.

## Create the Apple Distribution certificate on Windows

A Mac is not required to create the CSR or `.p12`. Git for Windows includes
the OpenSSL executable used by these scripts.

Generate the private key and CSR:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/new-apple-distribution-csr.ps1
```

Upload this generated file on the Apple certificate page:

```text
ios/signing-private/CertificateSigningRequest.certSigningRequest
```

Keep `ios/signing-private/apple-distribution-private.key` private and backed
up. Apple never receives it, and the downloaded certificate cannot be used for
signing without it.

After Apple creates the certificate, download the `.cer` file and export the
matching `.p12`:

```powershell
powershell -ExecutionPolicy Bypass `
  -File scripts/export-apple-distribution-p12.ps1 `
  -CertificatePath "$HOME\Downloads\distribution.cer"
```

Enter a strong export password when OpenSSL prompts. The output is:

```text
ios/signing-private/apple-distribution.p12
```

Use that file for `IOS_DISTRIBUTION_CERTIFICATE_BASE64` and save its export
password as `IOS_CERTIFICATE_PASSWORD`.

On Windows PowerShell, encode binary signing files without line wrapping:

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("AppleDistribution.p12")
) | Set-Clipboard

[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("BPMTechno_AppStore.mobileprovision")
) | Set-Clipboard

[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("AuthKey_XXXXXXXXXX.p8")
) | Set-Clipboard
```

Run **iOS TestFlight Release** from the Actions tab. Keep
`upload_to_testflight` enabled for a TestFlight delivery, or disable it to
produce only the signed IPA artifact.

## App Store review checklist

1. Create the App Store Connect record with the same bundle ID.
2. Confirm the App Privacy answers against the production analytics and
   advertising configuration for the web product (the native app does not embed
   ads or remote analytics by default).
3. Test microphone denial, airplane-mode launch, local file import, recording
   analysis, sharing, rotation, iPad multitasking, and large text.
4. Recapture App Store screenshots from the native SwiftUI UI.
5. In review notes, describe on-device Realtime BPM Analyzer analysis, microphone
   recording for tempo detection, native document import, haptics, Share Sheet
   support, and that audio is not uploaded.
