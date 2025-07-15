// Test ES6 import of realtime-bpm-analyzer v4.0.2
import * as realtimeBpm from 'realtime-bpm-analyzer';

console.log('=== ES6 Import Test ===');
console.log('Imported object:', realtimeBpm);
console.log('Available exports:', Object.keys(realtimeBpm));

// Test specific exports
console.log('createRealTimeBpmProcessor:', typeof realtimeBpm.createRealTimeBpmProcessor);
console.log('getBiquadFilter:', typeof realtimeBpm.getBiquadFilter);
console.log('analyzeFullBuffer:', typeof realtimeBpm.analyzeFullBuffer);