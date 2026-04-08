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
