/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { setCacheNameDetails, clientsClaim } from 'workbox-core';
import { NetworkFirst } from 'workbox-strategies';
import { googleFontsCache } from 'workbox-recipes';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import * as googleAnalytics from 'workbox-google-analytics';

async function messageClient(event, messageType) {
  if (!event.clientId) return;

  // Get the client.
  const client = await clients.get(event.clientId);
  // Exit early if we don't get the client.
  // Eg, if it closed.
  if (!client) return;

  // Send a message to the client.
  client.postMessage({
    type: messageType,
  });
}

// SETTINGS

// Claiming control to start runtime caching asap
clientsClaim();

// Use to update the app after user triggered refresh
//self.skipWaiting();

// Setting custom cache names
setCacheNameDetails({ precache: 'wb6-precache', runtime: 'wb6-runtime' });

// STATIC ROUTING

self.addEventListener('install', async (event) => {

  if (event.addRoutes) {
    try {
      event.addRoutes([
        {
          condition: {
            urlPattern: { pathname: '/login' },
          },
          source: 'network',
        },
        {
          condition: {
            urlPattern: { pathname: '/about' },
          },
          source: 'fetch-event',
        },
        {
          condition: {
            urlPattern: { pathname: '/privacy.html' },
          },
          source: {
            cacheName: 'wb6-precache',
          },
        },
        {
          condition: {
            urlPattern: { pathname: '/favicon.ico' },
          },
          source: 'race-network-and-fetch-handler',
        },
      ]);
      console.log('[SW] Routes registered');
    } catch (err) {
      console.error(err);
    }
  } else {
    console.error('[SW] No static routing support');
  }

});

// PRECACHING

// Precache and serve resources from __WB_MANIFEST array
precacheAndRoute(self.__WB_MANIFEST);

// NAVIGATION ROUTING

// This assumes /index.html has been precached.
const navHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navHandler, {
  denylist: [
    new RegExp('/account'),
    new RegExp('/admin'),
    new RegExp('/login'),
    new RegExp('/logout'),
    new RegExp('/.auth'),
    new RegExp('/aboutme'),
    new RegExp('/400.html'),
    new RegExp('/404.html'),
    new RegExp('/privacy.html'),
  ], // Also might be specified explicitly via allowlist
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

const messageAboutFailPlugin = {
  fetchDidFail: async ({ originalRequest, request, error, event, state }) => {
    messageClient(event, 'REQUEST_FAILED');
  },
};

// Instantiating and configuring plugin
const bgSyncPlugin = new BackgroundSyncPlugin('feedbackQueue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)

  onSync: async ({ queue }) => {
    // Run standard replay
    await queue.replayRequests();

    self.clients.matchAll().then((clients) => {
      clients.forEach((client) =>
        client.postMessage({ type: 'REPLAY_COMPLETED' })
      );
    });
  },
});

// Registering a route for retries
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/feedback'),
  new NetworkFirst({
    plugins: [bgSyncPlugin, messageAboutFailPlugin],
  }),
  'POST'
);

googleAnalytics.initialize();
