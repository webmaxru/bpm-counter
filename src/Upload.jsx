import React, { useState, useContext, useEffect } from 'react';
import detect from 'bpm-detective';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Feedback from './Feedback.jsx';
import ReactGA from 'react-ga4';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from './TelemetryService';
import { TelemetryContext } from './TelemetryContext';
import { Link } from 'react-router-dom';
import Seo from './Seo';
import {
  PublishingHeader,
  PublishingSections,
  RelatedPublishingPages,
} from './PublishingPage';
import { getPublishingPage } from './content/publishingPages';
import { useContentTelemetry } from './useContentTelemetry';
import { APP_INSIGHTS_BYPASS_FETCH } from './telemetryPrivacy';

const uploadPublishingPage = getPublishingPage('upload');

export function createSafeAudioAnalysisError(stage) {
  const messages = {
    fetch: 'Audio URL fetch failed.',
    decode: 'Audio decoding failed.',
    analysis: 'Audio BPM analysis failed.',
  };
  const safeStage = messages[stage] ? stage : 'analysis';
  const error = new Error(messages[safeStage]);
  error.name = `Audio${safeStage[0].toUpperCase()}${safeStage.slice(1)}Error`;
  return error;
}

function Upload(props) {
  let log = props.log;
  const appInsights = useContext(TelemetryContext);
  useContentTelemetry(uploadPublishingPage);

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
    let stage = 'fetch';

    fetch(url, {
      [APP_INSIGHTS_BYPASS_FETCH]: true,
    })
      .then(async (response) => {
        stage = 'decode';
        const buffer = await response.arrayBuffer();

        const data = await new Promise((resolve, reject) => {
          context.decodeAudioData(buffer, resolve, reject);
        });

        stage = 'analysis';
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
        const safeError = createSafeAudioAnalysisError(stage);
        toast.error(safeError.message);
        console.error(err);
        // P1 #7: Track decode/fetch errors to App Insights
        appInsights?.trackException({ exception: safeError });
      });
  };

  return (
    <main className="content publishing-page">
      <Seo page={uploadPublishingPage} />
      <article>
        <PublishingHeader page={uploadPublishingPage} />

        <section className="tool-panel" aria-label="Audio URL BPM analyzer">
          {isResultReady && primaryBPM ? (
            <>
              <div className="tool-panel__result" aria-live="polite">
                {primaryBPM}
              </div>
              <p className="tool-panel__unit">BPM</p>
            </>
          ) : null}

          {primaryBPM ? (
            <Feedback bpm={primaryBPM} log={log} type="file"></Feedback>
          ) : null}

          <label htmlFor="url">
            Direct URL of an MP3 or WAV file
          </label>
          <input
            id="url"
            type="url"
            placeholder="https://example.com/audio.mp3"
            onChange={(e) => setUrl(e.target.value)}
            value={url}
          />
          <p className="tool-panel__hint">
            Need a known-good URL?{' '}
            <button
              type="button"
              onClick={() => setUrl('/samples/bpmtechno-120.mp3')}
              className="hint-button"
            >
              Use the 120 BPM sample
            </button>
            .
          </p>
          <div className="tool-panel__actions">
            <button
              className="tool-panel__primary"
              type="button"
              onClick={calculateBPM}
              disabled={!url}
            >
              Fetch and calculate
            </button>
          </div>
          <p className="tool-panel__hint">
            Prefer live audio? Return to the{' '}
            <Link to="/">real-time BPM counter</Link>.
          </p>
        </section>

        <PublishingSections page={uploadPublishingPage} />
      </article>
      <RelatedPublishingPages page={uploadPublishingPage} />
    </main>
  );
}

// P1 #9: Per-route engagement tracking
export default withAITracking(reactPlugin, Upload);
