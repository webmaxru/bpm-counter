import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';
import { captureStoreScreenshots } from './store-screenshot-capture.mjs';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const outputRoot = path.join(repositoryRoot, 'store-assets', 'google-play');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const graphicsRoot = path.join(outputRoot, 'graphics');
const sourceRoot = path.join(outputRoot, 'source');
const productionOrigin = 'https://bpmtech.no';

const devices = [
  {
    id: 'phone',
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  {
    id: 'tablet-7-inch',
    viewport: { width: 600, height: 960 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  {
    id: 'tablet-10-inch',
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  {
    id: 'chromebook',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
];

async function renderFeatureGraphic(browser) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const sourcePath = path.join(sourceRoot, 'feature-graphic.html');

  await page.goto(pathToFileURL(sourcePath).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(graphicsRoot, 'feature-graphic-1024x500.png'),
  });
  await context.close();
}

await mkdir(graphicsRoot, { recursive: true });
await mkdir(screenshotRoot, { recursive: true });
await copyFile(
  path.join(repositoryRoot, 'android', 'store_icon.png'),
  path.join(graphicsRoot, 'app-icon-512x512.png'),
);

const browser = await chromium.launch({ headless: true });

try {
  await renderFeatureGraphic(browser);
  await captureStoreScreenshots({
    browser,
    devices,
    origin: productionOrigin,
    outputRoot: screenshotRoot,
  });
} finally {
  await browser.close();
}

console.log(`Generated Google Play assets in ${outputRoot}.`);
