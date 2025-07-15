// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Web Audio API for testing
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn(),
  createScriptProcessor: jest.fn(() => ({
    connect: jest.fn(),
    onaudioprocess: null,
  })),
  decodeAudioData: jest.fn(),
  destination: {},
}));

global.webkitAudioContext = global.AudioContext;

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

// Mock fetch for URL-based audio loading
global.fetch = jest.fn();

// Mock window.location
delete window.location;
window.location = { 
  search: '',
  reload: jest.fn(),
};