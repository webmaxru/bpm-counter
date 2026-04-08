import React, { useState, useContext, useEffect } from 'react';
import detect from 'bpm-detective';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Feedback from './Feedback.js';
import ReactGA from 'react-ga4';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from './TelemetryService';
import { TelemetryContext } from './TelemetryContext';

function Upload(props) {
  let log = props.log;
  const appInsights = useContext(TelemetryContext);

  const query = new URLSearchParams(window.location.search);

  const [url, setUrl] = useState(query.get('url') ?? '');
  const [primaryBPM, setPrimaryBPM] = useState(``);
  const [isResultReady, setIsResultReady] = useState(false);

  useEffect(() => {
    ReactGA.event('select_content', {
      content_type: 'mode',
      item_id: 'url',
    });
  }, []);

  const calculateBPM = () => {
    setIsResultReady(false);
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new window.AudioContext();

    fetch(url)
      .then(async (response) => {
        const buffer = await response.arrayBuffer();

        const data = await new Promise((resolve, reject) => {
          context.decodeAudioData(buffer, resolve, reject);
        });

        const bpm = detect(data);
        setPrimaryBPM(bpm);
        setIsResultReady(true);

        ReactGA.event('detect', {
          mode: 'url',
          bpm: bpm,
          threshold: null,
        });

        // P1 #6: Consistent event schema — matches Home.js detect events
        appInsights?.trackEvent({
          name: 'detect',
          properties: {
            mode: 'url',
            bpm: bpm,
            threshold: null,
          },
        });
      })
      .catch((err) => {
        toast.error(`${err}`);
        console.error(err);
        // P1 #7: Track decode/fetch errors to App Insights
        appInsights?.trackException({ exception: err });
      });
  };

  return (
    <main className="content">
      {isResultReady && primaryBPM ? (
        <>
          <h2>{primaryBPM}</h2>
          <h3>BPM</h3>
        </>
      ) : null}

      {primaryBPM ? (
        <Feedback bpm={primaryBPM} log={log} type="file"></Feedback>
      ) : null}

      <br />

      <label htmlFor="url">
        URL of mp3/wav file&nbsp;|&nbsp;
        <span
          onClick={() => setUrl('/samples/bpmtechno-120.mp3')}
          className="hint"
        >
          use sample
        </span>
      </label>
      <input
        id="url"
        type="url"
        placeholder="https://... mp3, wav"
        onChange={(e) => setUrl(e.target.value)}
        value={url}
      />
      <br />
      <br />
      <button className="button" onClick={calculateBPM}>
        Fetch and calculate
      </button>

      <br />
      <br />

      <p>
        Return to <a href="/">real-time BPM detection</a>
      </p>
    </main>
  );
}

// P1 #9: Per-route engagement tracking
export default withAITracking(reactPlugin, Upload);
