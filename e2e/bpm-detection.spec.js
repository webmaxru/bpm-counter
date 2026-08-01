import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect, chromium, devices } from '@playwright/test';
import { generateTrack } from '../scripts/generate-test-audio.js';

// BPM values with reliable detection from synthetic kick/hi-hat WAV files.
// These deterministic patterns reliably converge through Chromium's fake
// capture pipeline. Lower synthetic tempos are unstable in the v5 analyzer.
const BPM_VALUES = [130, 140];
const TOLERANCE = 3; // +/-3 BPM
const BASE_URL = 'http://localhost:3000';
const TEST_DURATION_SECONDS = 60;

test.describe('BPM detection via fake audio capture', () => {
  test.describe.configure({ mode: 'serial' });

  for (const expectedBpm of BPM_VALUES) {
    test(`detects ${expectedBpm} BPM from fake mic input`, async ({}, testInfo) => {
      const wavPath = testInfo.outputPath(`test-${expectedBpm}bpm.wav`);
      await mkdir(path.dirname(wavPath), { recursive: true });
      await writeFile(
        wavPath,
        generateTrack(expectedBpm, {
          sampleRate: 48000,
          durationSec: TEST_DURATION_SECONDS,
        })
      );

      const browser = await chromium.launch({
        args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          `--use-file-for-fake-audio-capture=${wavPath}`,
          '--autoplay-policy=no-user-gesture-required',
        ],
      });

      const context = await browser.newContext({
        ...devices['Pixel 5'],
        permissions: ['microphone'],
      });

      const page = await context.newPage();

      // Activate Chromium's fake audio device — calling getSettings()
      // on getUserMedia tracks forces the fake device to start reading
      // the WAV file. Without this, AudioWorklet may receive silence.
      await page.addInitScript(() => {
        const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = async function(constraints) {
          const stream = await origGUM(constraints);
          stream.getAudioTracks().forEach(t => t.getSettings());
          window.__testMediaStreams = window.__testMediaStreams || [];
          window.__testMediaStreams.push(stream);
          return stream;
        };
      });

      try {
        await page.goto(BASE_URL + '/?viz=true');

        if (expectedBpm === 130) {
          await page.evaluate(() => {
            const startButton = [...document.querySelectorAll('button')].find(
              (button) => button.textContent.includes('Start listening')
            );
            startButton.click();
            startButton.click();
          });
        } else {
          await page
            .getByRole('button', { name: /Start listening/i })
            .click();
        }

        // Wait for the listening state to confirm the microphone is active.
        await expect(
          page.getByText('Listening. Wait...', { exact: true })
        ).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.spectrum-analyzer')).not.toHaveClass(
          /spectrum-analyzer--hidden/
        );
        await expect(
          page.locator('.spectrum-analyzer #AudioMotionAnalyzer canvas')
        ).toBeVisible();

        // Continuous analysis may emit an early outlier before converging.
        await expect
          .poll(
            async () => {
              const bpmText = await page
                .locator('.bpm-display')
                .textContent();
              const detectedBpm = Number.parseFloat(bpmText);

              return Number.isFinite(detectedBpm)
                ? Math.abs(detectedBpm - expectedBpm)
                : Number.POSITIVE_INFINITY;
            },
            {
              message: `expected ${expectedBpm} BPM within ${TOLERANCE} BPM`,
              timeout: 70000,
            }
          )
          .toBeLessThanOrEqual(TOLERANCE);

        await expect(page.locator('.home-tool .affiliate-card')).toHaveCount(0);
        await expect(page.locator('.affiliate-card')).toBeVisible();

        if (expectedBpm === 130) {
          await page
            .getByRole('link', { name: 'Tap tempo', exact: true })
            .click();
          await expect
            .poll(() =>
              page.evaluate(() => ({
                count: window.__testMediaStreams.length,
                allEnded: window.__testMediaStreams.every((stream) =>
                  stream
                    .getTracks()
                    .every((track) => track.readyState === 'ended')
                ),
              }))
            )
            .toEqual({ count: 1, allEnded: true });
        }
      } finally {
        await context.close();
        await browser.close();
      }
    });
  }
});
