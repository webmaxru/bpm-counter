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

  test('spectrum analyzer is an unframed part of the live tool card', async ({ page }) => {
    const visualizer = page.locator('.home-tool #AudioMotionAnalyzer');
    const visualizerWrapper = page.locator('.home-tool .spectrum-analyzer');

    await expect(visualizer).toBeAttached();
    await expect(visualizerWrapper).toHaveClass(/spectrum-analyzer--hidden/);

    const frameStyles = await visualizerWrapper.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        borderWidth: styles.borderWidth,
        padding: styles.padding,
        backgroundColor: styles.backgroundColor,
      };
    });
    expect(frameStyles).toEqual({
      borderWidth: '0px',
      padding: '0px',
      backgroundColor: 'rgba(0, 0, 0, 0)',
    });
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

  test('active desktop navigation stays readable on hover and focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();

    const activeLink = page.getByRole('link', {
      name: 'Listen',
      exact: true,
    });

    await activeLink.hover();
    await expect(activeLink).toHaveCSS('color', 'rgb(255, 179, 107)');

    await activeLink.focus();
    await expect(activeLink).toHaveCSS('color', 'rgb(255, 179, 107)');
  });

  test('mobile first viewport keeps the CTA and affiliate offer visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    const startButton = page.getByRole('button', {
      name: /Start listening/i,
    });
    const affiliateCard = page.locator('.affiliate-card');
    const affiliateLink = affiliateCard.getByRole('link', {
      name: /Browse studio headphones/i,
    });

    await expect(startButton).toBeVisible();
    await expect(affiliateCard).toBeVisible();
    await expect(affiliateLink).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
    }));
    const startButtonBox = await startButton.boundingBox();
    const affiliateCardBox = await affiliateCard.boundingBox();
    const affiliateLinkBox = await affiliateLink.boundingBox();

    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth
    );
    expect(startButtonBox.height).toBeGreaterThanOrEqual(64);
    expect(affiliateCardBox.y).toBeLessThan(dimensions.viewportHeight);
    expect(affiliateLinkBox.y + affiliateLinkBox.height).toBeLessThan(
      dimensions.viewportHeight
    );
  });
});
