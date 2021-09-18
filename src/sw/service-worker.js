/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { setCacheNameDetails, clientsClaim } from 'workbox-core';
import { NetworkFirst } from 'workbox-strategies';
import { googleFontsCache } from 'workbox-recipes';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// SETTINGS

// Claiming control to start runtime caching asap
clientsClaim();

// Use to update the app after user triggered refresh
//self.skipWaiting();

// Setting custom cache names
setCacheNameDetails({ precache: 'wb6-precache', runtime: 'wb6-runtime' });

// PRECACHING

// Precache and serve resources from __WB_MANIFEST array
precacheAndRoute(self.__WB_MANIFEST);

// NAVIGATION ROUTING

// This assumes /index.html has been precached.
const navHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navHandler, {
  denylist: [new RegExp('/account/'), new RegExp('/admin/')], // Also might be specified explicitly via allowlist
});
registerRoute(navigationRoute);

// STATIC RESOURCES

googleFontsCache({ cachePrefix: 'wb6-gfonts' });

// APP SHELL UPDATE FLOW

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// BACKGROUND SYNC

// Instantiating and configuring plugin
const bgSyncPlugin = new BackgroundSyncPlugin('feedbackQueue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)
});

// Registering a route for retries
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/feedback'),
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);
