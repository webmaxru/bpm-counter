import React from 'react';
import { render } from '@testing-library/react';
import ReactGA from 'react-ga4';
import { TelemetryContext } from './TelemetryContext';
import { useContentTelemetry } from './useContentTelemetry';

vi.mock('react-ga4', () => ({
  default: {
    event: vi.fn(),
  },
}));

function TelemetryProbe({ page }) {
  useContentTelemetry(page);
  return null;
}

describe('useContentTelemetry', () => {
  it('tracks each page when a shared route component changes content', () => {
    const appInsights = { trackEvent: vi.fn() };
    const firstPage = {
      id: 'privacy',
      category: 'legal',
      path: '/privacy',
    };
    const secondPage = {
      id: 'affiliate-disclosure',
      category: 'legal',
      path: '/affiliate-disclosure',
    };

    const { rerender } = render(
      <TelemetryContext.Provider value={appInsights}>
        <TelemetryProbe page={firstPage} />
      </TelemetryContext.Provider>
    );

    rerender(
      <TelemetryContext.Provider value={appInsights}>
        <TelemetryProbe page={secondPage} />
      </TelemetryContext.Provider>
    );

    expect(ReactGA.event).toHaveBeenCalledTimes(2);
    expect(ReactGA.event).toHaveBeenLastCalledWith('content_viewed', {
      content_id: 'affiliate-disclosure',
      content_type: 'legal',
      path: '/affiliate-disclosure',
    });
    expect(appInsights.trackEvent).toHaveBeenCalledTimes(2);
    expect(appInsights.trackEvent).toHaveBeenLastCalledWith({
      name: 'content_viewed',
      properties: {
        content_id: 'affiliate-disclosure',
        content_type: 'legal',
        path: '/affiliate-disclosure',
      },
    });
  });
});
