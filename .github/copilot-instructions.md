# Project Guidelines

## Architecture

React 17 SPA deployed on **Azure Static Web Apps** with an Azure Functions API backend.

- **Frontend**: Create React App (react-scripts 5), React Router v5 (`<Switch>`/`<Route>`), plain CSS
- **API**: Single Azure Function (`api/feedback/`) — Node.js, CommonJS, Azure Functions v2 runtime, CosmosDB output binding
- **PWA**: Custom Workbox 7 `injectManifest` + Rollup 2 pipeline (not CRA's built-in SW)
- **Telemetry**: Dual tracking — Azure Application Insights AND Google Analytics 4

### Critical version constraints

Do NOT use APIs or patterns from newer versions of these libraries:

| Dependency | Version | Constraint |
|---|---|---|
| `react` | `^17.0.2` | Uses `ReactDOM.render()`, NOT `createRoot()` (React 18) |
| `react-router-dom` | `^5.3.0` | Uses `<Switch>`, `<Route>`, `withRouter`. NOT v6 (`<Routes>`, `useNavigate`) |
| `react-scripts` | `^5.0.1` | CRA 5 (Webpack 5 under the hood) |
| `realtime-bpm-analyzer` | `^5.0.1` | v5 API using `AudioWorklet` via `createRealtimeBpmAnalyzer()` |
| `rollup` | `^2.56.3` | Rollup 2 legacy plugin format — NOT Rollup 3+ |
| `react-toastify` | `^8.0.2` | v8 API |

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
- **Class components** exist only where required: `Feedback` (refs + lifecycle via `react-hint` factory pattern), `TelemetryProvider` (HOC compatibility with `withAITracking`/`withRouter`)
- No global state library — local `useState` + props drilling. `appInsights` and `log` are passed as props from `App`
- `appInsights` may be `null` initially — use optional chaining (`appInsights?.trackEvent()`) when calling telemetry methods

### Dual BPM engines

Two separate libraries handle BPM detection:
- `realtime-bpm-analyzer` — real-time mic input via AudioWorklet (`Home.js`)
- `bpm-detective` — URL-based audio fetch + `decodeAudioData` (`Upload.js`). Supports `?url=` query param to pre-fill

## Build and Test

```shell
# Install
npm install
cd api && npm install

# Dev server (uses SWA CLI to proxy API)
swa start http://localhost:3000 --run "npm start" --api-location ./api
# App available at http://localhost:4280

# HTTPS dev (for mobile testing over LAN — requires .pem cert files)
npm run startsecure

# Production build (3-stage: CRA → Workbox inject → Rollup bundle SW)
npm run build

# Tests (Jest + React Testing Library)
npm test
```

> **Note**: No test files exist yet. Testing libraries (`@testing-library/react`, Jest) are installed as dependencies but unused. Creating tests would start from scratch — create `src/setupTests.js` for global Web Audio API mocks, then add `*.test.js` files alongside components.

### Environment

- `.env` sets `GENERATE_SOURCEMAP=false` only
- **No `REACT_APP_*` vars** — App Insights connection string and GA4 measurement ID are hardcoded in source (`App.js`, `index.js`)

### Query param feature flags

- `?debug=true` — verbose logging
- `?viz=true` — force audio visualization on mobile
- `?bpm=N` — pre-set a BPM value (shows result immediately, but doesn't disable mic)
- `?url=<audio-url>` — pre-fill URL on the Upload page

## Conventions

- **Styling**: Plain CSS files per component (no CSS modules, no CSS-in-JS). Color palette: dark blue `#0D4C73`, teal `#35748C`, gold `#F2B680`, orange `#D98C5F`
- **File naming**: PascalCase for components (`Home.js`), one component per file, default export. Exception: `telemetry-provider.jsx` (only `.jsx` file)
- **Testing**: Mock Web Audio APIs and external deps (`realtime-bpm-analyzer`, `bpm-detective`, `audiomotion-analyzer`) via `jest.mock()`. Global audio mocks live in `src/setupTests.js`
- **Service worker build**: After editing `src/sw/service-worker.js`, the full `npm run build` pipeline is needed: CRA build → `node sw-build.js` (Workbox injectManifest) → `npx rollup -c` (IIFE bundle)
- **API functions**: Each function has its own subfolder under `api/` with `function.json` (bindings) + `index.js` (handler). Auth level is `anonymous` — SWA handles authentication
- **SWA routing/auth**: Configured in `src/staticwebapp.config.json` (gets copied to build). Routes `/account` require `authenticated` role; `/admin/*` requires `administrator` role
- **Telemetry**: Track significant events to both Application Insights (`appInsights.trackEvent()`) and GA4 (`ReactGA.event()`). The `TelemetryProvider` class component wraps the app for page view tracking
- **Audio cleanup**: `stopListening` triggers `window.location.reload()` rather than manual audio teardown — be aware of this when modifying audio state management
