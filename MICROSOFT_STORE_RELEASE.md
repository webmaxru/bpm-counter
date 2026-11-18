# Microsoft Store release playbook

Goal: refresh **Live BPM Counter** (`9NQ4M5SC9PQ9`) in Partner Center with the
current BPM Techno web experience, then regenerate and submit PWA packages.

The app is a hosted PWA. Ordinary website deploys to `https://bpmtech.no`
reach installed Store users automatically. Create and resubmit packages when
the web app manifest changes, or when Partner Center needs a new package
version. Listing screenshots, logos, and copy still need an explicit Store
submission.

## Status of checked-in work

| Area | Status |
| --- | --- |
| Store product ID `9NQ4M5SC9PQ9` | Live |
| Package ID `47782MaximSalnikov.BPMTechno` | Live |
| Listing copy + branding sources | `store-assets/microsoft-store/` |
| Asset generator | `npm run store-assets:microsoft` |
| Readiness gate | `npm run microsoft-store:check` |
| PWABuilder packaging script | `npm run microsoft-store:package` |
| GitHub Actions package + optional publish | `microsoft-store-release.yml` |
| Partner Center Entra / seller secrets | **Must be configured by you** |

## Pipeline map

```text
npm run store-assets:microsoft
        │
        ▼
npm run microsoft-store:check
        │
        ▼
npm run microsoft-store:package  ──►  .zip with .msixbundle + .classic.appxbundle
        │
        ├──────────►  artifact / manual Partner Center upload
        │
        └──────────►  one Partner Center submission (optional)
                      modern + classic bundles uploaded together,
                      draft preserved when present, then committed once
                              │
                              ▼
                     Partner Center certification
                              │
                              ▼
                     Upload listing screenshots + copy
```
Partner Center Entra secrets stay step-scoped so `npm ci` never sees them.


## 1. Partner Center identity

1. Open [Partner Center](https://partner.microsoft.com/dashboard) → Apps and
   games → **Live BPM Counter**.
2. Open **Product management** → **Product Identity**.
3. Copy:
   - Package ID → already committed as `47782MaximSalnikov.BPMTechno`
   - Publisher display name → already committed as `Maxim Salnikov`
   - Publisher ID (`CN=...`) → store as GitHub secret `MS_STORE_PUBLISHER_ID`
4. Keep the reserved product name **Live BPM Counter** unless you reserve a
   new name. Listing short title and description can still brand as BPM Techno.

## 2. GitHub secrets for automated publish

In the repository that will run releases (upstream `webmaxru/bpm-counter`
and/or your fork), add:

| Name | Purpose |
| --- | --- |
| `MS_STORE_PUBLISHER_ID` | Partner Center Publisher ID (`CN=...`) |
| `AZURE_AD_TENANT_ID` | Entra tenant for Partner Center API access |
| `AZURE_AD_APPLICATION_CLIENT_ID` | Entra app registration client ID |
| `AZURE_AD_APPLICATION_SECRET` | Entra app registration client secret |
| `SELLER_ID` | Partner Center seller / publisher numeric ID |

Create the Entra app, then add it under Partner Center **Account settings →
User management → Microsoft Entra applications** with the **Manager** role.
Official setup:
[Publish app updates with GitHub Actions](https://learn.microsoft.com/en-us/windows/apps/publish/msstore-dev-cli/github-actions).

Package generation alone only needs `MS_STORE_PUBLISHER_ID`. The Entra secrets
are required when `publish_to_store=true`.

## 3. Regenerate listing assets

```shell
npm ci
npx playwright install chromium
npm run store-assets:microsoft
npm run microsoft-store:check
```

This refreshes:

- Branding under `store-assets/microsoft-store/branding/`
- Desktop screenshots under `store-assets/microsoft-store/screenshots/desktop/`
  from the live site (`STORE_ASSET_ORIGIN` overrides the default
  `https://bpmtech.no`)

Review the PNGs before submission. Commit them when the production UI is the
version you want in the Store.

## 4. Package locally

```shell
export MS_STORE_PUBLISHER_ID="CN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# optional overrides:
# export MS_STORE_MODERN_VERSION=3.0.0.0
# export MS_STORE_CLASSIC_VERSION=2.1.0.0
npm run microsoft-store:package
```

Output lands in `store-assets/microsoft-store/packages/`:

- `bpm-techno-msstore-*.zip`
- `pwaAppInfo.json`
- `pwabuilder-request-*.json`

Unzip and keep:

- `*.msixbundle`
- `*.classic.appxbundle`

Ignore `*.sideload.msix` for Store upload.

## 5. Ship from GitHub Actions

1. Merge this pipeline PR to `main`.
2. Actions → **Microsoft Store Release** → Run workflow:
   - `modern_version`: `3.0.0.0`
   - `classic_version`: `2.1.0.0`
   - `regenerate_assets`: `true` for a fresh capture, or `false` to package the
     committed assets
   - `publish_to_store`: `false` for artifact-only; `true` after secrets work
3. Download the package artifact.
4. If publish was disabled, upload both Store packages in Partner Center →
   submission → **Packages**.
5. Upload listing graphics and screenshots from
   `store-assets/microsoft-store/` (or the listing-assets artifact).
6. Paste copy from `listing-en-US.txt` / `partner-center-submission.txt`.
7. Submit for certification.

## 6. What requires a new package?

| Change | New Store package needed? |
| --- | --- |
| HTML / CSS / JS / service worker on bpmtech.no | No |
| Screenshots, logos, description, what's new | No package; listing submission only |
| Web app manifest name, icons, shortcuts, protocol handlers, share target, related apps | Yes |

## 7. Certification tips

- If Partner Center warns about full trust / restricted capabilities, reply:
  `Needed for PWA Hosted App model, created by pwabuilder.com`
- Privacy URL: `https://bpmtech.no/privacy.html`
- Support: `mailto:salnikov@gmail.com`
- Age rating: keep the existing Everyone / IARC association unless policy
  answers change

## 8. Local gate before asking for review

```shell
npm run microsoft-store:check
```
