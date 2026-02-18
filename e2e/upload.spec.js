const { test, expect } = require('@playwright/test');

test('upload page allows entering a URL and has calculate button', async ({ page }) => {
  await page.goto('/upload');

  const urlInput = page.getByRole('textbox', { name: /URL of mp3\/wav file/i });
  await expect(urlInput).toBeVisible();
  await expect(urlInput).toHaveAttribute('placeholder', /https/);

  const calcButton = page.getByRole('button', { name: /Fetch and calculate/i });
  await expect(calcButton).toBeVisible();

  await urlInput.fill('/samples/bpmtechno-120.mp3');
  await expect(urlInput).toHaveValue('/samples/bpmtechno-120.mp3');

  const useSampleLink = page.getByText('use sample');
  await expect(useSampleLink).toBeVisible();

  await expect(page.getByRole('link', { name: /real-time BPM detection/i })).toBeVisible();
});
