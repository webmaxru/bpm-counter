---
description: "Use when working on Azure Functions API code, API endpoints, CosmosDB bindings, or backend logic"
applyTo: "api/**"
---
# API Guidelines

## Runtime & Module System

- Azure Functions **v2 runtime** with **Node.js CommonJS** (`module.exports`, `require`)
- Do NOT use ES modules (`import`/`export`) in API code

## Function Structure

- Each function lives in its own subfolder under `api/` (e.g., `api/feedback/`)
- Every function folder contains:
  - `function.json` — bindings (triggers, inputs, outputs)
  - `index.js` — handler logic

## Bindings

- Auth level is `anonymous` — Azure Static Web Apps handles authentication
- CosmosDB output binding uses `context.bindings.outputDocument`
- Database: `bpmtech-db`, connection setting: `bpmcounterdbaccount_DOCUMENTDB`

## Authentication

- Client principal is extracted from the `x-ms-client-principal` header (base64-encoded JSON)
- Auth/role enforcement is handled by SWA routing in `src/staticwebapp.config.json`, not in function code

## Telemetry

- Use `applicationinsights` v2 (`require('applicationinsights')`)
- Correlate traces via `context.traceContext.traceparent` as `ai.operation.id` tag override
- Track exceptions with `client.trackException()` and events with `client.trackEvent()`

## Error Handling

- Return appropriate HTTP status codes in `context.res`
- Validate required request body fields before processing
- Call `context.done()` after setting error responses to halt execution

## Dependencies

- Keep API dependencies minimal — currently only `applicationinsights`
- Install API deps separately: `cd api && npm install`

## Local Development

- Run locally via SWA CLI: `swa start http://localhost:3000 --run "npm start" --api-location ./api`
- Or directly: `cd api && func start`
