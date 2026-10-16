import React, { useCallback, useEffect, useRef, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import './Metronome.css';

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
}

function Metronome() {
  const [bpm, setBpm] = useState(120);
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

  bpmRef.current = bpm;
  beatsRef.current = beatsPerBar;

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRunning(false);
    setCurrentBeat(-1);
  }, []);

  const scheduler = useCallback(() => {
    const context = contextRef.current;

    if (!context) {
      return;
    }

    while (nextTimeRef.current < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const beat = beatRef.current;
      scheduleClick(context, nextTimeRef.current, beat === 0);

      const delay = Math.max(0, (nextTimeRef.current - context.currentTime) * 1000);
      window.setTimeout(() => setCurrentBeat(beat), delay);

      nextTimeRef.current = nextBeatTime(nextTimeRef.current, bpmRef.current);
      beatRef.current = (beat + 1) % beatsRef.current;
    }
  }, []);

  const start = useCallback(async () => {
    const AudioContextClass = getAudioContextClass();

    if (!AudioContextClass) {
      return;
    }

    if (!contextRef.current) {
      contextRef.current = new AudioContextClass();
    }

    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume();
    }

    beatRef.current = 0;
    nextTimeRef.current = contextRef.current.currentTime + 0.05;
    setRunning(true);
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);
  }, [scheduler]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      contextRef.current?.close?.();
    },
    []
  );

  const adjust = (delta) => setBpm((value) => clampBpm(value + delta));

  return (
    <ToolPageLayout pageId="metronome">
      <section className="tool-panel metronome" aria-labelledby="metronome-bpm-input">
        <label htmlFor="metronome-bpm-input">Tempo in BPM</label>
        <input
          id="metronome-bpm-input"
          type="number"
          min={MIN_BPM}
          max={MAX_BPM}
          step="1"
          inputMode="numeric"
          value={bpm}
          onChange={(event) => setBpm(clampBpm(event.target.value))}
        />
        <input
          className="metronome__slider"
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          step="1"
          value={bpm}
          aria-label="Tempo slider"
          onChange={(event) => setBpm(clampBpm(event.target.value))}
        />

        <div className="metronome__steps" role="group" aria-label="Adjust tempo">
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

        <label htmlFor="metronome-beats-select">Beats per bar</label>
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
            {running ? 'Stop' : 'Start metronome'}
          </button>
        ) : (
          <p role="alert">
            This browser does not support the Web Audio API, so the metronome
            cannot play clicks here.
          </p>
        )}
        <p className="tool-panel__note" aria-live="polite">
          {running
            ? `Playing ${bpm} BPM in ${beatsPerBar}/4. Beat ${
                currentBeat + 1 || 1
              } of ${beatsPerBar}.`
            : `Ready at ${bpm} BPM, ${beatsPerBar} beats per bar.`}
        </p>
      </section>
    </ToolPageLayout>
  );
}

export default Metronome;
