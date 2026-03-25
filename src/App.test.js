import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import App from './App';

// Mock workbox-window (used for service worker updates)
jest.mock('workbox-window', () => ({
  Workbox: jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn(),
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

// Mock TelemetryService
jest.mock('./TelemetryService', () => ({
  getAppInsights: jest.fn(() => null),
  ai: { reactPlugin: { getCookieMgr: () => ({ set: jest.fn() }) } },
}));

// Mock telemetry-provider to be a passthrough
jest.mock('./telemetry-provider', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) =>
      React.createElement(React.Fragment, null, children),
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
