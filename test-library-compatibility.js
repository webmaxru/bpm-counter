/**
 * Test script to investigate realtime-bpm-analyzer v4.0.2 API changes
 * This script will help document differences between v1.1.5 and v4.0.2
 */

console.log('=== Testing realtime-bpm-analyzer v4.0.2 API ===');

// Test 1: Basic import and constructor
try {
  const realtimeBpm = require('realtime-bpm-analyzer');
  console.log('✓ Import successful');
  console.log('Exported object type:', typeof realtimeBpm);
  console.log('Exported object keys:', Object.keys(realtimeBpm));
  
  // Check specific exports mentioned in README
  console.log('\n=== Checking specific exports ===');
  console.log('createRealTimeBpmProcessor:', typeof realtimeBpm.createRealTimeBpmProcessor);
  console.log('getBiquadFilter:', typeof realtimeBpm.getBiquadFilter);
  console.log('analyzeFullBuffer:', typeof realtimeBpm.analyzeFullBuffer);
  
  // Check if old constructor still exists
  console.log('RealTimeBPMAnalyzer (old constructor):', typeof realtimeBpm.RealTimeBPMAnalyzer);
  
  // List all available exports
  console.log('\n=== All available exports ===');
  Object.keys(realtimeBpm).forEach(key => {
    console.log(`- ${key}: ${typeof realtimeBpm[key]}`);
  });
  
  // Test 3: Try to create instance with old configuration
  const oldConfig = {
    debug: false,
    scriptNode: {
      bufferSize: 4096,
      numberOfInputChannels: 1,
      numberOfOutputChannels: 1,
    },
    computeBPMDelay: 5000,
    stabilizationTime: 10000,
    continuousAnalysis: true,
    pushTime: 1000,
    pushCallback: (err, bpm, threshold) => {
      console.log('Callback called:', { err, bpm, threshold });
    },
    onBpmStabilized: (threshold) => {
      console.log('BPM stabilized:', threshold);
    }
  };
  
  console.log('\n=== Testing constructor with old configuration ===');
  try {
    const analyzer = new RealTimeBPMAnalyzer(oldConfig);
    console.log('✓ Constructor with old config successful');
    console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(analyzer)));
    
    // Test 4: Check available methods
    console.log('\n=== Available methods ===');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(analyzer));
    methods.forEach(method => {
      if (typeof analyzer[method] === 'function') {
        console.log(`- ${method}()`);
      }
    });
    
    // Test 5: Check properties
    console.log('\n=== Available properties ===');
    Object.keys(analyzer).forEach(prop => {
      console.log(`- ${prop}: ${typeof analyzer[prop]}`);
    });
    
  } catch (constructorError) {
    console.log('✗ Constructor with old config failed:', constructorError.message);
    
    // Test 6: Try minimal constructor
    console.log('\n=== Testing minimal constructor ===');
    try {
      const minimalAnalyzer = new RealTimeBPMAnalyzer();
      console.log('✓ Minimal constructor successful');
    } catch (minimalError) {
      console.log('✗ Minimal constructor failed:', minimalError.message);
    }
  }
  
} catch (importError) {
  console.log('✗ Import failed:', importError.message);
}

// Test 7: Check package.json of the new version
try {
  const packageInfo = require('realtime-bpm-analyzer/package.json');
  console.log('\n=== Package Information ===');
  console.log('Version:', packageInfo.version);
  console.log('Description:', packageInfo.description);
  console.log('Main entry:', packageInfo.main);
  console.log('Keywords:', packageInfo.keywords);
} catch (packageError) {
  console.log('Could not read package info:', packageError.message);
}

console.log('\n=== Test completed ===');