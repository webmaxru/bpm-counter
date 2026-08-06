import { afterEach, describe, expect, it } from 'vitest';
import { AD_PROVIDERS, adsConfig, initializeAds } from './ads';

afterEach(() => {
  document.getElementById('adsense-script')?.remove();
  document.getElementById('amazon-ads-script')?.remove();
});

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
});
