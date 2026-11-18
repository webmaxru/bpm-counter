import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const outputRoot = path.join(repositoryRoot, 'store-assets', 'google-play');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const graphicsRoot = path.join(outputRoot, 'graphics');
const sourceRoot = path.join(outputRoot, 'source');
const screensSource = path.join(sourceRoot, 'native-phone-screens.html');
const featureSource = path.join(sourceRoot, 'feature-graphic.html');
const storeIconSource = path.join(repositoryRoot, 'android', 'store_icon.png');

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

const screens = [
  { id: '01-analyze-home', screen: 'analyze' },
  { id: '02-analyze-result', screen: 'analyze-result' },
  { id: '03-tap-tempo', screen: 'tap' },
  { id: '04-metronome', screen: 'metronome' },
  { id: '05-on-device-privacy', screen: 'privacy' },
];

async function renderFeatureGraphic(browser) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(featureSource).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(graphicsRoot, 'feature-graphic-1024x500.png'),
  });
  await context.close();
}

async function captureNativeScreenshots(browser) {
  for (const device of devices) {
    const deviceDirectory = path.join(screenshotRoot, device.id);
    await rm(deviceDirectory, { recursive: true, force: true });
    await mkdir(deviceDirectory, { recursive: true });

    const context = await browser.newContext({
      viewport: device.viewport,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile,
      hasTouch: device.hasTouch,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(pathToFileURL(screensSource).href);
    await page.evaluate(() => document.fonts.ready);

    for (const screen of screens) {
      await page.evaluate((name) => {
        document.body.dataset.screen = name;
      }, screen.screen);
      await page.waitForTimeout(80);
      await page.screenshot({
        path: path.join(deviceDirectory, `${screen.id}.png`),
        type: 'png',
      });
    }

    await context.close();
  }
}

await mkdir(graphicsRoot, { recursive: true });
await mkdir(screenshotRoot, { recursive: true });
await copyFile(storeIconSource, path.join(graphicsRoot, 'app-icon-512x512.png'));

const browser = await chromium.launch({ headless: true });

try {
  await renderFeatureGraphic(browser);
  await captureNativeScreenshots(browser);
} finally {
  await browser.close();
}

console.log(`Generated Google Play native assets in ${outputRoot}.`);
