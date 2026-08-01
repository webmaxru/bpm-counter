export const STATIC_PUBLISHING_ROUTES = Object.freeze([
  '/',
  '/upload',
  '/tools/tap-tempo',
  '/tools/bpm-to-ms',
  '/tools/bpm-converter',
  '/guides/real-time-bpm-counter',
  '/guides/how-bpm-detection-works',
  '/guides/genre-bpm-ranges',
  '/guides/beatmatching',
  '/guides/analyze-audio-url',
  '/privacy',
  '/terms',
  '/contact',
  '/affiliate-disclosure',
]);

export const APP_SHELL_ROUTES = Object.freeze(['/', '/about']);

export const STATIC_PUBLISHING_ALIASES = Object.freeze([
  {
    route: '/privacy.html',
    targetRoute: '/privacy',
  },
]);

export function getStaticDocumentPath(route) {
  return route === '/' ? '/index.html' : `${route}/index.html`;
}

export function getStaticNavigationPattern(route) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escapedRoute}/?(?:\\?.*)?$`);
}
