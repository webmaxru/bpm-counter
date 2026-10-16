import React, { useEffect, useRef, useState } from 'react';
import { adsConfig, getAdSenseSlot, isAdSenseEnabled } from './ads';
import './AdSlot.css';

const LAZY_ROOT_MARGIN = '600px 0px';

/**
 * A manual AdSense unit with a reserved height.
 *
 * - Renders nothing until a slot id is configured (VITE_ADSENSE_SLOT_*), so the
 *   current Auto ads setup is unchanged until Maxim creates the units.
 * - Reserves its height before the ad loads to avoid layout shift (CLS).
 * - Requests the ad only when the slot is within ~600 px of the viewport.
 * - Labelled "Advertisements", one of the two labels AdSense permits
 *   (support.google.com/adsense/answer/1346295, "Placing ads under a misleading heading").
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
          style={{ display: 'block' }}
          data-ad-client={adsConfig.adsense.clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-ad-layout={layout}
          data-full-width-responsive="true"
        />
      ) : null}
    </div>
  );
}

export default AdSlot;
