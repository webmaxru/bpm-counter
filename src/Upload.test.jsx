import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Upload from './Upload';
import { APP_INSIGHTS_BYPASS_FETCH } from './telemetryPrivacy';
import log from 'loglevel';
import { TelemetryContext } from './TelemetryContext';
import { MemoryRouter } from 'react-router-dom';

log.setLevel('silent');

// Mock react-ga4
vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

// Mock bpm-detective
vi.mock('bpm-detective', () => ({ default: vi.fn(() => 120) }));

// Mock applicationinsights-react-js (withAITracking used in Upload export)
vi.mock('@microsoft/applicationinsights-react-js', () => ({
  withAITracking: vi.fn((_plugin, component) => component),
  ReactPlugin: vi.fn().mockImplementation(function() { return {
    identifier: 'ReactPlugin',
  }; }),
}));

// Mock TelemetryService (Upload imports reactPlugin)
vi.mock('./TelemetryService', () => ({
  reactPlugin: { identifier: 'ReactPlugin' },
  getAppInsights: vi.fn(() => null),
  initialize: vi.fn(),
}));

// Mock react-tooltip (used by Feedback, which Upload renders)
vi.mock('react-tooltip', async () => {
  const React = await vi.importActual('react');
  return {
    Tooltip: (props) => React.createElement('div', { 'data-testid': 'react-tooltip' }),
  };
});

import detect from 'bpm-detective';

const mockAppInsights = {
  trackEvent: vi.fn(),
  trackException: vi.fn(),
  trackPageView: vi.fn(),
};

const defaultProps = {
  log,
  isDebug: false,
};

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

beforeEach(() => {
  detect.mockReturnValue(120);
  mockAppInsights.trackEvent.mockClear();
  mockAppInsights.trackException.mockClear();
});

describe('Upload', () => {
  it('renders URL input and "Fetch and calculate" button', () => {
    renderWithRouter(<Upload {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    ).toBeInTheDocument();
  });

  it('shows sample button', () => {
    renderWithRouter(<Upload {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /Use the 120 BPM sample/i })
    ).toBeInTheDocument();
  });

  it('analyzes a local audio file selected from the device', async () => {
    renderWithRouter(<Upload {...defaultProps} />);
    const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(1024));

    fireEvent.change(screen.getByLabelText(/Choose an audio file/i), {
      target: { files: [file] },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Analyze selected file/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText('120', { selector: '.tool-panel__result' })
      ).toBeInTheDocument();
    });
  });

  it('shows link back to real-time detection', () => {
    renderWithRouter(<Upload {...defaultProps} />);
    expect(
      screen.getByRole('link', { name: /real-time BPM counter/i })
    ).toBeInTheDocument();
  });

  it('filling URL input updates the value', () => {
    renderWithRouter(<Upload {...defaultProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {
      target: { value: 'https://example.com/song.mp3' },
    });
    expect(input).toHaveValue('https://example.com/song.mp3');
  });

  it('clicking the sample button fills the URL input', () => {
    renderWithRouter(<Upload {...defaultProps} />);
    fireEvent.click(
      screen.getByRole('button', { name: /Use the 120 BPM sample/i })
    );
    expect(screen.getByRole('textbox')).toHaveValue(
      '/samples/bpmtechno-120.mp3'
    );
  });
});

describe('Upload — withAITracking HOC', () => {
  // Validates P0 #1 fix: withAITracking receives a non-null reactPlugin at import time
  // Pre-fix: reactPlugin was null because createTelemetryService() captured it before init
  it('wraps Upload with withAITracking using a non-null reactPlugin', async () => {
    // Fresh module load captures the import-time withAITracking call
    vi.resetModules();
    await import('./Upload');
    const { withAITracking } = await import('@microsoft/applicationinsights-react-js');

    expect(withAITracking).toHaveBeenCalledTimes(1);
    const plugin = withAITracking.mock.calls[0][0];
    expect(plugin).not.toBeNull();
    expect(plugin).toBeDefined();
  });
});

describe('Upload — telemetry integration', () => {
  // Helper: mock fetch to return an ArrayBuffer, triggering BPM detection
  const mockSuccessfulFetch = () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      })
    );
  };

  afterEach(() => {
    if (global.fetch?.mockRestore) global.fetch.mockRestore();
    delete global.fetch;
  });

  it('excludes the submitted audio URL from dependency telemetry', async () => {
    mockSuccessfulFetch();

    renderWithRouter(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Upload {...defaultProps} />
      </TelemetryContext.Provider>
    );

    fireEvent.change(
      screen.getByRole('textbox', {
        name: /Direct URL of an MP3 or WAV file/i,
      }),
      {
        target: {
          value: 'https://example.com/audio.mp3?token=secret',
        },
      }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/audio.mp3?token=secret',
        {
          [APP_INSIGHTS_BYPASS_FETCH]: true,
        }
      );
    });
  });

  // Validates P0 #3 fix: Feedback component must receive appInsights prop
  // After BPM detection, clicking thumbs up should trigger trackEvent
  // on the appInsights instance (proving the prop was passed)
  it('Feedback receives appInsights and uses it for tracking', async () => {
    mockSuccessfulFetch();

    renderWithRouter(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Upload {...defaultProps} />
      </TelemetryContext.Provider>
    );

    // Set URL and click calculate
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://example.com/song.mp3' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    );

    // Wait for BPM result and Feedback component to appear
    await waitFor(() => {
      expect(screen.getByText(/Does 120 sound correct/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Yes, accurate' }));

    await waitFor(() => {
      // Post-fix: Feedback receives appInsights prop and calls trackEvent
      expect(mockAppInsights.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'share',
        })
      );
    });
  });

  // Validates P1 #6 fix: detect event should use standardized schema
  // Post-fix schema: { mode: 'url', bpm: <number>, threshold: null }
  // Pre-fix schema: { content_type: 'mode', item_id: 'url' }
  it('detect trackEvent uses standardized schema {mode, bpm, threshold}', async () => {
    mockSuccessfulFetch();

    renderWithRouter(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Upload {...defaultProps} />
      </TelemetryContext.Provider>
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://example.com/song.mp3' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText('120', { selector: '.tool-panel__result' })
      ).toBeInTheDocument();
    });

    // Post-fix: detect event uses { mode, bpm, threshold } schema
    expect(mockAppInsights.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'detect',
        properties: expect.objectContaining({
          mode: 'url',
          bpm: expect.any(Number),
        }),
      })
    );
  });

  // Validates P1 #7 fix: fetch errors should call trackException
  it('calls trackException when fetch fails', async () => {
    const fetchError = new Error(
      'Failed to fetch https://example.com/bad.mp3?token=secret'
    );
    global.fetch = vi.fn(() =>
      Promise.reject(fetchError)
    );

    // Suppress expected console.error from the catch block
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    renderWithRouter(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Upload {...defaultProps} />
      </TelemetryContext.Provider>
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://example.com/bad.mp3' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    );

    await waitFor(() => {
      expect(mockAppInsights.trackException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception: expect.objectContaining({
            name: 'AudioFetchError',
            message: 'Audio URL fetch failed.',
          }),
        })
      );
    });
    expect(
      mockAppInsights.trackException.mock.calls[0][0].exception.message
    ).not.toContain('secret');

    consoleSpy.mockRestore();
  });

  // Validates P1 #7 fix: decodeAudioData rejection should call trackException
  it('calls trackException when decodeAudioData fails', async () => {
    mockSuccessfulFetch();

    const decodeError = new Error('Unable to decode audio data');
    const OriginalAudioContext = window.AudioContext;
    window.AudioContext = vi.fn(function() { return {
      decodeAudioData: vi.fn((_buffer, _resolve, reject) => reject(decodeError)),
    }; });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    renderWithRouter(
      <TelemetryContext.Provider value={mockAppInsights}>
        <Upload {...defaultProps} />
      </TelemetryContext.Provider>
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://example.com/corrupt.mp3' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    );

    await waitFor(() => {
      expect(mockAppInsights.trackException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception: expect.objectContaining({
            name: 'AudioDecodeError',
            message: 'Audio decoding failed.',
          }),
        })
      );
    });

    consoleSpy.mockRestore();
    window.AudioContext = OriginalAudioContext;
  });
});
