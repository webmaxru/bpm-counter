# Trinity — History

## Project Context
- **Project:** BPM Counter — a web app that detects BPM in music from microphone input
- **Stack:** Next.js (static export), Azure Functions (backend), Azure Static Web Apps (deployment)
- **Current state:** React 17 CRA with plain CSS, React Router v5, PWA (Workbox 7)
- **Key files:** src/Home.js (mic BPM), src/Upload.js (URL BPM), src/App.js (routing + telemetry)
- **User:** Maxim Salnikov

## Learnings
- **bpm-detective upgrade (2026-03-24):** Requested upgrade from `^2.0.5`. Researched npm — `2.0.5` is already the latest stable version (only dist-tag: `latest: 2.0.5`). No newer version exists. No code changes needed. API remains: `import detect from 'bpm-detective'` → `detect(audioBuffer)` returning a BPM number.

### 2026-03-24 — Session logged by Scribe
- Orchestration log: `.squad/orchestration-log/2026-03-24T12-00-01Z-trinity-bpm-detective-check.md`
- Decision merged into `.squad/decisions.md`
