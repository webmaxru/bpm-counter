import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Upload from './Upload';
import log from 'loglevel';
import { TelemetryContext } from './TelemetryContext';

log.setLevel('silent');

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));

// Mock bpm-detective
jest.mock('bpm-detective', () => jest.fn(() => 120));

// Mock applicationinsights-react-js (withAITracking used in Upload export)
jest.mock('@microsoft/applicationinsights-react-js', () => ({
  withAITracking: jest.fn((_plugin, component) => component),
  ReactPlugin: jest.fn().mockImplementation(() => ({
    identifier: 'ReactPlugin',
  })),
}));

// Mock TelemetryService (Upload imports reactPlugin)
jest.mock('./TelemetryService', () => ({
  reactPlugin: { identifier: 'ReactPlugin' },
  getAppInsights: jest.fn(() => null),
  initialize: jest.fn(),
}));

// Mock react-hint factory (used by Feedback, which Upload renders)
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

const detect = require('bpm-detective');

const mockAppInsights = {
  trackEvent: jest.fn(),
  trackException: jest.fn(),
  trackPageView: jest.fn(),
};

const defaultProps = {
  log,
  isDebug: false,
};

beforeEach(() => {
  detect.mockReturnValue(120);
  mockAppInsights.trackEvent.mockClear();
  mockAppInsights.trackException.mockClear();
});

describe('Upload', () => {
  it('renders URL input and "Fetch and calculate" button', () => {
    render(<Upload {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Fetch and calculate/i })
    ).toBeInTheDocument();
  });

  it('shows "use sample" link', () => {
    render(<Upload {...defaultProps} />);
    expect(screen.getByText('use sample')).toBeInTheDocument();
  });

  it('shows link back to real-time detection', () => {
    render(<Upload {...defaultProps} />);
    expect(
      screen.getByRole('link', { name: /real-time BPM detection/i })
    ).toBeInTheDocument();
  });

  it('filling URL input updates the value', () => {
    render(<Upload {...defaultProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {
      target: { value: 'https://example.com/song.mp3' },
    });
    expect(input).toHaveValue('https://example.com/song.mp3');
  });

  it('clicking "use sample" fills the URL input', () => {
    render(<Upload {...defaultProps} />);
    fireEvent.click(screen.getByText('use sample'));
    expect(screen.getByRole('textbox')).toHaveValue(
      '/samples/bpmtechno-120.mp3'
    );
  });
});

describe('Upload — withAITracking HOC', () => {
  // Validates P0 #1 fix: withAITracking receives a non-null reactPlugin at import time
  // Pre-fix: reactPlugin was null because createTelemetryService() captured it before init
  it('wraps Upload with withAITracking using a non-null reactPlugin', () => {
    // Fresh module load captures the import-time withAITracking call
    jest.resetModules();
    require('./Upload');
    const { withAITracking } = require('@microsoft/applicationinsights-react-js');

    expect(withAITracking).toHaveBeenCalledTimes(1);
    const plugin = withAITracking.mock.calls[0][0];
    expect(plugin).not.toBeNull();
    expect(plugin).toBeDefined();
  });
});

describe('Upload — telemetry integration', () => {
  // Helper: mock fetch to return an ArrayBuffer, triggering BPM detection
  const mockSuccessfulFetch = () => {
    global.fetch = jest.fn(() =>
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

  // Validates P0 #3 fix: Feedback component must receive appInsights prop
  // After BPM detection, clicking thumbs up should trigger trackEvent
  // on the appInsights instance (proving the prop was passed)
  it('Feedback receives appInsights and uses it for tracking', async () => {
    mockSuccessfulFetch();

    render(
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

    // Click thumbs up — Feedback should call appInsights.trackEvent
    fireEvent.click(screen.getByText('👍🏽'));

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

    render(
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
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('120');
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
    const fetchError = new Error('Network request failed');
    global.fetch = jest.fn(() =>
      Promise.reject(fetchError)
    );

    // Suppress expected console.error from the catch block
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
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
      // Post-fix: catch block calls trackException
      expect(mockAppInsights.trackException).toHaveBeenCalledWith(
        expect.objectContaining({
          exception: expect.any(Error),
        })
      );
    });

    consoleSpy.mockRestore();
  });

  // Validates P1 #7 fix: decodeAudioData rejection should call trackException
  it('calls trackException when decodeAudioData fails', async () => {
    mockSuccessfulFetch();

    const decodeError = new Error('Unable to decode audio data');
    const OriginalAudioContext = window.AudioContext;
    window.AudioContext = jest.fn(() => ({
      decodeAudioData: jest.fn((_buffer, _resolve, reject) => reject(decodeError)),
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
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
          exception: decodeError,
        })
      );
    });

    consoleSpy.mockRestore();
    window.AudioContext = OriginalAudioContext;
  });
});
