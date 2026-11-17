import { mkdir, writeFile } from 'node:fs/promises';
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
const nativeScreensSource = path.join(
  outputRoot,
  'source',
  'native-screens.html',
);

const devices = [
  {
    id: 'iphone-6.9-inch',
    viewport: { width: 440, height: 956 },
    deviceScaleFactor: 3,
  },
  {
    id: 'ipad-13-inch',
    viewport: { width: 1032, height: 1376 },
    deviceScaleFactor: 2,
  },
];

const screens = [
  '01-analyze-result',
  '02-record-analyze',
  '03-file-analyze',
  '04-tap-tempo',
  '05-metronome',
];

await mkdir(graphicsRoot, { recursive: true });
await mkdir(screenshotRoot, { recursive: true });

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

  for (const device of devices) {
    const deviceDirectory = path.join(screenshotRoot, device.id);
    await mkdir(deviceDirectory, { recursive: true });

    const deviceContext = await browser.newContext({
      viewport: device.viewport,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
    });
    const devicePage = await deviceContext.newPage();

    for (const screenId of screens) {
      const screenUrl = new URL(pathToFileURL(nativeScreensSource).href);
      screenUrl.searchParams.set('screen', screenId);
      await devicePage.goto(screenUrl.href);
      await devicePage.evaluate(() => document.fonts.ready);
      await devicePage.waitForTimeout(120);
      await devicePage.screenshot({
        path: path.join(deviceDirectory, `${screenId}.png`),
        animations: 'disabled',
      });
    }

    await deviceContext.close();
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'store-assets/apple-app-store/source/native-screens.html',
    note: 'Native SwiftUI marketing comps for App Store Connect. Replace with simulator captures before final review if chrome differs.',
    devices: devices.map((device) => ({
      id: device.id,
      pixelSize: {
        width: device.viewport.width * device.deviceScaleFactor,
        height: device.viewport.height * device.deviceScaleFactor,
      },
      screens,
    })),
  };

  await writeFile(
    path.join(screenshotRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
} finally {
  await browser.close();
}

console.log(
  'Generated Apple App Store icon and native SwiftUI marketing screenshots.',
);
