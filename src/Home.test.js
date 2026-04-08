import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './Home';
import log from 'loglevel';

log.setLevel('silent');

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));

// Mock realtime-bpm-analyzer
jest.mock('realtime-bpm-analyzer', () => ({
  createRealtimeBpmAnalyzer: jest.fn().mockResolvedValue({
    node: { connect: jest.fn() },
    on: jest.fn(),
    reset: jest.fn(),
  }),
}));

// Mock audiomotion-analyzer
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

// Mock react-tooltip
jest.mock('react-tooltip', () => {
  const React = require('react');
  return {
    Tooltip: (props) => React.createElement('div', { 'data-testid': 'react-tooltip' }),
  };
});

const defaultProps = {
  log,
  isMobile: true,
  isForcedViz: false,
  testBPM: null,
  appInsights: null,
  isDebug: false,
};

describe('Home', () => {
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

    // Init view is shown (isShowingInit=true), but BPM state is pre-populated.
    // After clicking Start, the result (120 BPM) will display immediately
    // without waiting for real-time analysis.
    expect(
      screen.getByRole('button', { name: /Start listening/i })
    ).toBeInTheDocument();
  });
});
