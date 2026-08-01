import { test, expect } from '@playwright/test';

test('navigate from home to the DJ-focused about page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'About' }).click();

  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByText(/Built around real DJ decisions/i)).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Follow Maxim Salnikov on X' })
  ).toBeVisible();
});

test('navigate from upload page back to real-time detection', async ({ page }) => {
  await page.goto('/upload');

  await page
    .getByRole('link', { name: 'real-time BPM counter', exact: true })
    .click();

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
