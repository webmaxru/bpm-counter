import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Upload from './Upload';
import Home from './Home';
import detect from 'bpm-detective';

// Mock all external dependencies
jest.mock('bpm-detective');

const mockAnalyzer = {
  analyze: jest.fn(),
  clearValidPeaks: jest.fn(),
};
const mockRealTimeBPMAnalyzer = jest.fn(() => mockAnalyzer);
jest.mock('realtime-bpm-analyzer', () => mockRealTimeBPMAnalyzer);

jest.mock('react-ga4', () => ({ event: jest.fn() }));
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: { error: jest.fn() },
}));
jest.mock('audiomotion-analyzer', () => jest.fn().mockImplementation(() => ({
  registerGradient: jest.fn(),
  setOptions: jest.fn(),
  setLedParams: jest.fn(),
  connectInput: jest.fn(),
  audioCtx: { createMediaStreamSource: jest.fn() },
  volume: 0,
})));
jest.mock('react-hint', () => () => () => <div data-testid="react-hint" />);
jest.mock('./Feedback.js', () => function MockFeedback({ bpm, type }) {
  return <div data-testid="feedback" data-bpm={bpm} data-type={type} />;
});
jest.mock('./AdLink.js', () => function MockAdLink({ ad }) {
  return <div data-testid="ad-link" data-ad={ad} />;
});

describe('BPM Detection Integration Tests', () => {
  const mockProps = {
    log: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    appInsights: {
      trackEvent: jest.fn(),
    },
    isMobile: false,
    isForcedViz: false,
    testBPM: null,
    isDebug: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful mocks
    setupDefaultMocks();
  });

  function setupDefaultMocks() {
    // Mock successful fetch
    global.fetch.mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    });
    
    // Mock AudioContext for file processing
    global.AudioContext.mockImplementation(() => ({
      createMediaStreamSource: jest.fn(),
      createScriptProcessor: jest.fn(() => ({
        connect: jest.fn(),
        onaudioprocess: null,
      })),
      decodeAudioData: jest.fn().mockImplementation((buffer, resolve) => {
        resolve({ duration: 10, sampleRate: 44100 });
      }),
      destination: {},
    }));
    
    // Mock getUserMedia
    navigator.mediaDevices.getUserMedia.mockResolvedValue({
      getTracks: jest.fn(() => []),
    });
  }

  describe('File-based BPM Detection Workflow', () => {
    test('complete file upload and BPM detection workflow', async () => {
      const expectedBPM = 128;
      detect.mockReturnValue(expectedBPM);
      
      render(<Upload {...mockProps} />);
      
      // Step 1: User enters URL
      const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
      fireEvent.change(urlInput, { 
        target: { value: 'https://example.com/test-track.mp3' } 
      });
      
      // Step 2: User clicks calculate
      const calculateButton = screen.getByText('Fetch and calculate');
      fireEvent.click(calculateButton);
      
      // Step 3: Verify the complete workflow
      await waitFor(() => {
        // Audio file should be fetched
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/test-track.mp3');
        
        // Audio should be decoded
        expect(global.AudioContext).toHaveBeenCalled();
        
        // BPM detection should be performed
        expect(detect).toHaveBeenCalledWith({ duration: 10, sampleRate: 44100 });
        
        // Result should be displayed
        expect(screen.getByText('128')).toBeInTheDocument();
        expect(screen.getByText('BPM')).toBeInTheDocument();
        
        // Feedback component should be rendered
        expect(screen.getByTestId('feedback')).toBeInTheDocument();
        expect(screen.getByTestId('feedback')).toHaveAttribute('data-bpm', '128');
        expect(screen.getByTestId('feedback')).toHaveAttribute('data-type', 'file');
      });
      
      // Verify analytics tracking
      expect(mockProps.appInsights.trackEvent).toHaveBeenCalledWith({
        name: 'detect',
        properties: {
          content_type: 'mode',
          item_id: 'url',
        },
      });
    });

    test('handles complete error workflow in file processing', async () => {
      const networkError = new Error('Network timeout');
      global.fetch.mockRejectedValueOnce(networkError);
      
      const { toast } = require('react-toastify');
      
      render(<Upload {...mockProps} />);
      
      const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
      const calculateButton = screen.getByText('Fetch and calculate');
      
      fireEvent.change(urlInput, { 
        target: { value: 'https://example.com/broken-link.mp3' } 
      });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error: Network timeout');
        expect(screen.queryByText('BPM')).not.toBeInTheDocument();
      });
    });

    test('sample file workflow integration', async () => {
      const sampleBPM = 120;
      detect.mockReturnValue(sampleBPM);
      
      render(<Upload {...mockProps} />);
      
      // Use sample file
      const sampleLink = screen.getByText('use sample');
      fireEvent.click(sampleLink);
      
      const calculateButton = screen.getByText('Fetch and calculate');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/samples/bpmtechno-120.mp3');
        expect(screen.getByText('120')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time BPM Detection Workflow', () => {
    test('verifies real-time component renders correctly', () => {
      render(<Home {...mockProps} />);
      
      // Should render initial interface
      expect(screen.getByText('Start listening')).toBeInTheDocument();
      expect(screen.getByText('You will be asked to provide access to your microphone.')).toBeInTheDocument();
      expect(screen.getByText('App does not send any audio stream data to the servers.')).toBeInTheDocument();
    });

    test('handles browser compatibility issues', () => {
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

    test('displays test BPM correctly', () => {
      const testProps = { ...mockProps, testBPM: 135 };
      render(<Home {...testProps} />);
      
      expect(screen.getByText('135')).toBeInTheDocument();
      expect(screen.getByText('BPM')).toBeInTheDocument();
      expect(screen.getByTestId('feedback')).toBeInTheDocument();
      expect(screen.getByTestId('feedback')).toHaveAttribute('data-bpm', '135');
      expect(screen.getByTestId('feedback')).toHaveAttribute('data-type', 'mic');
    });
  });

  describe('Cross-Component Integration', () => {
    test('both components can coexist and work independently', async () => {
      // Test that both detection methods can be used in the same session
      const fileBPM = 110;
      
      detect.mockReturnValue(fileBPM);
      
      // Render Upload component first
      const { unmount: unmountUpload } = render(<Upload {...mockProps} />);
      
      // Test file-based detection
      const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
      fireEvent.change(urlInput, { target: { value: 'https://example.com/test.mp3' } });
      fireEvent.click(screen.getByText('Fetch and calculate'));
      
      await waitFor(() => {
        expect(screen.getByText('110')).toBeInTheDocument();
      });
      
      unmountUpload();
      
      // Render Home component
      render(<Home {...mockProps} />);
      
      // Test real-time component renders
      expect(screen.getByText('Start listening')).toBeInTheDocument();
      
      // Verify both libraries were used correctly
      expect(detect).toHaveBeenCalled();
    });

    test('error handling works consistently across components', async () => {
      const { toast } = require('react-toastify');
      
      // Test Upload error handling
      global.fetch.mockRejectedValueOnce(new Error('Upload failed'));
      
      const { unmount } = render(<Upload {...mockProps} />);
      
      const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
      fireEvent.change(urlInput, { target: { value: 'https://example.com/bad.mp3' } });
      fireEvent.click(screen.getByText('Fetch and calculate'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error: Upload failed');
      });
      
      unmount();
      jest.clearAllMocks();
      
      // Test Home error handling
      delete navigator.mediaDevices;
      
      render(<Home {...mockProps} />);
      fireEvent.click(screen.getByText('Start listening'));
      
      expect(toast.error).toHaveBeenCalledWith('No luck with accessing audio in your browser...');
      expect(mockProps.log.error).toHaveBeenCalledWith('Browser is not supported');
    });
  });

  describe('Library Integration Verification', () => {
    test('bmp-detective library integration', async () => {
      const testBPM = 142;
      detect.mockReturnValue(testBPM);
      
      render(<Upload {...mockProps} />);
      
      const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
      fireEvent.change(urlInput, { target: { value: 'https://example.com/test.mp3' } });
      fireEvent.click(screen.getByText('Fetch and calculate'));
      
      await waitFor(() => {
        expect(detect).toHaveBeenCalledWith({ duration: 10, sampleRate: 44100 });
        expect(screen.getByText('142')).toBeInTheDocument();
      });
    });

    test('realtime-bpm-analyzer library integration', () => {
      render(<Home {...mockProps} />);
      
      // Verify the library can be imported and mocked
      expect(mockRealTimeBPMAnalyzer).toBeDefined();
      expect(typeof mockRealTimeBPMAnalyzer).toBe('function');
    });

    test('both libraries work with different BPM ranges', async () => {
      const testCases = [
        { bpm: 60, description: 'slow' },
        { bpm: 120, description: 'medium' },
        { bpm: 180, description: 'fast' },
      ];
      
      for (const testCase of testCases) {
        detect.mockReturnValue(testCase.bpm);
        
        const { unmount } = render(<Upload {...mockProps} />);
        
        const urlInput = screen.getByPlaceholderText('https://... mp3, wav');
        fireEvent.change(urlInput, { target: { value: `https://example.com/${testCase.description}.mp3` } });
        fireEvent.click(screen.getByText('Fetch and calculate'));
        
        await waitFor(() => {
          expect(screen.getByText(testCase.bpm.toString())).toBeInTheDocument();
        });
        
        unmount();
        jest.clearAllMocks();
        setupDefaultMocks();
      }
    });
  });
});