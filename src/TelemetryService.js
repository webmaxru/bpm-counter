import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js';

let reactPlugin = null;
let clickPlugin = null;
let appInsights = null;

/**
 * Create the App Insights Telemetry Service
 * @return {{reactPlugin: ReactPlugin, appInsights: Object, initialize: Function}} - Object
 */
const createTelemetryService = () => {
  /**
   * Initialize the Application Insights class
   * @param {string} connectionString - Application Insights Instrumentation Key
   * @param {Object} browserHistory - client's browser history, supplied by the withRouter HOC
   * @return {void}
   */
  const initialize = (connectionString, browserHistory) => {
    if (!browserHistory) {
      throw new Error('Could not initialize Telemetry Service');
    }
    if (!connectionString) {
      throw new Error(
        'Instrumentation key not provided in ./src/telemetry-provider.jsx'
      );
    }

    reactPlugin = new ReactPlugin();

    clickPlugin = new ClickAnalyticsPlugin();
    const clickPluginConfig = {
      autoCapture: true,
    };

    appInsights = new ApplicationInsights({
      config: {
        connectionString: connectionString,
        maxBatchInterval: 0,
        disableFetchTracking: false,
        extensions: [reactPlugin, clickPlugin],
        extensionConfig: {
          [reactPlugin.identifier]: {
            history: browserHistory,
          },
          [clickPlugin.identifier]: clickPluginConfig,
        },
      },
    });

    appInsights.loadAppInsights();
  };

  return { reactPlugin, appInsights, initialize };
};

export const ai = createTelemetryService();
export const getAppInsights = () => appInsights;
