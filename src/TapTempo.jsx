import React, { useMemo, useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import NativeShareButton from './NativeShareButton';
import { performTapHaptic } from './nativePlatform';
import { getStrings } from './i18n';

const MAX_TAPS = 8;
const RESET_GAP_MS = 2500;

export function calculateTapBpm(tapTimes) {
  if (tapTimes.length < 2) {
    return null;
  }

  const intervals = tapTimes.slice(1).map((time, index) => {
    return time - tapTimes[index];
  });
  const averageInterval =
    intervals.reduce((total, interval) => total + interval, 0) /
    intervals.length;

  if (!Number.isFinite(averageInterval) || averageInterval <= 0) {
    return null;
  }

  return Math.round((60000 / averageInterval) * 10) / 10;
}

function TapTempo({ locale = 'en' }) {
  const strings = getStrings(locale);
  const [tapTimes, setTapTimes] = useState([]);
  const bpm = useMemo(() => calculateTapBpm(tapTimes), [tapTimes]);

  const handleTap = () => {
    const now = window.performance.now();
    void performTapHaptic();

    setTapTimes((currentTapTimes) => {
      const lastTap = currentTapTimes.at(-1);

      if (lastTap === undefined || now - lastTap > RESET_GAP_MS) {
        return [now];
      }

      return [...currentTapTimes, now].slice(-MAX_TAPS);
    });
  };

  return (
    <ToolPageLayout pageId={locale === 'nb' ? 'tap-tempo-nb' : 'tap-tempo'}>
      <section className="tool-panel" aria-labelledby="tap-tempo-result">
        <div
          className="tool-panel__result"
          id="tap-tempo-result"
          aria-live="polite"
        >
          {bpm ?? '--'}
        </div>
        <p className="tool-panel__unit">BPM</p>
        <div className="tool-panel__actions">
          <button
            className="tool-panel__primary"
            type="button"
            onClick={handleTap}
          >
            {strings.tapBeat}
          </button>
          <button
            className="tool-panel__secondary"
            type="button"
            onClick={() => setTapTimes([])}
            disabled={!tapTimes.length}
          >
            {strings.reset}
          </button>
          <NativeShareButton
            bpm={bpm}
            mode="tap tempo"
            className="tool-panel__secondary"
            locale={locale}
          />
        </div>
        <p className="tool-panel__hint">
          {tapTimes.length
            ? strings.recentTaps(tapTimes.length, MAX_TAPS)
            : strings.tapHint}
        </p>
      </section>
    </ToolPageLayout>
  );
}

export default TapTempo;
