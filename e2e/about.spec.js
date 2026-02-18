const { test, expect } = require('@playwright/test');

test('about page displays project info and service links', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { name: /3-in-1 project/i })).toBeVisible();

  await expect(page.getByText('real product')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Azure Static Web Apps (SWA)' })).toBeVisible();
  await expect(page.getByText('Progressive Web App')).toBeVisible();

  await expect(page.getByRole('heading', { name: /Author and credits/i })).toBeVisible();
  await expect(page.getByText('Maxim Salnikov')).toBeVisible();

  const fetchButton = page.getByRole('button', { name: /Fetch user account data/i });
  await expect(fetchButton).toBeVisible();
});
