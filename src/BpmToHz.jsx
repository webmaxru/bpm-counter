import React, { useMemo, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

const RATE_DIVISIONS = Object.freeze([
  ['4 bars', 16],
  ['2 bars', 8],
  ['1 bar (whole note)', 4],
  ['Half note', 2],
  ['Dotted quarter', 1.5],
  ['Quarter note (one beat)', 1],
  ['Dotted eighth', 0.75],
  ['Quarter triplet', 2 / 3],
  ['Eighth note', 0.5],
  ['Eighth triplet', 1 / 3],
  ['Sixteenth note', 0.25],
  ['Thirty-second note', 0.125],
]);

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function bpmToHz(bpm) {
  const tempo = Number(bpm);

  if (!Number.isFinite(tempo) || tempo <= 0) {
    return null;
  }

  return tempo / 60;
}

export function hzToBpm(hz) {
  const frequency = Number(hz);

  if (!Number.isFinite(frequency) || frequency <= 0) {
    return null;
  }

  return frequency * 60;
}

export function calculateRates(bpm) {
  const beatHz = bpmToHz(bpm);

  if (beatHz === null) {
    return [];
  }

  return RATE_DIVISIONS.map(([label, beats]) => {
    const seconds = beats / beatHz;

    return {
      label,
      hertz: round(1 / seconds, 4),
      milliseconds: round(seconds * 1000, 2),
    };
  });
}

function BpmToHz() {
  const [bpm, setBpm] = useState('120');
  const [hz, setHz] = useState('2');
  const rates = useMemo(() => calculateRates(bpm), [bpm]);
  const bpmFromHz = useMemo(() => hzToBpm(hz), [hz]);

  return (
    <ToolPageLayout pageId="bpm-to-hz">
      <section className="tool-panel" aria-labelledby="bpm-hz-input">
        <label htmlFor="bpm-hz-input">Tempo in BPM</label>
        <input
          id="bpm-hz-input"
          type="number"
          min="1"
          max="400"
          step="0.1"
          inputMode="decimal"
          value={bpm}
          onChange={(event) => setBpm(event.target.value)}
        />

        {rates.length ? (
          <div className="publishing-table-wrapper" aria-live="polite">
            <table className="publishing-table">
              <thead>
                <tr>
                  <th scope="col">Note value</th>
                  <th scope="col">Rate (Hz)</th>
                  <th scope="col">Period (ms)</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.label}>
                    <td>{rate.label}</td>
                    <td>{rate.hertz} Hz</td>
                    <td>{rate.milliseconds} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p role="alert">Enter a BPM value greater than zero.</p>
        )}

        <label htmlFor="hz-bpm-input">Frequency in Hz (Hz to BPM)</label>
        <input
          id="hz-bpm-input"
          type="number"
          min="0.001"
          max="100"
          step="0.01"
          inputMode="decimal"
          value={hz}
          onChange={(event) => setHz(event.target.value)}
        />
        <p className="tool-panel__note" aria-live="polite">
          {bpmFromHz !== null
            ? `${hz} Hz is ${round(bpmFromHz, 2)} BPM when one cycle equals one beat.`
            : 'Enter a frequency greater than zero.'}
        </p>
      </section>
    </ToolPageLayout>
  );
}

export default BpmToHz;
