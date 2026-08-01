# Android app with Bubblewrap

The Android app is a Trusted Web Activity for `https://bpmtech.no` with package
ID `no.bpmtech.twa`. Bubblewrap configuration lives in
`android/twa-manifest.json`; the generated Gradle project is committed so
Android Studio and command-line builds use the same source.

This project updates the existing Google Play listing. Release 3 uses version
code `3` and version name `3.0.0`. Paste `android/release-notes-v3.txt` into the
English release notes field in Play Console.

## Prerequisites

1. Install Node.js dependencies with `npm install`.
2. Run `npm run android:doctor`. Bubblewrap can download a compatible JDK and
   Android SDK when they are not already configured.
3. Validate the production PWA with `npm run android:validate`.

## Generate and build

Regenerate Android source after changing `android/twa-manifest.json`:

```powershell
npm run android:generate
```

If an icon or the web manifest has not been deployed yet, serve `public/`
locally and override only the asset origin used during generation:

```powershell
npm run start -- --host 127.0.0.1 --port 4175
```

In a second PowerShell window:

```powershell
$env:BUBBLEWRAP_ASSET_ORIGIN = "http://127.0.0.1:4175"
npm run android:generate
```

Build unsigned APK and AAB artifacts for infrastructure checks:

```powershell
npm run android:build:unsigned
```

Bubblewrap writes the unsigned outputs to
`android/app-release-unsigned-aligned.apk` and
`android/app/build/outputs/bundle/release/app-release.aab`. These files are
ignored by Git.

## Create the upload key

Create a private upload key once and back it up securely. Never commit it:

```powershell
$keytool = Get-ChildItem "$HOME\.bubblewrap\jdk" -Recurse -Filter keytool.exe | Select-Object -First 1
if (-not $keytool) {
  throw "Bubblewrap JDK not found. Run npm run android:doctor first."
}
New-Item -ItemType Directory -Force android\keystore | Out-Null
& $keytool.FullName -genkeypair -v -keystore android\keystore\bpm-techno-upload.jks -alias bpm-techno-upload -keyalg RSA -keysize 2048 -validity 10000
```

Set passwords only in the current shell or a secure secret store, then build:

```powershell
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = "<keystore password>"
$env:BUBBLEWRAP_KEY_PASSWORD = "<key password>"
npm run android:build
```

The Play-ready signed bundle is `android/app-release-bundle.aab`. Enroll the
app in Google Play App Signing and use this key only as the upload key.

## Digital Asset Links

The production association must use the SHA-256 certificate fingerprint shown
under **Play Console > Setup > App integrity > App signing key certificate**.
The upload-key fingerprint alone is not sufficient for Play-installed builds.

Add the Play signing fingerprint and generate the statement:

```powershell
npm run android:fingerprint:add -- `
  "AA:BB:CC:..." --name=play-app-signing
npm run android:assetlinks
```

Review `android/assetlinks.json`, then copy it to
`public/.well-known/assetlinks.json` and deploy the web app. The final endpoint
must return JSON without redirects:

`https://bpmtech.no/.well-known/assetlinks.json`

Local or direct-installed APK testing can use an additional upload-key
fingerprint in the same configuration.

## Release updates

For each Play release, increment both `appVersionCode` and `appVersion` in
`android/twa-manifest.json`, run `npm run android:generate`, and build the
signed AAB. Google Play requires new submissions to target Android 16 / API 36
from August 31, 2026. The project generator overrides Bubblewrap 1.24.1's older
default and produces both `compileSdkVersion 36` and `targetSdkVersion 36`.
Run `npm run android:verify` after every release build.
