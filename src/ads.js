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

export function initializeAds() {
  if (typeof document === 'undefined') {
    return;
  }

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
