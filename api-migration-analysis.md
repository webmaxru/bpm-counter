# realtime-bpm-analyzer API Migration Analysis
## Version 1.1.5 → 4.0.2

### Summary of Breaking Changes

The realtime-bpm-analyzer library has undergone a **complete architectural rewrite** between v1.1.5 and v4.0.2. The old constructor-based approach has been replaced with a modern AudioWorklet-based architecture.

### Key Changes

#### 1. **Import Structure**
**v1.1.5 (Old):**
```javascript
import RealTimeBPMAnalyzer from 'realtime-bpm-analyzer';
```

**v4.0.2 (New):**
```javascript
import { createRealTimeBpmProcessor, getBiquadFilter, analyzeFullBuffer, RealTimeBpmAnalyzer } from 'realtime-bpm-analyzer';
```

#### 2. **Architecture Change**
- **Old**: Constructor-based class with callback configuration
- **New**: AudioWorklet-based processor with message passing

#### 3. **API Comparison**

##### Old API (v1.1.5):
```javascript
const analyzer = new RealTimeBPMAnalyzer({
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
    // Handle BPM results
  },
  onBpmStabilized: (threshold) => {
    // Handle stabilization
  }
});

// Usage with ScriptProcessorNode
scriptProcessorNode.onaudioprocess = (e) => {
  analyzer.analyze(e);
};
```

##### New API (v4.0.2):
```javascript
// Create AudioWorklet processor
const realtimeAnalyzerNode = await createRealTimeBpmProcessor(audioContext, {
  continuousAnalysis: true,
  stabilizationTime: 20000, // Default changed from 10000 to 20000
  muteTimeInIndexes: 10000, // New parameter
  debug: false
});

// Connect audio nodes
source.connect(lowpass).connect(realtimeAnalyzerNode);

// Handle messages
realtimeAnalyzerNode.port.onmessage = (event) => {
  if (event.data.message === 'BPM') {
    console.log('BPM', event.data.data.bpm);
  }
  if (event.data.message === 'BPM_STABLE') {
    console.log('BPM_STABLE', event.data.data.bpm);
  }
};
```

#### 4. **Configuration Changes**

| v1.1.5 Parameter | v4.0.2 Parameter | Status | Notes |
|------------------|------------------|---------|-------|
| `debug` | `debug` | ✅ Kept | Same functionality |
| `scriptNode` | N/A | ❌ Removed | AudioWorklet handles this |
| `computeBPMDelay` | N/A | ❌ Removed | Handled internally |
| `stabilizationTime` | `stabilizationTime` | ✅ Kept | Default changed: 10000 → 20000 |
| `continuousAnalysis` | `continuousAnalysis` | ✅ Kept | Same functionality |
| `pushTime` | N/A | ❌ Removed | Handled internally |
| `pushCallback` | N/A | ❌ Removed | Replaced with message events |
| `onBpmStabilized` | N/A | ❌ Removed | Replaced with 'BPM_STABLE' message |
| N/A | `muteTimeInIndexes` | ✅ New | Default: 10000 |

#### 5. **Data Format Changes**

**v1.1.5 Callback:**
```javascript
pushCallback: (err, bpm, threshold) => {
  // bpm: Array of { tempo: number }
  // threshold: number
}
```

**v4.0.2 Message:**
```javascript
realtimeAnalyzerNode.port.onmessage = (event) => {
  // event.data.data: { bpm: Array<{tempo: number, count: number, confidence: number}>, threshold: number }
}
```

#### 6. **New Features in v4.0.2**
- **AudioWorklet-based**: Better performance and no audio glitches
- **Confidence levels**: BPM results now include confidence scores
- **Message-based architecture**: More robust event handling
- **Built-in filtering**: `getBiquadFilter()` helper function
- **File analysis**: `analyzeFullBuffer()` for offline analysis

#### 7. **Migration Requirements**

1. **Replace ScriptProcessorNode with AudioWorklet**
2. **Update configuration object** (remove deprecated parameters)
3. **Replace callbacks with message handlers**
4. **Update BPM data handling** (new data structure)
5. **Add proper audio node connections**
6. **Handle async initialization** (createRealTimeBpmProcessor returns Promise)

#### 8. **Browser Compatibility**
- **v1.1.5**: Used deprecated ScriptProcessorNode
- **v4.0.2**: Uses modern AudioWorklet (requires newer browsers)

### Migration Impact Assessment

**High Impact Changes:**
- Complete API rewrite requires significant code changes
- AudioWorklet requirement may affect browser compatibility
- Message-based architecture changes event handling patterns

**Benefits of Migration:**
- Better performance (AudioWorklet vs ScriptProcessorNode)
- More accurate BPM detection with confidence levels
- Modern, future-proof architecture
- Built-in filtering and offline analysis capabilities

### Recommended Migration Strategy

1. **Phase 1**: Update package.json and install v4.0.2
2. **Phase 2**: Create compatibility layer to maintain existing interface
3. **Phase 3**: Gradually migrate to new AudioWorklet-based architecture
4. **Phase 4**: Update UI to utilize new confidence data
5. **Phase 5**: Remove compatibility layer and fully adopt new API