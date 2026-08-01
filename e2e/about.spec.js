import { test, expect } from '@playwright/test';

test('about page is focused on practical DJ workflows', async ({ page }) => {
  await page.goto('/about');

  await expect(
    page.getByRole('heading', { name: 'About BPM Techno' })
  ).toBeVisible();
  await expect(page).toHaveTitle(
    'About BPM Techno | Practical BPM Tools for DJs'
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bpmtech.no/about'
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'index, follow'
  );

  await expect(page.getByText(/Built around real DJ decisions/i)).toBeVisible();
  await expect(
    page.getByText(/Choose the tempo method that fits the moment/i)
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Follow Maxim Salnikov on X' })
  ).toBeVisible();

  await expect(page.locator('body')).not.toContainText(/Azure|GitHub|demo|proof of concept/i);
});
