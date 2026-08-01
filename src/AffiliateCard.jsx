import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import ReactGA from 'react-ga4';
import { TelemetryContext } from './TelemetryContext';
import { getAffiliateCampaign } from './affiliateCampaigns';
import './AffiliateCard.css';

const VIEWABLE_RATIO = 0.5;
const VIEWABLE_DURATION_MS = 1000;

function AffiliateCard({ campaignId, placement }) {
  const appInsights = useContext(TelemetryContext);
  const campaign = getAffiliateCampaign(campaignId);
  const cardRef = useRef(null);
  const titleId = useId();
  const gaTrackedEvents = useRef(new Set());
  const appInsightsTrackedEvents = useRef(new Set());

  const eventProperties = useMemo(
    () => ({
      campaign_id: campaign.id,
      creative_id: campaign.creativeId,
      network: campaign.network,
      merchant: campaign.merchant,
      placement,
      destination_host: campaign.destinationHost,
    }),
    [campaign, placement]
  );

  const trackOnce = useCallback(
    (name) => {
      if (!gaTrackedEvents.current.has(name)) {
        gaTrackedEvents.current.add(name);
        ReactGA.event(name, eventProperties);
      }

      if (
        appInsights &&
        !appInsightsTrackedEvents.current.has(name)
      ) {
        appInsightsTrackedEvents.current.add(name);
        appInsights.trackEvent({
          name,
          properties: eventProperties,
        });
      }
    },
    [appInsights, eventProperties]
  );

  useEffect(() => {
    trackOnce('affiliate_impression');
  }, [trackOnce]);

  useEffect(() => {
    const card = cardRef.current;

    if (!card || !window.IntersectionObserver) {
      return undefined;
    }

    let viewableTimer;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= VIEWABLE_RATIO
        ) {
          window.clearTimeout(viewableTimer);
          viewableTimer = window.setTimeout(() => {
            trackOnce('affiliate_viewable');
          }, VIEWABLE_DURATION_MS);
          return;
        }

        window.clearTimeout(viewableTimer);
      },
      { threshold: [VIEWABLE_RATIO] }
    );

    observer.observe(card);

    return () => {
      window.clearTimeout(viewableTimer);
      observer.disconnect();
    };
  }, [trackOnce]);

  const handleClick = () => {
    ReactGA.event('affiliate_click', eventProperties);
    appInsights?.trackEvent({
      name: 'affiliate_click',
      properties: eventProperties,
    });
  };

  return (
    <aside
      className="affiliate-card"
      ref={cardRef}
      aria-labelledby={titleId}
    >
      <p className="affiliate-card__label">Affiliate recommendation</p>
      <h2 className="affiliate-card__title" id={titleId}>
        {campaign.title}
      </h2>
      <p className="affiliate-card__description">{campaign.description}</p>
      <a
        className="affiliate-card__link"
        href={campaign.href}
        onClick={handleClick}
        target="_blank"
        rel="sponsored noopener noreferrer"
        aria-label={`${campaign.callToAction} (opens in a new tab)`}
      >
        {campaign.callToAction}
      </a>
      <p className="affiliate-card__disclosure">
        As an Amazon Associate I earn from qualifying purchases.{' '}
        <a href="/affiliate-disclosure">Learn more</a>.
      </p>
    </aside>
  );
}

export default AffiliateCard;
