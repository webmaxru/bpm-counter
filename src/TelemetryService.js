import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js';
import { isMobile } from 'react-device-detect';

// P0 #1: Create ReactPlugin at module level so withAITracking HOC gets a real instance
export const reactPlugin = new ReactPlugin();

let appInsights = null;

/**
 * Initialize the Application Insights SDK (idempotent)
 * @param {string} connectionString - Application Insights connection string
 * @param {Object} browserHistory - React Router history object from withRouter HOC
 * @return {Object} appInsights instance
 */
export const initialize = (connectionString, browserHistory) => {
  if (appInsights) return appInsights;

  if (!browserHistory) {
    throw new Error('Could not initialize Telemetry Service');
  }
  if (!connectionString) {
    throw new Error(
      'Connection string not provided in ./src/telemetry-provider.jsx'
    );
  }

  const clickPlugin = new ClickAnalyticsPlugin();

  appInsights = new ApplicationInsights({
    config: {
      connectionString: connectionString,
      maxBatchInterval: 15000,                            // P1 #5: was 0 (immediate send)
      disableFetchTracking: false,
      correlationHeaderExcludedDomains: ['*.amazon.com'], // P1 #12: exclude ad link domains
      samplingPercentage: 100,                            // P2 #18: explicit, easy to tune
      extensions: [reactPlugin, clickPlugin],
      extensionConfig: {
        [reactPlugin.identifier]: {
          history: browserHistory,
        },
        [clickPlugin.identifier]: {
          autoCapture: false,                              // P2 #16: manual click_ad preferred
          dataTags: { useDefaultContentNameOrId: true },   // P2 #17
        },
      },
    },
  });

  appInsights.loadAppInsights();

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
