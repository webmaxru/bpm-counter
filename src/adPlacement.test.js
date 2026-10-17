import {
  getInArticleSectionIndex,
  isAdEligiblePath,
  shouldShowMultiplex,
} from './adPlacement';
import { getPublishingPage } from './content/publishingPages';
import { getTempoPage } from './content/tempoPages';

describe('ad placement rules', () => {
  it('allows ads (manual units and Auto ads) only on tool, guide and tempo routes', () => {
    [
      '/',
      '/upload',
      '/tools/metronome',
      '/tools/metronome/',
      '/no',
      '/no/',
      '/no/verktoy/metronom',
      '/guides/beatmatching',
      '/bpm/128',
    ].forEach((path) => {
      expect(isAdEligiblePath(path), path).toBe(true);
    });

    [
      '/tools',
      '/tools/',
      '/guides',
      '/bpm',
      '/no/verktoy',
      '/about',
      '/privacy',
      '/terms',
      '/contact',
      '/affiliate-disclosure',
      '/guides/not-a-real-guide',
      '/bpm/999',
    ].forEach((path) => {
      expect(isAdEligiblePath(path), path).toBe(false);
    });
  });

  it('keeps hubs and trust pages free of manual units', () => {
    ['tools-hub', 'guides-hub', 'bpm-hub', 'tools-hub-nb', 'privacy', 'about', 'contact'].forEach((id) => {
      const page = getPublishingPage(id);
      expect(getInArticleSectionIndex(page, { hasInteractiveTool: true }), id).toBe(-1);
      expect(shouldShowMultiplex(page), id).toBe(false);
    });
  });

  it('keeps two sections between a tool and the in-article unit', () => {
    ['metronome', 'bars-to-time', 'home', 'home-nb'].forEach((id) => {
      const page = getPublishingPage(id);
      const index = getInArticleSectionIndex(page, { hasInteractiveTool: true });

      expect(index, id).toBeGreaterThanOrEqual(2);
      expect(index, id).toBeLessThan(page.sections.length);
    });
  });

  it('places one in-article unit mid-page on tempo pages', () => {
    const page = getTempoPage(128);
    const index = getInArticleSectionIndex(page, { hasInteractiveTool: true });

    expect(index).toBe(3);
    expect(shouldShowMultiplex(page)).toBe(true);
  });

  it('skips the in-article unit on short pages', () => {
    expect(
      getInArticleSectionIndex(getPublishingPage('bpm-converter'), { hasInteractiveTool: true })
    ).toBe(-1);
  });
});
