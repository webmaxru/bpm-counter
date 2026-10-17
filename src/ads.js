import { isAdEligiblePath } from './adPlacement.js';

export const AD_PROVIDERS = Object.freeze({
  ADSENSE: 'adsense',
  AMAZON: 'amazon',
});

const DEFAULT_AD_PROVIDERS = [AD_PROVIDERS.ADSENSE];
const ADSENSE_CLIENT_ID =
  import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-6118980043742623';
const AMAZON_SCRIPT_URL =
  import.meta.env.VITE_AMAZON_ADS_SCRIPT_URL ||
  'https://c.amazon-adsystem.com/aax2/apstag.js';

function getConfiguredProviders() {
  const configuredValue =
    import.meta.env.VITE_AD_PROVIDERS || DEFAULT_AD_PROVIDERS.join(',');
  const providers = configuredValue
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => Object.values(AD_PROVIDERS).includes(provider));

  return [...new Set(providers)].length > 0
    ? [...new Set(providers)]
    : DEFAULT_AD_PROVIDERS;
}

export const adsConfig = Object.freeze({
  providers: getConfiguredProviders(),
  adsense: Object.freeze({
    clientId: ADSENSE_CLIENT_ID,
    scriptUrl: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`,
  }),
  amazon: Object.freeze({
    scriptUrl: AMAZON_SCRIPT_URL,
  }),
});

const ADSENSE_SLOTS = Object.freeze({
  // Manual units (AdSense → Ads → By ad unit). The ids are set in `.env`, so
  // both units are enabled by default; with no id configured the slot renders
  // nothing and only Auto ads run.
  inArticle: import.meta.env.VITE_ADSENSE_SLOT_IN_ARTICLE || '',
  multiplex: import.meta.env.VITE_ADSENSE_SLOT_MULTIPLEX || '',
});

export function getAdSenseSlot(name) {
  return ADSENSE_SLOTS[name] || '';
}

export function isAdSenseEnabled() {
  return adsConfig.providers.includes(AD_PROVIDERS.ADSENSE);
}

function appendScript({ id, src, crossOrigin }) {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.setAttribute('async', '');
  script.src = src;

  if (crossOrigin) {
    script.crossOrigin = crossOrigin;
  }

  document.head.appendChild(script);
}

function loadAdScripts() {
  if (adsConfig.providers.includes(AD_PROVIDERS.ADSENSE)) {
    appendScript({
      id: 'adsense-script',
      src: adsConfig.adsense.scriptUrl,
      crossOrigin: 'anonymous',
    });
  }

  if (adsConfig.providers.includes(AD_PROVIDERS.AMAZON)) {
    appendScript({
      id: 'amazon-ads-script',
      src: adsConfig.amazon.scriptUrl,
    });
  }
}

const AD_SCRIPT_LOAD_TIMEOUT_MS = 2500;
const AD_SCRIPT_IDS = Object.freeze(['adsense-script', 'amazon-ads-script']);

let adLoadScheduled = false;

/** True once an ad script has been added to this document. */
export function areAdScriptsLoaded() {
  return (
    typeof document !== 'undefined' &&
    AD_SCRIPT_IDS.some((id) => document.getElementById(id))
  );
}

/**
 * Loads the ad scripts after the window load event, but only if the page that
 * is open at that moment may show ads, so Auto ads never start on hubs, legal
 * pages or the 404.
 */
export function initializeAds({ isPathEligible = isAdEligiblePath } = {}) {
  if (
    typeof document === 'undefined' ||
    typeof window === 'undefined' ||
    adLoadScheduled
  ) {
    return;
  }

  // The ad and analytics scripts used to be injected before React rendered,
  // which put ~1.2 s of third-party JavaScript in front of the first paint on
  // mobile (Lighthouse, Oct 2026). Waiting for the window load event (with a
  // short cap so a page that never fires it still gets ads) keeps the counter
  // responsive and changes nothing about how Auto ads behave once loaded.
  adLoadScheduled = true;
  let timeoutId = null;

  const loadOnce = () => {
    if (!adLoadScheduled) {
      return;
    }
    adLoadScheduled = false;
    window.removeEventListener('load', loadOnce);
    window.clearTimeout(timeoutId);

    if (isPathEligible(window.location.pathname)) {
      loadAdScripts();
    }
  };

  if (document.readyState === 'complete') {
    loadOnce();
    return;
  }

  window.addEventListener('load', loadOnce, { once: true });
  timeoutId = window.setTimeout(loadOnce, AD_SCRIPT_LOAD_TIMEOUT_MS);
}

/**
 * Keeps the ad scripts in line with the current route. Returns true when the
 * document has to be reloaded: the scripts are already running (Auto ads keep
 * placing ads in a single-page app) and the new route must not show any ads.
 */
export function syncAdsWithRoute(path, { isPathEligible = isAdEligiblePath } = {}) {
  if (isPathEligible(path)) {
    initializeAds({ isPathEligible });
    return false;
  }

  return areAdScriptsLoaded();
}
