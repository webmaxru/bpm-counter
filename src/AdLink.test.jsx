import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdLink from './AdLink';
import { TelemetryContext } from './TelemetryContext';

// Mock react-ga4
vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

const mockAppInsights = {
  trackEvent: vi.fn(),
};

beforeEach(() => {
  // Fix Math.random for deterministic ad text selection
  vi.spyOn(Math, 'random').mockReturnValue(0);
  mockAppInsights.trackEvent.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdLink', () => {
  it('renders a link for "item-music-prod" ad', () => {
    render(<AdLink ad="item-music-prod" />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('amazon.com')
    );
  });

  it('renders a link for "item-sample-pack" ad', () => {
    render(<AdLink ad="item-sample-pack" />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('amazon.com')
    );
  });

  it('renders a link for "search-dj-controllers" ad', () => {
    render(<AdLink ad="search-dj-controllers" />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('amazon.com')
    );
  });

  it('link text is not empty', () => {
    render(<AdLink ad="item-music-prod" />);
    const link = screen.getByRole('link');
    expect(link.textContent.length).toBeGreaterThan(0);
  });
});

describe('AdLink — telemetry', () => {
  // Validates P2 #14 fix: AdLink should NOT call console.log
  // Pre-fix: line 7 has console.log(appInsights)
  it('does NOT call console.log', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

    render(
      <TelemetryContext.Provider value={mockAppInsights}>
        <AdLink ad="item-music-prod" />
      </TelemetryContext.Provider>
    );

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('click handler calls trackEvent with ad and text properties', () => {
    render(
      <TelemetryContext.Provider value={mockAppInsights}>
        <AdLink ad="item-music-prod" />
      </TelemetryContext.Provider>
    );
    const link = screen.getByRole('link');
    const linkText = link.textContent;

    fireEvent.click(link);

    expect(mockAppInsights.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'click_ad',
        properties: expect.objectContaining({
          ad: 'item-music-prod',
          text: linkText,
        }),
      })
    );
  });

  it('click handler does not crash when appInsights is null', () => {
    expect(() => {
      render(
        <TelemetryContext.Provider value={null}>
          <AdLink ad="item-music-prod" />
        </TelemetryContext.Provider>
      );
      const link = screen.getByRole('link');
      fireEvent.click(link);
    }).not.toThrow();
  });
});
