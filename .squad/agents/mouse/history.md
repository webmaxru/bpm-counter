# Mouse — History

## Project Context
- **Project:** BPM Counter — a web app that detects BPM in music from microphone input
- **Stack:** CRA 5 (React 17), Azure Functions (backend), Azure Static Web Apps (deployment)
- **Current state:** Full unit test foundation in place. 6 test suites, 29 tests. E2E expanded.
- **E2E:** Playwright config at `playwright.config.js`, specs in `e2e/` directory
- **User:** Maxim Salnikov

## Learnings

### BPM detection e2e tests via Chromium fake audio capture (2026-03-25)

**Created files:**
- `e2e/bpm-detection.spec.js` — parameterized Playwright tests that feed WAV files into Chromium's fake mic device

**Modified files:**
- `playwright.config.js` — added `bpm-detection` project (testMatch, 90s timeout, mic permission); excluded bpm-detection.spec.js from default `chromium` project; changed webServer to `cross-env PORT=4173 npm start` on port 4173
- `package.json` — added `test:e2e` and `test:e2e:bpm` npm scripts

**Critical gotchas discovered:**

1. **Chromium fake audio + AudioWorklet requires `getSettings()` activation.** Without calling `track.getSettings()` on the `getUserMedia` audio tracks, Chromium's fake audio capture sends silence to AudioWorklet processors. Fix: inject `page.addInitScript()` that monkey-patches `navigator.mediaDevices.getUserMedia` to call `getSettings()` on every track before returning the stream. This must be injected BEFORE navigation (not `page.evaluate`) so it runs before any page JS.

2. **realtime-bpm-analyzer v5 only reliably detects 120+ BPM from synthetic audio.** The 4/4 kick+hi-hat WAV patterns at 44100 Hz (resampled to 48000 Hz by Chromium) don't produce enough transient energy for BPM detection below 120. Results: 80/90/100 BPM = no detection; 110 BPM = mis-detected as 176; 120/130/140 BPM = accurate within ±3 BPM. Tests only cover 120, 130, 140.

3. **Each test needs its own `chromium.launch()`.** The `--use-file-for-fake-audio-capture` is a browser-level launch arg, not per-context. Each BPM test launches a fresh browser with the appropriate WAV file, creates a context + page, then closes everything in a `finally` block. Cannot use Playwright's default `{ page }` fixture.

4. **Port 3000 conflicts.** CRA dev server prompts interactively when port 3000 is in use, breaking Playwright's webServer auto-start. Fix: use `cross-env PORT=4173 npm start` to bind to a known-free port. The bpm-detection test uses `BASE_URL` constant set to `http://localhost:4173`.

5. **`--autoplay-policy=no-user-gesture-required`** as a Chromium arg helps ensure AudioContext activation without user gesture issues in headless mode.

**Detection timing observations:**
- 120 BPM: ~11s, 130 BPM: ~9s, 140 BPM: ~6-20s (variable)
- Faster tempos = faster detection (more transients per analysis window)
- `stabilizationTime: 10000` in the app means minimum ~10s before first BPM event

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
