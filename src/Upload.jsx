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
import NativeShareButton from './NativeShareButton';

const uploadPublishingPage = getPublishingPage('upload');

export function createSafeAudioAnalysisError(stage) {
  const messages = {
    fetch: 'Audio URL fetch failed.',
    read: 'The selected audio file could not be read.',
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [primaryBPM, setPrimaryBPM] = useState(``);
  const [resultMode, setResultMode] = useState('');
  const [isResultReady, setIsResultReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('');

  useEffect(() => {
    ReactGA.event('select_content', {
      content_type: 'mode',
      item_id: 'url',
    });
  }, []);

  const analyzeAudio = async ({ loadArrayBuffer, mode, initialStage }) => {
    setIsResultReady(false);
    setIsAnalyzing(true);
    setAnalysisMode(mode);
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new window.AudioContext();
    let stage = initialStage;

    try {
      const buffer = await loadArrayBuffer();
      stage = 'decode';
      const data = await new Promise((resolve, reject) => {
        context.decodeAudioData(buffer, resolve, reject);
      });

      stage = 'analysis';
      const bpm = detect(data);
      setPrimaryBPM(bpm);
      setResultMode(mode);
      setIsResultReady(true);

      ReactGA.event('detect', {
        mode,
        bpm,
        threshold: null,
      });

      appInsights?.trackEvent({
        name: 'detect',
        properties: {
          mode,
          bpm,
          threshold: null,
        },
      });
    } catch (err) {
      const safeError = createSafeAudioAnalysisError(stage);
      toast.error(safeError.message);
      console.error(err);
      appInsights?.trackException({ exception: safeError });
    } finally {
      setIsAnalyzing(false);
      setAnalysisMode('');
      await context.close?.().catch((error) => {
        log.warn(`Unable to close audio context: ${error.message}`);
      });
    }
  };

  const calculateBPM = () => {
    return analyzeAudio({
      mode: 'url',
      initialStage: 'fetch',
      loadArrayBuffer: async () => {
        const response = await fetch(url, {
          [APP_INSIGHTS_BYPASS_FETCH]: true,
        });

        if (response.ok === false) {
          throw new Error(`Audio request failed with ${response.status}.`);
        }

        return response.arrayBuffer();
      },
    });
  };

  const calculateFileBPM = () => {
    if (!selectedFile) {
      return Promise.resolve();
    }

    return analyzeAudio({
      mode: 'file',
      initialStage: 'read',
      loadArrayBuffer: () => selectedFile.arrayBuffer(),
    });
  };

  return (
    <main className="content publishing-page">
      <Seo page={uploadPublishingPage} />
      <article>
        <PublishingHeader page={uploadPublishingPage} />

        <section className="tool-panel" aria-label="Audio file BPM analyzer">
          {isResultReady && primaryBPM ? (
            <>
              <div className="tool-panel__result" aria-live="polite">
                {primaryBPM}
              </div>
              <p className="tool-panel__unit">BPM</p>
              <NativeShareButton
                bpm={primaryBPM}
                mode={resultMode === 'file' ? 'audio file' : 'audio URL'}
                className="tool-panel__secondary"
              />
            </>
          ) : null}

          {primaryBPM ? (
            <Feedback bpm={primaryBPM} log={log} type="file"></Feedback>
          ) : null}

          <div className="tool-panel__file-picker">
            <label className="tool-panel__secondary" htmlFor="audio-file">
              Choose an audio file
            </label>
            <input
              className="visually-hidden"
              id="audio-file"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.flac"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setPrimaryBPM('');
                setIsResultReady(false);
              }}
            />
            <span aria-live="polite">
              {selectedFile ? selectedFile.name : 'No file selected'}
            </span>
          </div>
          <div className="tool-panel__actions">
            <button
              className="tool-panel__primary"
              type="button"
              onClick={calculateFileBPM}
              disabled={!selectedFile || isAnalyzing}
            >
              {isAnalyzing && analysisMode === 'file'
                ? 'Analyzing file...'
                : 'Analyze selected file'}
            </button>
          </div>

          <p className="tool-panel__divider">
            <span>or use a direct link</span>
          </p>

          <label htmlFor="url">Direct URL of an MP3 or WAV file</label>
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
              disabled={!url || isAnalyzing}
            >
              {isAnalyzing && analysisMode === 'url'
                ? 'Fetching audio...'
                : 'Fetch and calculate'}
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
