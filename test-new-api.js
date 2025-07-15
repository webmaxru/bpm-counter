// Test the new realtime-bpm-analyzer API
import * as realtimeBpm from 'realtime-bpm-analyzer';

console.log('Testing realtime-bpm-analyzer v4.0.2 API');
console.log('Available exports:', Object.keys(realtimeBpm));

// Test if the functions exist
console.log('createRealTimeBpmProcessor:', typeof realtimeBpm.createRealTimeBpmProcessor);
console.log('getBiquadFilter:', typeof realtimeBpm.getBiquadFilter);
console.log('analyzeFullBuffer:', typeof realtimeBpm.analyzeFullBuffer);
console.log('RealTimeBpmAnalyzer:', typeof realtimeBpm.RealTimeBpmAnalyzer);

// Test basic functionality (without audio context since we're in Node)
if (typeof realtimeBpm.createRealTimeBpmProcessor === 'function') {
    console.log('✓ createRealTimeBpmProcessor function is available');
} else {
    console.log('✗ createRealTimeBpmProcessor function is not available');
}

if (typeof realtimeBpm.getBiquadFilter === 'function') {
    console.log('✓ getBiquadFilter function is available');
} else {
    console.log('✗ getBiquadFilter function is not available');
}

export { realtimeBpm };