import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Upload from './Upload';
import detect from 'bpm-detective';

// Mock bpm-detective
jest.mock('bpm-detective');

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
}));

// Mock toast notifications
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    error: jest.fn(),
  },
}));

// Mock Feedback component
jest.mock('./Feedback.js', () => {
  return function MockFeedback({ bpm, type }) {
    return <div data-testid="feedback" data-bpm={bpm} data-type={type} />;
  };
});

describe('Upload Component - BPM Detection', () => {
  const mockProps = {
    log: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    appInsights: {
      trackEvent: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset fetch mock
    global.fetch.mockClear();
    
    // Reset AudioContext mock
    global.AudioContext.mockClear();
    
    // Reset bpm-detective mock
    detect.mockClear();
    
    // Mock URL search params
    delete window.location;
    window.location = { search: '' };
  });

  test('renders upload interface correctly', () => {
    render(<Upload {...mockProps} />);
    
    expect(screen.getByLabelText(/URL of mp3\/wav file/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://... mp3, wav')).toBeInTheDocument();
    expect(screen.getByText('Fetch and calculate')).toBeInTheDocument();
    expect(screen.getByText('use sample')).toBeInTheDocument();
  });

  test('sets sample URL when "use sample" is clicked', () => {
    render(<Upload {...mockProps} />);
    
    const sampleLink = screen.getByText('use sample');
    const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
    
    fireEvent.click(sampleLink);
    
    expect(urlInput.value).toBe('/samples/bpmtechno-120.mp3');
  });

  test('successfully detects BPM from audio file', async () => {
    const mockAudioBuffer = { duration: 10, sampleRate: 44100 };
    const mockBPM = 120;
    
    // Mock successful fetch and audio processing
    global.fetch.mockResolvedValueOnce({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    });
    
    const mockAudioContext = {
      decodeAudioData: jest.fn().mockImplementation((buffer, resolve) => {
        resolve(mockAudioBuffer);
      }),
    };
    
    global.AudioContext.mockImplementation(() => mockAudioContext);
    detect.mockReturnValue(mockBPM);
    
    render(<Upload {...mockProps} />);
    
    const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
    const calculateButton = screen.getByText('Fetch and calculate');
    
    // Set URL and trigger calculation
    fireEvent.change(urlInput, { target: { value: 'https://example.com/test.mp3' } });
    fireEvent.click(calculateButton);
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('BPM')).toBeInTheDocument();
    });
    
    // Verify bpm-detective was called with decoded audio data
    expect(detect).toHaveBeenCalledWith(mockAudioBuffer);
    expect(detect).toHaveBeenCalledTimes(1);
    
    // Verify feedback component is rendered
    expect(screen.getByTestId('feedback')).toBeInTheDocument();
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-bpm', '120');
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-type', 'file');
  });

  test('handles fetch error gracefully', async () => {
    const mockError = new Error('Network error');
    global.fetch.mockRejectedValueOnce(mockError);
    
    const { toast } = require('react-toastify');
    
    render(<Upload {...mockProps} />);
    
    const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
    const calculateButton = screen.getByText('Fetch and calculate');
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com/invalid.mp3' } });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error: Network error');
    });
    
    // Ensure BPM result is not displayed
    expect(screen.queryByText('BPM')).not.toBeInTheDocument();
  });

  test('handles audio decoding error gracefully', async () => {
    const mockError = new Error('Decoding failed');
    
    global.fetch.mockResolvedValueOnce({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    });
    
    const mockAudioContext = {
      decodeAudioData: jest.fn().mockImplementation((buffer, resolve, reject) => {
        reject(mockError);
      }),
    };
    
    global.AudioContext.mockImplementation(() => mockAudioContext);
    
    const { toast } = require('react-toastify');
    
    render(<Upload {...mockProps} />);
    
    const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
    const calculateButton = screen.getByText('Fetch and calculate');
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com/corrupt.mp3' } });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error: Decoding failed');
    });
  });

  test('handles URL parameter initialization', () => {
    // Mock URL with search parameter
    delete window.location;
    window.location = { search: '?url=https://example.com/test.mp3' };
    
    render(<Upload {...mockProps} />);
    
    const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
    expect(urlInput.value).toBe('https://example.com/test.mp3');
  });

  test('bpm-detective integration works with different BPM values', async () => {
    const testCases = [
      { bpm: 60, description: 'slow tempo' },
      { bpm: 120, description: 'medium tempo' },
      { bpm: 180, description: 'fast tempo' },
    ];
    
    for (const testCase of testCases) {
      const mockAudioBuffer = { duration: 10, sampleRate: 44100 };
      
      global.fetch.mockResolvedValueOnce({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
      });
      
      const mockAudioContext = {
        decodeAudioData: jest.fn().mockImplementation((buffer, resolve) => {
          resolve(mockAudioBuffer);
        }),
      };
      
      global.AudioContext.mockImplementation(() => mockAudioContext);
      detect.mockReturnValue(testCase.bpm);
      
      const { unmount } = render(<Upload {...mockProps} />);
      
      const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
      const calculateButton = screen.getByText('Fetch and calculate');
      
      fireEvent.change(urlInput, { target: { value: `https://example.com/${testCase.description}.mp3` } });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(testCase.bpm.toString())).toBeInTheDocument();
      });
      
      expect(detect).toHaveBeenCalledWith(mockAudioBuffer);
      
      unmount();
      jest.clearAllMocks();
    }
  });
});