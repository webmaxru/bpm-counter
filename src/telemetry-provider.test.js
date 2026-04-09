/**
 * TelemetryProvider component tests
 *
 * Tests the functional provider component that uses useLocation() hook
 * for page view tracking (React Router v7). Mocks useLocation and TelemetryService.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(() => ({ pathname: '/', search: '', hash: '' })),
}));

jest.mock('./TelemetryService', () => ({
  initialize: jest.fn(),
  reactPlugin: { identifier: 'ReactPlugin' },
  getAppInsights: jest.fn(() => null),
}));

// Import AFTER mocks (jest.mock is hoisted)
import TelemetryProvider from './telemetry-provider';

// Get mock references after module resolution
const TelemetryService = require('./TelemetryService');
const { useLocation: mockUseLocation } = require('react-router-dom');

describe('TelemetryProvider', () => {
  beforeEach(() => {
    TelemetryService.initialize.mockClear();
    TelemetryService.getAppInsights.mockClear();
    TelemetryService.getAppInsights.mockReturnValue(null);
    mockUseLocation.mockReturnValue({ pathname: '/', search: '', hash: '' });
  });

  it('renders children when connection string is provided', () => {
    TelemetryService.getAppInsights.mockReturnValue({ trackPageView: jest.fn() });
    render(
      <TelemetryProvider
        connectionString="InstrumentationKey=test"
        after={jest.fn()}
      >
        <div data-testid="child">Hello</div>
      </TelemetryProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  // Validates P0 #4 fix: must not crash when connectionString is absent
  it('renders children when connection string is missing (no crash)', () => {
    expect(() => {
      render(
        <TelemetryProvider
          connectionString=""
          after={jest.fn()}
        >
          <div data-testid="child">Hello</div>
        </TelemetryProvider>
      );
    }).not.toThrow();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls initialize() with connection string only (no history)', () => {
    TelemetryService.getAppInsights.mockReturnValue({ trackPageView: jest.fn() });
    render(
      <TelemetryProvider
        connectionString="InstrumentationKey=test"
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );
    expect(TelemetryService.initialize).toHaveBeenCalledWith(
      'InstrumentationKey=test'
    );
  });

  it('does NOT call initialize() when connection string is missing', () => {
    render(
      <TelemetryProvider
        connectionString=""
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );
    expect(TelemetryService.initialize).not.toHaveBeenCalled();
  });

  // Validates P0 #4 fix: after() must not crash when init is skipped
  it('does not crash when after() is called without initialization', () => {
    const afterFn = jest.fn();
    expect(() => {
      render(
        <TelemetryProvider
          connectionString=""
          after={afterFn}
        >
          <div>child</div>
        </TelemetryProvider>
      );
    }).not.toThrow();
    // after() should NOT be called when init is skipped (getAppInsights returns null)
    expect(afterFn).not.toHaveBeenCalled();
  });

  // Validates P0 #4 fix: after() IS called when init succeeds
  it('calls after() when initialization succeeds', () => {
    const afterFn = jest.fn();
    TelemetryService.getAppInsights.mockReturnValue({ trackPageView: jest.fn() });
    render(
      <TelemetryProvider
        connectionString="InstrumentationKey=test"
        after={afterFn}
      >
        <div>child</div>
      </TelemetryProvider>
    );
    expect(afterFn).toHaveBeenCalled();
  });

  it('tracks page view on location change', () => {
    const mockAI = { trackPageView: jest.fn() };
    TelemetryService.getAppInsights.mockReturnValue(mockAI);

    const { rerender } = render(
      <TelemetryProvider
        connectionString="InstrumentationKey=test"
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );

    // Change location and rerender
    mockUseLocation.mockReturnValue({ pathname: '/about', search: '', hash: '' });
    rerender(
      <TelemetryProvider
        connectionString="InstrumentationKey=test"
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );

    expect(mockAI.trackPageView).toHaveBeenCalledWith(
      expect.objectContaining({ uri: '/about' })
    );
  });

  it('includes search and hash in page view URI', () => {
    const mockAI = { trackPageView: jest.fn() };
    TelemetryService.getAppInsights.mockReturnValue(mockAI);
    mockUseLocation.mockReturnValue({ pathname: '/', search: '?q=test', hash: '#section' });

    render(
      <TelemetryProvider
        connectionString="InstrumentationKey=test"
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );

    expect(mockAI.trackPageView).toHaveBeenCalledWith(
      expect.objectContaining({ uri: '/?q=test#section' })
    );
  });

  it('does not track page view when not initialized', () => {
    // getAppInsights returns null (not initialized)
    TelemetryService.getAppInsights.mockReturnValue(null);

    render(
      <TelemetryProvider
        connectionString=""
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );

    // No trackPageView should be called since AI is null
    // (No error thrown either — optional chaining handles it)
  });

  // Graceful degradation: initialize() throwing doesn't crash the app
  it('renders children even when initialize() throws', () => {
    TelemetryService.initialize.mockImplementation(() => {
      throw new Error('Bad connection string');
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => {
      render(
        <TelemetryProvider
          connectionString="InstrumentationKey=bad"
          after={jest.fn()}
        >
          <div data-testid="child">Hello</div>
        </TelemetryProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('child')).toBeInTheDocument();
    warnSpy.mockRestore();
  });

  it('logs warning when initialize() throws', () => {
    TelemetryService.initialize.mockImplementation(() => {
      throw new Error('Bad connection string');
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <TelemetryProvider
        connectionString="InstrumentationKey=bad"
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to initialize App Insights'),
      'Bad connection string'
    );
    warnSpy.mockRestore();
  });

  it('does not call after() when initialize() throws', () => {
    TelemetryService.initialize.mockImplementation(() => {
      throw new Error('Bad connection string');
    });
    const afterFn = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <TelemetryProvider
        connectionString="InstrumentationKey=bad"
        after={afterFn}
      >
        <div>child</div>
      </TelemetryProvider>
    );

    expect(afterFn).not.toHaveBeenCalled();
    console.warn.mockRestore();
  });
});
