/**
 * TelemetryProvider component tests
 *
 * Tests the provider component with mocked SDK dependencies.
 * The provider wraps the app, initializes App Insights, and calls
 * the after() callback so App can access the SDK instance.
 *
 * Tests marked "validates Px #N fix" assert CORRECT post-fix behavior.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom (withRouter as passthrough so we control history prop)
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  withRouter: (component) => component,
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

const mockHistory = { listen: jest.fn(), push: jest.fn() };

describe('TelemetryProvider', () => {
  beforeEach(() => {
    TelemetryService.initialize.mockClear();
    TelemetryService.getAppInsights.mockClear();
    TelemetryService.getAppInsights.mockReturnValue(null);
  });

  it('renders children when connection string is provided', () => {
    TelemetryService.getAppInsights.mockReturnValue({ trackPageView: jest.fn() });
    render(
      <TelemetryProvider
        history={mockHistory}
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
          history={mockHistory}
          connectionString=""
          after={jest.fn()}
        >
          <div data-testid="child">Hello</div>
        </TelemetryProvider>
      );
    }).not.toThrow();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls initialize() when connection string and history are available', () => {
    TelemetryService.getAppInsights.mockReturnValue({ trackPageView: jest.fn() });
    render(
      <TelemetryProvider
        history={mockHistory}
        connectionString="InstrumentationKey=test"
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );
    expect(TelemetryService.initialize).toHaveBeenCalledWith(
      'InstrumentationKey=test',
      mockHistory
    );
  });

  it('does NOT call initialize() when connection string is missing', () => {
    render(
      <TelemetryProvider
        history={mockHistory}
        connectionString=""
        after={jest.fn()}
      >
        <div>child</div>
      </TelemetryProvider>
    );
    expect(TelemetryService.initialize).not.toHaveBeenCalled();
  });

  it('does NOT call initialize() when history prop is missing', () => {
    const afterFn = jest.fn();
    render(
      <TelemetryProvider
        connectionString="InstrumentationKey=test"
        after={afterFn}
      >
        <div>child</div>
      </TelemetryProvider>
    );
    expect(TelemetryService.initialize).not.toHaveBeenCalled();
    expect(afterFn).not.toHaveBeenCalled();
  });

  // Validates P0 #4 fix: after() must not crash when init is skipped
  it('does not crash when after() is called without initialization', () => {
    const afterFn = jest.fn();
    expect(() => {
      render(
        <TelemetryProvider
          history={mockHistory}
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
        history={mockHistory}
        connectionString="InstrumentationKey=test"
        after={afterFn}
      >
        <div>child</div>
      </TelemetryProvider>
    );
    expect(afterFn).toHaveBeenCalled();
  });
});
