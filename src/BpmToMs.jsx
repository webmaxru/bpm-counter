import React, { useMemo, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

const NOTE_VALUES = Object.freeze([
  ['Whole note', 4],
  ['Half note', 2],
  ['Quarter note', 1],
  ['Dotted eighth', 0.75],
  ['Quarter triplet', 2 / 3],
  ['Eighth note', 0.5],
  ['Sixteenth note', 0.25],
]);

export function calculateNoteDurations(bpm) {
  const numericBpm = Number(bpm);

  if (!Number.isFinite(numericBpm) || numericBpm <= 0) {
    return [];
  }

  const quarterNote = 60000 / numericBpm;

  return NOTE_VALUES.map(([label, beats]) => ({
    label,
    milliseconds: Math.round(quarterNote * beats * 100) / 100,
  }));
}

function BpmToMs() {
  const [bpm, setBpm] = useState('120');
  const durations = useMemo(() => calculateNoteDurations(bpm), [bpm]);

  return (
    <ToolPageLayout pageId="bpm-to-ms">
      <section className="tool-panel" aria-labelledby="bpm-ms-input">
        <label htmlFor="bpm-ms-input">Tempo in BPM</label>
        <input
          id="bpm-ms-input"
          type="number"
          min="1"
          max="400"
          step="0.1"
          inputMode="decimal"
          value={bpm}
          onChange={(event) => setBpm(event.target.value)}
        />

        {durations.length ? (
          <div className="tool-results-grid" aria-live="polite">
            {durations.map((duration) => (
              <div className="tool-result-card" key={duration.label}>
                <span className="tool-result-card__label">
                  {duration.label}
                </span>
                <span className="tool-result-card__value">
                  {duration.milliseconds} ms
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p role="alert">Enter a BPM value greater than zero.</p>
        )}
      </section>
    </ToolPageLayout>
  );
}

export default BpmToMs;
