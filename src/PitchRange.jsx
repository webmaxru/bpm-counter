import React, { useMemo, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

export const PITCH_RANGES = Object.freeze([6, 8, 10, 16, 50, 100]);

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function positive(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function pitchRangeBounds(bpm, rangePercent) {
  const tempo = positive(bpm);
  const range = positive(rangePercent);

  if (!tempo || !range) {
    return null;
  }

  return {
    min: round(tempo * (1 - range / 100), 2),
    max: round(tempo * (1 + range / 100), 2),
  };
}

export function pitchPercent(fromBpm, toBpm) {
  const from = positive(fromBpm);
  const to = positive(toBpm);

  if (!from || !to) {
    return null;
  }

  return round(((to - from) / from) * 100, 2);
}

export function semitoneShift(fromBpm, toBpm) {
  const from = positive(fromBpm);
  const to = positive(toBpm);

  if (!from || !to) {
    return null;
  }

  return round(12 * Math.log2(to / from), 2);
}

function PitchRange() {
  const [bpm, setBpm] = useState('126');
  const [range, setRange] = useState('8');
  const [target, setTarget] = useState('130');

  const bounds = useMemo(() => pitchRangeBounds(bpm, range), [bpm, range]);
  const percent = useMemo(() => pitchPercent(bpm, target), [bpm, target]);
  const semitones = useMemo(() => semitoneShift(bpm, target), [bpm, target]);
  const reachable =
    bounds && percent !== null ? Math.abs(percent) <= Number(range) : null;

  return (
    <ToolPageLayout pageId="pitch-range">
      <section className="tool-panel" aria-labelledby="pitch-bpm-input">
        <label htmlFor="pitch-bpm-input">Track BPM</label>
        <input
          id="pitch-bpm-input"
          type="number"
          min="1"
          max="400"
          step="0.1"
          inputMode="decimal"
          value={bpm}
          onChange={(event) => setBpm(event.target.value)}
        />

        <label htmlFor="pitch-range-select">Pitch fader range</label>
        <select
          id="pitch-range-select"
          value={range}
          onChange={(event) => setRange(event.target.value)}
        >
          {PITCH_RANGES.map((value) => (
            <option key={value} value={value}>
              ±{value}%
            </option>
          ))}
        </select>

        {bounds ? (
          <div className="tool-results-grid" aria-live="polite">
            <div className="tool-result-card">
              <span className="tool-result-card__label">Slowest (−{range}%)</span>
              <span className="tool-result-card__value">{bounds.min} BPM</span>
            </div>
            <div className="tool-result-card">
              <span className="tool-result-card__label">Fastest (+{range}%)</span>
              <span className="tool-result-card__value">{bounds.max} BPM</span>
            </div>
          </div>
        ) : (
          <p role="alert">Enter a BPM value greater than zero.</p>
        )}

        <label htmlFor="pitch-target-input">Target BPM (the other track)</label>
        <input
          id="pitch-target-input"
          type="number"
          min="1"
          max="400"
          step="0.1"
          inputMode="decimal"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        />

        {percent !== null ? (
          <div className="tool-results-grid" aria-live="polite">
            <div className="tool-result-card">
              <span className="tool-result-card__label">Pitch adjustment</span>
              <span className="tool-result-card__value">
                {percent > 0 ? '+' : ''}
                {percent}%
              </span>
            </div>
            <div className="tool-result-card">
              <span className="tool-result-card__label">
                Key change without key lock
              </span>
              <span className="tool-result-card__value">
                {semitones > 0 ? '+' : ''}
                {semitones} st
              </span>
            </div>
            <div className="tool-result-card">
              <span className="tool-result-card__label">Within ±{range}%?</span>
              <span className="tool-result-card__value">
                {reachable ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        ) : (
          <p role="alert">Enter a target BPM greater than zero.</p>
        )}
      </section>
    </ToolPageLayout>
  );
}

export default PitchRange;
