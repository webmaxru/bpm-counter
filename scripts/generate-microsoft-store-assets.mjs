import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';
import { captureStoreScreenshots } from './store-screenshot-capture.mjs';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const outputRoot = path.join(repositoryRoot, 'store-assets', 'microsoft-store');
const brandingRoot = path.join(outputRoot, 'branding');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const sourcePath = path.join(outputRoot, 'source', 'branding.html');
const productionOrigin = 'https://bpmtech.no';
const captureOrigin = process.env.STORE_ASSET_ORIGIN ?? productionOrigin;

const brandingAssets = [
  {
    relativePath: path.join('poster-art', 'poster-art-720x1080.png'),
    width: 720,
    height: 1080,
    variant: 'poster',
  },
  {
    relativePath: path.join('poster-art', 'poster-art-1440x2160.png'),
    width: 1440,
    height: 2160,
    variant: 'poster',
  },
  {
    relativePath: path.join('box-art', 'box-art-1080x1080.png'),
    width: 1080,
    height: 1080,
    variant: 'box',
  },
  {
    relativePath: path.join('box-art', 'box-art-2160x2160.png'),
    width: 2160,
    height: 2160,
    variant: 'box',
  },
  {
    relativePath: path.join('store-logos', 'app-tile-icon-300x300.png'),
    width: 300,
    height: 300,
    variant: 'icon',
  },
  {
    relativePath: path.join('store-logos', 'store-logo-150x150.png'),
    width: 150,
    height: 150,
    variant: 'icon',
  },
  {
    relativePath: path.join('store-logos', 'store-logo-71x71.png'),
    width: 71,
    height: 71,
    variant: 'icon',
  },
  {
    relativePath: path.join('store-display', 'super-hero-art-1920x1080.png'),
    width: 1920,
    height: 1080,
    variant: 'superhero',
  },
  {
    relativePath: path.join('store-display', 'super-hero-art-3840x2160.png'),
    width: 3840,
    height: 2160,
    variant: 'superhero',
  },
  {
    relativePath: path.join('xbox', 'branded-key-art-584x800.png'),
    width: 584,
    height: 800,
    variant: 'branded-key',
  },
  {
    relativePath: path.join('xbox', 'titled-hero-art-1920x1080.png'),
    width: 1920,
    height: 1080,
    variant: 'titled-hero',
  },
  {
    relativePath: path.join('xbox', 'featured-promotional-square-1080x1080.png'),
    width: 1080,
    height: 1080,
    variant: 'promo-square',
  },
];

const devices = [
  {
    id: 'desktop',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
];

const browser = await chromium.launch({ headless: true });

try {
  for (const asset of brandingAssets) {
    const outputPath = path.join(brandingRoot, asset.relativePath);
    await mkdir(path.dirname(outputPath), { recursive: true });

    const context = await browser.newContext({
      viewport: { width: asset.width, height: asset.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const url = new URL(pathToFileURL(sourcePath).href);
    url.searchParams.set('variant', asset.variant);

    await page.goto(url.href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: outputPath });
    await context.close();
  }

  await rm(screenshotRoot, { recursive: true, force: true });
  await captureStoreScreenshots({
    browser,
    devices,
    origin: captureOrigin,
    outputRoot: screenshotRoot,
  });
} finally {
  await browser.close();
}

console.log(
  `Generated ${brandingAssets.length} Microsoft Store branding assets and desktop screenshots from ${captureOrigin}.`,
);
