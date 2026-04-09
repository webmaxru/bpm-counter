import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js';
import { isMobile } from 'react-device-detect';

// P0 #1: Create ReactPlugin at module level so withAITracking HOC gets a real instance
export const reactPlugin = new ReactPlugin();

let appInsights = null;
let sendFailureWarned = false;

/**
 * Parse and validate an App Insights connection string.
 * Normalizes endpoint URLs by stripping trailing slashes to prevent double-slash
 * issues (e.g. `https://endpoint.azure.com//v2/track`).
 * @param {string} connectionString - Raw connection string
 * @return {string} Normalized connection string
 * @throws {Error} If the connection string is missing or lacks InstrumentationKey
 */
export const parseConnectionString = (connectionString) => {
  if (!connectionString) {
    throw new Error(
      'App Insights connection string is not configured. ' +
      'Set REACT_APP_APPINSIGHTS_CONNECTION_STRING in your environment.'
    );
  }

  const parts = connectionString.split(';').filter(Boolean);
  const parsed = {};
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0) {
      parsed[part.substring(0, eqIdx)] = part.substring(eqIdx + 1);
    }
  }

  if (!parsed.InstrumentationKey) {
    throw new Error(
      'Connection string is missing InstrumentationKey. ' +
      'Expected format: InstrumentationKey=<guid>;IngestionEndpoint=<url>'
    );
  }

  // Normalize endpoint URLs — strip trailing slashes to avoid //v2/track
  const normalized = parts.map((part) => {
    if (part.startsWith('IngestionEndpoint=') || part.startsWith('LiveEndpoint=')) {
      return part.replace(/\/+$/, '');
    }
    return part;
  });

  return normalized.join(';');
};

/**
 * Initialize the Application Insights SDK (idempotent)
 * @param {string} connectionString - Application Insights connection string
 * @param {Object} [browserHistory] - React Router history object (optional)
 * @return {Object} appInsights instance
 */
export const initialize = (connectionString, browserHistory) => {
  if (appInsights) return appInsights;

  const normalizedConnString = parseConnectionString(connectionString);
  const clickPlugin = new ClickAnalyticsPlugin();

  appInsights = new ApplicationInsights({
    config: {
      connectionString: normalizedConnString,
      maxBatchInterval: 15000,                            // P1 #5: was 0 (immediate send)
      disableFetchTracking: false,
      correlationHeaderExcludedDomains: ['*.amazon.com'], // P1 #12: exclude ad link domains
      samplingPercentage: 100,                            // P2 #18: explicit, easy to tune
      extensions: [reactPlugin, clickPlugin],
      extensionConfig: {
        [reactPlugin.identifier]: browserHistory ? { history: browserHistory } : {},
        [clickPlugin.identifier]: {
          autoCapture: false,                              // P2 #16: manual click_ad preferred
          dataTags: { useDefaultContentNameOrId: true },   // P2 #17
        },
      },
    },
  });

  appInsights.loadAppInsights();

  // One-time warning when telemetry is discarded (e.g. invalid workspace, 400 errors)
  appInsights.addNotificationListener({
    eventsDiscarded: (events, reason) => {
      if (!sendFailureWarned) {
        sendFailureWarned = true;
        console.warn(
          '[App Insights] Telemetry events are being discarded (reason: %d). ' +
          'Check that your App Insights resource and workspace are valid in the Azure portal.',
          reason
        );
      }
    },
  });

  // P2 #20, #21: Enrich all telemetry with custom dimensions
  appInsights.addTelemetryInitializer((item) => {
    const query = new URLSearchParams(window.location.search);
    item.data = item.data || {};
    item.data.isMobile = String(isMobile);
    item.data.isDebug = String(query.get('debug') === 'true');
    item.data.appVersion = '0.1.0';
  });

  return appInsights;
};

export const getAppInsights = () => appInsights;
