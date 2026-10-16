import React, { useEffect, useRef, useState } from 'react';
import { adsConfig, getAdSenseSlot, isAdSenseEnabled } from './ads';
import './AdSlot.css';

const LAZY_ROOT_MARGIN = '600px 0px';

/**
 * A manual AdSense unit with a reserved height.
 *
 * - Renders only when a slot id is configured (VITE_ADSENSE_SLOT_*). The
 *   in-article and multiplex unit ids are committed in `.env`, so both units
 *   ship enabled in every build; clear a variable to switch that unit off.
 *   Auto ads keep working alongside the manual units.
 * - Reserves its height before the ad loads to avoid layout shift (CLS).
 * - Requests the ad only when the slot is within ~600 px of the viewport.
 * - Labelled "Advertisements", one of the two labels AdSense permits
 *   (support.google.com/adsense/answer/1346295, "Placing ads under a misleading heading").
 * - Callers key the slot by page id so client-side navigation requests a new ad.
 */
function AdSlot({ name, format = 'auto', layout, minHeight = 280 }) {
  const slot = getAdSenseSlot(name);
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!slot || visible) {
      return undefined;
    }

    const element = containerRef.current;

    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: LAZY_ROOT_MARGIN }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [slot, visible]);

  useEffect(() => {
    if (!slot || !visible || pushedRef.current) {
      return;
    }

    pushedRef.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // The ad script may be blocked; the reserved space simply stays empty.
    }
  }, [slot, visible]);

  if (!slot || !isAdSenseEnabled()) {
    return null;
  }

  return (
    <div
      className={`ad-slot ad-slot--${name}`}
      ref={containerRef}
      style={{ minHeight: `${minHeight}px` }}
    >
      <span className="ad-slot__label">Advertisements</span>
      {visible ? (
        <ins
          className="adsbygoogle"
          style={layout === 'in-article' ? { display: 'block', textAlign: 'center' } : { display: 'block' }}
          data-ad-client={adsConfig.adsense.clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-ad-layout={layout}
          data-full-width-responsive={format === 'auto' ? 'true' : undefined}
        />
      ) : null}
    </div>
  );
}

export default AdSlot;
