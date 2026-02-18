# Project Guidelines

## Architecture

React 17 SPA deployed on **Azure Static Web Apps** with an Azure Functions API backend.

- **Frontend**: Create React App (react-scripts 5), React Router v5 (`<Switch>`/`<Route>`), plain CSS
- **API**: Single Azure Function (`api/feedback/`) — Node.js, CommonJS, Azure Functions v2 runtime
- **PWA**: Custom Workbox `injectManifest` + Rollup pipeline (not CRA's built-in SW)
- **Telemetry**: Dual tracking — Azure Application Insights AND Google Analytics 4

### Key directories

| Path | Purpose |
|------|---------|
| `src/` | React components, styles, config |
| `src/sw/` | Service worker source (Workbox) |
| `api/` | Azure Functions (each subfolder = one function) |
| `build/` | Production output (CRA build + SW injection) |
| `public/` | Static assets copied to build |

### Component patterns

- **Functional components with hooks** are the primary pattern (`Home`, `Upload`, `App`)
- **Class components** exist only where required: `Feedback` (refs + lifecycle), `TelemetryProvider` (HOC compatibility with `withAITracking`/`withRouter`)
- No global state library — local `useState` + props drilling. `appInsights` and `log` are passed as props from `App`

### Dual BPM engines

Two separate libraries handle BPM detection:
- `realtime-bpm-analyzer` — real-time mic input via AudioWorklet (`Home.js`)
- `bpm-detective` — offline file analysis via `decodeAudioData` (`Upload.js`)

## Build and Test

```shell
# Install
npm install
cd api && npm install

# Dev server (uses SWA CLI to proxy API)
swa start http://localhost:3000 --run "npm start" --api-location ./api
# App available at http://localhost:4280

# Production build (3-stage: CRA → Workbox inject → Rollup bundle SW)
npm run build

# Tests (Jest + React Testing Library, watch mode)
npm test
```

### Query param feature flags

- `?debug=true` — verbose logging
- `?viz=true` — force audio visualization on mobile
- `?bpm=N` — pre-set a test BPM value (skips mic)

## Conventions

- **Styling**: Plain CSS files per component (no CSS modules, no CSS-in-JS). Color palette: dark blue `#0D4C73`, teal `#35748C`, gold `#F2B680`, orange `#D98C5F`
- **Testing**: Mock Web Audio APIs and external deps (`realtime-bpm-analyzer`, `bpm-detective`, `audiomotion-analyzer`) via `jest.mock()`. Global audio mocks live in `src/setupTests.js`
- **Service worker build**: After editing `src/sw/service-worker.js`, the full `npm run build` pipeline is needed: CRA build → `node sw-build.js` (Workbox injectManifest) → `npx rollup -c` (IIFE bundle)
- **API functions**: Each function has its own subfolder under `api/` with `function.json` (bindings) + `index.js` (handler). Auth level is `anonymous` — SWA handles authentication
- **SWA routing/auth**: Configured in `src/staticwebapp.config.json` (gets copied to build). Routes `/account` require `authenticated` role; `/admin/*` requires `administrator` role
- **Telemetry**: Track significant events to both Application Insights (`appInsights.trackEvent()`) and GA4 (`ReactGA.event()`). The `TelemetryProvider` class component wraps the app for page view tracking
- **Audio cleanup**: `stopListening` triggers `window.location.reload()` rather than manual audio teardown — be aware of this when modifying audio state management
