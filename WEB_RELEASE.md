# Web release playbook (Azure Static Web Apps)

Index of all surfaces: [`STORE_RELEASES.md`](STORE_RELEASES.md).

## Purpose

Ship the production Progressive Web App at **https://bpmtech.no** (Azure
Static Web Apps resource `mango-mud-0136f961e`). This is the hosted experience
Microsoft Store packages wrap; it is independent of the native Apple and Google
Play binaries.

## Identity

| Item | Value |
| --- | --- |
| Production URL | `https://bpmtech.no` |
| Azure SWA nickname | `mango-mud-0136f961e` |
| Workflow | `.github/workflows/azure-static-web-apps-mango-mud-0136f961e.yml` |
| App location | `/` (Vite) |
| API location | `api` (Azure Functions) |
| Output location | `build` |

## Create from scratch

Use this when standing up a **new** Static Web App (new fork, new Azure
subscription, or disaster recovery). For the live bpmtech.no app, skip to
[Update existing / draft](#update-existing--draft).

1. Fork or clone the repo and connect an Azure subscription.
2. Create a Static Web App (VS Code Azure extension or Azure Portal → Static Web
   App). Point it at the GitHub repo and `main`.
3. Configure build fields to match this repo: app `/`, API `api`, output
   `build`.
4. Azure writes a GitHub Actions workflow and creates the deployment token
   secret (name like `AZURE_STATIC_WEB_APPS_API_TOKEN_…`).
5. Add optional build-time `VITE_*` secrets listed below.
6. Attach the custom domain `bpmtech.no` in the Azure Portal when DNS is ready.
7. Confirm a production deploy from `main` and open the site.

Broader SWA feature walkthrough (auth, staging, Functions): see [`README.md`](README.md).

## Update existing / draft

The production site already exists. Day-to-day updates:

1. Land web changes on `main` (merge PR or push). The Azure workflow deploys
   production automatically.
2. For a **preview**, open a PR against `main` from a branch **in the same
   repository** (fork PRs skip the deploy token). GitHub Actions comments the
   staging URL.
3. Merge the PR to promote; closing the PR without merge tears down the staging
   environment.
4. For a **manual production redeploy** without a new commit, run
   **Actions → Azure Static Web Apps CI/CD → Run workflow** from the `main`
   branch (dispatch on other refs is ignored).

Native / store-only changes under `android/`, `ios/`, `store-assets/`, store
scripts, and the store playbooks do **not** trigger production deploys on
`main` (push path filters). Pull requests keep an unfiltered trigger so closing
a PR always cleans up the staging environment.

## Trigger the release pipeline

| Method | When to use |
| --- | --- |
| Merge / push to `main` | Normal production ship |
| Pull request (same-repo branch) | Staging preview |
| **workflow_dispatch** on `main` | Redeploy current `main` without a new commit |

There is no store tag for the website. Do not confuse squad package tags
(`v*`) with App Store / Play tags (`ios-v*`, `android-v*`).

## Required secrets and variables

| Name | Kind | Purpose |
| --- | --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_MUD_0136F961E` | Secret | Deploy token for this SWA |
| `VITE_APPINSIGHTS_CONNECTION_STRING` | Secret (optional) | Application Insights |
| `VITE_GA4_MEASUREMENT_ID` | Secret (optional) | Google Analytics 4 |
| `VITE_ADSENSE_SLOT_IN_ARTICLE` | Secret (optional) | AdSense slot |
| `VITE_ADSENSE_SLOT_MULTIPLEX` | Secret (optional) | AdSense multiplex |
| `VITE_POSTHOG_KEY` | Secret (optional) | PostHog |
| `VITE_POSTHOG_HOST` | Secret (optional) | PostHog host |

`SKIP_DEPLOY_ON_MISSING_SECRETS` is set in the workflow so fork CI can run
without the Azure token. Production deploys still need the token on the
canonical repo.

## Asset locations

Web has no Partner Center / ASC / Play listing pack. Relevant paths:

| Path | Role |
| --- | --- |
| `src/` | App UI and routes |
| `public/` | Static files, including `.well-known/assetlinks.json` for Play |
| `api/` | Azure Functions |
| `src/staticwebapp.config.json` | SWA routes, headers, auth |

Privacy / legal pages used by store listings (for example
`https://bpmtech.no/privacy` and `/privacy/ios`) ship through this pipeline.

## Pipeline map

```text
push/PR/dispatch on web-relevant paths
        │
        ▼
azure-static-web-apps-*.yml
        │
        ├─ Vite build (+ api)
        └─ Azure/static-web-apps-deploy
                │
                ├─ PR  → staging environment URL
                └─ main → https://bpmtech.no
```

## Local checks

```shell
npm ci
npm test
npm run build
```

Optional local SWA emulator (requires Azure Static Web Apps CLI):

```shell
npx @azure/static-web-apps-cli start
```
