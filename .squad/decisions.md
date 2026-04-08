# Squad Decisions

## Active Decisions

### Upgrade realtime-bpm-analyzer v1 → v5 (2026-03-24)
**Author:** Switch (Audio Engineer) | **Status:** Implemented

Upgraded `realtime-bpm-analyzer` from `^1.1.5` to `^5.0.1`. Migrated from deprecated `ScriptProcessorNode` + callback API to `AudioWorkletNode` + event-emitter API. Key changes: `createRealtimeBpmAnalyzer()` async factory, `on('bpm', ...)` / `on('bpmStable', ...)` / `on('error', ...)` events, `analyzer.reset()`. Zero dependencies. Files changed: `package.json`, `src/Home.js`.

### bpm-detective upgrade — no action needed (2026-03-24)
**Author:** Trinity (Frontend Dev) | **Status:** Resolved (no change)

`bpm-detective@2.0.5` is already the latest stable version. No upgrade available.

### Project structure review (2026-03-24)
**Author:** Neo (Architect) | **Status:** Advisory

Full architectural assessment filed. Key findings: hardcoded telemetry keys (App Insights, GA4), missing `appInsights` null guards in several components, build tools in `dependencies` instead of `devDependencies`, deprecated Rollup plugins, no unit tests. No immediate action required — tracked for future sessions.

### Test audio generation approach (2026-03-24)
**Author:** Switch (Audio Engineer) | **Status:** Implemented

Zero-dependency Node.js script (`scripts/generate-test-audio.js`) generates WAV test files at arbitrary BPMs using raw PCM synthesis. Kick drum (sine sweep 150→45 Hz + exponential decay) + hi-hat (off-beat noise bursts). Chosen over ffmpeg/sox for portability and sample-accurate BPM precision. 7 files × ~3.8 MB each; reproducible and deterministic. Validates detection algorithm accuracy on ideal signal — real-world tolerance requires actual music.

### Test foundation mocking strategy (2026-03-24)
**Author:** Mouse (Tester) | **Status:** Implemented

Global browser API mocks (Web Audio, MediaDevices, Performance) in `src/setupTests.js`; per-test-file `jest.mock()` for npm dependencies. CRA 5 enables `resetMocks: true` by default, clearing `jest.fn()` implementations between tests — global mocks must use plain functions or be re-applied in `beforeEach`. Added `jest.moduleNameMapper` in package.json for `realtime-bpm-analyzer` to resolve v5.0.1 packaging bug. Rejected `__mocks__` directory (CRA roots don't discover root-level mocks) and mocking child components (preferred integration-like coverage).

### BPM E2E test scope limited to 120–140 BPM (2026-03-25)
**Author:** Mouse (Tester) | **Status:** Implemented

Playwright e2e tests use Chromium `--use-file-for-fake-audio-capture` to feed synthesized WAV files as mic input. Only 120, 130, and 140 BPM are tested (±3 tolerance). Tempos below 120 excluded — `realtime-bpm-analyzer` v5 cannot reliably detect them through Chromium's fake audio capture pipeline (44100→48000 Hz resample + AudioWorklet processing). 80/90/100 BPM: zero detection; 110 BPM: mis-detected as 176 (false harmonic). Future options: regenerate WAVs at 48 kHz, use real music, sharper transients, or test via `bpm-detective`. Files: `e2e/bpm-detection.spec.js` (new), `playwright.config.js` (bpm-detection project), `package.json` (test:e2e scripts).

### Azure Functions best practices audit (2026-04-08)
**Author:** Tank (Backend Dev) | **Status:** Proposed

Comprehensive audit of `api/` backend against current Azure Functions standards identified 13 findings across P0 (3), P1 (3), and P2 (7):

**P0 — Critical Bugs:**
1. Validation error in `api/feedback/index.js`: `context.done()` does not stop execution in async functions; code continues to access `req.body.bpm` causing crashes on null/undefined body.
2. Anonymous write endpoint with no rate limiting, CAPTCHA, or request validation — CosmosDB cost/spam abuse risk.
3. App Insights setup fragility: `appInsights.setup()` at module scope with no connection string param; missing env var causes cold start failure.

**P1 — Modernization:**
4. Extension bundle outdated `[2.*, 3.0.0)` → upgrade to `[4.*, 5.0.0)` for security patches and modern CosmosDB binding properties.
5. SWA managed functions + CosmosDB output binding unsupported per SWA docs — current implementation may work via extension bundles but lacks official guarantee.
6. Programming model v3 (function.json + CommonJS) → v4 (@azure/functions) migration recommended for better testability and modern API.

**P2 — Code Quality:**
7. `Math.floor(Date.now() / 1)` uses no-op division by 1.
8. Document ID generated twice (different values) — should generate once, reuse.
9. `substr()` deprecated → use `substring()` or `slice()`.
10. Unnecessary `JSON.stringify()` on CosmosDB output document.
11. HTTP 404 for validation error → should be 400 (Bad Request).
12. Empty `proxies.json` (deprecated feature) — can be removed.
13. Missing `local.settings.sample.json` onboarding template.
14. Missing security headers in SWA config: `X-Content-Type-Options`, `X-Frame-Options`.

**Recommended Phases:**
- **Phase 1:** Fix P0 bugs (blocking production).
- **Phase 2:** Update extension bundle, remove proxies.json, add security headers.
- **Phase 3:** Team decision on v4 migration.

**Impact:** Trinity (frontend) unaffected; Mouse should add validation test cases; Neo reviews v4 decision.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
