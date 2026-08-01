import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from './Home';
import log from 'loglevel';
import { TelemetryContext } from './TelemetryContext';
import { MemoryRouter } from 'react-router-dom';

log.setLevel('silent');

// Mock react-ga4
vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

// Capture analyzer event handlers so tests can trigger BPM events
// Variables prefixed with `mock` are allowed inside vi.mock() factories
let mockAnalyzerHandlers = {};
let mockAnalyzer = null;
vi.mock('realtime-bpm-analyzer', () => ({
  createRealtimeBpmAnalyzer: vi.fn().mockImplementation(() => {
    mockAnalyzerHandlers = {};
    mockAnalyzer = {
      node: { connect: vi.fn() },
      on: vi.fn((event, handler) => {
        mockAnalyzerHandlers[event] = handler;
      }),
      reset: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
    return Promise.resolve(mockAnalyzer);
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

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Home', () => {
  beforeEach(() => {
    mockAnalyzerHandlers = {};
    // mockReset clears vi.fn() implementations between tests.
    // Re-apply the analyzer mock (same pattern as getUserMedia in setupTests.js).
    createRealtimeBpmAnalyzer.mockImplementation(() => {
      mockAnalyzerHandlers = {};
      mockAnalyzer = {
        node: { connect: vi.fn() },
        on: vi.fn((event, handler) => {
          mockAnalyzerHandlers[event] = handler;
        }),
        reset: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
      return Promise.resolve(mockAnalyzer);
    });
  });

  it('renders "Start listening" button initially', () => {
    renderWithRouter(<Home {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /Start listening/i })
    ).toBeInTheDocument();
  });

  it('shows mic access info text', () => {
    renderWithRouter(<Home {...defaultProps} />);
    expect(
      screen.getByText(/microphone permission is requested/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no audio is sent to any server/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Browse studio headphones/i })
    ).toBeInTheDocument();
  });

  it('clicking "Start listening" calls getUserMedia', async () => {
    navigator.mediaDevices.getUserMedia.mockClear();

    renderWithRouter(<Home {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      });
    });
  });

  it('ignores a second start while microphone setup is pending', async () => {
    let resolveStream;
    navigator.mediaDevices.getUserMedia.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStream = resolve;
      })
    );

    renderWithRouter(<Home {...defaultProps} />);
    const startButton = screen.getByRole('button', {
      name: /Start listening/i,
    });

    act(() => {
      startButton.click();
      startButton.click();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();

    await act(async () => {
      resolveStream({
        getTracks: () => [{ stop: vi.fn() }],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Listening. Wait...')).toBeInTheDocument();
    });
  });

  it('pre-populates BPM state when testBPM prop is provided', () => {
    renderWithRouter(<Home {...defaultProps} testBPM="120" />);

    expect(
      screen.getByRole('button', { name: /Start listening/i })
    ).toBeInTheDocument();
  });

  it('shows "Listening. Wait..." after clicking Start before BPM detected', async () => {
    renderWithRouter(<Home {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(screen.getByText('Listening. Wait...')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Start over/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Browse DJ controllers/i })
    ).not.toBeInTheDocument();
  });

  it('displays interim BPM while waiting for stable result', async () => {
    renderWithRouter(<Home {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(mockAnalyzerHandlers.bpm).toBeDefined();
    });

    act(() => {
      mockAnalyzerHandlers.bpm({
        bpm: [{ tempo: 125 }],
        threshold: 0.4,
      });
    });

    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText('Listening. Wait...')).toBeInTheDocument();
    expect(screen.queryByText('BPM')).not.toBeInTheDocument();
  });

  it('displays detected BPM when analyzer fires bpmStable event', async () => {
    renderWithRouter(<Home {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(mockAnalyzerHandlers.bpmStable).toBeDefined();
    });

    act(() => {
      mockAnalyzerHandlers.bpmStable({
        bpm: [{ tempo: 128 }, { tempo: 64 }],
        threshold: 0.85,
      });
    });

    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Browse DJ controllers/i })
    ).toBeInTheDocument();
  });

  it('handles getUserMedia rejection gracefully', async () => {
    const mockLog = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const mockTrackException = vi.fn();
    const mockAppInsights = { trackEvent: vi.fn(), trackException: mockTrackException };

    navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(
      new Error('Permission denied')
    );

    renderWithRouter(
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

  it('stops microphone capture and the analyzer on unmount', async () => {
    const stopTrack = vi.fn();
    navigator.mediaDevices.getUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: stopTrack }],
    });

    const { unmount } = renderWithRouter(<Home {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Start listening/i }));

    await waitFor(() => {
      expect(screen.getByText('Listening. Wait...')).toBeInTheDocument();
    });

    unmount();

    expect(stopTrack).toHaveBeenCalledOnce();
    expect(mockAnalyzer.stop).toHaveBeenCalledOnce();
    expect(mockAnalyzer.disconnect).toHaveBeenCalledOnce();
  });

  it('tracks detect event via TelemetryContext on mount', async () => {
    const mockAppInsights = { trackEvent: vi.fn(), trackException: vi.fn() };

    renderWithRouter(
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
    renderWithRouter(<Home {...defaultProps} isMobile={true} />);
    expect(screen.queryByTestId('react-tooltip')).not.toBeInTheDocument();
  });

  it('renders tooltip on desktop', () => {
    renderWithRouter(<Home {...defaultProps} isMobile={false} />);
    expect(screen.getByTestId('react-tooltip')).toBeInTheDocument();
  });
});
