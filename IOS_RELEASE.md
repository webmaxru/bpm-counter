# iOS and TestFlight release

For the team-wide versus app-specific credential model and instructions for
reusing this setup in future apps, see
[`APPLE_APP_STORE_REUSE.md`](APPLE_APP_STORE_REUSE.md).

BPM Techno ships on iOS as a Capacitor 8 application that bundles the Vite
production build. It does not load the public website as its application
shell.

## App identity

- Display name: `BPM Techno`
- Default bundle ID: `no.bpmtech.app`
- Version: `3.0.0`
- Minimum iOS version: iOS 15
- Device families: iPhone and iPad

Register `no.bpmtech.app` in Apple Developer and App Store Connect before the
first signed build. If another bundle ID is required, update
`capacitor.config.json` and both Xcode build configurations. The release
workflow can override the build setting with the `IOS_BUNDLE_ID` repository
variable, but the checked-in value should still match the registered app.

## Native functionality

The iOS build adds native value to the web BPM tools:

- Live microphone analysis with an iOS `AVAudioSession` configured for
  measurement, speaker output, Bluetooth input, and coexistence with other
  audio.
- Local MP3, WAV, M4A, AAC, or FLAC selection through the iOS document picker.
- Haptic feedback for tap tempo.
- Native iOS Share Sheet for BPM results.
- External merchant and social links opened with Capacitor Browser.
- Bundled application files and a native launch screen for offline startup.

The microphone permission text states that rhythm analysis happens on the
device and audio is not uploaded.

## Local development

A Mac with Xcode 26 and Node.js 22 is required for native compilation.

```shell
npm ci
npm run ios:sync
npm run ios:verify
npm run ios:open
```

Select the `App` scheme in Xcode and run it on an iPhone or iPad simulator.
Microphone behavior, Bluetooth routing, haptics, the document picker, and the
Share Sheet must also be checked on physical hardware.

`npm run ios:sync` rebuilds the web app, updates Capacitor plugins and bundled
assets, and synchronizes the 1024 x 1024 store icon into Xcode.

## GitHub Actions

`.github/workflows/ios-ci.yml` runs the complete web test suite, builds the
bundled app, verifies native metadata, and compiles an unsigned simulator app
on the pinned `macos-26` runner.

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
   advertising configuration.
3. Test microphone denial, airplane-mode launch, local file import, sharing,
   affiliate disclosure, rotation, iPad multitasking, and large text.
4. Recapture App Store screenshots from the final native build if safe areas
   or permission flows visibly differ from the generated web screenshots.
5. In review notes, describe local microphone processing, native document
   import, haptics, Share Sheet support, and the external Amazon affiliate
   links.
