# Switch — History

## Project Context
- **Project:** bpm-counter — BPM detection web app
- **User:** Maxim Salnikov
- **Stack:** React 17 CRA, Azure Functions, Azure Static Web Apps
- **Audio stack:** `realtime-bpm-analyzer` v1 (mic), `bpm-detective` (URL), `audiomotion-analyzer` (viz)
- **Role:** Web Audio API expert and audio processing specialist
- **Joined:** 2026-03-24

## Learnings

### realtime-bpm-analyzer v1 → v5 upgrade (2026-03-24)
- Upgraded from `^1.1.5` (v1 API) to `^5.0.1` (v5 API)
- **Import changed**: default export `RealTimeBPMAnalyzer` → named export `{ createRealtimeBpmAnalyzer }`
- **Architecture shift**: `ScriptProcessorNode` (deprecated Web Audio) → `AudioWorkletNode` (modern, non-blocking)
- **API shift**: constructor + callbacks → async factory function + event emitter (`on('bpm', ...)`, `on('bpmStable', ...)`, `on('error', ...)`)
- `pushCallback(err, bpm, threshold)` → split into `bpm` event (data has `{ bpm, threshold }`) and `error` event (data has `{ message, error }`)
- `onBpmStabilized` + `clearValidPeaks()` → `bpmStable` event + `analyzer.reset()`
- `computeBPMDelay` and `pushTime` options removed in v5; `bpm` events fire at analysis rate
- `scriptNode.bufferSize` config no longer needed — AudioWorklet manages its own buffers internally
- `onStream()` is now async because `createRealtimeBpmAnalyzer` returns a Promise (loads AudioWorklet module)
- Mic no longer connected to `context.destination` (was a ScriptProcessorNode quirk) — eliminates mic feedback through speakers
- The `BpmCandidates.bpm` array may have fewer than 2 entries; added guard before accessing `bpm[1]`
- v5 is zero-dependency (removed 27 transitive packages, added 5)

### 2026-03-24 — Session logged by Scribe
- Orchestration log: `.squad/orchestration-log/2026-03-24T12-00-00Z-switch-realtime-bpm-upgrade.md`
- Decision merged into `.squad/decisions.md`
