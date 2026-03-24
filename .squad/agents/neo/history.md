# Neo — History

## Project Context
- **Project:** BPM Counter — a web app that detects BPM (beats per minute) in music from microphone input
- **Stack:** Next.js (static export), Azure Functions (backend), Azure Static Web Apps (deployment)
- **Current state:** React 17 CRA app with React Router v5, PWA with Workbox 7, dual telemetry (App Insights + GA4)
- **BPM engines:** realtime-bpm-analyzer (mic input), bpm-detective (URL-based audio)
- **User:** Maxim Salnikov

## Learnings

### 2026-03-24 — Full Project Structure Review
- **Architecture**: React 17 CRA + Azure Functions v2 + SWA. Solid for its scope.
- **Key files**: `App.js` (root + SW registration + hardcoded App Insights key), `index.js` (GA4 init), `TelemetryService.js` (App Insights SDK setup), `telemetry-provider.jsx` (class component HOC for AI tracking)
- **Build pipeline**: 3-stage — CRA build → `sw-build.js` (Workbox injectManifest) → `rollup -c` (IIFE bundle of SW). Build tools incorrectly in `dependencies`.
- **Critical pattern**: `appInsights` can be `null` — several components lack null guards. Upload.js and Home.js both call `appInsights.trackEvent()` unsafely.
- **API**: Single function `api/feedback/` with CosmosDB output binding. CommonJS, v2 runtime. Weak input validation.
- **SW**: Sophisticated — background sync for feedback, static routing API, google fonts cache, app shell update flow.
- **E2E**: 3 Playwright specs (homepage, upload, about) — smoke tests only, run against dev server.
- **No unit tests** despite testing libraries being installed.
- **Rollup plugins**: Using deprecated unscoped packages (`rollup-plugin-node-resolve` etc.)
- **Decision filed**: `neo-project-structure-review.md` with prioritized recommendations
