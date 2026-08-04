import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';
import { captureStoreScreenshots } from './store-screenshot-capture.mjs';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const outputRoot = path.join(
  repositoryRoot,
  'store-assets',
  'apple-app-store',
);
const graphicsRoot = path.join(outputRoot, 'graphics');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const brandingSource = path.join(
  repositoryRoot,
  'store-assets',
  'microsoft-store',
  'source',
  'branding.html',
);
const productionOrigin = 'https://bpmtech.no';
const captureOrigin = process.env.STORE_ASSET_ORIGIN ?? productionOrigin;

const devices = [
  {
    id: 'iphone-6.9-inch',
    viewport: { width: 440, height: 956 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  {
    id: 'ipad-13-inch',
    viewport: { width: 1032, height: 1376 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
];

await mkdir(graphicsRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const iconUrl = new URL(pathToFileURL(brandingSource).href);
  iconUrl.searchParams.set('variant', 'icon');

  await page.goto(iconUrl.href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(graphicsRoot, 'app-store-icon-1024x1024.png'),
  });
  await context.close();

  await captureStoreScreenshots({
    browser,
    devices,
    origin: captureOrigin,
    outputRoot: screenshotRoot,
  });
} finally {
  await browser.close();
}

console.log('Generated Apple App Store icon and screenshots.');
