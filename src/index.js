import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ReactGA from 'react-ga4';
import { getAppInsights } from './TelemetryService';

ReactGA.initialize(process.env.REACT_APP_GA4_MEASUREMENT_ID);
ReactGA.send('pageview');

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
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