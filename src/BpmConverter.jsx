import React, { useMemo, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { getStrings } from './i18n';

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

function BpmConverter({ locale = 'en' }) {
  const strings = getStrings(locale);
  const [bpm, setBpm] = useState('128');
  const tempoFamily = useMemo(() => calculateTempoFamily(bpm), [bpm]);

  return (
    <ToolPageLayout pageId={locale === 'nb' ? 'bpm-converter-nb' : 'bpm-converter'}>
      <section className="tool-panel" aria-labelledby="bpm-converter-input">
        <label htmlFor="bpm-converter-input">{strings.tempoInput}</label>
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
              <span className="tool-result-card__label">{strings.halfTime}</span>
              <span className="tool-result-card__value">
                {tempoFamily.halfTime} BPM
              </span>
            </div>
            <div className="tool-result-card">
              <span className="tool-result-card__label">{strings.original}</span>
              <span className="tool-result-card__value">
                {tempoFamily.original} BPM
              </span>
            </div>
            <div className="tool-result-card">
              <span className="tool-result-card__label">{strings.doubleTime}</span>
              <span className="tool-result-card__value">
                {tempoFamily.doubleTime} BPM
              </span>
            </div>
          </div>
        ) : (
          <p role="alert">{strings.enterPositiveBpm}</p>
        )}
      </section>
    </ToolPageLayout>
  );
}

export default BpmConverter;
