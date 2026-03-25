# Frontend Documentation — BPM Techno

> **BPM Techno** is a real-time BPM (beats per minute) counter for DJs, built as a React 17 Progressive Web App deployed on Azure Static Web Apps.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack & Version Constraints](#technology-stack--version-constraints)
- [Project Structure](#project-structure)
- [Component Documentation](#component-documentation)
  - [App](#app)
  - [Home](#home)
  - [Upload](#upload)
  - [Feedback](#feedback)
  - [About](#about)
  - [Account](#account)
  - [Admin](#admin)
  - [Login](#login)
  - [AdLink](#adlink)
  - [TelemetryProvider](#telemetryprovider)
  - [TelemetryService](#telemetryservice)
- [Routing Configuration](#routing-configuration)
- [Authentication & Authorization](#authentication--authorization)
- [Telemetry Integration](#telemetry-integration)
  - [Azure Application Insights](#azure-application-insights)
  - [Google Analytics 4](#google-analytics-4)
- [BPM Detection Engines](#bpm-detection-engines)
  - [Real-Time Detection (Microphone)](#real-time-detection-microphone)
  - [URL-Based Detection (File Upload)](#url-based-detection-file-upload)
- [Audio Visualization](#audio-visualization)
- [Service Worker & PWA](#service-worker--pwa)
  - [Service Worker Source](#service-worker-source)
  - [Build Pipeline](#build-pipeline)
  - [Precaching](#precaching)
  - [Runtime Caching Strategies](#runtime-caching-strategies)
  - [Background Sync](#background-sync)
  - [App Shell Update Flow](#app-shell-update-flow)
  - [Web App Manifest](#web-app-manifest)
- [Styling Conventions](#styling-conventions)
- [Query Parameter Feature Flags](#query-parameter-feature-flags)
- [Build Process](#build-process)
  - [Development](#development)
  - [Production](#production)
  - [HTTPS Development](#https-development)
- [Environment Variables](#environment-variables)
- [Testing Approach](#testing-approach)

---

## Architecture Overview

The frontend is a single-page application (SPA) built with **Create React App** and deployed on **Azure Static Web Apps (SWA)**. The architecture follows these principles:

- **Functional components with hooks** are the primary pattern
- **Class components** exist only where required by third-party HOC patterns (`Feedback`, `TelemetryProvider`)
- **No global state library** — local `useState` + props drilling
- **Dual telemetry** — Azure Application Insights AND Google Analytics 4
- **Two BPM detection engines** — real-time mic input and URL-based audio analysis
- **Custom service worker** — Workbox 7 with a Rollup 2 bundle pipeline (not CRA's built-in SW)
- `appInsights` may be `null` initially — always use optional chaining (`appInsights?.trackEvent()`)

```
┌─────────────────────────────────────────────────────┐
│                    Azure SWA                        │
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │   React SPA (build/) │  │  Azure Functions     │  │
│  │   - CRA 5 output     │  │  (api/feedback/)     │  │
│  │   - Custom SW        │  │  - CosmosDB binding  │  │
│  └──────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack & Version Constraints

> **⚠️ Critical:** Do NOT use APIs or patterns from newer versions of these libraries.

| Dependency | Version | Constraint |
|---|---|---|
| `react` | `^17.0.2` | Uses `ReactDOM.render()`, NOT `createRoot()` (React 18+) |
| `react-dom` | `^17.0.2` | Paired with React 17 |
| `react-router-dom` | `^5.3.0` | Uses `<Switch>`, `<Route>`, `withRouter`. NOT v6 (`<Routes>`, `useNavigate`) |
| `react-scripts` | `^5.0.1` | CRA 5 (Webpack 5 under the hood) |
| `realtime-bpm-analyzer` | `^5.0.1` | v5 API using `AudioWorklet` via `createRealtimeBpmAnalyzer()` |
| `rollup` | `^2.56.3` | Rollup 2 legacy plugin format — NOT Rollup 3+ |
| `react-toastify` | `^8.0.2` | v8 API |
| `audiomotion-analyzer` | `^3.5.0` | Audio visualization library |
| `bpm-detective` | `^2.0.5` | Offline BPM detection from audio buffers |
| `react-hint` | `^3.2.1` | Tooltip library using factory pattern |
| `react-ga4` | `^1.1.2` | Google Analytics 4 integration |
| `loglevel` | `^1.7.1` | Lightweight logging |
| `react-device-detect` | `^1.17.0` | Device detection (mobile vs. desktop) |
| `web-vitals` | `^1.0.1` | Core Web Vitals reporting |
| `workbox-build` | `^7.0.0` | Service worker precache manifest injection (dev dependency) |

### App Insights Packages

| Package | Purpose |
|---|---|
| `@microsoft/applicationinsights-web` | Core SDK |
| `@microsoft/applicationinsights-react-js` | React integration + `withAITracking` HOC |
| `@microsoft/applicationinsights-clickanalytics-js` | Auto-capture click telemetry |

---

## Project Structure

```
src/
├── index.js                    # Entry point — ReactDOM.render(), GA4 init
├── index.css                   # Global styles, color palette, typography
├── App.js                      # Root component — Router, SW registration, layout
├── App.css                     # Layout styles (header, footer, body grid)
├── Home.js                     # Real-time BPM detection via microphone
├── Home.css                    # Home component styles (buttons, content)
├── Upload.js                   # URL-based BPM detection via bpm-detective
├── Feedback.js                 # BPM accuracy feedback widget (class component)
├── About.js                    # About page with SWA demo links
├── Account.js                  # User account page (auth required)
├── Admin.js                    # Admin page (administrator role required)
├── Login.js                    # Login page with provider links
├── AdLink.js                   # Affiliate ad link component with tracking
├── TelemetryService.js         # App Insights SDK factory & configuration
├── telemetry-provider.jsx      # App Insights HOC wrapper (class component)
├── reportWebVitals.js          # Core Web Vitals measurement
├── custom-hint.css             # react-hint tooltip theme overrides
├── staticwebapp.config.json    # SWA routing, auth, headers, MIME types
└── sw/
    └── service-worker.js       # Workbox service worker source

public/
├── index.html                  # HTML template with meta tags, fonts, OG tags
├── manifest.webmanifest        # PWA web app manifest
├── favicon.ico                 # App favicon
├── 400.html                    # Custom 400 error page
├── 404.html                    # Custom 404 error page
├── privacy.html                # Privacy policy page
├── ads.txt                     # Ad network authorization
├── assetlinks.json             # Digital asset links (TWA/Android)
├── robots.txt                  # Search engine crawl directives
├── images/                     # Icons, screenshots, social images
│   ├── icons/                  # PWA icons (192–512px)
│   ├── screenshots/            # App store screenshots
│   ├── shortcuts/              # Shortcut icons
│   └── social.png              # OG/Twitter social card image
└── samples/
    └── bpmtechno-120.mp3       # 120 BPM test audio sample

# Root build files
├── rollup.config.js            # Rollup 2 config — bundles SW as IIFE
├── sw-build.js                 # Workbox injectManifest config
└── package.json                # Dependencies, scripts, browserslist
```

---

## Component Documentation

### App

**File:** `App.js`
**Type:** Functional component
**Role:** Root application component — sets up routing, service worker, layout, and telemetry.

#### Key Behaviors

- **Query parameter parsing:** Reads `debug`, `viz`, and `bpm` from the URL on mount
- **Log level:** Sets `loglevel` to `info` (debug mode) or `error` (production)
- **Service worker registration:** Uses `workbox-window` to register `/sw.js`, handle update prompts via toast notifications, and listen for background sync messages
- **Telemetry initialization:** Wraps the app in `<TelemetryProvider>` and stores the `appInsights` instance in state
- **Navigation timing:** Logs `PerformanceNavigationTiming` entries on mount

#### State

| State | Type | Description |
|---|---|---|
| `appInsights` | `Object \| null` | Application Insights instance, set after telemetry init |

#### Layout Structure

```
<Router>
  <TelemetryProvider>
    <header>          — App title link + About "?" button
    <div.body>
      <Switch>        — Route-based page rendering
      <nav.nav>       — Reserved navigation area
      <aside.ads>     — Reserved ad area
    </div.body>
    <footer>          — AudioMotion container + credits/debug label
    <ToastContainer>  — Global toast notifications
  </TelemetryProvider>
</Router>
```

#### Service Worker Update Flow

1. `Workbox` registers `/sw.js`
2. On `waiting` event → shows toast with "Updated app is available" + Reload button
3. On reload click → calls `wb.messageSkipWaiting()` and reloads on `controlling` event
4. Listens for `REPLAY_COMPLETED` and `REQUEST_FAILED` messages from the SW for background sync status

---

### Home

**File:** `Home.js`
**Type:** Functional component
**Role:** Real-time BPM detection using the device microphone via `realtime-bpm-analyzer`.

#### Props

| Prop | Type | Description |
|---|---|---|
| `log` | `Object` | `loglevel` logger instance |
| `isMobile` | `boolean` | Whether the device is mobile (from `react-device-detect`) |
| `isForcedViz` | `boolean` | Force audio visualization even on mobile (`?viz=true`) |
| `testBPM` | `string \| null` | Pre-set BPM value from `?bpm=N` query param |
| `isDebug` | `boolean` | Debug mode flag |
| `appInsights` | `Object \| null` | Application Insights instance |

#### State

| State | Type | Default | Description |
|---|---|---|---|
| `threshold` | `number` | `0` | Detection confidence threshold (0–1) |
| `primaryBPM` | `string` | `testBPM \|\| ""` | Primary detected BPM value |
| `secondaryBPM` | `string` | `""` | Secondary BPM candidate |
| `isListening` | `boolean` | `false` | Whether mic input is active |
| `isShowingInit` | `boolean` | `true` | Show start button vs. results |
| `isResultReady` | `boolean` | `testBPM ? true : false` | Whether a BPM result is available |
| `isSampleVisible` | `boolean` | `false` | Toggle visibility of sample audio player |

#### Key Behaviors

- **Mic access:** Calls `navigator.mediaDevices.getUserMedia({ audio: true })` on "Start listening"
- **BPM analysis:** Creates a `realtime-bpm-analyzer` instance with `continuousAnalysis: true` and `stabilizationTime: 10000` ms
- **Audio visualization:** On desktop (or when forced), creates an `AudioMotionAnalyzer` with the project's custom gradient
- **Stop listening:** Calls `window.location.reload()` for complete audio teardown
- **Threshold opacity:** The BPM display opacity scales with the detection threshold (`style={{ opacity: threshold + 0.4 }}`)
- **Sample audio:** Toggleable `<audio>` element playing `/samples/bpmtechno-120.mp3` for testing
- **Tooltips:** `react-hint` tooltips on desktop only

#### Telemetry Events

| Event | Trigger | Properties |
|---|---|---|
| `select_content` (GA4) | Component mount | `content_type: 'mode', item_id: 'realtime'` |
| `detect` (GA4 + AI) | BPM detected | `mode: 'realtime', bpm, threshold` |
| `detect` (AI only) | Component mount (when appInsights available) | `content_type: 'mode', item_id: 'realtime'` |

---

### Upload

**File:** `Upload.js`
**Type:** Functional component
**Role:** BPM detection from a remote audio file URL using `bpm-detective`.

#### Props

| Prop | Type | Description |
|---|---|---|
| `log` | `Object` | `loglevel` logger instance |
| `isDebug` | `boolean` | Debug mode flag |
| `appInsights` | `Object \| null` | Application Insights instance |

#### State

| State | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | `query.get('url') ?? ''` | Audio file URL (pre-filled from `?url=` param) |
| `primaryBPM` | `string` | `""` | Detected BPM value |
| `isResultReady` | `boolean` | `false` | Whether detection is complete |

#### Key Behaviors

- **URL pre-fill:** Reads `?url=<audio-url>` from the query string to pre-populate the input
- **Sample shortcut:** "use sample" link sets URL to `/samples/bpmtechno-120.mp3`
- **Detection flow:** Fetches audio → `decodeAudioData()` → `bpm-detective` `detect()` function
- **Error handling:** Displays errors via `react-toastify`

#### Telemetry Events

| Event | Trigger | Properties |
|---|---|---|
| `select_content` (GA4) | Component mount | `content_type: 'mode', item_id: 'url'` |
| `detect` (GA4) | BPM detected | `mode: 'url', bpm` |
| `detect` (AI) | BPM detected | `content_type: 'mode', item_id: 'url'` |

---

### Feedback

**File:** `Feedback.js`
**Type:** Class component
**Role:** BPM accuracy feedback widget — asks if the detected BPM is correct and sends the response to the API.

> Class component because `react-hint` factory requires ref-based tooltip control (`this.instance.toggleHint()`).

#### Props

| Prop | Type | Description |
|---|---|---|
| `bpm` | `string` | The detected BPM to evaluate |
| `log` | `Object` | `loglevel` logger instance |
| `type` | `string` | Detection mode: `"mic"` or `"file"` |
| `appInsights` | `Object \| null` | Application Insights instance |

#### Key Behaviors

- **Auto-show tooltip:** On mount, shows a tooltip hint for 5 seconds prompting feedback
- **API call:** POSTs to `/api/feedback` with `{ bpm, type, isCorrect }` (service worker handles offline replay)
- **Optimistic UI:** Shows success toast immediately before the fetch completes
- **Dual telemetry:** Tracks `share` event to both GA4 and App Insights on feedback submission

---

### About

**File:** `About.js`
**Type:** Functional component
**Role:** Information page describing the project, with SWA demo links and telemetry debugging tools.

#### Props

| Prop | Type | Description |
|---|---|---|
| `appInsights` | `Object \| null` | Application Insights instance |

#### Key Behaviors

- Displays project description (3-in-1: product, SWA demo, PWA proof of concept)
- Provides SWA authentication test links (login, logout, purge providers)
- Fetches and displays `/.auth/me` client principal data
- Includes telemetry debugging buttons: Track Exception, Track Event, Track Trace, Throw Error, XHR/Fetch requests

---

### Account

**File:** `Account.js`
**Type:** Functional component
**Role:** Authenticated user account page displaying SWA client principal data.

#### State

| State | Type | Description |
|---|---|---|
| `clientPrincipal` | `Object \| null` | User identity from `/.auth/me` |
| `isLoading` | `boolean` | Loading state for auth fetch |

#### Key Behaviors

- Fetches `/.auth/me` on mount to get authenticated user info
- Displays identity provider, user ID, user details, and roles
- Shows "Not logged in" with login link if unauthenticated
- Warns in console during local development (where auth endpoint is unavailable)

---

### Admin

**File:** `Admin.js`
**Type:** Functional component
**Role:** Admin panel page — accessible only to users with the `administrator` role.

Minimal component with links to Account and Logout.

---

### Login

**File:** `Login.js`
**Type:** Functional component
**Role:** Login page with links to SWA authentication providers.

#### Supported Providers

- **Twitter** — `/.auth/login/twitter`
- **GitHub** — `/.auth/login/github`
- **Azure Active Directory** — `/.auth/login/aad` (disabled in SWA config, returns 404)

Includes variants with `post_login_redirect_uri` to redirect to `/account` after login.

---

### AdLink

**File:** `AdLink.js`
**Type:** Functional component
**Role:** Affiliate advertisement link component with click tracking.

#### Props

| Prop | Type | Description |
|---|---|---|
| `ad` | `string` | Ad category key: `"search-dj-controllers"`, `"item-sample-pack"`, or `"item-music-prod"` |
| `appInsights` | `Object \| null` | Application Insights instance |

#### Key Behaviors

- Contains a map of ad categories, each with an Amazon affiliate link and an array of display text variants
- Randomly selects one text variant on each render
- Tracks `click_ad` events to both GA4 and App Insights with ad key and displayed text
- Opens links in new tab with `rel="noreferrer"`

---

### TelemetryProvider

**File:** `telemetry-provider.jsx`
**Type:** Class component
**Role:** Wraps the application to provide Azure Application Insights page view tracking.

> Class component because `withAITracking` HOC from `@microsoft/applicationinsights-react-js` requires it.

#### Props

| Prop | Type | Description |
|---|---|---|
| `connectionString` | `string` | App Insights connection string |
| `after` | `Function` | Callback invoked after initialization (used to get the appInsights instance) |
| `children` | `ReactNode` | Child components to render |

#### Key Behaviors

- On mount, initializes the `TelemetryService` with the connection string and router history
- Calls `this.props.after()` to allow the parent to retrieve the `appInsights` instance
- Exported wrapped with `withRouter` (for browser history access) and `withAITracking` (for automatic page view tracking)

---

### TelemetryService

**File:** `TelemetryService.js`
**Type:** Module (factory pattern)
**Role:** Creates and configures the Application Insights SDK instance.

#### Exports

| Export | Type | Description |
|---|---|---|
| `ai` | `Object` | Contains `reactPlugin`, `appInsights`, and `initialize()` |
| `getAppInsights()` | `Function` | Returns the initialized `ApplicationInsights` instance |

#### Configuration

- **`maxBatchInterval: 0`** — Sends telemetry immediately (no batching)
- **`disableFetchTracking: false`** — Tracks fetch API calls as dependencies
- **Click Analytics Plugin** — Auto-captures click events
- **React Plugin** — Integrates with React Router history for page view tracking

---

## Routing Configuration

Routes are defined in `App.js` using React Router v5 `<Switch>` / `<Route>`:

| Path | Component | Auth Required | Description |
|---|---|---|---|
| `/` | `Home` | No | Real-time BPM detection (default) |
| `/upload` | `Upload` | No | URL-based BPM detection |
| `/about` | `About` | No | Project info and SWA demo |
| `/account` | `Account` | Yes (`authenticated`) | User account details |
| `/admin` | `Admin` | Yes (`administrator`) | Admin panel |
| `/login` | `Login` | No | Auth provider selection |

### SWA Route Configuration

Additional routing rules in `staticwebapp.config.json`:

| Route | Behavior |
|---|---|
| `/aboutme` | 301 redirect → `/about` |
| `/logout` | Redirect → `/.auth/logout?post_logout_redirect_uri=/about` |
| `/login-twitter` | Rewrite → `/.auth/login/twitter` |
| `/login-account` | Rewrite → `/.auth/login/twitter?post_login_redirect_uri=/account` |
| `/.auth/login/aad` | Returns 404 (disabled) |
| `/images/*` | Cache-Control: `must-revalidate, max-age=15770000` |

### Navigation Fallback

```json
{
  "navigationFallback": {
    "rewrite": "index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/static/*"]
  }
}
```

All unmatched routes fall through to `index.html` for client-side routing, except image and static asset paths.

---

## Authentication & Authorization

Authentication is managed entirely by **Azure Static Web Apps**, not by application code.

### Configuration (`staticwebapp.config.json`)

| Route | Allowed Roles | Behavior |
|---|---|---|
| `/account` | `authenticated` | Requires any logged-in user |
| `/admin/*` | `administrator` | Requires administrator role |
| All other routes | `anonymous` | Public access |

### Response Overrides

| Status Code | Behavior |
|---|---|
| `401` | Redirect to `/login` (302) |
| `400`, `403` | Serve `/400.html` |
| `404` | Serve `/404.html` |

### Auth Flow

1. User visits a protected route (e.g., `/account`)
2. SWA checks the `allowedRoles` configuration
3. Unauthenticated users receive a 401 → redirected to `/login`
4. Login page presents SWA auth provider links (`/.auth/login/twitter`, `/.auth/login/github`)
5. After login, user identity is available via `/.auth/me` (fetched in `Account.js` and `About.js`)

### Client Principal

The `/.auth/me` endpoint returns:

```json
{
  "clientPrincipal": {
    "identityProvider": "github",
    "userId": "...",
    "userDetails": "username",
    "userRoles": ["anonymous", "authenticated"]
  }
}
```

---

## Telemetry Integration

The app uses **dual telemetry** — every significant user action is tracked to both systems.

### Azure Application Insights

**Setup:** `TelemetryService.js` + `telemetry-provider.jsx`

- Initialized in `TelemetryProvider.componentDidMount()` with the connection string
- Instance stored in `App` state as `appInsights` and passed as props to all components
- **Always use optional chaining:** `appInsights?.trackEvent()` since it's `null` before initialization
- Features enabled: page view tracking, click analytics (auto-capture), fetch dependency tracking, React Router integration

**Tracked Events:**

| Event Name | Component | Trigger |
|---|---|---|
| `detect` | Home, Upload | BPM detection result or mode selection |
| `share` | Feedback | User submits feedback |
| `click_ad` | AdLink | Ad link clicked |
| `some event` | About | Manual test button |

### Google Analytics 4

**Setup:** `index.js`

- Initialized at app startup via `ReactGA.initialize()` with the measurement ID
- Initial pageview sent via `ReactGA.send('pageview')`
- Offline tracking replayed by the service worker via `workbox-google-analytics`

**Tracked Events:**

| Event Name | Component | Trigger |
|---|---|---|
| `select_content` | Home, Upload | Page/mode selection |
| `detect` | Home, Upload | BPM detection result |
| `share` | Feedback | Feedback submitted |
| `click_ad` | AdLink | Ad link clicked |

### Web Vitals

`reportWebVitals.js` dynamically imports `web-vitals` to measure CLS, FID, FCP, LCP, and TTFB. Called in `index.js` without a callback by default (no-op unless a reporting function is passed).

---

## BPM Detection Engines

### Real-Time Detection (Microphone)

**Component:** `Home.js`
**Library:** [`realtime-bpm-analyzer`](https://github.com/AuraBPM/realtime-bpm-analyzer) v5

#### Flow

1. User clicks "Start listening"
2. App requests microphone access via `getUserMedia({ audio: true })`
3. Creates a `Web Audio API` `AudioContext` and `MediaStreamSource`
4. Initializes `createRealtimeBpmAnalyzer()` with options:
   - `debug`: matches `?debug=true` flag
   - `continuousAnalysis: true` — keeps analyzing (doesn't stop after first result)
   - `stabilizationTime: 10000` — waits 10 seconds before providing stable results
5. Connects the mic stream to the analyzer's AudioWorklet node
6. Listens for `bpm` events providing candidates with confidence thresholds
7. On `bpmStable` event, resets the analyzer for re-detection
8. On `error` event, marks result as not ready

#### Stop Behavior

Stopping calls `window.location.reload()` rather than manually tearing down audio nodes. This ensures complete cleanup of `AudioContext`, `AudioWorklet`, and `MediaStream` resources.

---

### URL-Based Detection (File Upload)

**Component:** `Upload.js`
**Library:** [`bpm-detective`](https://github.com/AuraBPM/bpm-detective) v2

#### Flow

1. User enters an audio file URL (or clicks "use sample" for the built-in 120 BPM sample)
2. App fetches the audio file via `fetch(url)`
3. Converts response to `ArrayBuffer`
4. Decodes with `AudioContext.decodeAudioData()`
5. Passes the `AudioBuffer` to `bpm-detective`'s `detect()` function
6. Displays the computed BPM

#### URL Pre-fill

The `?url=<audio-url>` query parameter pre-fills the URL input field on load.

---

## Audio Visualization

**Library:** [`audiomotion-analyzer`](https://github.com/hvianna/audioMotion-analyzer) v3
**Component:** `Home.js`
**Container:** `<div id="AudioMotionAnalyzer">` in `App.js` footer

Visualization is enabled on **desktop only** by default, or forced on mobile via `?viz=true`.

### Configuration

```js
{
  gradient: 'my-grad',          // Custom gradient using brand colors
  height: window.innerHeight / 4,
  showBgColor: false,
  overlay: true,
  mode: 6,                      // 1/6th octave bands
  lumiBars: false,
  showLeds: true,               // LED bar style
  showScaleX: false,
  loRes: true                   // Low resolution for performance
}
```

### Custom Gradient

| Position | Color | Name |
|---|---|---|
| Background | `#0D4C73` | Dark blue |
| 0.8 | `#35748C` | Teal |
| 0.6 | `#F2B680` | Gold |
| 0.4 | `#D98C5F` | Orange |
| 0.2 | `#8C5230` | Brown |

The visualization connects to the same microphone `MediaStream` used for BPM detection. Volume is set to 0 to prevent audio feedback.

---

## Service Worker & PWA

The app uses a **custom Workbox-based service worker** (not CRA's built-in), with a 3-stage build pipeline.

### Service Worker Source

**File:** `src/sw/service-worker.js`

#### Features

| Feature | Implementation |
|---|---|
| **Precaching** | `precacheAndRoute(self.__WB_MANIFEST)` — auto-generated manifest |
| **Navigation routing** | `NavigationRoute` serving `/index.html` with denylist for auth/static routes |
| **Google Fonts caching** | `workbox-recipes` `googleFontsCache()` |
| **Background sync** | `BackgroundSyncPlugin` for failed `/api/feedback` POST requests |
| **GA offline tracking** | `workbox-google-analytics` `initialize()` |
| **Static routing API** | Chrome-specific `event.addRoutes()` for `/login`, `/about`, `/privacy.html`, `/favicon.ico` |
| **Client claim** | `clientsClaim()` — takes control immediately |
| **Skip waiting** | Manual via message (not automatic) |

#### Navigation Denylist

These paths are excluded from the SPA navigation handler and served directly:

- `/account`, `/admin`, `/login`, `/logout`
- `/.auth`
- `/aboutme`
- `/400.html`, `/404.html`, `/privacy.html`

### Build Pipeline

The service worker build is a 3-stage process:

```
1. react-scripts build          → Produces build/ with app assets
2. node sw-build.js              → Workbox injectManifest: injects precache
                                   manifest into src/sw/service-worker.js
                                   → outputs build/sw.js
3. npx rollup -c                 → Bundles build/sw.js as IIFE with:
                                   - node_modules resolution
                                   - process.env.NODE_ENV → 'production'
                                   - Terser minification
```

#### sw-build.js Configuration

```js
{
  globDirectory: "build",
  globPatterns: [
    "favicon.ico", "index.html", "privacy.html",
    "static/**/*", "images/icons/*", "manifest.webmanifest"
  ],
  globIgnores: ["**/*.map", "**/*.txt"],
  swSrc: "src/sw/service-worker.js",
  swDest: "build/sw.js",
  dontCacheBustURLsMatching: /\.+\.chunk\.(?:js|css)/,
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024  // 4 MB
}
```

#### rollup.config.js

```js
{
  input: 'build/sw.js',
  output: { file: 'build/sw.js', format: 'iife' },
  plugins: [resolve(), replace({ 'process.env.NODE_ENV': '"production"' }), terser()]
}
```

### Precaching

Precached assets (injected via `__WB_MANIFEST`):
- `favicon.ico`, `index.html`, `privacy.html`
- `static/**/*` (JS/CSS chunks)
- `images/icons/*` (PWA icons)
- `manifest.webmanifest`

Cache busting is skipped for hashed chunk files (`*.chunk.js`, `*.chunk.css`).

### Runtime Caching Strategies

| URL Pattern | Strategy | Notes |
|---|---|---|
| Navigation requests | Precache (`index.html`) | Via `NavigationRoute` |
| Google Fonts | Runtime cache | Via `workbox-recipes` |
| `/api/feedback` (POST) | NetworkFirst | With BackgroundSync plugin |
| Google Analytics | Replay offline | Via `workbox-google-analytics` |

### Background Sync

Failed `POST /api/feedback` requests are queued by `BackgroundSyncPlugin`:

- **Queue name:** `feedbackQueue`
- **Max retention:** 24 hours
- **On successful replay:** Posts `REPLAY_COMPLETED` message to all clients → triggers success toast
- **On fetch failure:** Posts `REQUEST_FAILED` message to client → triggers warning toast

### App Shell Update Flow

1. New SW version detected → `waiting` event fires
2. App shows toast: "Updated app is available" with Reload button
3. User clicks Reload → sends `SKIP_WAITING` message to SW
4. SW calls `self.skipWaiting()` → `controlling` event fires
5. App reloads the page

### Web App Manifest

**File:** `public/manifest.webmanifest`

| Feature | Value |
|---|---|
| Display | `standalone` (with `window-control-overlay`, `minimal-ui` fallbacks) |
| Theme color | `#0d4c73` |
| Orientation | `portrait` |
| Categories | `entertainment`, `music` |
| Shortcuts | "Upload Audio File" → `/upload` |
| File handlers | `.mp3` files → `/upload` |
| Share target | GET with `title`, `text`, `url` params |
| Protocol handlers | `web+bpm://` protocol → `/?bpm=` |
| Related apps | Google Play (`no.bpmtech.twa`), Microsoft Store (`9NQ4M5SC9PQ9`) |

---

## Styling Conventions

- **Plain CSS** files per component — no CSS modules, no CSS-in-JS
- **File naming:** CSS files match their component (`Home.css` for `Home.js`)
- **Global styles** in `index.css`; layout in `App.css`
- **Font:** [Saira](https://fonts.google.com/specimen/Saira) (loaded from Google Fonts via `<link>` in `index.html`)

### Color Palette

| Color | Hex | Usage |
|---|---|---|
| Dark Blue | `#0D4C73` | Background, nav text |
| Teal | `#35748C` | Buttons, footer, secondary accents |
| Gold | `#F2B680` | Primary BPM display (`h2`), start button |
| Orange | `#D98C5F` | Sub-headings (`h3`), hints/links |
| Brown | `#8C5230` | Visualization gradient endpoint |
| White | `#FFFFFF` | Text, links, button text |

### Key CSS Classes

| Class | File | Purpose |
|---|---|---|
| `.body` | `App.css` | Main content flex container |
| `.content` | `Home.css` | Centered content area |
| `.btn-start` | `Home.css` | Large gold start button |
| `.btn-stop` | `Home.css` | Teal stop/restart button |
| `.button` | `index.css` | Generic styled button/link |
| `.about` | `App.css` | "?" button in header |
| `.hint` | `index.css` | Dashed underline interactive text |
| `.custom-hint` | `custom-hint.css` | react-hint tooltip theme |

### Responsive Design

- Mobile-first layout using flexbox
- `@media (min-width: 768px)` breakpoint switches body to row layout and adds sidebar widths
- Audio visualization hidden on mobile by default (enabled via `?viz=true`)

---

## Query Parameter Feature Flags

Read in `App.js` on mount from `window.location.search`:

| Parameter | Example | Description |
|---|---|---|
| `debug` | `?debug=true` | Enables verbose logging (`loglevel` set to `info`), shows "Debugging mode" in footer instead of credits, enables debug output in `realtime-bpm-analyzer` |
| `viz` | `?viz=true` | Forces audio visualization on mobile devices (normally desktop-only) |
| `bpm` | `?bpm=128` | Pre-sets a BPM value — shows the result immediately, marks `isResultReady` as `true`, but does not disable mic access |
| `url` | `?url=https://example.com/track.mp3` | Pre-fills the audio URL input on the Upload page |

---

## Build Process

### Development

```bash
# Install dependencies
npm install

# Start dev server (CRA webpack-dev-server)
npm start
# → http://localhost:3000

# Start with SWA CLI (proxies API)
swa start http://localhost:3000 --run "npm start" --api-location ./api
# → http://localhost:4280 (includes API + auth emulation)
```

> **Note:** The service worker is NOT active in development mode. Only the React app runs.

### Production

```bash
# Full production build (3-stage)
npm run build
```

This runs:

1. **`react-scripts build`** — CRA production build → `build/`
2. **`node sw-build.js`** — Workbox `injectManifest` → `build/sw.js` with precache manifest
3. **`npx rollup -c`** — Bundles `build/sw.js` as IIFE, resolves dependencies, minifies

### HTTPS Development

For testing on mobile devices over LAN (required for mic access):

```bash
npm run startsecure
```

Requires `.pem` certificate files (`192.168.1.9.pem` and `192.168.1.9-key.pem`) in the project root. Uses `cross-env` to set `HTTPS=true` and cert paths.

---

## Environment Variables

**File:** `.env`

| Variable | Value | Description |
|---|---|---|
| `GENERATE_SOURCEMAP` | `false` | Disables source maps in production build |
| `REACT_APP_APPINSIGHTS_CONNECTION_STRING` | Connection string | Azure Application Insights connection string |
| `REACT_APP_GA4_MEASUREMENT_ID` | Measurement ID | Google Analytics 4 measurement ID |

- Environment variables prefixed with `REACT_APP_` are embedded at build time by CRA
- No runtime environment variable injection — values are baked into the JavaScript bundle

---

## Testing Approach

### Current State

Testing libraries are installed but **no test files exist yet**:

- `@testing-library/react` `^11.1.0`
- `@testing-library/jest-dom` `^5.11.4`
- `@testing-library/user-event` `^12.1.10`
- Jest (bundled with `react-scripts`)
- Playwright `^1.58.2` (for E2E tests)

### Running Tests

```bash
npm test          # Jest in watch mode
```

### Recommended Setup

To create tests from scratch:

1. **Create `src/setupTests.js`** with global mocks for:
   - `AudioContext` / `webkitAudioContext`
   - `navigator.mediaDevices.getUserMedia`
   - `MediaStream` / `MediaStreamSource`
   - `AudioWorklet`

2. **Mock external dependencies** via `jest.mock()`:
   - `realtime-bpm-analyzer` — mock `createRealtimeBpmAnalyzer()`
   - `bpm-detective` — mock `detect()`
   - `audiomotion-analyzer` — mock the constructor and methods
   - `react-ga4` — mock `ReactGA.initialize()`, `ReactGA.event()`, `ReactGA.send()`
   - `@microsoft/applicationinsights-web` — mock `ApplicationInsights`

3. **Add `*.test.js` files** alongside components (e.g., `Home.test.js`)

### E2E Tests

The `e2e/` directory and `playwright.config.js` at the project root are set up for Playwright end-to-end tests.
