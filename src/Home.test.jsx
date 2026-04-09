import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from './Home';
import log from 'loglevel';
import { TelemetryContext } from './TelemetryContext';

log.setLevel('silent');

// Mock react-ga4
vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

// Capture analyzer event handlers so tests can trigger BPM events
// Variables prefixed with `mock` are allowed inside vi.mock() factories
let mockAnalyzerHandlers = {};
vi.mock('realtime-bpm-analyzer', () => ({
  createRealtimeBpmAnalyzer: vi.fn().mockImplementation(() => {
    mockAnalyzerHandlers = {};
    return Promise.resolve({
      node: { connect: vi.fn() },
      on: vi.fn((event, handler) => {
        mockAnalyzerHandlers[event] = handler;
      }),
      reset: vi.fn(),
    });
  }),
}));

// Mock audiomotion-analyzer
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

// Mock react-tooltip
vi.mock('react-tooltip', async () => {
  const React = await vi.importActual('react');
  return {
    Tooltip: (props) => React.createElement('div', { 'data-testid': 'react-tooltip', 'data-tooltip-id': props.id }),
  };
});

import { createRealtimeBpmAnalyzer } from 'realtime-bpm-analyzer';

const defaultProps = {
  log,
  isMobile: true,
  isForcedViz: false,
  testBPM: null,
  appInsights: null,
  isDebug: false,
};

describe('Home', () => {
  beforeEach(() => {
    mockAnalyzerHandlers = {};
    // mockReset clears vi.fn() implementations between tests.
    // Re-apply the analyzer mock (same pattern as getUserMedia in setupTests.js).
    createRealtimeBpmAnalyzer.mockImplementation(() => {
      mockAnalyzerHandlers = {};
      return Promise.resolve({
        node: { connect: vi.fn() },
        on: vi.fn((event, handler) => {
          mockAnalyzerHandlers[event] = handler;
        }),
        reset: vi.fn(),
      });
    });
  });

  it('renders "Start listening" button initially', () => {
    render(<Home {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /Start listening/i })
    ).toBeInTheDocument();
  });

  it('shows mic access info text', () => {
    render(<Home {...defaultProps} />);
    expect(
      screen.getByText(/provide access to your microphone/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not send any audio stream data/i)
    ).toBeInTheDocument();
  });

  it('clicking "Start listening" calls getUserMedia', async () => {
    navigator.mediaDevices.getUserMedia.mockClear();

    render(<Home {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      });
    });
  });

  it('pre-populates BPM state when testBPM prop is provided', () => {
    render(<Home {...defaultProps} testBPM="120" />);

    expect(
      screen.getByRole('button', { name: /Start listening/i })
    ).toBeInTheDocument();
  });

  it('shows "Listening..." after clicking Start before BPM detected', async () => {
    render(<Home {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Start over/i })).toBeInTheDocument();
  });

  it('displays detected BPM when analyzer fires bpm event', async () => {
    render(<Home {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(mockAnalyzerHandlers.bpm).toBeDefined();
    });

    act(() => {
      mockAnalyzerHandlers.bpm({
        bpm: [{ tempo: 128 }, { tempo: 64 }],
        threshold: 0.85,
      });
    });

    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
  });

  it('handles getUserMedia rejection gracefully', async () => {
    const mockLog = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const mockTrackException = vi.fn();
    const mockAppInsights = { trackEvent: vi.fn(), trackException: mockTrackException };

    navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(
      new Error('Permission denied')
    );

    render(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Home {...defaultProps} log={mockLog} />
      </TelemetryContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
    });

    expect(mockTrackException).toHaveBeenCalledWith({
      exception: expect.any(Error),
    });
  });

  it('tracks detect event via TelemetryContext on mount', async () => {
    const mockAppInsights = { trackEvent: vi.fn(), trackException: vi.fn() };

    render(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Home {...defaultProps} />
      </TelemetryContext.Provider>
    );

    await waitFor(() => {
      expect(mockAppInsights.trackEvent).toHaveBeenCalledWith({
        name: 'detect',
        properties: { mode: 'realtime', bpm: null, threshold: null },
      });
    });
  });

  it('does not render tooltip on mobile', () => {
    render(<Home {...defaultProps} isMobile={true} />);
    expect(screen.queryByTestId('react-tooltip')).not.toBeInTheDocument();
  });

  it('renders tooltip on desktop', () => {
    render(<Home {...defaultProps} isMobile={false} />);
    expect(screen.getByTestId('react-tooltip')).toBeInTheDocument();
  });
});
