import posthog from 'posthog-js';

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

export const isPostHogConfigured = Boolean(posthogKey && posthogHost);

if (!isPostHogConfigured) {
  // Warn instead of throwing: .env is not committed, so tests, CI and fresh
  // clones run without these variables.
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    const missingVariable = posthogKey
      ? 'VITE_POSTHOG_HOST'
      : 'VITE_POSTHOG_KEY';

    console.warn(
      `${missingVariable} is not configured, so PostHog events are not captured. Copy .env.example to .env and set it.`
    );
  }
} else {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    defaults: '2026-08-30',
    logs: {
      serviceName: 'bpm-counter-web',
      environment: import.meta.env.MODE,
    },
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  });
}

export default posthog;
