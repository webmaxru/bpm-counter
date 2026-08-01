import React, { useMemo, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

export function calculateTempoFamily(bpm) {
  const numericBpm = Number(bpm);

  if (!Number.isFinite(numericBpm) || numericBpm <= 0) {
    return null;
  }

  return {
    halfTime: Math.round((numericBpm / 2) * 100) / 100,
    original: Math.round(numericBpm * 100) / 100,
    doubleTime: Math.round(numericBpm * 2 * 100) / 100,
  };
}

function BpmConverter() {
  const [bpm, setBpm] = useState('128');
  const tempoFamily = useMemo(() => calculateTempoFamily(bpm), [bpm]);

  return (
    <ToolPageLayout pageId="bpm-converter">
      <section className="tool-panel" aria-labelledby="bpm-converter-input">
        <label htmlFor="bpm-converter-input">Tempo in BPM</label>
        <input
          id="bpm-converter-input"
          type="number"
          min="1"
          max="400"
          step="0.01"
          inputMode="decimal"
          value={bpm}
          onChange={(event) => setBpm(event.target.value)}
        />

        {tempoFamily ? (
          <div className="tool-results-grid" aria-live="polite">
            <div className="tool-result-card">
              <span className="tool-result-card__label">Half-time</span>
              <span className="tool-result-card__value">
                {tempoFamily.halfTime} BPM
              </span>
            </div>
            <div className="tool-result-card">
              <span className="tool-result-card__label">Original</span>
              <span className="tool-result-card__value">
                {tempoFamily.original} BPM
              </span>
            </div>
            <div className="tool-result-card">
              <span className="tool-result-card__label">Double-time</span>
              <span className="tool-result-card__value">
                {tempoFamily.doubleTime} BPM
              </span>
            </div>
          </div>
        ) : (
          <p role="alert">Enter a BPM value greater than zero.</p>
        )}
      </section>
    </ToolPageLayout>
  );
}

export default BpmConverter;
