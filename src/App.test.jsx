import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { act } from 'react';
import App from './App';

// --- Shared mock objects (prefix with "mock" so Jest hoists them) ---
const mockTelemetryAppInsights = {
  trackPageView: vi.fn(),
  trackEvent: vi.fn(),
  trackException: vi.fn(),
  trackMetric: vi.fn(),
};

// Capture Workbox event handlers for SW message tests
const mockWbEventHandlers = {};

// Mock workbox-window with handler capture
vi.mock('workbox-window', () => ({
  Workbox: vi.fn().mockImplementation(function() { return {
    addEventListener: vi.fn((event, handler) => {
      if (!mockWbEventHandlers[event]) mockWbEventHandlers[event] = [];
      mockWbEventHandlers[event].push(handler);
    }),
    register: vi.fn().mockResolvedValue({}),
    messageSkipWaiting: vi.fn(),
  }; }),
}));

// Mock react-ga4
vi.mock('react-ga4', () => ({
  default: {
    event: vi.fn(),
    initialize: vi.fn(),
    send: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock react-toastify to capture toast calls
vi.mock('react-toastify', async () => {
  const React = await vi.importActual('react');
  return {
    toast: Object.assign(vi.fn(), {
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }),
    ToastContainer: () => React.createElement('div'),
  };
});

// Mock applicationinsights-react-js (AppInsightsErrorBoundary, withAITracking)
vi.mock('@microsoft/applicationinsights-react-js', async () => {
  const React = await vi.importActual('react');
  return {
    withAITracking: (_plugin, component) => component,
    AppInsightsErrorBoundary: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    ReactPlugin: vi.fn().mockImplementation(function() { return {
      identifier: 'ReactPlugin',
    }; }),
  };
});

// Mock TelemetryService — getAppInsights returns a usable mock
vi.mock('./TelemetryService', () => ({
  getAppInsights: vi.fn(() => mockTelemetryAppInsights),
  initialize: vi.fn(),
  reactPlugin: { getCookieMgr: () => ({ set: vi.fn() }) },
}));

// Mock telemetry-provider: calls after() in useEffect (like real component)
vi.mock('./telemetry-provider', async () => {
  const React = await vi.importActual('react');
  return {
    __esModule: true,
    default: function MockTelemetryProvider({ children, after }) {
      React.useEffect(() => {
        if (after) after();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return React.createElement(React.Fragment, null, children);
    },
  };
});

// Mock realtime-bpm-analyzer (used by Home)
vi.mock('realtime-bpm-analyzer', () => ({
  createRealtimeBpmAnalyzer: vi.fn().mockResolvedValue({
    node: { connect: vi.fn() },
    on: vi.fn(),
    reset: vi.fn(),
  }),
}));

// Mock audiomotion-analyzer (used by Home)
vi.mock('audiomotion-analyzer', () => ({
  default: vi.fn().mockImplementation(function() { return {
    registerGradient: vi.fn(),
    setOptions: vi.fn(),
    setLedParams: vi.fn(),
    audioCtx: {
      createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
    },
    connectInput: vi.fn(),
    volume: 0,
  }; }),
}));

// Mock react-tooltip (used by Home and Feedback)
vi.mock('react-tooltip', async () => {
  const React = await vi.importActual('react');
  return {
    Tooltip: (props) => React.createElement('div', { 'data-testid': 'react-tooltip' }),
  };
});

// Mock bpm-detective (used by Upload)
vi.mock('bpm-detective', () => ({ default: vi.fn(() => 120) }));

// Mock react-device-detect
vi.mock('react-device-detect', () => ({
  isMobile: false,
}));

// Re-import mocked modules for beforeEach re-application
import * as TelemetryService from './TelemetryService';
import * as workboxWindow from 'workbox-window';
import { toast } from 'react-toastify';

beforeEach(() => {
  // Re-apply mock implementations cleared by CRA's resetMocks
  TelemetryService.getAppInsights.mockReturnValue(mockTelemetryAppInsights);
  workboxWindow.Workbox.mockImplementation(function() { return {
    addEventListener: vi.fn((event, handler) => {
      if (!mockWbEventHandlers[event]) mockWbEventHandlers[event] = [];
      mockWbEventHandlers[event].push(handler);
    }),
    register: vi.fn().mockResolvedValue({}),
    messageSkipWaiting: vi.fn(),
  }; });

  // Clear captured handlers
  for (const key in mockWbEventHandlers) delete mockWbEventHandlers[key];
});

afterEach(() => {
  cleanup();
  window.history.pushState({}, '', '/');
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('displays the header with title', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /BPM Techno.*Free.*Offline.*BPM tools for DJs/i,
      })
    ).toBeInTheDocument();
  });

  it('links to the audience-focused about page from the footer', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
  });

  it('has footer with author credit', () => {
    render(<App />);
    expect(screen.getByText(/Maxim Salnikov/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Affiliate disclosure/i })
    ).toHaveAttribute('href', '/affiliate-disclosure');
  });

  it('shows Home component on / route', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /Start listening/i })
    ).toBeInTheDocument();
  });

  it('shows the DJ-focused publishing page on /about', () => {
    window.history.pushState({}, '', '/about');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'About BPM Techno' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Built around real DJ decisions/i)).toBeInTheDocument();
    expect(document.title).toBe(
      'About BPM Techno | Practical BPM Tools for DJs'
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://bpmtech.no/about'
    );
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow'
    );
  });

  it('shows Upload component on /upload route', () => {
    window.history.pushState({}, '', '/upload');
    render(<App />);
    expect(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    ).toBeInTheDocument();
  });

  it('shows affiliate disclosure on /affiliate-disclosure route', () => {
    window.history.pushState({}, '', '/affiliate-disclosure');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Affiliate disclosure/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/As an Amazon Associate I earn from qualifying purchases/i)
    ).toBeInTheDocument();
  });

  it('shows the tap tempo tool on /tools/tap-tempo', () => {
    window.history.pushState({}, '', '/tools/tap-tempo');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Tap tempo BPM counter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Tap beat/i })
    ).toBeInTheDocument();
  });

  it('shows a publishing guide on /guides/beatmatching', () => {
    window.history.pushState({}, '', '/guides/beatmatching');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Beatmatching guide for beginners/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Identify and correct drift/i)).toBeInTheDocument();
  });

  it('shows the accurate privacy page on /privacy', () => {
    window.history.pushState({}, '', '/privacy');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Privacy policy/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not upload or store the microphone stream/i)
    ).toBeInTheDocument();
  });

  it('redirects the legacy privacy URL to the canonical route', async () => {
    window.history.pushState({}, '', '/privacy.html');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/privacy');
    });
    expect(
      screen.getByRole('heading', { name: /Privacy policy/i })
    ).toBeInTheDocument();
  });

  it('marks unknown guide routes as noindex', () => {
    window.history.pushState({}, '', '/guides/not-a-real-guide');
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /Page not found/i })
    ).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow'
    );
  });
});

describe('App — telemetry integration', () => {
  // Validates P0 #2 fix: ReactPlugin auto-tracks pageviews; manual
  // trackPageView() in after() creates duplicates.
  // Post-fix: after() should NOT call trackPageView() manually.
  it('does NOT manually call trackPageView() on mount', () => {
    render(<App />);

    // Post-fix: after() no longer calls trackPageView()
    // Pre-fix: after() calls appInsightsInstance.trackPageView() — this test
    // will fail on pre-fix code, which is expected
    expect(mockTelemetryAppInsights.trackPageView).not.toHaveBeenCalled();
  });

  it('renders without crash when telemetry is unavailable', () => {
    // Simulate telemetry being unavailable
    TelemetryService.getAppInsights.mockReturnValue(null);

    expect(() => {
      render(<App />);
    }).not.toThrow();
  });
});

describe('App — service worker telemetry', () => {
  // Enable serviceWorker for these tests (jsdom doesn't have it)
  const originalServiceWorker = navigator.serviceWorker;

  beforeEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { addEventListener: vi.fn() },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
      writable: true,
    });
  });

  // Validates P1 #11 fix: SW events should be tracked in App Insights
  it('SW message handler tracks REPLAY_COMPLETED event', async () => {
    await act(async () => {
      render(<App />);
    });

    const messageHandlers = mockWbEventHandlers['message'] || [];
    expect(messageHandlers.length).toBeGreaterThan(0);

    act(() => {
      messageHandlers.forEach((h) =>
        h({ data: { type: 'REPLAY_COMPLETED' } })
      );
    });

    expect(mockTelemetryAppInsights.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sw_replay_completed',
      })
    );

    expect(toast.success).toHaveBeenCalledWith(
      'Your feedback was sent after the connection is restored'
    );
  });

  // Validates P1 #11 fix: SW events should be tracked in App Insights
  it('SW message handler tracks REQUEST_FAILED event', async () => {
    await act(async () => {
      render(<App />);
    });

    const messageHandlers = mockWbEventHandlers['message'] || [];
    expect(messageHandlers.length).toBeGreaterThan(0);

    act(() => {
      messageHandlers.forEach((h) =>
        h({ data: { type: 'REQUEST_FAILED' } })
      );
    });

    expect(mockTelemetryAppInsights.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sw_request_failed',
      })
    );

    expect(toast.warning).toHaveBeenCalledWith(
      'Your feedback will be sent after the connection is restored'
    );
  });
});
