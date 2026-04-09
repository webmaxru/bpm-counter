import '@testing-library/jest-dom/vitest';

// Polyfill TextEncoder/TextDecoder for jsdom (required by react-router v7)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Web Audio API (not available in jsdom)
class MockAudioContext {
  constructor() {
    this.destination = {};
    this.state = 'running';
  }
  createMediaStreamSource() {
    return { connect: vi.fn(), disconnect: vi.fn() };
  }
  createScriptProcessor() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    };
  }
  createAnalyser() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: { value: 1 },
    };
  }
  decodeAudioData(buffer, success, error) {
    const audioBuffer = {
      duration: 10,
      sampleRate: 44100,
      numberOfChannels: 1,
      getChannelData: () => new Float32Array(441000),
    };
    if (success) success(audioBuffer);
    return Promise.resolve(audioBuffer);
  }
  close() {
    return Promise.resolve();
  }
  resume() {
    return Promise.resolve();
  }
}

window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

// Mock MediaDevices
// Use a beforeEach pattern because mockReset clears vi.fn() impls
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
});
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Re-apply getUserMedia mock before each test (mockReset clears vi.fn() impls)
beforeEach(() => {
  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
  });
});

// Mock performance.getEntriesByType (used in App.js)
// jsdom's window.performance doesn't inherit from Performance.prototype,
// so patch the instance directly
window.performance.getEntriesByType = function () {
  return [{}];
};

// Suppress known noisy console output in tests
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) return;
  // Suppress React Router v5 UNSAFE_ lifecycle warnings in StrictMode
  if (typeof args[0] === 'string' && args[0].includes('UNSAFE_')) return;
  originalError.call(console, ...args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('react-dom/test-utils')) return;
  originalWarn.call(console, ...args);
};
