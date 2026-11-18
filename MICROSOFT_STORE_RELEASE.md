# Microsoft Store release playbook

Index of all surfaces: [`STORE_RELEASES.md`](STORE_RELEASES.md).

## Purpose

Refresh the **hosted PWA** listing in Partner Center (product **Live BPM
Counter**). Ordinary website deploys to `https://bpmtech.no` reach installed
Store users automatically. Create and resubmit packages when the web app
manifest changes, or when Partner Center needs a new package version. Listing
screenshots, logos, and copy still need an explicit Store submission.

## Identity

| Item | Value |
| --- | --- |
| Store product ID | `9NQ4M5SC9PQ9` |
| Package ID | `47782MaximSalnikov.BPMTechno` |
| Reserved name | Live BPM Counter |
| Publisher display | Maxim Salnikov |
| Hosted URL | `https://bpmtech.no` |
| CI | `.github/workflows/microsoft-store-ci.yml` |
| Release | `.github/workflows/microsoft-store-release.yml` |

## Create from scratch

1. Open [Partner Center](https://partner.microsoft.com/dashboard) → Apps and
   games → **Create a new app** (or reserve a name).
2. Complete Product Identity; record Package ID, Publisher display name, and
   Publisher ID (`CN=...`).
3. Commit identity into `store-assets/microsoft-store/package-identity.json`
   (update the checked-in file if this is truly a new product).
4. Generate branding + screenshots: `npm run store-assets:microsoft`.
5. Configure `MS_STORE_PUBLISHER_ID` and (for API publish) Entra secrets.
6. Run `npm run microsoft-store:package`, upload both modern `.msixbundle` and
   classic `.appxbundle`, fill listing fields, submit for certification.

For **this** product the listing already exists — use
[Update existing / draft](#update-existing--draft).

## Update existing / draft

1. Open Partner Center → **Live BPM Counter** (`9NQ4M5SC9PQ9`).
2. Decide whether you need a **new package** (manifest / identity change) or
   **listing-only** updates (screenshots, logos, description).
3. Regenerate assets when the production UI changed:
   `npm run store-assets:microsoft`.
4. Dispatch **Microsoft Store Release** with a higher `modern_version` than the
   last submitted package (classic must stay lower than modern).
5. Start with `publish_to_store=false` to collect artifacts; flip to `true`
   after Entra secrets work.
6. If publishing manually: upload both Store packages in one submission,
   attach listing graphics, paste copy from the handoff files, submit.

## Trigger the release pipeline

| Method | Details |
| --- | --- |
| **workflow_dispatch** | Actions → **Microsoft Store Release** (only trigger) |

Inputs:

| Input | Typical value |
| --- | --- |
| `modern_version` | `3.0.0.0` (four-part; bump each package submission) |
| `classic_version` | `2.1.0.0` (must be lower than modern) |
| `regenerate_assets` | `true` for a fresh production capture |
| `publish_to_store` | `false` until Partner Center API secrets work |

There is no tag trigger for Microsoft Store (avoids colliding with `v*` /
`ios-v*` / `android-v*`).

Local package:

```shell
export MS_STORE_PUBLISHER_ID="CN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
npm run microsoft-store:package
```

## Required secrets and variables

| Name | Purpose |
| --- | --- |
| `MS_STORE_PUBLISHER_ID` | Partner Center Publisher ID (`CN=...`) — required to package |
| `AZURE_AD_TENANT_ID` | Entra tenant (publish only) |
| `AZURE_AD_APPLICATION_CLIENT_ID` | Entra app client ID (publish only) |
| `AZURE_AD_APPLICATION_SECRET` | Entra app client secret (publish only) |
| `SELLER_ID` | Partner Center seller / publisher numeric ID (publish only) |

Create the Entra app, then add it under Partner Center **Account settings →
User management → Microsoft Entra applications** with the **Manager** role.
Guide: [Publish app updates with GitHub Actions](https://learn.microsoft.com/en-us/windows/apps/publish/msstore-dev-cli/github-actions).

Partner Center Entra secrets stay step-scoped so `npm ci` never sees them.

## Asset locations

| Asset | Path |
| --- | --- |
| Listing copy | `store-assets/microsoft-store/listing-en-US.txt` |
| Partner Center handoff | `store-assets/microsoft-store/partner-center-submission.txt` |
| Package identity | `store-assets/microsoft-store/package-identity.json` |
| Branding | `store-assets/microsoft-store/branding/` |
| Desktop screenshots | `store-assets/microsoft-store/screenshots/desktop/` |
| Branding source | `store-assets/microsoft-store/source/branding.html` |
| Generated packages | `store-assets/microsoft-store/packages/` (gitignored outputs) |

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
                      modern + classic together, draft preserved, one commit
                              │
                              ▼
                     Partner Center certification
```

### What requires a new package?

| Change | New Store package needed? |
| --- | --- |
| HTML / CSS / JS / service worker on bpmtech.no | No |
| Screenshots, logos, description, what's new | No package; listing submission only |
| Web app manifest name, icons, shortcuts, protocol handlers, share target, related apps | Yes |

## Local checks

```shell
npm ci
npx playwright install chromium
npm run store-assets:microsoft
npm run microsoft-store:check
npm run microsoft-store:release:check
```

Certification tip: if Partner Center warns about full trust / restricted
capabilities, reply: `Needed for PWA Hosted App model, created by pwabuilder.com`.
Privacy URL: `https://bpmtech.no/privacy.html`. Support: `mailto:salnikov@gmail.com`.
