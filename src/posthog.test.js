vi.mock('posthog-js', () => ({ default: { init: vi.fn() } }));

describe('posthog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('loads without throwing and stays disabled when not configured', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '');
    vi.stubEnv('VITE_POSTHOG_HOST', '');

    const { default: posthog, isPostHogConfigured } = await import('./posthog');

    expect(isPostHogConfigured).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it('initializes PostHog when key and host are configured', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://eu.i.posthog.com');

    const { default: posthog, isPostHogConfigured } = await import('./posthog');

    expect(isPostHogConfigured).toBe(true);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({ api_host: 'https://eu.i.posthog.com' })
    );
  });
});
