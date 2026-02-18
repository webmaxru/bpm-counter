const { test, expect } = require('@playwright/test');

test('homepage loads with title and start button', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/BPM/i);

  const heading = page.getByRole('link', { name: /Real-Time BPM Counter/i });
  await expect(heading).toBeVisible();

  const startButton = page.getByRole('button', { name: /Start listening/i });
  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();

  await expect(page.getByText('provide access to your microphone')).toBeVisible();
});
