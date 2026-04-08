# Trinity — History

## Project Context
- **Project:** BPM Counter — a web app that detects BPM in music from microphone input
- **Stack:** Next.js (static export), Azure Functions (backend), Azure Static Web Apps (deployment)
- **Current state:** React 17 CRA with plain CSS, React Router v5, PWA (Workbox 7)
- **Key files:** src/Home.js (mic BPM), src/Upload.js (URL BPM), src/App.js (routing + telemetry)
- **User:** Maxim Salnikov

## Learnings
- **bpm-detective upgrade (2026-03-24):** Requested upgrade from `^2.0.5`. Researched npm — `2.0.5` is already the latest stable version (only dist-tag: `latest: 2.0.5`). No newer version exists. No code changes needed. API remains: `import detect from 'bpm-detective'` → `detect(audioBuffer)` returning a BPM number.

### 2026-03-24 — Session logged by Scribe
- Orchestration log: `.squad/orchestration-log/2026-03-24T12-00-01Z-trinity-bpm-detective-check.md`
- Decision merged into `.squad/decisions.md`

### 2026-04-08 — Frontend App Insights Audit
- **Full audit of `@microsoft/applicationinsights-web` + React plugin + Click Analytics integration. 21 findings total (4 P0, 8 P1, 9 P2).**
- **Critical bug found:** `TelemetryService.js` factory pattern returns `{ reactPlugin, appInsights }` capturing `null` at creation time. `withAITracking(ai.reactPlugin, ...)` in `telemetry-provider.jsx:38` receives permanent `null` — component engagement metrics never tracked.
- **Duplicate initial page view:** Manual `trackPageView()` in `App.js:89` + React plugin auto-tracking via `history` object = 2 page views on first load.
- **Missing prop:** `Upload.js:72` doesn't pass `appInsights` to `<Feedback>`, so URL-mode feedback telemetry is silently lost. Confirmed by comparison with `Home.js:228` which correctly passes it.
- **Crash risk:** `after()` callback in `telemetry-provider.jsx:29` always runs even if `initialize()` was skipped → `null.trackPageView()` crash.
- **Performance:** `maxBatchInterval: 0` sends every item immediately; combined with high-frequency `detect` events = network flood.
- **Event schema inconsistency:** Home.js `detect` sends `bpm`+`threshold`; Upload.js `detect` sends `content_type`+`item_id`.
- **No `trackException()` for real errors** (mic failures, decode errors, API failures) — only console/toast.
- **`reportWebVitals()` called with no callback** (`index.js:21`) — CLS/FID/FCP/LCP/TTFB infrastructure exists but is entirely inert. Could pipe to App Insights via `trackMetric()`.
- **SW offline events not tracked:** `REPLAY_COMPLETED` and `REQUEST_FAILED` shown as toasts but not sent to App Insights (`App.js:54-68`).
- **ClickAnalyticsPlugin missing `dataTags`** — auto-capture enabled but captured clicks have minimal context.
- **No `addTelemetryInitializer()`** — missing custom enrichment (isMobile, isDebug, etc.).
- **Verified non-issue:** React Router history timing race in `telemetry-provider.jsx` is NOT a bug — `withRouter` HOC guarantees `history` availability synchronously from Router context before `componentDidMount`.
- **Verified non-issue:** `[appInsights]` dependency pattern in Home.js useEffect correctly handles initialization timing. Optional chaining handles null case.
- **Installed versions:** `applicationinsights-web@2.8.14` (latest 3.4.1), `react-js@3.4.3` (latest 19.3.8), `clickanalytics@2.8.14` (latest 3.4.1).
- **Key telemetry files:** `src/TelemetryService.js` (singleton factory), `src/telemetry-provider.jsx` (class component HOC wrapper), `src/App.js` (initialization + props distribution).
- **Connection string:** Uses `REACT_APP_APPINSIGHTS_CONNECTION_STRING` env var via `.env` file (good — not hardcoded in source).
- **SDK handles unload flush internally** — no explicit `flush()` needed on page unload.
- Decision inbox: `.squad/decisions/inbox/trinity-appinsights-audit.md`
