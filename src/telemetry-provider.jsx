import React, { useEffect, useRef, Fragment } from 'react';
import { initialize, getAppInsights } from './TelemetryService';
import { useLocation } from 'react-router-dom';

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
      initialize(connectionString);
      initialized.current = true;

      const appInsightsInstance = getAppInsights();
      if (afterRef.current && appInsightsInstance) {
        afterRef.current();
      }
    }
  }, [connectionString]);

  // Track page views on navigation
  useEffect(() => {
    if (initialized.current) {
      const ai = getAppInsights();
      ai?.trackPageView({ uri: location.pathname + location.search + location.hash });
    }
  }, [location]);

  return <Fragment>{children}</Fragment>;
}

export default TelemetryProvider;
