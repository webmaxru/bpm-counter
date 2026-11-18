# App Store launch playbook (native 4.0)

Goal: get **BPM Techno** (`no.bpmtech.app`) into TestFlight, then App Review, as fast as the Apple side allows. The signed IPA pipeline is already in GitHub Actions; the remaining blockers are Apple Developer / App Store Connect setup and uploading marketing metadata.

## Status of checked-in work

| Area | Status |
| --- | --- |
| Native SwiftUI app (iOS 17+) | Shipped on `main` |
| `ios-ci.yml` simulator build | Present |
| `ios-release.yml` signed IPA → TestFlight | Present (manual dispatch + `ios-v*` tags) |
| App Store icon 1024×1024 | Present |
| Native iPhone + iPad screenshots (5 each) | Regenerated from SwiftUI comps |
| Listing / What’s New / review notes for 4.0 | Present under `store-assets/apple-app-store/` |
| GitHub Actions signing + ASC API secrets | **Must be confirmed in the repo settings** (this agent cannot list them) |

Run the local gate anytime:

```shell
npm run store-assets:app-store
npm run store-assets:check
npm run ios:verify
```

## Your next steps (in order)

### 1. Apple Developer — app identity

1. Confirm membership is active (you already have an App Store license).
2. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), ensure an **App ID** exists for `no.bpmtech.app` (explicit).
3. Create or refresh an **App Store** provisioning profile that includes that App ID and the current **Apple Distribution** certificate for team `B9FMXAW5TZ`.
4. Encode the profile for GitHub:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\profile.mobileprovision"))
```

Team-wide certificate / API key reuse notes: [`APPLE_APP_STORE_REUSE.md`](APPLE_APP_STORE_REUSE.md).

### 2. App Store Connect — app record

1. Create (or open) the iOS app with bundle ID `no.bpmtech.app`.
2. Set primary category **Music**, secondary **Utilities**.
3. Add Support / Marketing URLs from the submission handoff. Set the App Store
   **Privacy Policy URL** to `https://bpmtech.no/privacy/ios` (native-specific;
   do not use the website `/privacy` page for the iOS listing).
4. Complete **App Privacy** as **Data Not Collected** for the native binary
   (see the same handoff file).
5. Complete the age rating questionnaire.
6. Answer export compliance: the app sets `ITSAppUsesNonExemptEncryption` to
   `false`.

### 3. GitHub secrets and variables

In the GitHub repository that will run releases (upstream `webmaxru/bpm-counter`
and/or your fork), set:

| Name | Kind |
| --- | --- |
| `APPLE_TEAM_ID` | Secret (`B9FMXAW5TZ`) |
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Secret |
| `IOS_CERTIFICATE_PASSWORD` | Secret |
| `IOS_PROVISIONING_PROFILE_BASE64` | Secret (app-specific) |
| `APP_STORE_CONNECT_API_KEY_ID` | Secret (`C6D6DZK5S7` if reusing the documented key) |
| `APP_STORE_CONNECT_ISSUER_ID` | Secret |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Secret |
| `IOS_BUNDLE_ID` | Variable, optional (default `no.bpmtech.app`) |

Signing material creation on Windows: see [`IOS_RELEASE.md`](IOS_RELEASE.md).

### 4. Ship a TestFlight build

1. Merge this launch PR to `main`.
2. Actions → **iOS TestFlight Release** → Run workflow:
   - `version`: `4.0.0`
   - `upload_to_testflight`: `true`
3. Or push an iOS release tag: `git tag ios-v4.0.0 && git push origin ios-v4.0.0`
   (do not use bare `v*` tags — those belong to package releases)
4. Download the IPA artifact if you need a manual upload fallback.
5. In App Store Connect → TestFlight, wait for processing, then add internal
   and/or external testers.

### 5. Product page assets

Upload from the repo (or ASC UI):

- Icon:
  `store-assets/apple-app-store/graphics/app-store-icon-1024x1024.png`
- iPhone 6.9":
  `store-assets/apple-app-store/screenshots/iphone-6.9-inch/*.png`
- iPad 13":
  `store-assets/apple-app-store/screenshots/ipad-13-inch/*.png`
- Copy:
  `listing-en-US.txt`, `metadata/description-en-US.txt`,
  `metadata/whats-new-en-US.txt`

Required before final submit: screenshots must match the shipped native UI.
Regenerate after UI changes with `npm run store-assets:app-store`, then prefer
replacing comps with TestFlight / device captures when chrome must be exact.

### 6. Submit for App Review

1. Select the processed 4.0.0 build.
2. Paste App Review notes from the submission handoff.
3. Submit.

Apple review timing is outside this pipeline. TestFlight usually processes a
build within minutes to a few hours after a successful upload.

## Pipeline map

```text
npm run store-assets:check
        │
        ▼
ios-release.yml  ──►  archive + export IPA  ──►  artifact
        │
        └──────────►  xcrun altool upload  ──►  TestFlight
                                                     │
                                                     ▼
                                            ASC metadata + Submit
```

## Regenerating screenshots

```shell
npm run store-assets:app-store
```

Source comps live in
`store-assets/apple-app-store/source/native-screens.html` and match the native
Analyze / Tap / Metronome tabs.
