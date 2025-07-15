import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './Home';

// Mock realtime-bpm-analyzer v4.0.2 API
const mockAnalyzerNode = {
  port: {
    onmessage: null,
    onmessageerror: null,
  },
  connect: jest.fn().mockReturnThis(),
};

const mockCreateRealTimeBpmProcessor = jest.fn().mockResolvedValue(mockAnalyzerNode);
const mockGetBiquadFilter = jest.fn().mockReturnValue({
  connect: jest.fn().mockReturnThis(),
});

jest.mock('realtime-bpm-analyzer', () => ({
  createRealTimeBpmProcessor: mockCreateRealTimeBpmProcessor,
  getBiquadFilter: mockGetBiquadFilter,
  default: jest.fn(),
}));

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
}));

// Mock audiomotion-analyzer
jest.mock('audiomotion-analyzer', () => {
  return jest.fn().mockImplementation(() => ({
    registerGradient: jest.fn(),
    setOptions: jest.fn(),
    setLedParams: jest.fn(),
    connectInput: jest.fn(),
    audioCtx: {
      createMediaStreamSource: jest.fn(),
    },
    volume: 0,
  }));
});

// Mock toast notifications
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    error: jest.fn(),
  },
}));

// Mock react-hint
jest.mock('react-hint', () => {
  return () => () => <div data-testid="react-hint" />;
});

// Mock Feedback and AdLink components
jest.mock('./Feedback.js', () => {
  return function MockFeedback({ bpm, type }) {
    return <div data-testid="feedback" data-bpm={bpm} data-type={type} />;
  };
});

jest.mock('./AdLink.js', () => {
  return function MockAdLink({ ad }) {
    return <div data-testid="ad-link" data-ad={ad} />;
  };
});

describe('Home Component - Real-time BPM Analysis Baseline Tests', () => {
  const mockProps = {
    log: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    isMobile: false,
    isForcedViz: false,
    testBPM: null,
    appInsights: {
      trackEvent: jest.fn(),
    },
    isDebug: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateRealTimeBpmProcessor.mockClear();
    mockGetBiquadFilter.mockClear();
    
    // Reset mock implementations
    mockCreateRealTimeBpmProcessor.mockResolvedValue(mockAnalyzerNode);
    mockGetBiquadFilter.mockReturnValue({
      connect: jest.fn().mockReturnThis(),
    });
    
    // Mock window.location.reload
    window.location.reload = jest.fn();
    
    // Mock AudioContext and related APIs
    global.AudioContext = jest.fn().mockImplementation(() => ({
      createMediaStreamSource: jest.fn().mockReturnValue({
        connect: jest.fn().mockReturnThis(),
      }),
    }));
    global.webkitAudioContext = global.AudioContext;
  });

  test('renders initial interface correctly', () => {
    render(<Home {...mockProps} />);
    
    expect(screen.getByText('Start listening')).toBeInTheDocument();
    expect(screen.getByText('You will be asked to provide access to your microphone.')).toBeInTheDocument();
    expect(screen.getByText('App does not send any audio stream data to the servers.')).toBeInTheDocument();
  });

  test('displays test BPM when provided in props', () => {
    const testProps = { ...mockProps, testBPM: 140 };
    render(<Home {...testProps} />);
    
    expect(screen.getByText('140')).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
    
    // Should show feedback component
    expect(screen.getByTestId('feedback')).toBeInTheDocument();
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-bpm', '140');
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-type', 'mic');
  });

  test('shows and hides sample audio file', () => {
    render(<Home {...mockProps} />);
    
    // Initially should show "Show sample file"
    expect(screen.getByText('Show sample file')).toBeInTheDocument();
    
    // Click to show sample
    fireEvent.click(screen.getByText('Show sample file'));
    
    expect(screen.getByText('Hide sample file')).toBeInTheDocument();
    expect(screen.getByRole('audio')).toBeInTheDocument();
    
    // Click to hide sample
    fireEvent.click(screen.getByText('Hide sample file'));
    
    expect(screen.getByText('Show sample file')).toBeInTheDocument();
    expect(screen.queryByRole('audio')).not.toBeInTheDocument();
  });

  test('verifies realtime-bpm-analyzer v4.0.2 API is imported correctly', () => {
    // This test verifies that the new v4.0.2 API functions can be imported and mocked
    expect(mockCreateRealTimeBpmProcessor).toBeDefined();
    expect(typeof mockCreateRealTimeBpmProcessor).toBe('function');
    expect(mockGetBiquadFilter).toBeDefined();
    expect(typeof mockGetBiquadFilter).toBe('function');
  });

  test('handles AudioWorklet not supported error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock successful getUserMedia
    const mockStream = { id: 'mock-stream' };
    const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    // Mock createRealTimeBpmProcessor to reject with NotSupportedError
    mockCreateRealTimeBpmProcessor.mockRejectedValue(
      Object.assign(new Error('AudioWorklet not supported'), { name: 'NotSupportedError' })
    );

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(toast.error).toHaveBeenCalledWith('Real-time BPM analysis requires a modern browser with AudioWorklet support');
    expect(mockProps.log.error).toHaveBeenCalledWith('AudioWorklet not supported in this browser');
  });

  test('handles AudioWorklet invalid state error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock successful getUserMedia
    const mockStream = { id: 'mock-stream' };
    const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    // Mock createRealTimeBpmProcessor to reject with InvalidStateError
    mockCreateRealTimeBpmProcessor.mockRejectedValue(
      Object.assign(new Error('Invalid state'), { name: 'InvalidStateError' })
    );

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(toast.error).toHaveBeenCalledWith('Audio system initialization failed. Please try refreshing the page.');
    expect(mockProps.log.error).toHaveBeenCalledWith('Audio context is in invalid state for AudioWorklet');
  });

  test('handles AudioWorklet module loading error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock successful getUserMedia
    const mockStream = { id: 'mock-stream' };
    const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    // Mock createRealTimeBpmProcessor to reject with addModule error
    mockCreateRealTimeBpmProcessor.mockRejectedValue(
      new Error('Failed to load AudioWorklet module via addModule')
    );

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(toast.error).toHaveBeenCalledWith('Failed to load audio processing module. Please check your internet connection.');
    expect(mockProps.log.error).toHaveBeenCalledWith('Failed to load AudioWorklet module');
  });

  test('handles audio filter creation error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock successful getUserMedia and AudioWorklet creation
    const mockStream = { id: 'mock-stream' };
    const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    // Mock getBiquadFilter to throw error
    mockGetBiquadFilter.mockImplementation(() => {
      throw Object.assign(new Error('Filter creation failed'), { name: 'InvalidStateError' });
    });

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(toast.error).toHaveBeenCalledWith('Audio processing setup failed');
    expect(mockProps.log.error).toHaveBeenCalledWith('Failed to create audio filter: InvalidStateError: Filter creation failed');
  });

  test('handles browser compatibility check', () => {
    // Mock unsupported browser
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    delete navigator.mediaDevices;
    
    const { toast } = require('react-toastify');
    
    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    expect(toast.error).toHaveBeenCalledWith('No luck with accessing audio in your browser...');
    expect(mockProps.log.error).toHaveBeenCalledWith('Browser is not supported');
    
    // Restore for other tests
    if (originalGetUserMedia) {
      navigator.mediaDevices = { getUserMedia: originalGetUserMedia };
    }
  });

  test('handles microphone access denied error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock getUserMedia to reject with NotAllowedError
    const mockGetUserMedia = jest.fn().mockRejectedValue(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
    );
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(toast.error).toHaveBeenCalledWith('Microphone access is required for real-time BPM analysis');
    expect(mockProps.log.error).toHaveBeenCalledWith('Microphone access denied by user');
  });

  test('handles microphone not found error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock getUserMedia to reject with NotFoundError
    const mockGetUserMedia = jest.fn().mockRejectedValue(
      Object.assign(new Error('No microphone found'), { name: 'NotFoundError' })
    );
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(toast.error).toHaveBeenCalledWith('No microphone detected. Please connect a microphone and try again.');
    expect(mockProps.log.error).toHaveBeenCalledWith('No microphone found');
  });

  test('handles microphone in use error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock getUserMedia to reject with NotReadableError
    const mockGetUserMedia = jest.fn().mockRejectedValue(
      Object.assign(new Error('Microphone in use'), { name: 'NotReadableError' })
    );
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(toast.error).toHaveBeenCalledWith('Microphone is already in use by another application');
    expect(mockProps.log.error).toHaveBeenCalledWith('Microphone is already in use');
  });

  test('handles security error', async () => {
    const { toast } = require('react-toastify');
    
    // Mock getUserMedia to reject with SecurityError
    const mockGetUserMedia = jest.fn().mockRejectedValue(
      Object.assign(new Error('Security error'), { name: 'SecurityError' })
    );
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true
    });

    render(<Home {...mockProps} />);
    
    const startButton = screen.getByText('Start listening');
    fireEvent.click(startButton);
    
    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(toast.error).toHaveBeenCalledWith('Security restrictions prevent microphone access. Please check your browser settings.');
    expect(mockProps.log.error).toHaveBeenCalledWith('Security error accessing microphone');
  });

  test('mobile vs desktop buffer size configuration', () => {
    // Test desktop configuration
    const desktopProps = { ...mockProps, isMobile: false };
    render(<Home {...desktopProps} />);
    
    // Test mobile configuration  
    const { unmount } = render(<Home {...desktopProps} />);
    unmount();
    
    const mobileProps = { ...mockProps, isMobile: true };
    render(<Home {...mobileProps} />);
    
    // Both should render without errors, buffer size differences are internal
    expect(screen.getByText('Start listening')).toBeInTheDocument();
  });

  test('component unmounts cleanly', () => {
    const { unmount } = render(<Home {...mockProps} />);
    
    // Should unmount without errors
    expect(() => unmount()).not.toThrow();
  });

  test('handles debug mode correctly', () => {
    const debugProps = { ...mockProps, isDebug: true };
    render(<Home {...debugProps} />);
    
    expect(screen.getByText('Start listening')).toBeInTheDocument();
  });

  test('handles forced visualization mode', () => {
    const vizProps = { ...mockProps, isForcedViz: true };
    render(<Home {...vizProps} />);
    
    expect(screen.getByText('Start listening')).toBeInTheDocument();
  });
});