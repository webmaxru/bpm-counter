import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Feedback from './Feedback';
import log from 'loglevel';
import { TelemetryContext } from './TelemetryContext';

log.setLevel('silent');

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));

// Mock react-tooltip
jest.mock('react-tooltip', () => {
  const React = require('react');
  return {
    Tooltip: (props) => React.createElement('div', { 'data-testid': 'react-tooltip' }),
  };
});

const defaultProps = {
  bpm: '120',
  log,
  type: 'mic',
};

describe('Feedback', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true })
    );
  });

  afterEach(() => {
    global.fetch.mockRestore?.();
  });

  it('renders thumbs up and thumbs down buttons', () => {
    render(<Feedback {...defaultProps} />);
    expect(screen.getByText('👍🏽')).toBeInTheDocument();
    expect(screen.getByText('👎🏽')).toBeInTheDocument();
  });

  it('shows question about BPM correctness', () => {
    render(<Feedback {...defaultProps} />);
    expect(screen.getByText(/Does 120 sound correct/)).toBeInTheDocument();
  });

  it('clicking thumbs up sends POST to /api/feedback with isCorrect=true', async () => {
    render(<Feedback {...defaultProps} />);

    fireEvent.click(screen.getByText('👍🏽'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/feedback',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody).toEqual({
      bpm: '120',
      type: 'mic',
      isCorrect: true,
    });
  });

  it('clicking thumbs down sends POST to /api/feedback with isCorrect=false', async () => {
    render(<Feedback {...defaultProps} />);

    fireEvent.click(screen.getByText('👎🏽'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/feedback',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody).toEqual({
      bpm: '120',
      type: 'mic',
      isCorrect: false,
    });
  });

  it('tracks feedback event via TelemetryContext on successful send', async () => {
    const mockAppInsights = { trackEvent: jest.fn(), trackException: jest.fn() };

    render(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Feedback {...defaultProps} />
      </TelemetryContext.Provider>
    );

    fireEvent.click(screen.getByText('👍🏽'));

    await waitFor(() => {
      expect(mockAppInsights.trackEvent).toHaveBeenCalledWith({
        name: 'share',
        properties: {
          method: 'API',
          content_type: 'feedback',
          item_id: true,
        },
      });
    });
  });

  it('tracks exception via TelemetryContext when fetch throws', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    const mockAppInsights = { trackEvent: jest.fn(), trackException: jest.fn() };

    render(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Feedback {...defaultProps} />
      </TelemetryContext.Provider>
    );

    fireEvent.click(screen.getByText('👍🏽'));

    await waitFor(() => {
      expect(mockAppInsights.trackException).toHaveBeenCalledWith({
        exception: expect.any(Error),
      });
    });
  });

  it('tracks exception when HTTP response is not ok', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500 })
    );
    const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
    const mockAppInsights = { trackEvent: jest.fn(), trackException: jest.fn() };

    render(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Feedback {...defaultProps} log={mockLog} />
      </TelemetryContext.Provider>
    );

    fireEvent.click(screen.getByText('👍🏽'));

    await waitFor(() => {
      expect(mockAppInsights.trackException).toHaveBeenCalledWith({
        exception: expect.any(Error),
      });
    });

    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining('HTTP error')
    );
  });

  it('does not crash when TelemetryContext is null', async () => {
    render(
      <TelemetryContext.Provider value={null}>
        <Feedback {...defaultProps} />
      </TelemetryContext.Provider>
    );

    fireEvent.click(screen.getByText('👍🏽'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
