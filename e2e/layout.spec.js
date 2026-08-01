import { test, expect } from '@playwright/test';

test.describe('Page layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header, body, and footer are stacked vertically', async ({ page }) => {
    const header = page.locator('header');
    const body = page.locator('.body');
    const footer = page.locator('footer');

    await expect(header).toBeVisible();
    await expect(body).toBeVisible();
    await expect(footer).toBeVisible();

    const headerBox = await header.boundingBox();
    const bodyBox = await body.boundingBox();
    const footerBox = await footer.boundingBox();

    // Header should be at the very top
    expect(headerBox.y).toBeLessThan(5);

    // Body must start below the header (not to the right)
    expect(bodyBox.y).toBeGreaterThan(headerBox.y);
    expect(bodyBox.x).toBeLessThan(50); // left-aligned, not a right column

    // Footer must start below the body
    expect(footerBox.y).toBeGreaterThan(bodyBox.y);
    expect(footerBox.x).toBeLessThan(50); // left-aligned, not a right column
  });

  test('header and footer span the full viewport width', async ({ page }) => {
    const viewportWidth = page.viewportSize().width;
    const header = page.locator('header');
    const footer = page.locator('footer');

    const headerBox = await header.boundingBox();
    const footerBox = await footer.boundingBox();

    expect(headerBox.width).toBeCloseTo(viewportWidth, -1);
    expect(footerBox.width).toBeCloseTo(viewportWidth, -1);
  });

  test('spectrum analyzer is mounted inside the live tool card', async ({ page }) => {
    const visualizer = page.locator('.home-tool #AudioMotionAnalyzer');
    const visualizerFrame = page.locator('.home-tool .spectrum-analyzer');

    await expect(visualizer).toBeAttached();
    await expect(visualizerFrame).toHaveClass(/spectrum-analyzer--hidden/);

    const borderRadius = await visualizerFrame.evaluate(
      (element) => getComputedStyle(element).borderRadius
    );
    expect(borderRadius).not.toBe('0px');
  });

  test('layout snapshot matches baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-layout.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('tablet layout does not overflow horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth
    );
  });
});
