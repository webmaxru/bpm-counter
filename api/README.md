# BPM Counter — API Documentation

## Overview

The BPM Counter API is a serverless backend built on **Azure Functions v2** and deployed via **Azure Static Web Apps (SWA)**. It provides HTTP endpoints that the React SPA frontend consumes. The API currently consists of a single function (`feedback`) that persists user feedback about BPM detection accuracy to **Azure CosmosDB**.

### Architecture at a Glance

```
┌──────────────┐    POST /api/feedback    ┌────────────────────┐    CosmosDB output    ┌────────────┐
│  React SPA   │ ──────────────────────►  │  Azure Function    │ ───────────────────►  │  CosmosDB  │
│  (Frontend)  │  ◄──────────────────────  │  (feedback)        │                       │  bpmtech-db│
└──────────────┘    JSON response         └────────────────────┘                       └────────────┘
                                                   │
                                                   │  trackEvent / trackException
                                                   ▼
                                          ┌────────────────────┐
                                          │ Application        │
                                          │ Insights           │
                                          └────────────────────┘
```

## Runtime & Module System

| Setting | Value |
|---------|-------|
| Azure Functions runtime | v2 (`"version": "2.0"` in `host.json`) |
| Extension bundle | `Microsoft.Azure.Functions.ExtensionBundle` v2.x |
| Node.js module system | **CommonJS** (`module.exports`, `require`) |
| Language | JavaScript |

> **Important:** Do NOT use ES modules (`import`/`export`) in API code. All files must use CommonJS.

## Project Structure

```
api/
├── feedback/              # Feedback function
│   ├── function.json      #   Binding definitions (trigger, inputs, outputs)
│   ├── index.js           #   Handler logic
│   └── sample.dat         #   Sample request payload for testing
├── host.json              # Global Azure Functions host configuration
├── proxies.json           # Proxy definitions (currently empty)
├── package.json           # API-specific dependencies
├── package-lock.json      # Lockfile
├── .funcignore            # Files excluded from deployment
└── .gitignore             # Git ignore rules
```

### Function Conventions

Each Azure Function lives in its own subfolder under `api/`. Every function folder contains:

- **`function.json`** — Declarative binding configuration (triggers, inputs, outputs)
- **`index.js`** — The handler function, exported as the default via `module.exports`
- **`sample.dat`** (optional) — Example request payload for local testing

## API Endpoints

### `POST /api/feedback`

Records user feedback about whether the BPM detection result was accurate.

#### Request

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `bpm` | `string \| number` | ✅ | The detected BPM value shown to the user |
| `isCorrect` | `boolean` | ✅ | Whether the user confirmed the BPM was correct |
| `type` | `string` | ❌ | Source of BPM detection (sent by frontend, not validated by API) |

**Example request:**

```http
POST /api/feedback
Content-Type: application/json

{
    "bpm": "120",
    "isCorrect": true
}
```

#### Response

**Success (`200 OK`):**

```json
{
    "message": "Thank you!",
    "clientPrincipal": {
        "identityProvider": "twitter",
        "userId": "abc123",
        "userDetails": "username",
        "userRoles": ["authenticated", "anonymous"]
    }
}
```

> If the user is not authenticated, `clientPrincipal` will be an empty object `{}`.

**Validation Error (`404`):**

Returned when the request body is missing or does not contain both `bpm` and `isCorrect`.

```json
"No required parameter!"
```

#### Bindings (`function.json`)

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    },
    {
      "type": "cosmosDB",
      "direction": "out",
      "name": "outputDocument",
      "databaseName": "bpmtech-db",
      "collectionName": "feedback",
      "createIfNotExists": true,
      "connectionStringSetting": "bpmcounterdbaccount_DOCUMENTDB"
    }
  ]
}
```

| Binding | Type | Direction | Purpose |
|---------|------|-----------|---------|
| `req` | `httpTrigger` | in | HTTP POST trigger (anonymous auth) |
| `res` | `http` | out | HTTP response |
| `outputDocument` | `cosmosDB` | out | Writes feedback document to CosmosDB |

#### Handler Logic Flow

1. **Validate** the request body — checks for `bpm` and `isCorrect` fields
2. **Extract client principal** from the `x-ms-client-principal` header (SWA-provided)
3. **Generate a document** with a unique `id`, `bpm`, `isCorrect`, and `timestamp`
4. **Write to CosmosDB** via `context.bindings.outputDocument`
5. **Track a telemetry event** (`feedback_save`) to Application Insights
6. **Return** a success response with the client principal info

#### Error Handling

- Missing required fields → `404` response + `trackException` to Application Insights
- Client principal decode failure → logged via `context.log()`, execution continues with an empty `clientPrincipal`

## Authentication & Authorization

Authentication is handled **entirely by Azure Static Web Apps**, not by the function code itself.

### How It Works

1. SWA intercepts requests and injects the `x-ms-client-principal` HTTP header (base64-encoded JSON)
2. The function decodes this header to identify the authenticated user
3. Route-level access control is configured in `src/staticwebapp.config.json`
4. All functions use `"authLevel": "anonymous"` because SWA manages auth upstream

### Client Principal Extraction

```javascript
const header = req.headers['x-ms-client-principal'];
const encoded = Buffer.from(header, 'base64');
const decoded = encoded.toString('ascii');
const clientPrincipal = JSON.parse(decoded);
```

The decoded `clientPrincipal` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `identityProvider` | `string` | Auth provider (e.g., `"twitter"`) |
| `userId` | `string` | Provider-specific user ID |
| `userDetails` | `string` | Username or email |
| `userRoles` | `string[]` | Roles assigned (e.g., `["authenticated", "anonymous"]`) |

### SWA Route-Level Auth Rules

These are defined in `src/staticwebapp.config.json` and enforced before requests reach the API:

| Route | Allowed Roles |
|-------|---------------|
| `/account` | `authenticated` |
| `/admin/*` | `administrator` |
| All other routes | `anonymous` (public) |

> The `/api/feedback` endpoint is publicly accessible (no role restriction). Unauthenticated users can submit feedback — the API gracefully handles missing client principal data.

## Telemetry & Monitoring

The API uses **Azure Application Insights** (`applicationinsights` v2) for telemetry.

### Setup

```javascript
const appInsights = require('applicationinsights');
appInsights.setup();
const client = appInsights.defaultClient;
```

The Application Insights SDK auto-discovers the connection string from the `APPLICATIONINSIGHTS_CONNECTION_STRING` (or `APPINSIGHTS_INSTRUMENTATIONKEY`) environment variable, which is typically set by the Azure platform.

### Trace Correlation

Each function invocation correlates telemetry with the incoming request using the operation ID from the Azure Functions trace context:

```javascript
var operationIdOverride = {
    'ai.operation.id': context.traceContext.traceparent,
};
```

This `tagOverrides` object is passed to all `trackEvent` and `trackException` calls.

### Tracked Telemetry

| Method | Event Name | When |
|--------|------------|------|
| `client.trackEvent()` | `feedback_save` | Successful feedback submission (includes `bpm`, `isCorrect`, `timestamp`) |
| `client.trackException()` | — | Request validation failure (missing required parameters) |

### Host-Level Sampling

Configured in `host.json`:

```json
{
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  }
}
```

- Sampling is **enabled** to reduce telemetry volume/costs
- **Request** telemetry type is excluded from sampling (all requests are logged)

## Database — CosmosDB

### Connection Details

| Setting | Value |
|---------|-------|
| Database name | `bpmtech-db` |
| Collection name | `feedback` |
| Connection string setting | `bpmcounterdbaccount_DOCUMENTDB` |
| Auto-create collection | `true` |

The connection string is stored as an **application setting** (environment variable) named `bpmcounterdbaccount_DOCUMENTDB`, configured in the Azure portal or in `local.settings.json` for local development.

### Document Schema

Each feedback submission writes a document to the `feedback` collection:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier: ISO timestamp + 8 random digits |
| `bpm` | `string \| number` | The BPM value the user was evaluating |
| `isCorrect` | `boolean` | Whether the user confirmed the BPM was accurate |
| `timestamp` | `number` | Unix timestamp in milliseconds (`Date.now()`) |

**Example document:**

```json
{
    "id": "2024-01-15T10:30:00.000Z42859371",
    "bpm": "120",
    "isCorrect": true,
    "timestamp": 1705312200000
}
```

### Writing Documents

Documents are written via the CosmosDB output binding, not through a client SDK:

```javascript
context.bindings.outputDocument = JSON.stringify({ ... });
```

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-tools-reference) v3+
- [Azure Static Web Apps CLI](https://github.com/Azure/static-web-apps-cli) (`npm install -g @azure/static-web-apps-cli`)

### Install Dependencies

```bash
cd api
npm install
```

### Running Locally

**Option 1 — Full-stack with SWA CLI** (recommended):

From the project root:

```bash
swa start http://localhost:3000 --run "npm start" --api-location ./api
```

This starts the React dev server on port 3000 and the API, proxied together via SWA CLI on **port 4280**. The SWA CLI emulates authentication and routing.

**Option 2 — API only**:

```bash
cd api
func start
# or: npm start
```

The API will be available at `http://localhost:7071/api/feedback`.

### Local Settings

For local development, create `api/local.settings.json` (git-ignored):

```json
{
    "IsEncrypted": false,
    "Values": {
        "FUNCTIONS_WORKER_RUNTIME": "node",
        "AzureWebJobsStorage": "",
        "bpmcounterdbaccount_DOCUMENTDB": "<your-cosmosdb-connection-string>",
        "APPLICATIONINSIGHTS_CONNECTION_STRING": "<your-app-insights-connection-string>"
    }
}
```

> **Note:** `local.settings.json` is listed in both `.gitignore` and `.funcignore` — it must never be committed.

### Testing the Endpoint

```bash
curl -X POST http://localhost:7071/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"bpm": "120", "isCorrect": true}'
```

Expected response:

```json
{
    "message": "Thank you!",
    "clientPrincipal": {}
}
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `applicationinsights` | `^2.3.5` | Azure Application Insights telemetry SDK |

> Dependencies are intentionally minimal. Install separately from the frontend: `cd api && npm install`.

## Configuration & Environment Variables

| Variable | Purpose | Set By |
|----------|---------|--------|
| `bpmcounterdbaccount_DOCUMENTDB` | CosmosDB connection string | Azure portal / `local.settings.json` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights connection | Azure platform (auto-set) |
| `FUNCTIONS_WORKER_RUNTIME` | Must be `"node"` | `local.settings.json` / Azure platform |
| `AzureWebJobsStorage` | Storage account for Functions runtime | Azure platform / `local.settings.json` |

## Proxies

The `proxies.json` file is present but currently empty — no proxy routes are configured:

```json
{
    "$schema": "http://json.schemastore.org/proxies",
    "proxies": {}
}
```

## Deployment

The API is deployed automatically as part of the Azure Static Web Apps deployment pipeline. SWA detects the `api/` folder and deploys it as the managed Functions backend. No separate deployment step is required — just push to the configured branch.

### Files Excluded from Deployment (`.funcignore`)

```
*.js.map
*.ts
.git*
.vscode
local.settings.json
test
tsconfig.json
```
