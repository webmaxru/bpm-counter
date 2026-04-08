import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ReactGA from 'react-ga4';
import { getAppInsights } from './TelemetryService';

ReactGA.initialize(process.env.REACT_APP_GA4_MEASUREMENT_ID);
ReactGA.send('pageview');

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// P1 #10: Forward Core Web Vitals to App Insights
reportWebVitals((metric) => {
  const appInsights = getAppInsights();
  appInsights?.trackMetric({ name: metric.name, average: metric.value });
});

/*
document.addEventListener('DOMContentLoaded', function () {
  if (!checkPerformanceCookiesEnabled()) {
      if (typeof appInsights === 'object' && typeof appInsights.config === 'object') {
          window.appInsights.config.disableCookiesUsage = true;
      }
  }
});
*/