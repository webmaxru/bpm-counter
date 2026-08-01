# Azure Deployment Plan

**Status:** Validated
**Last Updated:** 2026-08-01

## 1. Project Overview

- **Mode:** MODIFY
- **Workload:** Existing public BPM analysis and publishing web application
- **Repository:** `webmaxru/bpm-counter`
- **Production branch:** `main`
- **Production domains:** `https://bpmtech.no`, `https://www.bpmtech.no`
- **Azure hostname:** `https://mango-mud-0136f961e.azurestaticapps.net`
- **Change objective:** Deploy the completed affiliate monetization improvements and AdSense-oriented publishing surface, then verify production readiness.

## 2. Requirements

| Requirement | Decision |
|---|---|
| Classification | Production |
| Expected scale | Small, under 1,000 users per month initially |
| Budget | Cost-Optimized |
| Compliance | No special regulated-workload requirements; preserve privacy, telemetry disclosure, affiliate disclosure, and authenticated-route controls |
| Availability | Use the existing globally served Azure Static Web Apps production endpoint |
| Data residency | Preserve the existing West US 2 deployment; no data-plane or storage changes |

The user explicitly requested production deployment. The subscription, target, and operating profile use the detected existing production configuration because the user was unavailable for the confirmation form.

## 3. Current Architecture

```text
Browser
  |
  v
Azure Static Web Apps: bpm-counter (West US 2, Free)
  |-- Vite/React static frontend and prerendered publishing pages
  |-- Static Web Apps routing, authentication, custom domains, and TLS
  |-- Managed Azure Functions API from api/
  |     `-- /api/feedback -> existing Cosmos DB output binding
  |-- Application Insights telemetry
  `-- Google Analytics 4 telemetry

External affiliate destinations are opened only after a user click.
```

### Existing Azure Target

| Property | Value |
|---|---|
| Subscription | Visual Studio Enterprise Subscription |
| Subscription ID | `d0b7d6ee-17bf-4c4f-b79d-4f6c2cb583fd` |
| Resource group | `bpm-counter-v2` |
| Resource | `Microsoft.Web/staticSites/bpm-counter` |
| Region | West US 2 |
| SKU | Free |
| Source provider | GitHub |
| Repository/branch | `webmaxru/bpm-counter` / `main` |
| Custom domain status | `bpmtech.no` Ready; `www.bpmtech.no` Ready |

No Azure resources will be created, deleted, resized, or moved.

## 4. Deployment Recipe

- **Recipe:** Existing CI/CD
- **Mechanism:** `.github/workflows/azure-static-web-apps-mango-mud-0136f961e.yml`
- **Deployment action:** `Azure/static-web-apps-deploy@v1`
- **Trigger:** Push to `main`
- **App location:** `/`
- **API location:** `api`
- **Output location:** `build`
- **Credential:** Existing GitHub Actions secret `AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_MUD_0136F961E`

### Selection Rationale

The application already has a healthy production Static Web Apps resource and a successful GitHub Actions deployment history. Reusing that workflow avoids infrastructure drift, resource replacement, new credentials, and unnecessary `azd`, Bicep, Terraform, or Azure CLI provisioning artifacts.

## 5. Resource Inventory and Quota

| Azure Resource Type | Existing Resource | Number to Deploy | Quota Requirement |
|---|---|---:|---|
| `Microsoft.Web/staticSites` | `bpm-counter` | 0 | None; content/configuration update only |
| Managed Static Web Apps API | Existing `api/` deployment | 0 | None; code update only |
| Existing feedback data binding | Unchanged | 0 | None |

**Total new Azure resources:** 0

The Azure Quota CLI was attempted for `Microsoft.Web` in `westus2`, but the subscription does not have the `Microsoft.Quota` provider registered. No provider registration is warranted for this release because the deployment provisions zero resources and consumes no regional capacity quota.

## 6. Files and Infrastructure Changes

- No new infrastructure-as-code files are required.
- No `azure.yaml`, Bicep, Terraform, Dockerfile, or Azure resource configuration will be generated.
- The existing Static Web Apps workflow remains the deployment source of truth.
- `.azure/deployment-plan.md` records preparation, validation, and deployment decisions.
- Application, content, tests, static routing, and service-worker changes already present in the worktree are the deployment payload.

## 7. Validation Proof

**Validation executed:** 2026-08-01T02:51:48+02:00

| Check | Command or Evidence | Result |
|---|---|---|
| Azure account | `az account show` | Enabled `Visual Studio Enterprise Subscription` with the planned subscription ID |
| Static Web Apps target | `az staticwebapp show --name bpm-counter --resource-group bpm-counter-v2` | Existing Free-tier site in West US 2, linked to `webmaxru/bpm-counter` branch `main` |
| Custom domains | `az staticwebapp hostname list` | `bpmtech.no` and `www.bpmtech.no` both `Ready` |
| Azure Policy | `az policy assignment list` | 0 assigned policies |
| Region support | Azure Static Web Apps region availability reference | West US 2 supported |
| GitHub workflow | `gh api repos/webmaxru/bpm-counter/actions/workflows/azure-static-web-apps-mango-mud-0136f961e.yml` | Workflow state `active` |
| Deployment history | `gh run list --workflow azure-static-web-apps-mango-mud-0136f961e.yml --limit 5` | Five most recent runs completed successfully |
| Deployment credential | `gh secret list --repo webmaxru/bpm-counter` | Required Static Web Apps token secret present |
| Unit tests | `npm test` | 145 passed, 1 skipped |
| Browser tests | `npm run test:e2e` | 20 passed |
| Production build | `npm run build` | Succeeded; 14 prerendered routes and 25 service-worker precache entries |
| Artifact inspection | PowerShell checks over `build/` | 0 missing files, 14 HTML documents, 14 sitemap URLs, 30 SWA routes, service worker present |
| API dependencies | `npm --prefix api ls --depth=0` | Dependency tree valid |
| Branch safety | `git rev-list --left-right --count origin/main...HEAD` | Local `main` is 1 commit ahead and 0 behind |
| Diff quality | `git diff --check` | Passed |
| Static RBAC review | Search for `*.bicep` and `*.tf` | Not applicable: no IaC, managed identity, or role-assignment changes |

All validation checks passed. The release is approved for the existing CI/CD deployment recipe.

## 8. Security and Identity

- Keep the Static Web Apps deployment token in GitHub Actions secrets; do not expose or rotate it during this release.
- Preserve existing Static Web Apps authentication and authorization rules.
- Preserve noindex behavior for authentication, account, demo, and other non-publishing routes.
- Preserve telemetry URL sanitization so analyzer query parameters are not sent to GA4 or Application Insights.
- Preserve `rel="sponsored nofollow noopener noreferrer"` on affiliate destinations.
- No new RBAC assignments, managed identities, secrets, public ports, or network resources are required.

## 9. Cost Estimate

| Item | Expected Incremental Cost |
|---|---:|
| Azure Static Web Apps Free tier | $0/month |
| Existing managed API deployment | $0 incremental |
| Existing telemetry/data services | No configuration or capacity change |
| New Azure resources | $0 |

This release is expected to add no Azure infrastructure cost. Existing service usage charges, external affiliate programs, and future AdSense traffic are outside the deployment delta.

## 10. Execution Plan

1. Verify the worktree and branch relationship to `origin/main`.
2. Run the unit test suite, Playwright suite, and full production build.
3. Run Azure deployment validation with this plan marked `Ready for Validation`.
4. Stage only the monetization, publishing, test, and deployment-plan changes. Exclude unrelated user deletions under `.entire/` and `.github/hooks/`.
5. Commit with the required Copilot trailers.
6. Push the validated commit to `origin/main`.
7. Monitor the Azure Static Web Apps GitHub Actions workflow to a successful conclusion.
8. Verify the custom domain and Azure hostname with clean HTTP and browser checks.
9. Audit the deployed site for AdSense submission readiness and report any account-specific blockers.

## 11. Validation Criteria

### Local

- `npm test` passes.
- `npm run test:e2e` passes.
- `npm run build` succeeds.
- The build contains all 14 prerendered public documents, sitemap, robots configuration, structured metadata, routing configuration, and bundled service worker.

### Deployment

- The push-triggered GitHub Actions workflow completes successfully.
- The workflow deploys the intended commit from `main`.
- No unrelated worktree deletions are included in the deployment commit.

### Production

- `bpmtech.no`, `www.bpmtech.no`, and the Azure hostname resolve over HTTPS.
- All intended public routes return crawlable content on direct requests.
- Unknown routes return an actual 404 response.
- Authentication and non-publishing routes retain noindex protection.
- Canonicals, robots directives, JSON-LD, sitemap entries, and internal navigation are correct.
- Affiliate cards show disclosure, contextual destinations, sponsored attributes, and usable responsive layouts.
- Tap tempo and BPM conversion tools function in production.
- The service worker updates without serving stale metadata or soft 404s.
- Microphone start/stop and SPA navigation release media resources.

## 12. AdSense Submission Readiness Audit

- Confirm Googlebot-readable static HTML across the publishing surface.
- Confirm `robots.txt` and `sitemap.xml` are reachable and internally consistent.
- Confirm trust pages: privacy, terms, contact, and affiliate disclosure.
- Confirm no ad placements exist on error, login, account, demo, or other noindex pages.
- Check for an existing AdSense publisher ID and approved site-verification method.
- Add or verify `ads.txt` only when the actual publisher ID is known; never invent one.
- Confirm a Google-certified consent-management platform is configured before serving ads to users in the EEA, UK, or Switzerland.
- Record that content and technical readiness improve eligibility but cannot guarantee account approval.

## 13. Rollback

If the deployment introduces a production regression:

1. Revert the deployment commit without rewriting history.
2. Push the revert to `main`.
3. Monitor the Static Web Apps workflow until the prior behavior is restored.
4. Re-run the affected production checks.

The deployment does not mutate or delete Azure infrastructure, so rollback is limited to application code and configuration.

## 14. Research Summary

| Component | Finding Applied |
|---|---|
| Azure Static Web Apps | Appropriate for the React SPA, prerendered HTML, and integrated `api/` Functions backend. The existing `build` output path matches the documented React convention. |
| Region availability | West US 2 is one of the supported Static Web Apps regions. No region change is needed. |
| Free SKU | Supports two custom domains. The existing `bpmtech.no` and `www.bpmtech.no` domains consume both slots, and this release adds no domain. |
| GitHub-linked deployment | Reuse the existing repository/branch integration and deployment token stored in GitHub Actions secrets. Never expose the token in logs or deployment outputs. |
| Routing and authentication | Preserve explicit Static Web Apps routes, authenticated/admin role controls, noindex headers, and real 404 behavior. |
| Managed Azure Functions | The integrated API remains unchanged as an infrastructure component; no standalone Function App, plan, storage account, or deployment slot is introduced. |
| Cosmos DB binding | Preserve the existing feedback output binding and connection configuration; no data model, capacity, or account changes are in scope. |
| Application Insights | Preserve the existing client instrumentation and URL sanitization; no telemetry resource or connection-string change is in scope. |

Sources: Azure Prepare references for Static Web Apps deployment, routing, region availability, Azure Functions, Cosmos DB, and Application Insights; detected Azure resource configuration; existing GitHub Actions workflow.

## 15. Preparation Evidence

- Azure CLI authenticated to the enabled target subscription.
- GitHub CLI authenticated as a repository administrator.
- The production Static Web App, repository integration, custom domains, and deployment secret were detected successfully.
- `origin/main` is an ancestor of local `main`; local `main` is one commit ahead and not behind.
- Unit tests: 145 passed, 1 skipped.
- Playwright: 20 passed.
- Production build: succeeded, generating 14 prerendered routes and a service worker precaching 25 files.

## 16. Validation Steps

- [x] All validation checks pass
  - [x] Deployment plan and detected Azure target agree.
  - [x] West US 2 supports Azure Static Web Apps.
  - [x] No assigned Azure Policy conflicts block the release.
  - [x] Existing GitHub Actions workflow is active and has a successful deployment history.
  - [x] Required Static Web Apps deployment secret exists.
  - [x] Generated production artifact contains the expected routes, sitemap, configuration, and service worker.
  - [x] Unit tests, browser tests, and production build pass.
  - [x] Git diff passes whitespace/error checks.
  - [x] Static RBAC review is complete or documented as not applicable.
