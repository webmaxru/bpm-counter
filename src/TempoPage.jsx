import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ToolPageLayout from './ToolPageLayout';
import NotFound from './NotFound';
import { MetronomePanel } from './Metronome';
import { calculateTapBpm } from './TapTempo';
import { findPublishingPageByPath } from './content/publishingPages';
import {
  getTempoPath,
  isValidTempo,
  parseTempoSlug,
} from './content/tempoPages';
import { performTapHaptic } from './nativePlatform';

const MAX_TAPS = 8;
const RESET_GAP_MS = 2500;
const MATCH_TOLERANCE_BPM = 1.5;

/**
 * Compares a tapped tempo with the page tempo and says whether it matches,
 * is a half-time/double-time reading, or which tempo page fits better.
 */
export function compareTappedTempo(tappedBpm, targetBpm) {
  if (!Number.isFinite(tappedBpm) || tappedBpm <= 0) {
    return null;
  }

  const difference = Math.round((tappedBpm - targetBpm) * 10) / 10;

  if (Math.abs(difference) <= MATCH_TOLERANCE_BPM) {
    return { kind: 'match', difference };
  }
  if (Math.abs(tappedBpm * 2 - targetBpm) <= MATCH_TOLERANCE_BPM) {
    return { kind: 'half', difference };
  }
  if (Math.abs(tappedBpm / 2 - targetBpm) <= MATCH_TOLERANCE_BPM) {
    return { kind: 'double', difference };
  }

  const nearest = Math.round(tappedBpm);
  return {
    kind: 'other',
    difference,
    nearest: isValidTempo(nearest) ? nearest : null,
  };
}

function TapCheck({ bpm }) {
  const [tapTimes, setTapTimes] = useState([]);
  const tapped = useMemo(() => calculateTapBpm(tapTimes), [tapTimes]);
  const comparison = useMemo(
    () => (tapTimes.length >= 4 ? compareTappedTempo(tapped, bpm) : null),
    [tapped, tapTimes.length, bpm]
  );

  const handleTap = () => {
    const now = window.performance.now();
    void performTapHaptic();

    setTapTimes((current) => {
      const lastTap = current.at(-1);

      if (lastTap === undefined || now - lastTap > RESET_GAP_MS) {
        return [now];
      }

      return [...current, now].slice(-MAX_TAPS);
    });
  };

  let verdict = `Tap at least four beats of a track to check whether it is ${bpm} BPM.`;
  if (comparison?.kind === 'match') {
    verdict = `That matches ${bpm} BPM (${comparison.difference >= 0 ? '+' : ''}${comparison.difference} BPM).`;
  } else if (comparison?.kind === 'half') {
    verdict = `You are tapping at half-time: ${tapped} BPM is half of ${bpm}.`;
  } else if (comparison?.kind === 'double') {
    verdict = `You are tapping at double-time: ${tapped} BPM is twice ${bpm}.`;
  } else if (comparison?.kind === 'other') {
    verdict = `That is ${Math.abs(comparison.difference)} BPM ${comparison.difference > 0 ? 'faster' : 'slower'} than ${bpm}.`;
  } else if (tapTimes.length > 0) {
    verdict = `${tapTimes.length} tap${tapTimes.length === 1 ? '' : 's'} so far. Keep tapping with the beat.`;
  }

  return (
    <section className="tool-panel tempo-check" aria-labelledby="tempo-check-title">
      <h2 id="tempo-check-title" className="tempo-check__title">
        Tap along to check the tempo
      </h2>
      <div className="tool-panel__result" aria-live="polite">
        {tapped ?? '--'}
      </div>
      <p className="tool-panel__unit">BPM tapped</p>
      <div className="tool-panel__actions">
        <button className="tool-panel__primary" type="button" onClick={handleTap}>
          Tap beat
        </button>
        <button
          className="tool-panel__secondary"
          type="button"
          onClick={() => setTapTimes([])}
          disabled={!tapTimes.length}
        >
          Reset
        </button>
      </div>
      <p className="tool-panel__hint" aria-live="polite">
        {verdict}
        {comparison?.kind === 'other' && comparison.nearest ? (
          <>
            {' '}
            <Link to={getTempoPath(comparison.nearest)}>
              Open the {comparison.nearest} BPM page
            </Link>
            .
          </>
        ) : null}
      </p>
    </section>
  );
}

export function TempoTools({ bpm }) {
  return (
    <div className="tempo-tools">
      <MetronomePanel key={`metronome-${bpm}`} initialBpm={bpm} />
      <TapCheck key={`tap-${bpm}`} bpm={bpm} />
    </div>
  );
}

function TempoPage() {
  const { tempo } = useParams();
  const bpm = parseTempoSlug(tempo);
  const page = bpm === null ? null : findPublishingPageByPath(getTempoPath(bpm));

  if (!page) {
    return <NotFound />;
  }

  return (
    <ToolPageLayout key={page.id} page={page}>
      <TempoTools bpm={bpm} />
    </ToolPageLayout>
  );
}

export default TempoPage;
