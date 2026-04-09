# Tank — History

## Project Context
- **Project:** BPM Counter — a web app that detects BPM in music from microphone input
- **Stack:** Next.js (static export), Azure Functions (backend), Azure Static Web Apps (deployment)
- **Current state:** Single Azure Function at `api/feedback/` with CosmosDB output binding
- **API structure:** `api/feedback/function.json` (bindings) + `api/feedback/index.js` (handler)
- **User:** Maxim Salnikov

## Learnings

### Azure Functions Best Practices Audit (2026-08-04)
- `host.json` `"version": "2.0"` is the schema version, NOT the runtime version. Runtime is controlled by `FUNCTIONS_EXTENSION_VERSION` app setting (or SWA platform for managed functions).
- Current extension bundle `[2.*, 3.0.0)` is severely outdated — recommended is `[4.*, 5.0.0)`.
- SWA managed functions officially constrain "triggers and bindings to HTTP" — CosmosDB output binding is a risk area. May work in practice via extension bundles, but not officially guaranteed.
- Programming model is v3 (function.json-based). v4 (`@azure/functions` npm package) is GA and recommended — code-centric registration, no function.json, better testability.
- `api/feedback/index.js` has critical bug: no `return` after validation error → execution falls through to CosmosDB write path, likely crashes on `req.body.bpm` when body is null.
- `appInsights.setup()` at module scope with no connection string parameter — relies on env var, no fallback if missing.
- `api/feedback/` endpoint is anonymous with no rate limiting — abuse/cost risk (writes to CosmosDB + telemetry).
- CosmosDB binding uses deprecated properties: `collectionName` (→ `containerName`), `connectionStringSetting` (→ `connection`).
- Key files: `api/host.json`, `api/feedback/function.json`, `api/feedback/index.js`, `api/package.json`, `src/staticwebapp.config.json`, `swa-cli.config.json`.

### Azure Functions Audit Fix Implementation (2026-08-04)
- Replaced CosmosDB output binding with `@azure/cosmos` SDK v4 for SWA compatibility. Lazy-init pattern caches a promise (not the container) to prevent race conditions on concurrent cold starts.
- Database: `bpmtech-db`, Container: `feedback`, Partition key: `/id`.
- Cosmos connection string: checks `COSMOSDB_CONNECTION_STRING` first, falls back to `bpmcounterdbaccount_DOCUMENTDB` for backward compatibility.
- App Insights guarded: checks both `APPLICATIONINSIGHTS_CONNECTION_STRING` and `APPINSIGHTS_INSTRUMENTATIONKEY` env vars before calling `setup()`. All `client` calls use optional chaining (`client?.trackEvent()`).
- Validation returns 400 (not 404), with proper body type checks (`typeof === 'object'`, `!Array.isArray`), and early `return` (no more `context.done()`).
- Cosmos write failures return HTTP 500 — data loss is not silently hidden behind "Thank you!" response.
- Extension bundle updated to `[4.*, 5.0.0)`.
- Security headers added: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
- `api/proxies.json` deleted (deprecated feature, was empty).
- `api/local.settings.sample.json` created for developer onboarding.
- Code quality: `Date.now()` (removed `/1`), `substring()` (replaced `substr()`), single document ID generation, `const` instead of `var`, removed `JSON.stringify()` on document.

### Azure Cost Optimization Cleanup (2026-08-09)
- Deleted orphaned SRE App Insights (`bpm-counter-sre-be8c69bc-9bd6-app-insights`) — was linked to a deleted workspace.
- Deleted 2 orphaned smart detector alert rules: `Failure Anomalies - bpm-counter-sre-*` and `Failure Anomalies - bpm-counter-ai` (referenced non-existent App Insights resources).
- Deleted 2 orphaned managed identities: `bpm-counter-sre-kyrz2xu6z25je` (eastus2) and `bpm-agent-2utobr7bi6t6a` (swedencentral, confirmed zero role assignments).
- Deleted 2 orphaned metric alerts (`index page-bpm-counter-ai`, `static-bpm-counter-ai`) — both referenced non-existent `bpm-counter-ai` App Insights and its web tests.
- Set 1GB daily data cap on active `bpm-counter` App Insights as a cost safety net.
- Reduced Log Analytics workspace `bpm-counter-workspace` retention from 90 → 30 days.
- Resource group went from ~14+ resources down to 8 legitimate resources: CosmosDB, App Insights, SWA, Log Analytics workspace, 2 dashboards, 1 action group, 1 active smart detector rule.
- JMESPath queries with `contains()` in `--query` fail on Windows PowerShell due to bracket parsing — use `--query "[?name=='exact']"` or list-then-filter in PowerShell variables instead.
- `az monitor app-insights component delete` does NOT accept `--yes` flag (unlike many other `az` delete commands).
- `az monitor smart-detector alert-rule delete` command hangs indefinitely — use `az resource delete --ids <full-resource-id>` as a reliable alternative.
