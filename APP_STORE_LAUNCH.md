# Apple App Store release playbook

Index of all surfaces: [`STORE_RELEASES.md`](STORE_RELEASES.md).

Signing depth and Windows CSR/P12 steps: [`IOS_RELEASE.md`](IOS_RELEASE.md).
Team-wide credential reuse: [`APPLE_APP_STORE_REUSE.md`](APPLE_APP_STORE_REUSE.md).

## Purpose

Ship **BPM Techno** as a native SwiftUI iOS/iPadOS app through TestFlight and
App Review. Website deploys to bpmtech.no do **not** update this binary.

## Identity

| Item | Value |
| --- | --- |
| Display name | BPM Techno |
| Bundle ID | `no.bpmtech.app` |
| Marketing version | `4.0.0` |
| Minimum OS | iOS 17 |
| Devices | iPhone and iPad |
| Xcode project / scheme | `ios/App/App.xcodeproj` / `App` |
| CI | `.github/workflows/ios-ci.yml` |
| Release | `.github/workflows/ios-release.yml` |

## Create from scratch

1. Confirm Apple Developer membership is active (team `B9FMXAW5TZ`).
2. In Certificates, Identifiers & Profiles, create an **explicit App ID** for
   `no.bpmtech.app`.
3. Create an **App Store** provisioning profile for that App ID using the
   current Apple Distribution certificate.
4. In App Store Connect, create the iOS app with the same bundle ID.
5. Set primary category **Music**, secondary **Utilities**.
6. Set Privacy Policy URL to `https://bpmtech.no/privacy/ios` (native-specific;
   do not use the website `/privacy` page).
7. Complete **App Privacy** (native binary: Data Not Collected by default), age
   rating, and export compliance (`ITSAppUsesNonExemptEncryption` = `false`).
8. Encode the provisioning profile and configure GitHub secrets (below).
9. Prepare first listing assets under `store-assets/apple-app-store/`.
10. Run a signed build with TestFlight upload, then submit for App Review.

## Update existing / draft

When the ASC record and listing already exist:

1. Bump marketing version / build as needed (workflow inputs or `ios-v*` tag).
2. Refresh screenshots or copy if the native UI changed:
   `npm run store-assets:app-store`.
3. Dispatch **iOS TestFlight Release** (or push `ios-vX.Y.Z`).
4. In App Store Connect, attach the processed build to the version, update
   What’s New, and submit (or save as draft).

## Trigger the release pipeline

| Method | Details |
| --- | --- |
| **workflow_dispatch** | Actions → **iOS TestFlight Release** |
| Tag | `git tag ios-v4.0.0 && git push origin ios-v4.0.0` |

Dispatch inputs:

| Input | Typical value |
| --- | --- |
| `version` | `4.0.0` |
| `build_number` | leave empty (uses run number) |
| `upload_to_testflight` | `true` for TestFlight; `false` for IPA artifact only |

Bare `v*` tags are **not** used here (squad package releases).

## Required secrets and variables

| Name | Kind |
| --- | --- |
| `APPLE_TEAM_ID` | Secret |
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Secret |
| `IOS_CERTIFICATE_PASSWORD` | Secret |
| `IOS_PROVISIONING_PROFILE_BASE64` | Secret (app-specific) |
| `APP_STORE_CONNECT_API_KEY_ID` | Secret (needed when uploading) |
| `APP_STORE_CONNECT_ISSUER_ID` | Secret (needed when uploading) |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Secret (needed when uploading) |
| `IOS_BUNDLE_ID` | Variable, optional (default `no.bpmtech.app`) |

## Asset locations

| Asset | Path |
| --- | --- |
| Listing / handoff | `store-assets/apple-app-store/listing-en-US.txt` |
| Submission notes | `store-assets/apple-app-store/app-store-connect-submission.txt` |
| Metadata | `store-assets/apple-app-store/metadata/` |
| Icon 1024² | `store-assets/apple-app-store/graphics/app-store-icon-1024x1024.png` |
| iPhone 6.9" shots | `store-assets/apple-app-store/screenshots/iphone-6.9-inch/` |
| iPad 13" shots | `store-assets/apple-app-store/screenshots/ipad-13-inch/` |
| Screenshot comps | `store-assets/apple-app-store/source/native-screens.html` |

## Pipeline map

```text
npm run ios:release:check
        │
        ▼
ios-release.yml  ──►  archive + export IPA  ──►  artifact
        │
        └──────────►  xcrun altool upload  ──►  TestFlight
                                                     │
                                                     ▼
                                            ASC metadata + Submit
```

## Local checks

```shell
npm run store-assets:app-store
npm run app-store:check
npm run ios:verify
npm run ios:release:check
```
