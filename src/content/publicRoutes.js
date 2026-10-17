import { TEMPO_ROUTES } from './tempoPages.js';

// Core routes: prerendered AND precached by the service worker.
export const STATIC_PUBLISHING_ROUTES = Object.freeze([
  '/',
  '/about',
  '/upload',
  '/tools/tap-tempo',
  '/tools/bpm-to-ms',
  '/tools/bpm-converter',
  '/tools/bars-to-time',
  '/tools/bpm-to-hz',
  '/tools/pitch-range',
  '/tools/metronome',
  '/tools',
  '/guides/real-time-bpm-counter',
  '/guides/how-bpm-detection-works',
  '/guides/genre-bpm-ranges',
  '/guides/beatmatching',
  '/guides/analyze-audio-url',
  '/guides/bpm-reference-table',
  '/guides',
  '/privacy',
  '/terms',
  '/contact',
  '/affiliate-disclosure',
  '/bpm',
  '/no',
  '/no/verktoy',
  '/no/verktoy/tap-tempo',
  '/no/verktoy/bpm-til-ms',
  '/no/verktoy/metronom',
  '/no/verktoy/bpm-konverterer',
]);

// Per-tempo pages (/bpm/60 … /bpm/200): prerendered and in the sitemap, but
// not precached, so installing the service worker does not download 141
// extra HTML files. They are served from the network like any web page;
// offline, the service worker answers with the precached app shell, which
// renders the same tempo page from the bundled data.
export const NETWORK_ONLY_PUBLISHING_ROUTES = TEMPO_ROUTES;

// Navigations to a tempo page, e.g. /bpm/128, /bpm/128/ or /bpm/128?x=1.
export const TEMPO_NAVIGATION_PATTERN = /^\/bpm\/\d+\/?(?:\?.*)?$/;

export const PRERENDERED_ROUTES = Object.freeze([
  ...STATIC_PUBLISHING_ROUTES,
  ...NETWORK_ONLY_PUBLISHING_ROUTES,
]);

export const APP_SHELL_ROUTES = Object.freeze(['/']);

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
