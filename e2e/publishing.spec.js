import { test, expect } from '@playwright/test';

test('primary navigation exposes BPM tools and guides', async ({ page }) => {
  await page.goto('/');

  const navigation = page.getByRole('navigation', { name: 'Primary' });
  await expect(
    navigation.getByRole('link', { name: 'Tap tempo' })
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'BPM to ms' })
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Beatmatching' })
  ).toBeVisible();
});

test('tap tempo calculates a stable manual BPM', async ({ page }) => {
  await page.goto('/tools/tap-tempo');

  const tapButton = page.getByRole('button', { name: /Tap beat/i });
  await page.evaluate(() => {
    window.__tapTestNow = 0;
    Object.defineProperty(window.performance, 'now', {
      configurable: true,
      value: () => window.__tapTestNow,
    });
  });

  for (const tapTime of [1000, 1500, 2000, 2500]) {
    await page.evaluate((time) => {
      window.__tapTestNow = time;
    }, tapTime);
    await tapButton.click();
  }

  await expect(page.locator('.tool-panel__result')).toHaveText('120');
});

test('BPM calculator updates note durations', async ({ page }) => {
  await page.goto('/tools/bpm-to-ms');

  await page
    .getByRole('spinbutton', { name: /Tempo in BPM/i })
    .fill('100');

  await expect(page.getByText('600 ms')).toBeVisible();
  await expect(page.getByText('300 ms')).toBeVisible();
});

test('guide route has route-specific metadata and useful content', async ({
  page,
}) => {
  await page.goto('/guides/beatmatching');

  await expect(page).toHaveTitle(/Beatmatching Guide for Beginners/);
  await expect(
    page.getByRole('heading', { name: /Beatmatching guide for beginners/i })
  ).toBeVisible();
  await expect(page.getByText(/A nudge fixes phase/i)).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bpmtech.no/guides/beatmatching'
  );
});

test('privacy and disclosure pages are reachable from the footer', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByText(/does not upload or store the microphone stream/i)
  ).toBeVisible();

  await page
    .getByRole('link', { name: 'Affiliate disclosure', exact: true })
    .click();
  await expect(page).toHaveURL(/\/affiliate-disclosure$/);
  await expect(
    page.getByText(/As an Amazon Associate I earn from qualifying purchases/i)
  ).toBeVisible();
});

test('unknown guide routes are marked noindex', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/guides/not-a-real-guide');

  await expect(page).toHaveTitle('Page Not Found | BPM Techno');
  await expect(
    page.getByRole('heading', { name: 'Page not found' })
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow'
  );

  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth
  );
});
