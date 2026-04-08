import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import App from './App';

// --- Shared mock objects (prefix with "mock" so Jest hoists them) ---
const mockTelemetryAppInsights = {
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  trackException: jest.fn(),
  trackMetric: jest.fn(),
};

// Capture Workbox event handlers for SW message tests
const mockWbEventHandlers = {};

// Mock workbox-window with handler capture
jest.mock('workbox-window', () => ({
  Workbox: jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn((event, handler) => {
      if (!mockWbEventHandlers[event]) mockWbEventHandlers[event] = [];
      mockWbEventHandlers[event].push(handler);
    }),
    register: jest.fn().mockResolvedValue({}),
    messageSkipWaiting: jest.fn(),
  })),
}));

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));

// Mock applicationinsights-react-js (AppInsightsErrorBoundary, withAITracking)
jest.mock('@microsoft/applicationinsights-react-js', () => {
  const React = require('react');
  return {
    withAITracking: (_plugin, component) => component,
    AppInsightsErrorBoundary: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    ReactPlugin: jest.fn().mockImplementation(() => ({
      identifier: 'ReactPlugin',
    })),
  };
});

// Mock TelemetryService — getAppInsights returns a usable mock
jest.mock('./TelemetryService', () => ({
  getAppInsights: jest.fn(() => mockTelemetryAppInsights),
  initialize: jest.fn(),
  reactPlugin: { getCookieMgr: () => ({ set: jest.fn() }) },
}));

// Mock telemetry-provider: calls after() in useEffect (like real component)
jest.mock('./telemetry-provider', () => {
  const React = require('react');
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
jest.mock('realtime-bpm-analyzer', () => ({
  createRealtimeBpmAnalyzer: jest.fn().mockResolvedValue({
    node: { connect: jest.fn() },
    on: jest.fn(),
    reset: jest.fn(),
  }),
}));

// Mock audiomotion-analyzer (used by Home)
jest.mock('audiomotion-analyzer', () =>
  jest.fn().mockImplementation(() => ({
    registerGradient: jest.fn(),
    setOptions: jest.fn(),
    setLedParams: jest.fn(),
    audioCtx: {
      createMediaStreamSource: jest.fn(() => ({ connect: jest.fn() })),
    },
    connectInput: jest.fn(),
    volume: 0,
  }))
);

// Mock react-hint factory (used by Home and Feedback)
jest.mock('react-hint', () => {
  const React = require('react');
  return () =>
    class MockReactHint extends React.Component {
      toggleHint = jest.fn();
      render() {
        return React.createElement('div', { 'data-testid': 'react-hint' });
      }
    };
});

// Mock bpm-detective (used by Upload)
jest.mock('bpm-detective', () => jest.fn(() => 120));

// Mock react-device-detect
jest.mock('react-device-detect', () => ({
  isMobile: false,
}));

// Re-import mocked module for beforeEach re-application
const TelemetryService = require('./TelemetryService');
const workboxWindow = require('workbox-window');

beforeEach(() => {
  // Re-apply mock implementations cleared by CRA's resetMocks
  TelemetryService.getAppInsights.mockReturnValue(mockTelemetryAppInsights);
  workboxWindow.Workbox.mockImplementation(() => ({
    addEventListener: jest.fn((event, handler) => {
      if (!mockWbEventHandlers[event]) mockWbEventHandlers[event] = [];
      mockWbEventHandlers[event].push(handler);
    }),
    register: jest.fn().mockResolvedValue({}),
    messageSkipWaiting: jest.fn(),
  }));

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
      screen.getByRole('link', { name: /Real-Time BPM Counter/i })
    ).toBeInTheDocument();
  });

  it('has "?" link to about page', () => {
    render(<App />);
    const aboutLink = screen.getByText('?');
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink.closest('a')).toHaveAttribute('href', '/about');
  });

  it('has footer with author credit', () => {
    render(<App />);
    expect(screen.getByText(/Maxim Salnikov/)).toBeInTheDocument();
  });

  it('shows Home component on / route', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /Start listening/i })
    ).toBeInTheDocument();
  });

  it('shows About component on /about route', () => {
    window.history.pushState({}, '', '/about');
    render(<App />);
    expect(screen.getByText(/3-in-1 project/i)).toBeInTheDocument();
  });

  it('shows Upload component on /upload route', () => {
    window.history.pushState({}, '', '/upload');
    render(<App />);
    expect(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    ).toBeInTheDocument();
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
      value: { addEventListener: jest.fn() },
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
  });
});
