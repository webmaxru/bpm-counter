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

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
