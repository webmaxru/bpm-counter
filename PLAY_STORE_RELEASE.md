# Google Play release playbook

Goal: ship the **native Kotlin Compose** BPM Techno app (`no.bpmtech.twa`)
version **4.0.0** (versionCode **4**) to Google Play as fast as a signed AAB and
listing assets allow.

This updates the existing Play listing (same package ID as the old TWA). Ordinary
website deploys to `https://bpmtech.no` do **not** update the native Play app.

## Status of checked-in work

| Area | Status |
| --- | --- |
| Package ID `no.bpmtech.twa` | Existing Play listing |
| Native app version `4.0.0` / code `4` | In `android/app/build.gradle` |
| Listing copy + handoff | `store-assets/google-play/` |
| Native screenshot + graphic generator | `npm run store-assets:google-play` |
| Readiness gate | `npm run google-play:check` |
| Signed AAB + optional Play upload | `.github/workflows/android-release.yml` |
| Upload keystore / Play API secrets | **Must be configured by you** |

## Pipeline map

```text
npm run store-assets:google-play
        │
        ▼
npm run google-play:check
        │
        ▼
GitHub Actions: Android Play Store Release
        │
        ├─ decode upload keystore from ANDROID_KEYSTORE_BASE64
        ├─ ./gradlew :app:bundleRelease  (signed)
        ├─ upload AAB + listing artifacts
        │
        └─ optional: r0adkll/upload-google-play
                    track = internal | alpha | beta | production
                    status = draft | completed
                              │
                              ▼
                     Play Console review / rollout
                              │
                              ▼
                     Upload/confirm listing screenshots + Data Safety
```

Signing and Play API secrets stay step-scoped so ordinary CI jobs never see them.

## 1. Play Console prerequisites (you)

1. Open [Google Play Console](https://play.google.com/console) → app
   **Realtime BPM Counter for DJs** (`no.bpmtech.twa`).
2. Confirm **Play App Signing** is enabled (almost always on for existing apps).
3. Keep or create an **upload key** keystore used only to sign AABs you upload.
4. Create a **Google Cloud service account** with Play Console access:
   - Play Console → Users and permissions → Invite user → service account
   - Role: **Release to production, exclude devices, and use Play App Signing**
     (or at least release to testing tracks while you validate)
5. Download the service account JSON key.

## 2. GitHub secrets

In the repository that will run releases (upstream `webmaxru/bpm-counter`
and/or your fork), add:

| Name | Purpose |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 of the upload-key `.jks` / `.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Raw JSON for the Play Developer API service account |

Encode the keystore locally (do not commit it):

```shell
base64 -w0 upload-keystore.jks > upload-keystore.b64
```

Paste the single-line contents into `ANDROID_KEYSTORE_BASE64`.

## 3. Regenerate listing assets

```shell
npm ci
npx playwright install chromium
npm run store-assets:google-play
npm run google-play:check
```

This refreshes:

- `store-assets/google-play/graphics/` (icon + feature graphic)
- `store-assets/google-play/screenshots/{phone,tablet-7-inch,tablet-10-inch,chromebook}/`
  from native Compose mockups in
  `store-assets/google-play/source/native-phone-screens.html`

Review the PNGs before submission. Commit them when the UI is the version you
will ship.

## 4. Ship a release build

### Option A — GitHub Actions (preferred)

1. Merge this branch to the repo that holds the secrets.
2. Actions → **Android Play Store Release** → Run workflow.
3. Recommended first run:
   - `track`: `internal`
   - `upload_to_play`: `true` once secrets exist (or `false` to only build artifacts)
   - `status`: `draft`
   - `regenerate_assets`: `false` if assets are already committed
4. Download the AAB artifact if you need a manual Console upload.

### Option B — local signed bundle

```shell
export ANDROID_KEYSTORE_FILE=/absolute/path/to/upload-keystore.jks
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=...
export ANDROID_KEY_PASSWORD=...
npm run android:bundle
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` in Play Console.

## 5. Console listing checklist (same day)

Paste / upload from the repo:

| Console field | Source |
| --- | --- |
| Short description | `store-assets/google-play/listing-en-US.txt` |
| Full description | same |
| Release notes | `android/release-notes-v4.txt` |
| App icon 512 | `store-assets/google-play/graphics/app-icon-512x512.png` |
| Feature graphic | `store-assets/google-play/graphics/feature-graphic-1024x500.png` |
| Phone screenshots | `store-assets/google-play/screenshots/phone/` |
| Tablet screenshots | `.../tablet-7-inch/` and `.../tablet-10-inch/` |
| Data Safety / ads answers | `store-assets/google-play/play-console-submission.txt` |

Also confirm:

- Privacy policy URL `https://bpmtech.no/privacy`
- Content rating questionnaire still valid for Music & Audio
- Target API 36 / policy declarations for the new native binary
- Digital Asset Links fingerprint matches Play App Signing cert in
  `public/.well-known/assetlinks.json`

## 6. Recommended rollout order

1. **Internal testing** track with the signed 4.0.0 AAB
2. Install from the internal track on a physical device; exercise record, file,
   tap, metronome, deny-mic
3. Promote to **closed/open testing** if you want wider coverage
4. Promote to **production** (staged 20% → 100% if you prefer caution)

## 7. Fastest path if secrets are not ready today

1. Run **Android Play Store Release** with `upload_to_play=false` after adding
   only the four keystore secrets — or sign locally.
2. Manually upload the AAB in Play Console → Testing → Internal testing.
3. Upload the regenerated screenshots + feature graphic from the workflow
   listing-assets artifact.
4. Submit for review.

Automated Play upload can be turned on later with
`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` and `upload_to_play=true`.
