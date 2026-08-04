import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const outputRoot = path.join(
  repositoryRoot,
  'store-assets',
  'microsoft-store',
  'branding',
);
const sourcePath = path.join(
  repositoryRoot,
  'store-assets',
  'microsoft-store',
  'source',
  'branding.html',
);

const assets = [
  {
    path: 'poster-art\\poster-art-720x1080.png',
    width: 720,
    height: 1080,
    variant: 'poster',
  },
  {
    path: 'poster-art\\poster-art-1440x2160.png',
    width: 1440,
    height: 2160,
    variant: 'poster',
  },
  {
    path: 'box-art\\box-art-1080x1080.png',
    width: 1080,
    height: 1080,
    variant: 'box',
  },
  {
    path: 'box-art\\box-art-2160x2160.png',
    width: 2160,
    height: 2160,
    variant: 'box',
  },
  {
    path: 'store-logos\\app-tile-icon-300x300.png',
    width: 300,
    height: 300,
    variant: 'icon',
  },
  {
    path: 'store-logos\\store-logo-150x150.png',
    width: 150,
    height: 150,
    variant: 'icon',
  },
  {
    path: 'store-logos\\store-logo-71x71.png',
    width: 71,
    height: 71,
    variant: 'icon',
  },
  {
    path: 'store-display\\super-hero-art-1920x1080.png',
    width: 1920,
    height: 1080,
    variant: 'superhero',
  },
  {
    path: 'store-display\\super-hero-art-3840x2160.png',
    width: 3840,
    height: 2160,
    variant: 'superhero',
  },
  {
    path: 'xbox\\branded-key-art-584x800.png',
    width: 584,
    height: 800,
    variant: 'branded-key',
  },
  {
    path: 'xbox\\titled-hero-art-1920x1080.png',
    width: 1920,
    height: 1080,
    variant: 'titled-hero',
  },
  {
    path: 'xbox\\featured-promotional-square-1080x1080.png',
    width: 1080,
    height: 1080,
    variant: 'promo-square',
  },
];

const browser = await chromium.launch({ headless: true });

try {
  for (const asset of assets) {
    const outputPath = path.join(outputRoot, asset.path);
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
} finally {
  await browser.close();
}

console.log(`Generated ${assets.length} Microsoft Store branding assets.`);
