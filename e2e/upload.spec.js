import { test, expect } from '@playwright/test';

test('upload page allows entering a URL and has calculate button', async ({ page }) => {
  await page.goto('/upload');

  const urlInput = page.getByRole('textbox', {
    name: /Direct URL of an MP3 or WAV file/i,
  });
  await expect(urlInput).toBeVisible();
  await expect(urlInput).toHaveAttribute('placeholder', /https/);

  const calcButton = page.getByRole('button', { name: /Fetch and calculate/i });
  await expect(calcButton).toBeVisible();

  await urlInput.fill('/samples/bpmtechno-120.mp3');
  await expect(urlInput).toHaveValue('/samples/bpmtechno-120.mp3');

  const useSampleButton = page.getByRole('button', {
    name: /Use the 120 BPM sample/i,
  });
  await expect(useSampleButton).toBeVisible();

  await expect(
    page.getByRole('link', {
      name: 'real-time BPM counter',
      exact: true,
    })
  ).toBeVisible();
});

test('calculates BPM from sample audio file', async ({ page }) => {
  await page.goto('/upload');

  await page.getByRole('button', { name: /Use the 120 BPM sample/i }).click();

  const urlInput = page.getByRole('textbox', {
    name: /Direct URL of an MP3 or WAV file/i,
  });
  await expect(urlInput).toHaveValue('/samples/bpmtechno-120.mp3');

  // Click calculate
  await page.getByRole('button', { name: /Fetch and calculate/i }).click();

  // Wait for BPM result — the sample is 120 BPM
  const bpmResult = page.locator('.tool-panel__result');
  await expect(bpmResult).toBeVisible({ timeout: 30000 });
  await expect(bpmResult).toHaveText(/\d+/);
});
