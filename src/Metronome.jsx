import React, { useCallback, useEffect, useRef, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import './Metronome.css';
import { getStrings } from './i18n';

export const MIN_BPM = 30;
export const MAX_BPM = 300;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;

export function clampBpm(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 120;
  }

  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(numeric * 10) / 10));
}

export function nextBeatTime(previousTime, bpm) {
  return previousTime + 60 / clampBpm(bpm);
}

function getAudioContextClass() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.AudioContext || window.webkitAudioContext || null;
}

function scheduleClick(context, time, accented) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'square';
  oscillator.frequency.value = accented ? 1760 : 1175;
  gain.gain.setValueAtTime(accented ? 0.5 : 0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.06);

  return { oscillator, gain };
}

function silenceClick({ oscillator, gain }) {
  try {
    oscillator.stop();
  } catch {
    // The oscillator has already finished.
  }
  oscillator.disconnect?.();
  gain.disconnect?.();
}

function parseTempo(value) {
  const text = String(value).trim();
  const numeric = Number(text);

  return text !== '' && Number.isFinite(numeric) ? numeric : null;
}

export function MetronomePanel({ initialBpm = 120, locale = 'en' }) {
  const strings = getStrings(locale);
  const text = strings.metronome;
  const [bpm, setBpm] = useState(() => clampBpm(initialBpm));
  const [tempoDraft, setTempoDraft] = useState(() => String(clampBpm(initialBpm)));
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [running, setRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const supported = getAudioContextClass() !== null;

  const contextRef = useRef(null);
  const timerRef = useRef(null);
  const nextTimeRef = useRef(0);
  const beatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerBar);
  const scheduledClicksRef = useRef(new Set());
  const beatTimeoutsRef = useRef(new Set());
  // Bumped on every stop/unmount so a start that is still awaiting resume()
  // can tell it has been cancelled.
  const sessionRef = useRef(0);
  const startingRef = useRef(false);

  bpmRef.current = bpm;
  beatsRef.current = beatsPerBar;

  const halt = useCallback(() => {
    sessionRef.current += 1;
    startingRef.current = false;

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    beatTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    beatTimeoutsRef.current.clear();
    scheduledClicksRef.current.forEach(silenceClick);
    scheduledClicksRef.current.clear();
  }, []);

  const stop = useCallback(() => {
    halt();
    setRunning(false);
    setCurrentBeat(-1);
  }, [halt]);

  const scheduler = useCallback(() => {
    const context = contextRef.current;

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const beats = beatsRef.current;

    // After a main-thread stall or background timer throttling, beats that are
    // already in the past are skipped (keeping the bar position) instead of
    // being played all at once.
    while (nextTimeRef.current < now) {
      nextTimeRef.current = nextBeatTime(nextTimeRef.current, bpmRef.current);
      beatRef.current = (beatRef.current + 1) % beats;
    }

    while (nextTimeRef.current < now + SCHEDULE_AHEAD_SECONDS) {
      const beat = beatRef.current % beats;
      const time = nextTimeRef.current;
      const click = scheduleClick(context, time, beat === 0);

      scheduledClicksRef.current.add(click);
      click.oscillator.onended = () => {
        scheduledClicksRef.current.delete(click);
      };

      const timeoutId = window.setTimeout(() => {
        beatTimeoutsRef.current.delete(timeoutId);
        setCurrentBeat(beat);
      }, Math.max(0, (time - now) * 1000));
      beatTimeoutsRef.current.add(timeoutId);

      nextTimeRef.current = nextBeatTime(time, bpmRef.current);
      beatRef.current = (beat + 1) % beats;
    }
  }, []);

  const start = useCallback(async () => {
    const AudioContextClass = getAudioContextClass();

    if (!AudioContextClass || startingRef.current || timerRef.current !== null) {
      return;
    }

    startingRef.current = true;
    const session = sessionRef.current;

    try {
      if (!contextRef.current) {
        contextRef.current = new AudioContextClass();
      }

      if (contextRef.current.state === 'suspended') {
        await contextRef.current.resume();
      }
    } catch {
      if (session === sessionRef.current) {
        startingRef.current = false;
      }
      return;
    }

    if (session !== sessionRef.current || !contextRef.current) {
      return;
    }

    startingRef.current = false;
    beatRef.current = 0;
    nextTimeRef.current = contextRef.current.currentTime + 0.05;
    setRunning(true);
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);
  }, [scheduler]);

  useEffect(
    () => () => {
      halt();
      const context = contextRef.current;
      contextRef.current = null;
      context?.close?.();
    },
    [halt]
  );

  const applyBpm = (value) => {
    const next = clampBpm(value);
    setBpm(next);
    setTempoDraft(String(next));
  };

  const adjust = (delta) => applyBpm(bpm + delta);

  const handleTempoInput = (event) => {
    const { value } = event.target;
    const numeric = parseTempo(value);

    setTempoDraft(value);

    if (numeric !== null && numeric >= MIN_BPM && numeric <= MAX_BPM) {
      setBpm(clampBpm(numeric));
    }
  };

  const commitTempo = () => {
    const numeric = parseTempo(tempoDraft);
    applyBpm(numeric === null ? bpm : numeric);
  };

  return (
      <section className="tool-panel metronome" aria-labelledby="metronome-bpm-input">
        <label htmlFor="metronome-bpm-input">{strings.tempoInput}</label>
        <input
          id="metronome-bpm-input"
          type="number"
          min={MIN_BPM}
          max={MAX_BPM}
          step="0.1"
          inputMode="decimal"
          value={tempoDraft}
          onChange={handleTempoInput}
          onBlur={commitTempo}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitTempo();
            }
          }}
        />
        <input
          className="metronome__slider"
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          step="1"
          value={bpm}
          aria-label={text.slider}
          onChange={(event) => applyBpm(event.target.value)}
        />

        <div className="metronome__steps" role="group" aria-label={text.adjust}>
          <button type="button" onClick={() => adjust(-5)}>
            −5
          </button>
          <button type="button" onClick={() => adjust(-1)}>
            −1
          </button>
          <button type="button" onClick={() => adjust(1)}>
            +1
          </button>
          <button type="button" onClick={() => adjust(5)}>
            +5
          </button>
        </div>

        <label htmlFor="metronome-beats-select">{text.beatsPerBar}</label>
        <select
          id="metronome-beats-select"
          value={beatsPerBar}
          onChange={(event) => setBeatsPerBar(Number(event.target.value))}
        >
          {[2, 3, 4, 5, 6, 7].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>

        <div className="metronome__beats" aria-hidden="true">
          {Array.from({ length: beatsPerBar }, (_, index) => (
            <span
              key={index}
              className={`metronome__beat${
                index === currentBeat ? ' metronome__beat--active' : ''
              }${index === 0 ? ' metronome__beat--accent' : ''}`}
            />
          ))}
        </div>

        {supported ? (
          <button
            type="button"
            className="metronome__toggle"
            aria-pressed={running}
            onClick={running ? stop : start}
          >
            {running ? text.stop : text.start}
          </button>
        ) : (
          <p role="alert">
            {text.unsupported}
          </p>
        )}
        <p className="tool-panel__note" aria-live="polite">
          {running
            ? text.playing(bpm, beatsPerBar)
            : text.ready(bpm, beatsPerBar)}
        </p>
      </section>
  );
}

function Metronome({ locale = 'en' }) {
  return (
    <ToolPageLayout pageId={locale === 'nb' ? 'metronome-nb' : 'metronome'}>
      <MetronomePanel locale={locale} />
    </ToolPageLayout>
  );
}

export default Metronome;
