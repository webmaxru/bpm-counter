import React, { useMemo, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

const BAR_COUNTS = Object.freeze([1, 4, 8, 16, 32, 64]);

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function barsToSeconds(bpm, bars, beatsPerBar = 4) {
  const tempo = toNumber(bpm);
  const barCount = toNumber(bars);
  const beats = toNumber(beatsPerBar);

  if (!tempo || !barCount || !beats) {
    return null;
  }

  return (60 / tempo) * beats * barCount;
}

export function secondsToBars(bpm, seconds, beatsPerBar = 4) {
  const tempo = toNumber(bpm);
  const duration = toNumber(seconds);
  const beats = toNumber(beatsPerBar);

  if (!tempo || !duration || !beats) {
    return null;
  }

  return duration / ((60 / tempo) * beats);
}

export function formatDuration(seconds) {
  if (seconds === null || !Number.isFinite(seconds)) {
    return '-';
  }

  if (seconds < 60) {
    return `${(Math.round(seconds * 100) / 100).toString()} s`;
  }

  const tenths = Math.round(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  const restText = ((tenths % 600) / 10).toFixed(1).padStart(4, '0');

  return `${minutes}:${restText} min`;
}

function BarsToTime() {
  const [bpm, setBpm] = useState('128');
  const [beatsPerBar, setBeatsPerBar] = useState('4');
  const [bars, setBars] = useState('16');
  const [seconds, setSeconds] = useState('60');

  const beatSeconds = useMemo(
    () => barsToSeconds(bpm, 1, 1),
    [bpm]
  );
  const rows = useMemo(
    () =>
      BAR_COUNTS.map((count) => ({
        count,
        seconds: barsToSeconds(bpm, count, beatsPerBar),
      })),
    [bpm, beatsPerBar]
  );
  const customBarsSeconds = useMemo(
    () => barsToSeconds(bpm, bars, beatsPerBar),
    [bpm, bars, beatsPerBar]
  );
  const barsInDuration = useMemo(
    () => secondsToBars(bpm, seconds, beatsPerBar),
    [bpm, seconds, beatsPerBar]
  );
  const valid = beatSeconds !== null;

  return (
    <ToolPageLayout pageId="bars-to-time">
      <section className="tool-panel" aria-labelledby="bars-bpm-input">
        <label htmlFor="bars-bpm-input">Tempo in BPM</label>
        <input
          id="bars-bpm-input"
          type="number"
          min="1"
          max="400"
          step="0.1"
          inputMode="decimal"
          value={bpm}
          onChange={(event) => setBpm(event.target.value)}
        />

        <label htmlFor="bars-beats-input">Beats per bar</label>
        <input
          id="bars-beats-input"
          type="number"
          min="1"
          max="16"
          step="1"
          inputMode="numeric"
          value={beatsPerBar}
          onChange={(event) => setBeatsPerBar(event.target.value)}
        />

        {valid ? (
          <>
            <div className="tool-results-grid" aria-live="polite">
              <div className="tool-result-card">
                <span className="tool-result-card__label">One beat</span>
                <span className="tool-result-card__value">
                  {formatDuration(beatSeconds)}
                </span>
              </div>
              {rows.map((row) => (
                <div className="tool-result-card" key={row.count}>
                  <span className="tool-result-card__label">
                    {row.count === 1 ? '1 bar' : `${row.count} bars`}
                  </span>
                  <span className="tool-result-card__value">
                    {formatDuration(row.seconds)}
                  </span>
                </div>
              ))}
            </div>

            <label htmlFor="bars-count-input">Custom number of bars</label>
            <input
              id="bars-count-input"
              type="number"
              min="1"
              max="10000"
              step="1"
              inputMode="numeric"
              value={bars}
              onChange={(event) => setBars(event.target.value)}
            />
            <p className="tool-panel__note" aria-live="polite">
              {customBarsSeconds !== null
                ? `${bars} bars at ${bpm} BPM last ${formatDuration(customBarsSeconds)}.`
                : 'Enter a number of bars greater than zero.'}
            </p>

            <label htmlFor="bars-seconds-input">
              Duration in seconds (time to bars)
            </label>
            <input
              id="bars-seconds-input"
              type="number"
              min="0.1"
              max="36000"
              step="0.1"
              inputMode="decimal"
              value={seconds}
              onChange={(event) => setSeconds(event.target.value)}
            />
            <p className="tool-panel__note" aria-live="polite">
              {barsInDuration !== null
                ? `${seconds} seconds at ${bpm} BPM is ${
                    Math.round(barsInDuration * 100) / 100
                  } bars (${Math.round(barsInDuration * Number(beatsPerBar) * 100) / 100} beats).`
                : 'Enter a duration greater than zero.'}
            </p>
          </>
        ) : (
          <p role="alert">Enter a BPM value and beats per bar greater than zero.</p>
        )}
      </section>
    </ToolPageLayout>
  );
}

export default BarsToTime;
