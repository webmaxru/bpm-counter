# BPM Techno — distribution surfaces

One index for all four release surfaces. Each surface has its own playbook,
CI path, and release workflow. Shipping one surface does **not** publish the
others.

| Surface | Playbook | CI | Release workflow | Console / host |
| --- | --- | --- | --- | --- |
| Web (bpmtech.no) | [`WEB_RELEASE.md`](WEB_RELEASE.md) | Azure Static Web Apps workflow | same workflow (push / PR / dispatch) | Azure Static Web Apps |
| Microsoft Store | [`MICROSOFT_STORE_RELEASE.md`](MICROSOFT_STORE_RELEASE.md) | `microsoft-store-ci.yml` | `microsoft-store-release.yml` | Partner Center |
| Apple App Store | [`APP_STORE_LAUNCH.md`](APP_STORE_LAUNCH.md) | `ios-ci.yml` | `ios-release.yml` | App Store Connect / TestFlight |
| Google Play | [`PLAY_STORE_RELEASE.md`](PLAY_STORE_RELEASE.md) | `android-ci.yml` | `android-release.yml` | Play Console |

Supporting docs:

- Assets and dimensions: [`store-assets/ASSET_REQUIREMENTS.md`](store-assets/ASSET_REQUIREMENTS.md)
- Native Android app notes: [`ANDROID.md`](ANDROID.md)
- Native iOS signing detail: [`IOS_RELEASE.md`](IOS_RELEASE.md)
- Reusing Apple team credentials: [`APPLE_APP_STORE_REUSE.md`](APPLE_APP_STORE_REUSE.md)

## How Maxim triggers each pipeline

Run these on the repository that holds the secrets (normally
`webmaxru/bpm-counter`). Prefer **Actions → workflow → Run workflow**.

| Surface | Trigger | Typical inputs | npm gates |
| --- | --- | --- | --- |
| **Web** | Push / merge to `main`, or **workflow_dispatch** on `Azure Static Web Apps CI/CD` | none | `npm run build` locally if you want a dry run |
| **Microsoft Store** | **workflow_dispatch** on **Microsoft Store Release** | `modern_version`, `classic_version`, `regenerate_assets`, `publish_to_store` | `npm run microsoft-store:check` |
| **Apple** | **workflow_dispatch** on **iOS TestFlight Release**, or push tag `ios-vX.Y.Z` | `version`, `build_number` (optional), `upload_to_testflight` | `npm run ios:release:check` |
| **Google Play** | **workflow_dispatch** on **Android Play Store Release**, or push tag `android-vX.Y.Z` | `track`, `upload_to_play`, `status`, `regenerate_assets` | `npm run google-play:release:check` |

Do **not** use bare package tags (`v*`) for store apps. Those belong to the
squad / GitHub Release flow. Store tags are prefixed: `ios-v*`, `android-v*`.

### Independence rules

- Web deploys ignore native/store-only path changes (`android/`, `ios/`,
  `store-assets/`, store playbooks, and the non-web release workflows).
- Store release workflows are manual (or store-specific tags). They never run
  because the website was redeployed.
- Microsoft Store packages the **hosted PWA** at `https://bpmtech.no`. A
  website deploy reaches installed Store users without a new package unless the
  web app manifest or listing needs a Partner Center submission.
- Apple and Google Play ship **native** binaries. Website deploys do not update
  those store apps.

## Secrets at a glance

| Surface | Required to build / package | Required to publish / upload |
| --- | --- | --- |
| Web | `AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_MUD_0136F961E` | same (+ optional `VITE_*` analytics secrets) |
| Microsoft Store | `MS_STORE_PUBLISHER_ID` | + `AZURE_AD_TENANT_ID`, `AZURE_AD_APPLICATION_CLIENT_ID`, `AZURE_AD_APPLICATION_SECRET`, `SELLER_ID` |
| Apple | signing cert + profile secrets | + App Store Connect API key secrets (for TestFlight upload) |
| Google Play | `ANDROID_KEYSTORE_*` (four secrets) | + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` |

Full tables live in each playbook.

## Asset folders

| Surface | Listing / graphics root |
| --- | --- |
| Web | site content under `src/`, `public/` (no store listing pack) |
| Microsoft Store | `store-assets/microsoft-store/` |
| Apple App Store | `store-assets/apple-app-store/` |
| Google Play | `store-assets/google-play/` (+ `android/release-notes-v4.txt`) |

Regenerate store graphics:

```shell
npm run store-assets:all
npm run store-releases:check
```

## Shared playbook sections

Every surface playbook uses the same outline:

1. Purpose
2. Identity
3. Create from scratch
4. Update existing / draft
5. Trigger the release pipeline
6. Required secrets and variables
7. Asset locations
8. Pipeline map
9. Local checks
