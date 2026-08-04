import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const routes = [
  {
    id: '01-live-bpm-counter',
    path: '/',
  },
  {
    id: '02-audio-url-analyzer',
    path: '/upload',
  },
  {
    id: '03-tap-tempo',
    path: '/tools/tap-tempo',
    prepare: async (page) => {
      await page.evaluate(() => {
        window.__storeAssetTapTime = 0;
        Object.defineProperty(window.performance, 'now', {
          configurable: true,
          value: () => window.__storeAssetTapTime,
        });
      });

      for (let index = 0; index < 8; index += 1) {
        await page.evaluate(() => {
          window.__storeAssetTapTime += 468.75;
          const tapButton = [...document.querySelectorAll('button')].find(
            (button) => button.textContent.trim() === 'Tap beat',
          );
          tapButton.click();
        });
        await page.waitForTimeout(30);
      }
    },
  },
  {
    id: '04-bpm-to-milliseconds',
    path: '/tools/bpm-to-ms',
    prepare: async (page) => {
      await page.getByLabel('Tempo in BPM').fill('128');
    },
  },
  {
    id: '05-half-double-time',
    path: '/tools/bpm-converter',
    prepare: async (page) => {
      await page.getByLabel('Tempo in BPM').fill('128');
    },
  },
];

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      html {
        scrollbar-width: none !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
      }
    `,
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
}

export async function captureStoreScreenshots({
  browser,
  devices,
  origin,
  outputRoot,
}) {
  for (const device of devices) {
    const deviceDirectory = path.join(outputRoot, device.id);
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

    for (const route of routes) {
      await page.goto(`${origin}${route.path}`, {
        waitUntil: 'domcontentloaded',
      });
      await settle(page);

      if (route.prepare) {
        await route.prepare(page);
        await page.waitForTimeout(300);
      }

      await page.screenshot({
        path: path.join(deviceDirectory, `${route.id}.png`),
      });
    }

    await context.close();
  }
}
