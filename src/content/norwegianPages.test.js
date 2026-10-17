import { getPublishingPage, findPublishingPageByPath } from './publishingPages';
import {
  getHreflangAlternates,
  HREFLANG_PAIRS,
  isNorwegianPath,
  norwegianPages,
} from './norwegianPages';

describe('Norwegian pages', () => {
  it('pairs every Norwegian page with an existing English page', () => {
    HREFLANG_PAIRS.forEach(({ en, nb }) => {
      expect(findPublishingPageByPath(en), en).not.toBeNull();
      expect(findPublishingPageByPath(nb), nb).not.toBeNull();
    });
    expect(HREFLANG_PAIRS).toHaveLength(norwegianPages.length);
  });

  it('returns reciprocal hreflang alternates with an English x-default', () => {
    HREFLANG_PAIRS.forEach(({ en, nb }) => {
      expect(getHreflangAlternates(en)).toEqual(getHreflangAlternates(nb));
      expect(getHreflangAlternates(nb)).toEqual([
        { hreflang: 'en', path: en },
        { hreflang: 'nb', path: nb },
        { hreflang: 'x-default', path: en },
      ]);
    });
    expect(getHreflangAlternates('/guides')).toEqual([]);
  });

  it('marks pages as bokmål and keeps related links in Norwegian', () => {
    norwegianPages.forEach((page) => {
      expect(page.lang).toBe('nb');
      expect(isNorwegianPath(page.path)).toBe(true);
      page.relatedPageIds.forEach((id) => {
        expect(getPublishingPage(id).lang, `${page.id} -> ${id}`).toBe('nb');
      });
    });
    expect(isNorwegianPath('/notes')).toBe(false);
  });
});
