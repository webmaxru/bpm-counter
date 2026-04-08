# Mouse — History

## Project Context
- **Project:** BPM Counter — a web app that detects BPM in music from microphone input
- **Stack:** CRA 5 (React 17), Azure Functions (backend), Azure Static Web Apps (deployment)
- **Current state:** Full unit test foundation in place. 9 test suites, 65 tests (64 pass, 1 skipped). E2E expanded.
- **E2E:** Playwright config at `playwright.config.js`, specs in `e2e/` directory
- **User:** Maxim Salnikov

## Learnings

### API feedback function unit tests written (2026-04-08)

**Created files:**
- `api/feedback/index.test.js` — 34 unit tests covering validation, success path, client principal, App Insights resilience, Cosmos DB error handling, telemetry correlation, and data integrity

**Modified files:**
- `api/package.json` — added `jest` as devDependency, updated test script to `jest --verbose`

**Mock strategy for Azure Functions API tests:**
- `applicationinsights` — mock `setup()`, `start()`, `defaultClient` with `trackEvent`/`trackException` fns
- `@azure/cosmos` — mock `CosmosClient` → `databases.createIfNotExists()` → `containers.createIfNotExists()` → `items.create()` chain; use `{ virtual: true }` since package may not yet be installed
- Use `jest.resetModules()` + `jest.isolateModules()` + `jest.doMock()` per test to avoid module-cache poisoning from module-scope side effects (`appInsights.setup()`, `CosmosClient` init)
- Helper functions: `createMockContext()`, `createMockReq(body, headers)`, `base64Encode(obj)`, `loadHandler(appInsightsOverride)`, `loadHandlerWithSetupCrash()`
- `loadHandlerWithSetupCrash()` — separate loader that makes `appInsights.setup()` throw, verifying the handler's try/catch survives import-time failures

**Critical gotchas discovered:**
1. **`jest.resetModules()` before `jest.isolateModules()` is defensive best practice.** Without it, stale module-scope state from a prior `isolateModules` could leak into the registry used by the next call.
2. **`{ virtual: true }` needed for `jest.doMock('@azure/cosmos')`.** If `@azure/cosmos` isn't installed in `node_modules`, Jest will throw "Cannot find module" even for mocks without the `virtual` flag.
3. **Falsy-valid edge cases catch real bugs.** Tests for `bpm: 0` and `isCorrect: false` ensure the fix doesn't use truthy checks (`if (!bpm)`) which would incorrectly reject valid values.
4. **Invalid base64 doesn't always throw.** `Buffer.from('!!!', 'base64')` succeeds silently with garbage output. Must test both garbage base64 AND valid base64 of invalid JSON separately.
5. **Don't assert `context.done()`.** The fixed async function should use `return`, not `context.done()`. Assert early-return effects instead: status code, no Cosmos write, no trackEvent.
6. **Comprehensive early-return test is essential.** A single test asserting ALL four side effects (400 status, trackException called, no Cosmos write, no trackEvent) catches regressions that individual tests might miss.
7. **App Insights import-time crash is a separate scenario from null client.** `setup()` throwing at module load requires its own `loadHandlerWithSetupCrash()` loader. The handler's try/catch must survive this, leaving `client = null`.

**Test results:** 34/34 pass against Tank's fixed implementation.

**Test results against Tank's fixed code:** 31/31 pass. All validation, success path, client principal, App Insights resilience, Cosmos error handling, telemetry correlation, and data integrity tests green. Added 2 extra Cosmos tests (write failure logging, no-connection-string skip) beyond the original 29 after reviewing Tank's implementation.

### API validation test coverage needed (2026-04-08)

**From Tank's Azure Functions audit:** The `api/feedback/` endpoint has critical validation bugs that need e2e test coverage:
1. Null/undefined request body crashes with `'bpm' in req.body` error (non-object primitive throws)
2. `context.done()` does not halt execution; validation errors still write to CosmosDB
3. Anonymous write endpoint has no rate limiting — abuse/spam risk

**Action for Mouse:** Add e2e tests that validate error handling on the feedback POST endpoint. Cover scenarios: empty body, missing bpm field, invalid bpm value, null body. Verify HTTP 400 response and no CosmosDB write on validation failure.

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

### App Insights telemetry tests for 20 audit findings (2026-04-09)

**Created files:**
- `src/TelemetryService.test.js` — 15 tests: exports (reactPlugin, initialize, getAppInsights), initialization (connection string, loadAppInsights, getAppInsights before/after), SDK config (maxBatchInterval=15000, correlationHeaderExcludedDomains, autoCapture=false, dataTags, samplingPercentage, telemetry initializer)
- `src/telemetry-provider.test.js` — 6 tests: render children, init when connectionString+history present, skip init without connectionString, P0#4 crash fix (after() without init), after() with initialization, argument validation throws
- `src/reportWebVitals.test.js` — 3 tests (1 skipped): dynamic import mock limitation, guard when no callback, guard when non-function

**Modified files:**
- `src/App.test.js` — added 5 tests: trackPageView NOT called (P0#2), renders without crash when telemetry unavailable, SW REPLAY_COMPLETED event tracking (P1#11), SW REQUEST_FAILED event tracking (P1#11)
- `src/Upload.test.js` — added 3 tests: Feedback receives appInsights (P0#3), detect schema {mode,bpm,threshold} (P1#6), trackException on decode error (P1#7)
- `src/AdLink.test.js` — added 3 tests: no console.log calls (P2#14), click trackEvent with ad+text properties, no crash when appInsights is null

**Audit findings covered by tests:**
| Finding | Severity | Test File | Status |
|---------|----------|-----------|--------|
| P0#1 reactPlugin identity | P0 | TelemetryService.test.js | ✅ |
| P0#2 no manual trackPageView | P0 | App.test.js | ✅ |
| P0#3 Feedback gets appInsights | P0 | Upload.test.js | ✅ |
| P0#4 after() crash guard | P0 | telemetry-provider.test.js | ✅ |
| P1#5 maxBatchInterval=15000 | P1 | TelemetryService.test.js | ✅ |
| P1#6 detect schema | P1 | Upload.test.js | ✅ |
| P1#7 trackException on error | P1 | Upload.test.js | ✅ |
| P1#9 withAITracking removed | P1 | telemetry-provider.test.js | ✅ (impl verified) |
| P1#10 reportWebVitals callback | P1 | reportWebVitals.test.js | ⚠️ skipped (import() mock limitation) |
| P1#11 SW event tracking | P1 | App.test.js | ✅ |
| P1#12 correlationHeaderExcludedDomains | P1 | TelemetryService.test.js | ✅ |
| P2#14 no console.log | P2 | AdLink.test.js | ✅ |
| P2#16 autoCapture=false | P2 | TelemetryService.test.js | ✅ |
| P2#17 dataTags | P2 | TelemetryService.test.js | ✅ |
| P2#18 samplingPercentage | P2 | TelemetryService.test.js | ✅ |
| P2#20 telemetry initializer | P2 | TelemetryService.test.js | ✅ |

**Critical gotchas discovered:**
1. **jest.isolateModules + jest.doMock = BROKEN.** `jest.doMock` registers mocks in the current registry; `jest.isolateModules` creates a NEW isolated registry that does NOT see doMock registrations. Fix: use `jest.mock` (hoisted) + `jest.resetModules()` + `require()` per test for singleton module isolation.
2. **CRA 5 resetMocks resets jest.mock factory mock functions.** Mock functions created inside `jest.mock()` factories get their implementations cleared between tests. Fix: re-apply `mockImplementation`/`mockReturnValue` in `beforeEach`.
3. **Dynamic import() bypasses jest.mock in CRA 5.** `import('web-vitals')` inside reportWebVitals.js doesn't resolve through jest's mock registry. Despite `@babel/plugin-proposal-dynamic-import` being present, the transform doesn't intercept the mock. Tracked as known limitation; test skipped.
4. **jest.mock hoisting + const = TDZ error.** `const mockX = jest.fn(); jest.mock('y', () => mockX)` causes TDZ ReferenceError because jest.mock is hoisted above the const declaration. Fix: define everything inline in the jest.mock factory, get references via `require()`.
5. **TelemetryContext.Provider required for component telemetry tests.** AdLink and Upload use `useContext(TelemetryContext)`, not props. Wrap renders with `<TelemetryContext.Provider value={mockAppInsights}>`.
6. **SW tests need navigator.serviceWorker injection.** jsdom lacks `navigator.serviceWorker`. Use `Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })` and capture Workbox `addEventListener` handlers.
7. **Math.random must be mocked for deterministic AdLink text.** AdLink selects display text via `Math.random()`. Mock with `jest.spyOn(Math, 'random').mockReturnValue(0)` for deterministic assertions.

**Mocking patterns added:**
- `@microsoft/applicationinsights-web` → `{ ApplicationInsights: jest.fn(() => ({ loadAppInsights, addTelemetryInitializer, ... })) }` + re-apply in beforeEach
- `@microsoft/applicationinsights-clickanalytics-js` → `{ ClickAnalyticsPlugin: jest.fn(() => ({ identifier: 'ClickAnalyticsPlugin' })) }`
- `./TelemetryService` (for telemetry-provider.test.js) → `{ initialize: jest.fn(), getAppInsights: jest.fn() }`
- `./TelemetryContext` → `{ TelemetryContext: require('react').createContext(null) }` (for component tests)

**Test results:** 9 suites, 64 passed, 1 skipped, 0 failed.
