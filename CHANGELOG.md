# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- agentprose script on every page (read-only WebMCP tools for AI agents, agentprose Cloud analytics and hosted search).
- `/agentprose.json`, one Markdown file per page under `/agentprose/posts/` and `/llms.txt`, generated at build time from the page content.
- Page "Updated" dates are now machine-readable `<time datetime>` elements.

## [0.1.0] - 2026-10-17

### Added

- Live microphone BPM detection, audio-file analysis and tap tempo.
- Metronome, bars-to-time, BPM-to-Hz and pitch-range tools with tool and guide hubs.
- Configurable advertising providers, including lazy-loaded AdSense in-article and multiplex units.
- iOS app, Android TWA and multi-store release assets.

### Fixed

- Metronome stop now cancels already-scheduled clicks and beat highlights.
- Metronome skips beats that expired while the tab was throttled instead of bursting them.
- Metronome start is guarded against concurrent clicks and unmounts while audio resumes.
- Metronome tempo input accepts clearing, retyping and decimal values, committing on blur or Enter.
- Metronome screen-reader announcements no longer repeat on every beat.
- Bars-to-time validates beats per bar before showing results.
- Ad slots remount when navigating between pages that share a layout.
- Every page now has a level-one heading.
- Self-hosted fonts are precached for offline use.
- Article structured data only publishes `datePublished` when a real publication date exists.

### Removed

- Entire CLI session hooks and configuration.
