# Google Play release playbook

Index of all surfaces: [`STORE_RELEASES.md`](STORE_RELEASES.md).

Native app technical notes: [`ANDROID.md`](ANDROID.md).

## Purpose

Ship the **native Kotlin Compose** BPM Techno app to Google Play. Website
deploys to `https://bpmtech.no` do **not** update this binary. The package ID
matches the historical TWA listing so updates go to the same Play product.

## Identity

| Item | Value |
| --- | --- |
| Play package ID | `no.bpmtech.twa` |
| Version name | `4.0.0` |
| Version code | `4` |
| `minSdk` / `targetSdk` | 24 / 36 |
| CI | `.github/workflows/android-ci.yml` |
| Release | `.github/workflows/android-release.yml` |

## Create from scratch

1. Create a Play Console developer account and a new application.
2. Reserve package ID `no.bpmtech.twa` (or change the Gradle applicationId and
   all Asset Links if you intentionally fork the identity).
3. Enable **Play App Signing**.
4. Create an upload keystore; back it up offline (never commit it).
5. Create a Google Cloud service account with Play Console release access and
   download its JSON key.
6. Complete store listing, content rating, Data Safety, and privacy policy URL
   (`https://bpmtech.no/privacy`) using files under `store-assets/google-play/`.
7. Configure GitHub secrets (below).
8. Build a signed AAB and upload to the **internal** testing track first.

For **this** product the Play listing already exists — use
[Update existing / draft](#update-existing--draft).

## Update existing / draft

1. Confirm the upload-key SHA-256 still matches **Play Console → App integrity →
   Upload key certificate**. Request an upload-key reset only if the key is
   lost; do not change the package ID.
2. Bump `versionName` / `versionCode` in `android/app/build.gradle` when
   shipping a new binary, and keep
   `store-assets/google-play/package-identity.json` in sync in the same commit.
   `npm run android:verify` and `npm run google-play:check` assert those two
   sources match each other (they no longer hard-code a release number).
3. Refresh listing graphics if the UI changed:
   `npm run store-assets:google-play`.
4. Dispatch **Android Play Store Release** (or push `android-vX.Y.Z`).
5. Prefer `track=internal`, `status=draft` for the first automated upload, then
   promote in Play Console after device smoke tests.
6. Update screenshots, release notes, and Data Safety if the answers changed.

## Trigger the release pipeline

| Method | Details |
| --- | --- |
| **workflow_dispatch** | Actions → **Android Play Store Release** |
| Tag | `git tag android-v4.0.0 && git push origin android-v4.0.0` |

Dispatch inputs:

| Input | Typical first run |
| --- | --- |
| `track` | `internal` |
| `upload_to_play` | `false` until secrets work; then `true` |
| `status` | `draft` |
| `regenerate_assets` | `false` if assets are already committed |

Tag pushes build and optionally upload using defaults equivalent to
`track=internal`, `upload_to_play=false`, `status=draft` unless you re-run with
dispatch. Prefer dispatch when you need production upload.

Local signed bundle alternative:

```shell
export ANDROID_KEYSTORE_FILE=/absolute/path/to/upload-keystore.jks
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=...
export ANDROID_KEY_PASSWORD=...
npm run android:bundle
```

## Required secrets and variables

| Name | Purpose |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 of the upload-key `.jks` / `.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play Developer API service account JSON (upload only) |

Encode the keystore locally (do not commit it):

```shell
base64 -w0 upload-keystore.jks > upload-keystore.b64
```

Signing secrets stay step-scoped so ordinary Android CI never sees them.

## Asset locations

| Asset | Path |
| --- | --- |
| Listing copy | `store-assets/google-play/listing-en-US.txt` |
| Console handoff | `store-assets/google-play/play-console-submission.txt` |
| Package identity | `store-assets/google-play/package-identity.json` |
| App icon 512 | `store-assets/google-play/graphics/app-icon-512x512.png` |
| Feature graphic | `store-assets/google-play/graphics/feature-graphic-1024x500.png` |
| Screenshots | `store-assets/google-play/screenshots/{phone,tablet-7-inch,tablet-10-inch,chromebook}/` |
| Release notes | `android/release-notes-v4.txt` |
| Play what’s new dir | `android/play-whatsnew/` |
| Asset Links (web) | `public/.well-known/assetlinks.json` |

## Pipeline map

```text
npm run store-assets:google-play
        │
        ▼
npm run google-play:check
        │
        ▼
android-release.yml
        │
        ├─ decode upload keystore
        ├─ ./gradlew :app:bundleRelease
        ├─ upload AAB + listing artifacts
        │
        └─ optional: r0adkll/upload-google-play
                    track = internal | alpha | beta | production
                    status = draft | completed
                              │
                              ▼
                     Play Console review / rollout
```

## Local checks

```shell
npm ci
npx playwright install chromium   # only if regenerating screenshots
npm run store-assets:google-play
npm run google-play:check
npm run android:verify
npm run google-play:release:check
```
