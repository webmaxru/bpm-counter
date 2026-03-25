import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Upload from './Upload';
import log from 'loglevel';

log.setLevel('silent');

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));

// Mock bpm-detective
jest.mock('bpm-detective', () => jest.fn(() => 120));

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

const defaultProps = {
  log,
  appInsights: null,
  isDebug: false,
};

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
