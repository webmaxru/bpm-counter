import posthog, { isPostHogConfigured } from './posthog';

const posthogLog = {
  info(message, attributes) {
    if (isPostHogConfigured) {
      posthog.logger.info(message, attributes);
    }
  },
  error(message, attributes) {
    if (isPostHogConfigured) {
      posthog.logger.error(message, attributes);
    }
  },
};

export default posthogLog;
