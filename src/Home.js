/* eslint-disable no-unused-vars */
import './Home.css';
import Feedback from './Feedback.js';
import React, { useEffect, useState } from 'react';
import RealTimeBPMAnalyzer from 'realtime-bpm-analyzer';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactHintFactory from 'react-hint';
import 'react-hint/css/index.css';
import './custom-hint.css';
import ReactGA from 'react-ga4';

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

        onStream(stream);

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
        log.error(`${err.name}: ${err.message}`);
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

  const onStream = (stream) => {
    input = context.createMediaStreamSource(stream);
    scriptProcessorNode = context.createScriptProcessor(bufferSize, 1, 1);

    input.connect(scriptProcessorNode);
    scriptProcessorNode.connect(context.destination);

    const onAudioProcess = new RealTimeBPMAnalyzer({
      debug: props.isDebug,
      scriptNode: {
        bufferSize: bufferSize,
        numberOfInputChannels: 1,
        numberOfOutputChannels: 1,
      },
      computeBPMDelay: 5000,
      stabilizationTime: 10000,
      continuousAnalysis: true,
      pushTime: 1000,
      pushCallback: (err, bpm, threshold) => {
        if (err) {
          log.warn(`${err.name}: ${err.message}`);

          setIsResultReady(false);
          return;
        }

        if (bpm && bpm.length) {
          setIsResultReady(true);
          setThreshold(Math.round(threshold * 100) / 100);

          setPrimaryBPM(`${bpm[0].tempo}`);
          setSecondaryBPM(`${bpm[1].tempo}`);

          log.info(bpm);
          log.info(`Threshold, ${threshold}`);

          ReactGA.event('detect', {
            mode: 'realtime',
            bpm: bpm[0].tempo,
            threshold: threshold,
          });
          appInsights.trackEvent({
            name: 'detect',
            properties: {
              mode: 'realtime',
              bpm: bpm[0].tempo,
              threshold: threshold,
            },
          });
        }
      },
      onBpmStabilized: (threshold) => {
        onAudioProcess.clearValidPeaks(threshold);
      },
    });

    scriptProcessorNode.onaudioprocess = (e) => {
      onAudioProcess.analyze(e);
    };
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
            NEW! <a href="/upload">BPM detection in hosted mp3/wav files</a>
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
