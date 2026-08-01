import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ReactGA from 'react-ga4';
import AffiliateCard from './AffiliateCard';
import { TelemetryContext } from './TelemetryContext';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

const mockAppInsights = {
  trackEvent: vi.fn(),
};

let intersectionCallback;

beforeEach(() => {
  vi.useFakeTimers();
  intersectionCallback = null;
  mockAppInsights.trackEvent.mockClear();
  ReactGA.event.mockClear();

  window.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
    intersectionCallback = callback;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
  });
});

afterEach(() => {
  vi.useRealTimers();
  delete window.IntersectionObserver;
});

function renderCard() {
  return render(
    <TelemetryContext.Provider value={mockAppInsights}>
      <AffiliateCard
        campaignId="studio-headphones"
        placement="home_initial"
      />
    </TelemetryContext.Provider>
  );
}

describe('AffiliateCard', () => {
  it('renders a contextual recommendation with required disclosure', () => {
    renderCard();

    expect(screen.getByText('Affiliate recommendation')).toBeInTheDocument();
    expect(screen.getByText('Hear the beat clearly')).toBeInTheDocument();
    expect(
      screen.getByText(/As an Amazon Associate I earn from qualifying purchases/i)
    ).toBeInTheDocument();

    const affiliateLink = screen.getByRole('link', {
      name: /Browse studio headphones/i,
    });
    expect(affiliateLink).toHaveAttribute(
      'href',
      expect.stringContaining('tag=webapplication-20')
    );
    expect(affiliateLink).toHaveAttribute(
      'rel',
      'sponsored noopener noreferrer'
    );
  });

  it('tracks a stable impression event', () => {
    renderCard();

    const properties = expect.objectContaining({
      campaign_id: 'amazon-studio-headphones',
      creative_id: 'studio-headphones-v1',
      placement: 'home_initial',
    });

    expect(ReactGA.event).toHaveBeenCalledWith(
      'affiliate_impression',
      properties
    );
    expect(mockAppInsights.trackEvent).toHaveBeenCalledWith({
      name: 'affiliate_impression',
      properties,
    });
  });

  it('tracks viewability after half the card is visible for one second', () => {
    renderCard();

    act(() => {
      intersectionCallback([
        {
          isIntersecting: true,
          intersectionRatio: 0.75,
        },
      ]);
      vi.advanceTimersByTime(1000);
    });

    expect(ReactGA.event).toHaveBeenCalledWith(
      'affiliate_viewable',
      expect.objectContaining({
        campaign_id: 'amazon-studio-headphones',
        placement: 'home_initial',
      })
    );
  });

  it('tracks outbound clicks without relying on randomized copy', () => {
    renderCard();

    fireEvent.click(
      screen.getByRole('link', { name: /Browse studio headphones/i })
    );

    expect(ReactGA.event).toHaveBeenCalledWith(
      'affiliate_click',
      expect.objectContaining({
        campaign_id: 'amazon-studio-headphones',
        placement: 'home_initial',
      })
    );
    expect(mockAppInsights.trackEvent).toHaveBeenCalledWith({
      name: 'affiliate_click',
      properties: expect.objectContaining({
        campaign_id: 'amazon-studio-headphones',
        placement: 'home_initial',
      }),
    });
  });

  it('does not crash when Application Insights is unavailable', () => {
    expect(() => {
      render(
        <TelemetryContext.Provider value={null}>
          <AffiliateCard
            campaignId="dj-controllers"
            placement="home_result"
          />
        </TelemetryContext.Provider>
      );
    }).not.toThrow();
  });
});
