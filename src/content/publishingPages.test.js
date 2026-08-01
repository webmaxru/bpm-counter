import {
  getRelatedPages,
  publishingPages,
} from './publishingPages';
import {
  APP_SHELL_ROUTES,
  getStaticNavigationPattern,
  STATIC_PUBLISHING_ALIASES,
  STATIC_PUBLISHING_ROUTES,
} from './publicRoutes';

function getPageText(page) {
  const sections = page.sections.flatMap((section) => [
    section.heading,
    ...(section.paragraphs ?? []),
    ...(section.steps ?? []),
    ...(section.bullets ?? []),
    ...(section.table?.headers ?? []),
    ...(section.table?.rows.flat() ?? []),
  ]);
  const faqs = (page.faqs ?? []).flatMap((faq) => [
    faq.question,
    faq.answer,
  ]);

  return [page.heading, page.lede, ...sections, ...faqs].join(' ');
}

describe('publishing page content', () => {
  it('has unique IDs and paths', () => {
    const ids = publishingPages.map((page) => page.id);
    const paths = publishingPages.map((page) => page.path);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('covers every prerendered route exactly once', () => {
    const contentPaths = publishingPages.map((page) => page.path).sort();
    const staticPaths = [...STATIC_PUBLISHING_ROUTES].sort();

    expect(contentPaths).toEqual(staticPaths);
  });

  it('matches publishing navigations with shortcut query strings', () => {
    const pattern = getStaticNavigationPattern('/tools/tap-tempo');

    expect(pattern.test('/tools/tap-tempo')).toBe(true);
    expect(pattern.test('/tools/tap-tempo/')).toBe(true);
    expect(
      pattern.test('/tools/tap-tempo?utm_source=homescreen')
    ).toBe(true);
    expect(pattern.test('/tools/tap-tempo/extra')).toBe(false);
  });

  it('limits the offline app shell to known SPA routes', () => {
    const patterns = APP_SHELL_ROUTES.map(getStaticNavigationPattern);
    const matchesAppShell = (path) =>
      patterns.some((pattern) => pattern.test(path));

    expect(matchesAppShell('/')).toBe(true);
    expect(matchesAppShell('/about/?utm_source=test')).toBe(true);
    expect(matchesAppShell('/not-a-real-page')).toBe(false);
    expect(STATIC_PUBLISHING_ALIASES).toContainEqual({
      route: '/privacy.html',
      targetRoute: '/privacy',
    });
  });

  it('keeps tool and guide pages substantial', () => {
    publishingPages
      .filter((page) => page.category === 'tool' || page.category === 'guide')
      .forEach((page) => {
        const wordCount = getPageText(page).trim().split(/\s+/).length;
        expect(wordCount, `${page.path} word count`).toBeGreaterThan(180);
        expect(page.sections.length, `${page.path} section count`).toBeGreaterThanOrEqual(3);
      });
  });

  it('resolves all related page references', () => {
    publishingPages.forEach((page) => {
      expect(() => getRelatedPages(page)).not.toThrow();
    });
  });

  it('provides complete route metadata', () => {
    publishingPages.forEach((page) => {
      expect(page.title.length).toBeGreaterThan(20);
      expect(page.description.length).toBeGreaterThan(70);
      expect(page.updatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(page.structuredDataType).toBeTruthy();
    });
  });
});
