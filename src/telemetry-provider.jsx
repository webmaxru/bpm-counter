import React, { useEffect, useRef, Fragment } from 'react';
import { initialize, getAppInsights } from './TelemetryService';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import {
  getTelemetryPath,
  getTelemetryUrl,
} from './telemetryPrivacy';

/**
 * TelemetryProvider — initializes App Insights and tracks page views via React Router location.
 * Converted from class component (withRouter HOC no longer needed with React Router v7 hooks).
 */
function TelemetryProvider({ connectionString, after, children }) {
  const location = useLocation();
  const initialized = useRef(false);
  const afterRef = useRef(after);
  afterRef.current = after;

  // Initialize App Insights (once)
  useEffect(() => {
    if (!initialized.current && connectionString) {
      try {
        initialize(connectionString);
        initialized.current = true;

        const appInsightsInstance = getAppInsights();
        if (afterRef.current && appInsightsInstance) {
          afterRef.current();
        }
      } catch (err) {
        console.warn('[TelemetryProvider] Failed to initialize App Insights:', err.message);
      }
    }
  }, [connectionString]);

  // Track page views without query strings, which may contain an audio URL.
  useEffect(() => {
    const path = getTelemetryPath(location);
    const url = getTelemetryUrl(location, window.location.origin);

    ReactGA.set({ page: path, page_location: url });
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      location: url,
      title: document.title,
    });

    if (initialized.current) {
      const ai = getAppInsights();
      ai?.trackPageView({ uri: path });
    }
  }, [location.pathname]);

  return <Fragment>{children}</Fragment>;
}

export default TelemetryProvider;
