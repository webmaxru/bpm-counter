import {
  getStaticNavigationPattern,
  NETWORK_ONLY_PUBLISHING_ROUTES,
  STATIC_PUBLISHING_ROUTES,
  TEMPO_NAVIGATION_PATTERN,
} from './publicRoutes';

describe('public routes', () => {
  it('matches every network-only tempo page for the offline fallback', () => {
    NETWORK_ONLY_PUBLISHING_ROUTES.forEach((route) => {
      expect(TEMPO_NAVIGATION_PATTERN.test(route), route).toBe(true);
      expect(TEMPO_NAVIGATION_PATTERN.test(`${route}/`), route).toBe(true);
      expect(TEMPO_NAVIGATION_PATTERN.test(`${route}?utm_source=x`), route).toBe(true);
    });
  });

  it('leaves precached routes to their own navigation handlers', () => {
    ['/bpm', '/bpm/', '/bpm/abc', '/bpm/128/extra', '/tools/metronome'].forEach((path) => {
      expect(TEMPO_NAVIGATION_PATTERN.test(path), path).toBe(false);
    });

    STATIC_PUBLISHING_ROUTES.forEach((route) => {
      expect(TEMPO_NAVIGATION_PATTERN.test(route), route).toBe(false);
    });
  });

  it('does not let a static route pattern swallow tempo pages', () => {
    const patterns = STATIC_PUBLISHING_ROUTES.map(getStaticNavigationPattern);

    expect(patterns.some((pattern) => pattern.test('/bpm/128'))).toBe(false);
  });
});
