import { useContext, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import { TelemetryContext } from './TelemetryContext';

export function useContentTelemetry(page) {
  const appInsights = useContext(TelemetryContext);
  const gaTrackedPageId = useRef(null);
  const appInsightsTrackedPageId = useRef(null);
  const properties = {
    content_id: page.id,
    content_type: page.category,
    path: page.path,
  };

  useEffect(() => {
    if (gaTrackedPageId.current !== page.id) {
      gaTrackedPageId.current = page.id;
      ReactGA.event('content_viewed', properties);
    }
  }, [page.id, page.category, page.path]);

  useEffect(() => {
    if (appInsights && appInsightsTrackedPageId.current !== page.id) {
      appInsightsTrackedPageId.current = page.id;
      appInsights.trackEvent({
        name: 'content_viewed',
        properties,
      });
    }
  }, [appInsights, page.id, page.category, page.path]);
}
