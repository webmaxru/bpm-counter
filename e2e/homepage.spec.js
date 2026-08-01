import { test, expect } from '@playwright/test';

test('homepage loads with title and start button', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/BPM/i);

  const heading = page.getByRole('heading', {
    level: 1,
    name: /BPM Techno.*Free.*Offline.*BPM tools for DJs/i,
  });
  await expect(heading).toBeVisible();

  const startButton = page.getByRole('button', { name: /Start listening/i });
  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();

  await expect(
    page.getByText(/Microphone permission is requested/i)
  ).toBeVisible();
  await expect(
    page.getByText(/No audio is sent to any server/i)
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Browse studio headphones/i })
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Affiliate disclosure/i })
  ).toBeVisible();
});
