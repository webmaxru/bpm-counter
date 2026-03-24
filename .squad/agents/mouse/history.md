# Mouse — History

## Project Context
- **Project:** BPM Counter — a web app that detects BPM in music from microphone input
- **Stack:** CRA 5 (React 17), Azure Functions (backend), Azure Static Web Apps (deployment)
- **Current state:** Full unit test foundation in place. 6 test suites, 29 tests. E2E expanded.
- **E2E:** Playwright config at `playwright.config.js`, specs in `e2e/` directory
- **User:** Maxim Salnikov

## Learnings

### Test foundation (2026-03-24)

**Created files:**
- `src/setupTests.js` — Global mocks for Web Audio API, MediaDevices, performance.getEntriesByType
- `src/App.test.js` — 7 tests (render, header, nav, footer, routing to Home/About/Upload)
- `src/Home.test.js` — 4 tests (render, mic info, getUserMedia call, testBPM prop)
- `src/Upload.test.js` — 5 tests (render, input, sample link, typing, use-sample click)
- `src/About.test.js` — 5 tests (heading, author, button, SWA link, PWA mention)
- `src/Feedback.test.js` — 4 tests (buttons, correctness question, POST on thumbs up/down)
- `src/AdLink.test.js` — 4 tests (three ad types, non-empty text)
- `e2e/navigation.spec.js` — 3 e2e navigation tests
- Updated `e2e/upload.spec.js` — added BPM calculation from sample file test

**Critical gotchas discovered:**
1. **CRA 5 `resetMocks: true` kills setupTests mocks.** Any `jest.fn().mockReturnValue()` set in setupTests.js gets its implementation cleared after each test. Fix: use plain functions for global mocks that need to survive (`Performance.prototype.getEntriesByType = function() { return [{}]; }`), or re-apply in `beforeEach`.
2. **`realtime-bpm-analyzer` v5.0.1 has broken packaging.** The `main` field points to `dist/index.js` but the actual file is at `dist/dist/index.js`. Required `moduleNameMapper` in package.json jest config to fix resolution.
3. **jsdom lacks `performance.getEntriesByType`.** App.js destructures its return value (`const [navTiming] = ...`), causing "undefined is not iterable" if not mocked.
4. **Home component `isShowingInit` is always `true` initially**, even when `testBPM` prop is set. The BPM value is pre-populated in state but the init screen still shows until user clicks Start.
5. **About page has multiple "Maxim Salnikov" text nodes and multiple "Azure Static Web Apps" links.** Must use `getAllByText` or exact name match (`'Azure Static Web Apps (SWA)'`) to avoid ambiguity.

**Mocking patterns registry:**
- `react-ga4` → `{ event: jest.fn(), initialize: jest.fn(), send: jest.fn() }`
- `react-hint` factory → returns class component with `toggleHint = jest.fn()` (needed for Feedback's `componentDidMount`)
- `realtime-bpm-analyzer` → `{ createRealtimeBpmAnalyzer: jest.fn().mockResolvedValue({ node, on, reset }) }`
- `audiomotion-analyzer` → mock constructor returning stub with registerGradient, setOptions, etc.
- `bpm-detective` → `jest.fn(() => 120)`
- `workbox-window` → `{ Workbox: jest.fn().mockImplementation(() => ({ addEventListener, register, messageSkipWaiting })) }`
- `./TelemetryService` → `{ getAppInsights: () => null, ai: { reactPlugin: { getCookieMgr: () => ({set: jest.fn()}) } } }`
- `./telemetry-provider` → passthrough Fragment wrapper (skips `after` callback, so appInsights stays null)
- `react-device-detect` → `{ isMobile: false }`
- `navigator.mediaDevices.getUserMedia` → needs `beforeEach` re-apply due to resetMocks
