import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AD_PROVIDERS,
  adsConfig,
  areAdScriptsLoaded,
  initializeAds,
  syncAdsWithRoute,
} from './ads';

afterEach(() => {
  document.getElementById('adsense-script')?.remove();
  document.getElementById('amazon-ads-script')?.remove();
  window.history.pushState({}, '', '/');
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function deferWindowLoad() {
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
}

describe('ads configuration', () => {
  it('enables AdSense by default', () => {
    expect(adsConfig.providers).toEqual([AD_PROVIDERS.ADSENSE]);
  });

  it('loads the configured AdSense script with the approval client', () => {
    initializeAds();

    const script = document.getElementById('adsense-script');
    expect(script).toHaveAttribute(
      'src',
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6118980043742623'
    );
    expect(script).toHaveAttribute('crossorigin', 'anonymous');
    expect(script).toHaveAttribute('async');
  });

  it('does not load Amazon when it is not enabled', () => {
    initializeAds();

    expect(document.getElementById('amazon-ads-script')).toBeNull();
  });

  it('waits for the window load event before injecting ad scripts', () => {
    deferWindowLoad();
    vi.useFakeTimers();

    initializeAds();
    expect(document.getElementById('adsense-script')).toBeNull();

    window.dispatchEvent(new Event('load'));
    expect(document.getElementById('adsense-script')).not.toBeNull();
  });

  it('falls back to a timeout when the load event never fires', () => {
    deferWindowLoad();
    vi.useFakeTimers();

    initializeAds();
    vi.advanceTimersByTime(2499);
    expect(document.getElementById('adsense-script')).toBeNull();

    vi.advanceTimersByTime(1);
    expect(document.getElementById('adsense-script')).not.toBeNull();
  });
});

describe('ad route gating (Auto ads included)', () => {
  it.each(['/tools', '/guides', '/bpm', '/no/verktoy', '/about', '/privacy', '/terms', '/not-a-page'])(
    'never loads the ad script on %s',
    (path) => {
      window.history.pushState({}, '', path);

      initializeAds();

      expect(document.getElementById('adsense-script')).toBeNull();
      expect(areAdScriptsLoaded()).toBe(false);
    }
  );

  it.each(['/', '/no', '/tools/metronome/', '/guides/beatmatching', '/bpm/128'])(
    'loads the ad script on %s',
    (path) => {
      window.history.pushState({}, '', path);

      initializeAds();

      expect(areAdScriptsLoaded()).toBe(true);
    }
  );

  it('re-checks the route when the deferred load finally fires', () => {
    deferWindowLoad();
    vi.useFakeTimers();

    initializeAds();
    window.history.pushState({}, '', '/privacy');
    window.dispatchEvent(new Event('load'));

    expect(document.getElementById('adsense-script')).toBeNull();

    // A later eligible route can still schedule a fresh load.
    window.history.pushState({}, '', '/tools/metronome');
    initializeAds();
    window.dispatchEvent(new Event('load'));
    expect(document.getElementById('adsense-script')).not.toBeNull();
  });

  it('loads ads on eligible routes without asking for a reload', () => {
    window.history.pushState({}, '', '/tools/metronome');

    expect(syncAdsWithRoute('/tools/metronome')).toBe(false);
    expect(areAdScriptsLoaded()).toBe(true);
  });

  it('needs no reload on an excluded route when no ad script is running', () => {
    window.history.pushState({}, '', '/tools');

    expect(syncAdsWithRoute('/tools')).toBe(false);
    expect(areAdScriptsLoaded()).toBe(false);
  });

  it('asks for a reload when leaving an ad page for an excluded route', () => {
    syncAdsWithRoute('/');
    expect(areAdScriptsLoaded()).toBe(true);

    window.history.pushState({}, '', '/privacy');
    expect(syncAdsWithRoute('/privacy')).toBe(true);
  });

  it('accepts a custom eligibility rule', () => {
    const isPathEligible = vi.fn(() => false);

    expect(syncAdsWithRoute('/', { isPathEligible })).toBe(false);
    expect(isPathEligible).toHaveBeenCalledWith('/');
    expect(areAdScriptsLoaded()).toBe(false);
  });
});
