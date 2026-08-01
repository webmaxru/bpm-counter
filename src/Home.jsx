/* eslint-disable no-unused-vars */
import './Home.css';
import Feedback from './Feedback.jsx';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createRealtimeBpmAnalyzer } from 'realtime-bpm-analyzer';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import './custom-hint.css';
import ReactGA from 'react-ga4';
import AffiliateCard from './AffiliateCard.jsx';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from './TelemetryService';
import { TelemetryContext } from './TelemetryContext';
import Seo from './Seo';
import {
  PublishingFaq,
  PublishingSections,
  RelatedPublishingPages,
} from './PublishingPage';
import { getPublishingPage } from './content/publishingPages';
import { useContentTelemetry } from './useContentTelemetry';

const homePublishingPage = getPublishingPage('home');

function Home(props) {
  let log = props.log;

  const isMobile = props.isMobile;
  const isForcedViz = props.isForcedViz;
  const testBPM = props.testBPM;
  const appInsights = useContext(TelemetryContext);
  useContentTelemetry(homePublishingPage);

  const audioContextRef = useRef(null);
  const audioInputRef = useRef(null);
  const audioMotionRef = useRef(null);
  const bpmAnalyzerRef = useRef(null);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const mediaStreamRef = useRef(null);

  const cleanupAudio = useCallback(() => {
    const bpmAnalyzer = bpmAnalyzerRef.current;
    const audioInput = audioInputRef.current;
    const audioMotion = audioMotionRef.current;
    const mediaStream = mediaStreamRef.current;
    const audioContexts = new Set([
      audioContextRef.current,
      audioMotion?.audioCtx,
    ]);

    bpmAnalyzer?.stop?.();
    bpmAnalyzer?.disconnect?.();
    audioInput?.disconnect?.();
    audioMotion?.toggleAnalyzer?.(false);
    audioMotion?.disconnectInput?.();
    audioMotion?.disconnectOutput?.();
    mediaStream?.getTracks?.().forEach((track) => track.stop());

    audioContexts.forEach((audioContext) => {
      if (audioContext?.state !== 'closed') {
        const closePromise = audioContext?.close?.();
        closePromise?.catch((error) => {
          log.warn(`Unable to close audio context: ${error.message}`);
        });
      }
    });

    bpmAnalyzerRef.current = null;
    audioInputRef.current = null;
    audioMotionRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    isStartingRef.current = false;
  }, [log]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanupAudio();
    };
  }, [cleanupAudio]);

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
        mode: 'realtime',
        bpm: null,
        threshold: null,
      },
    });
  }, [appInsights]);

  const startListening = async () => {
    if (isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;
    setIsListening(true);
    let startedSuccessfully = false;

    try {
      if (navigator.mediaDevices.getUserMedia) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new window.AudioContext();
        audioContextRef.current = context;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          await context.close();
          return;
        }

        mediaStreamRef.current = stream;
        await onStream(stream, context);

        if (!isMountedRef.current) {
          cleanupAudio();
          return;
        }

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
          audioMotionRef.current = audioMotion;

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

        if (isMountedRef.current) {
          setIsShowingInit(false);
          startedSuccessfully = true;
        }
      } else {
        toast.error('No luck with accessing audio in your browser...');
        log.error('Browser is not supported');
      }
    } catch (err) {
      cleanupAudio();
      log.error(`${err.name}: ${err.message}`);
      // P1 #7: Track mic/audio errors to App Insights
      appInsights?.trackException({ exception: err });
    } finally {
      isStartingRef.current = false;
      if (!startedSuccessfully && isMountedRef.current) {
        setIsListening(false);
      }
    }
  };

  const [threshold, setThreshold] = useState(0);
  const [primaryBPM, setPrimaryBPM] = useState(testBPM || ``);
  const [secondaryBPM, setSecondaryBPM] = useState(``);
  const [interimBPM, setInterimBPM] = useState(``);
  const [isListening, setIsListening] = useState(false);

  const [isShowingInit, setIsShowingInit] = useState(true);
  const [isResultReady, setIsResultReady] = useState(testBPM ? true : false);

  const [isSampleVisible, setSampleVisible] = useState(false);

  const toggleSampleVisibility = () => {
    setSampleVisible(!isSampleVisible);
  };

  const stopListening = () => {
    cleanupAudio();
    setIsListening(false);
    setIsShowingInit(true);
    window.location.reload();
  };

  const onStream = async (stream, context) => {
    const input = context.createMediaStreamSource(stream);
    audioInputRef.current = input;

    const bpmAnalyzer = await createRealtimeBpmAnalyzer(context, {
      debug: props.isDebug,
      continuousAnalysis: true,
      stabilizationTime: 10000,
    });
    bpmAnalyzerRef.current = bpmAnalyzer;

    if (!isMountedRef.current) {
      bpmAnalyzer.stop();
      bpmAnalyzer.disconnect();
      return;
    }

    input.connect(bpmAnalyzer.node);

    bpmAnalyzer.on('bpm', (data) => {
      if (isMountedRef.current && data.bpm && data.bpm.length) {
        setInterimBPM(`${data.bpm[0].tempo}`);

        log.info(data.bpm);
        log.info(`Threshold, ${data.threshold}`);
      }
    });

    bpmAnalyzer.on('bpmStable', (data) => {
      if (!isMountedRef.current) {
        return;
      }

      if (data.bpm && data.bpm.length) {
        setIsResultReady(true);
        setThreshold(Math.round(data.threshold * 100) / 100);

        setPrimaryBPM(`${data.bpm[0].tempo}`);
        if (data.bpm.length > 1) {
          setSecondaryBPM(`${data.bpm[1].tempo}`);
        }

        setInterimBPM(``);

        ReactGA.event('detect', {
          mode: 'realtime',
          bpm: data.bpm[0].tempo,
          threshold: data.threshold,
        });
        // P1 #6: Consistent event schema across detect events
        appInsights?.trackEvent({
          name: 'detect',
          properties: {
            mode: 'realtime',
            bpm: data.bpm[0].tempo,
            threshold: data.threshold,
          },
        });
      }

      bpmAnalyzer.reset();
    });

    bpmAnalyzer.on('error', (data) => {
      if (!isMountedRef.current) {
        return;
      }
      log.warn(data.message);
      setIsResultReady(false);
    });
  };

  return (
    <main className="content">
      <Seo page={homePublishingPage} />
      {isShowingInit ? (
        <div>
          <button
            onClick={startListening}
            disabled={isListening}
            className="btn-start"
            data-tooltip-id="home-hint"
            data-tooltip-content="Click and wait for some time for BPM stabilizes"
          >
            Start listening
          </button>

          <p>You will be asked to provide access to your microphone.</p>
          <p>App does not send any audio stream data to the servers.</p>

          <AffiliateCard
            campaignId="studio-headphones"
            placement="home_initial"
          />
        </div>
      ) : (
        <div>
          <h2 style={{ opacity: threshold + 0.4 }}>
            {isResultReady ? primaryBPM : null}
          </h2>
          <h3>{isResultReady ? 'BPM' : 'Listening. Wait...'}</h3>

          {!isResultReady && interimBPM ? (
            <p style={{ color: '#d98c5f', fontSize: '1.2em', opacity: 0.5, margin: 0 }}>
              {interimBPM}
            </p>
          ) : null}

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
            ></Feedback>
          ) : null}

          {isResultReady ? (
            <AffiliateCard
              campaignId="dj-controllers"
              placement="home_result"
            />
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

      {!isMobile ? (
        <Tooltip id="home-hint" place="top" className="custom-hint" />
      ) : null}

      <section className="home-publishing" aria-labelledby="home-guide-title">
        <h2 className="home-publishing__title" id="home-guide-title">
          Measure and understand tempo
        </h2>
        <p className="home-publishing__lede">{homePublishingPage.lede}</p>
        <PublishingSections page={homePublishingPage} />
        <PublishingFaq page={homePublishingPage} />
        <RelatedPublishingPages page={homePublishingPage} />
      </section>
    </main>
  );
}

// P1 #9: Per-route engagement tracking instead of whole-app
export default withAITracking(reactPlugin, Home);
