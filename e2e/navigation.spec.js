const { test, expect } = require('@playwright/test');

test('navigate from home to about via ? link', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: '?' }).click();

  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByText(/3-in-1 project/i)).toBeVisible();
  await expect(page.getByText('Maxim Salnikov')).toBeVisible();
});

test('navigate from upload page back to real-time detection', async ({ page }) => {
  await page.goto('/upload');

  await page.getByRole('link', { name: /real-time BPM detection/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: /Start listening/i })).toBeVisible();
});

test('navigate between home and upload pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start listening/i })).toBeVisible();

  await page.goto('/upload');
  await expect(page.getByRole('button', { name: /Fetch and calculate/i })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start listening/i })).toBeVisible();
});
