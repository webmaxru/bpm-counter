/* eslint-disable no-unused-vars */
import './Home.css';
import Feedback from './Feedback.js';
import React, { useEffect, useState } from 'react';
import realtimeBpm, { createRealTimeBpmProcessor, getBiquadFilter } from 'realtime-bpm-analyzer';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactHintFactory from 'react-hint';
import 'react-hint/css/index.css';
import './custom-hint.css';
import ReactGA from 'react-ga4';
import AdLink from './AdLink.js';

const ReactHint = ReactHintFactory(React);

function Home(props) {
  let log = props.log;

  const isMobile = props.isMobile;
  const isForcedViz = props.isForcedViz;
  const testBPM = props.testBPM;
  const appInsights = props.appInsights;

  let context;
  let input;
  let scriptProcessorNode;
  const bufferSize = isMobile ? 16384 : 4096;

  useEffect(() => {
    ReactGA.event('select_content', {
      content_type: 'mode',
      item_id: 'realtime',
    });
  }, []);

  useEffect(() => {
    appInsights?.trackEvent({
      name: 'detect',
      properties: {
        content_type: 'mode',
        item_id: 'realtime',
      },
    });
  }, [appInsights]);

  const startListening = async () => {
    if (navigator.mediaDevices.getUserMedia) {
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new window.AudioContext();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        await onStream(stream);

        if (!isMobile || isForcedViz) {
          const audioMotionGradientOptions = {
            bgColor: '#0D4C73',
            dir: 'v',
            colorStops: [
              { pos: 0.8, color: '#35748C' },
              { pos: 0.6, color: '#F2B680' },
              { pos: 0.4, color: '#D98C5F' },
              { pos: 0.2, color: '#8C5230' },
            ],
          };

          const audioMotion = new AudioMotionAnalyzer(
            document.getElementById('AudioMotionAnalyzer')
          );

          audioMotion.registerGradient('my-grad', audioMotionGradientOptions);

          audioMotion.setOptions({
            gradient: 'my-grad',
            height: window.innerHeight / 4,
            showBgColor: false,
            overlay: true,
            mode: 6,
            lumiBars: false,
            showLeds: true,
            showScaleX: false,
            loRes: true,
          });

          audioMotion.setLedParams({
            maxLeds: 20,
            spaceV: 1,
            spaceH: 2,
          });

          const micStream =
            audioMotion.audioCtx.createMediaStreamSource(stream);
          audioMotion.connectInput(micStream);
          audioMotion.volume = 0;
        }

        setIsListening(true);
        setIsShowingInit(false);
      } catch (err) {
        // Enhanced error handling for getUserMedia and AudioContext errors
        if (err.name === 'NotAllowedError') {
          log.error('Microphone access denied by user');
          toast.error('Microphone access is required for real-time BPM analysis');
        } else if (err.name === 'NotFoundError') {
          log.error('No microphone found');
          toast.error('No microphone detected. Please connect a microphone and try again.');
        } else if (err.name === 'NotReadableError') {
          log.error('Microphone is already in use');
          toast.error('Microphone is already in use by another application');
        } else if (err.name === 'OverconstrainedError') {
          log.error('Microphone constraints cannot be satisfied');
          toast.error('Microphone configuration error. Please try with different settings.');
        } else if (err.name === 'SecurityError') {
          log.error('Security error accessing microphone');
          toast.error('Security restrictions prevent microphone access. Please check your browser settings.');
        } else if (err.name === 'NotSupportedError' && err.message.includes('AudioContext')) {
          log.error('AudioContext not supported');
          toast.error('Your browser does not support audio processing required for BPM analysis');
        } else {
          log.error(`Audio initialization error: ${err.name}: ${err.message}`);
          toast.error('Failed to initialize audio system. Please try refreshing the page.');
        }
        
        // Reset UI state on error
        setIsListening(false);
        setIsShowingInit(true);
      }
    } else {
      toast.error('No luck with accessing audio in your browser...');
      log.error('Browser is not supported');
    }
  };

  const [threshold, setThreshold] = useState(0);
  const [primaryBPM, setPrimaryBPM] = useState(testBPM || ``);
  const [secondaryBPM, setSecondaryBPM] = useState(``);
  const [isListening, setIsListening] = useState(false);

  const [isShowingInit, setIsShowingInit] = useState(true);
  const [isResultReady, setIsResultReady] = useState(testBPM ? true : false);

  const [isSampleVisible, setSampleVisible] = useState(false);

  const toggleSampleVisibility = () => {
    setSampleVisible(!isSampleVisible);
  };

  const stopListening = () => {
    setIsListening(false);
    setIsShowingInit(true);
    window.location.reload();
  };

  const onStream = async (stream) => {
    try {
      input = context.createMediaStreamSource(stream);
      
      // Create the new AudioWorklet-based BPM processor with enhanced error handling
      let realtimeAnalyzerNode;
      try {
        realtimeAnalyzerNode = await createRealTimeBpmProcessor(context, {
          debug: props.isDebug,
          stabilizationTime: 10000, // Keep same as before
          continuousAnalysis: true,
          muteTimeInIndexes: 10000, // New parameter in v4.0.2
        });
      } catch (workletError) {
        // Handle AudioWorklet-specific initialization errors
        if (workletError.name === 'NotSupportedError') {
          log.error('AudioWorklet not supported in this browser');
          toast.error('Real-time BPM analysis requires a modern browser with AudioWorklet support');
          return;
        } else if (workletError.name === 'InvalidStateError') {
          log.error('Audio context is in invalid state for AudioWorklet');
          toast.error('Audio system initialization failed. Please try refreshing the page.');
          return;
        } else if (workletError.message && workletError.message.includes('addModule')) {
          log.error('Failed to load AudioWorklet module');
          toast.error('Failed to load audio processing module. Please check your internet connection.');
          return;
        } else {
          log.error(`AudioWorklet initialization failed: ${workletError.name}: ${workletError.message}`);
          toast.error('Failed to initialize real-time BPM analyzer. Please try again.');
          return;
        }
      }

      // Create lowpass filter with error handling
      let lowpass;
      try {
        lowpass = getBiquadFilter(context);
      } catch (filterError) {
        log.error(`Failed to create audio filter: ${filterError.name}: ${filterError.message}`);
        toast.error('Audio processing setup failed');
        return;
      }

      // Connect audio nodes with error handling
      try {
        input.connect(lowpass).connect(realtimeAnalyzerNode);
      } catch (connectionError) {
        log.error(`Audio node connection failed: ${connectionError.name}: ${connectionError.message}`);
        toast.error('Audio routing setup failed');
        return;
      }

      // Handle messages from the AudioWorklet processor with enhanced error handling
      realtimeAnalyzerNode.port.onmessage = (event) => {
        try {
          const { message, data } = event.data;

          if (message === 'BPM') {
            if (data && data.bpm && data.bpm.length) {
              setIsResultReady(true);
              setThreshold(Math.round(data.threshold * 100) / 100);

              setPrimaryBPM(`${data.bpm[0].tempo}`);
              setSecondaryBPM(data.bpm[1] ? `${data.bpm[1].tempo}` : '');

              log.info(data.bpm);
              log.info(`Threshold, ${data.threshold}`);

              ReactGA.event('detect', {
                mode: 'realtime',
                bpm: data.bpm[0].tempo,
                threshold: data.threshold,
              });
              appInsights.trackEvent({
                name: 'detect',
                properties: {
                  mode: 'realtime',
                  bpm: data.bpm[0].tempo,
                  threshold: data.threshold,
                },
              });
            } else {
              log.warn('Received BPM message with invalid data structure');
            }
          } else if (message === 'BPM_STABLE') {
            // BPM has stabilized - this replaces the old onBpmStabilized callback
            log.info('BPM stabilized:', data);
          } else if (message === 'ANALYZER_RESETED') {
            // Analyzer was reset due to continuous analysis
            log.info('Analyzer reset for continuous analysis');
          } else if (message === 'ERROR') {
            // Handle errors from the AudioWorklet processor
            const errorMsg = data?.error || 'Unknown error from BPM analyzer';
            log.error(`BPM analyzer error: ${errorMsg}`);
            toast.error('BPM analysis encountered an error. Audio processing may be interrupted.');
          } else if (message === 'PROCESSOR_ERROR') {
            // Handle processor-specific errors
            log.error(`Audio processor error: ${data?.error || 'Unknown processor error'}`);
            toast.error('Audio processing error occurred. Please try restarting the analysis.');
          } else {
            log.warn(`Unknown message from BPM analyzer: ${message}`);
          }
        } catch (messageError) {
          log.error(`Error processing BPM analyzer message: ${messageError.name}: ${messageError.message}`);
          // Don't show toast for message processing errors to avoid spam
        }
      };

      // Handle port errors
      realtimeAnalyzerNode.port.onmessageerror = (error) => {
        log.error('BPM analyzer message error:', error);
        toast.error('Communication error with BPM analyzer');
      };

      // Store reference for cleanup
      scriptProcessorNode = realtimeAnalyzerNode;
      
    } catch (err) {
      // Enhanced general error handling with specific error types
      if (err.name === 'NotAllowedError') {
        log.error('Microphone access denied by user');
        toast.error('Microphone access is required for real-time BPM analysis');
      } else if (err.name === 'NotFoundError') {
        log.error('No microphone found');
        toast.error('No microphone detected. Please connect a microphone and try again.');
      } else if (err.name === 'NotReadableError') {
        log.error('Microphone is already in use');
        toast.error('Microphone is already in use by another application');
      } else if (err.name === 'OverconstrainedError') {
        log.error('Microphone constraints cannot be satisfied');
        toast.error('Microphone configuration error. Please try with different settings.');
      } else if (err.name === 'SecurityError') {
        log.error('Security error accessing microphone');
        toast.error('Security restrictions prevent microphone access. Please check your browser settings.');
      } else if (err.name === 'TypeError' && err.message.includes('AudioWorklet')) {
        log.error('AudioWorklet not available');
        toast.error('Your browser does not support advanced audio processing required for real-time BPM analysis');
      } else {
        log.error(`Error setting up BPM analyzer: ${err.name}: ${err.message}`);
        toast.error('Failed to initialize BPM analyzer. Please try refreshing the page.');
      }
      
      // Reset UI state on error
      setIsListening(false);
      setIsShowingInit(true);
    }
  };

  return (
    <main className="content">
      {isShowingInit ? (
        <div>
          <button
            onClick={startListening}
            disabled={isListening}
            className="btn-start"
            data-home="Click and wait for some time for BPM stabilizes"
          >
            Start listening
          </button>

          <p>You will be asked to provide access to your microphone.</p>
          <p>App does not send any audio stream data to the servers.</p>

          <p>
            <AdLink ad="item-music-prod" appInsights={appInsights} />
          </p>
        </div>
      ) : (
        <div>
          <h2 style={{ opacity: threshold + 0.4 }}>
            {isResultReady ? primaryBPM : null}
          </h2>
          <h3>{isResultReady ? 'BPM' : 'Listening...'}</h3>

          {!isResultReady && primaryBPM ? (
            <h4>
              <small>Last: </small>
              {primaryBPM}
              <small> BPM</small>
            </h4>
          ) : null}

          <p>
            <AdLink ad="item-sample-pack" appInsights={appInsights} />
          </p>

          <button onClick={stopListening} className="btn-stop">
            Start over
          </button>

          {primaryBPM ? (
            <Feedback
              bpm={primaryBPM}
              log={log}
              type="mic"
              appInsights={appInsights}
            ></Feedback>
          ) : null}

          <br />
          <br />

          {isSampleVisible ? (
            <p>
              <small className="hint" onClick={toggleSampleVisibility}>
                Hide sample file
              </small>
              <br />
              <audio
                src="/samples/bpmtechno-120.mp3"
                id="sample"
                controls
              ></audio>
              <br />
              <small>
                Play it loud! It takes 5-30 seconds to detect correct BPM (120).{' '}
              </small>
            </p>
          ) : (
            <p>
              <small className="hint" onClick={toggleSampleVisibility}>
                Show sample file
              </small>
            </p>
          )}
        </div>
      )}

      <ToastContainer />

      {!isMobile ? (
        <ReactHint
          events
          position="top"
          className="custom-hint react-hint"
          attribute="data-home"
        />
      ) : null}
    </main>
  );
}

export default Home;
