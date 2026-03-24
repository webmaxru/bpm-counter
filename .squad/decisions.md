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

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
