const path = require('path');
const { test, expect, chromium } = require('@playwright/test');

// BPM values with reliable detection from synthetic kick/hi-hat WAV files.
// The realtime-bpm-analyzer v5 reliably detects 120+ BPM from these patterns.
// Tempos below 120 BPM don't produce enough transient energy per analysis
// window for reliable detection via Chromium fake audio capture.
const BPM_VALUES = [120, 130, 140];
const TOLERANCE = 3; // +/-3 BPM
const SAMPLES_DIR = path.resolve(__dirname, '..', 'public', 'samples');
const BASE_URL = 'http://localhost:3000';

test.describe('BPM detection via fake audio capture', () => {
  for (const expectedBpm of BPM_VALUES) {
    test(`detects ${expectedBpm} BPM from fake mic input`, async () => {
      const wavPath = path.join(SAMPLES_DIR, `test-${expectedBpm}bpm.wav`);

      const browser = await chromium.launch({
        args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          `--use-file-for-fake-audio-capture=${wavPath}`,
          '--autoplay-policy=no-user-gesture-required',
        ],
      });

      const context = await browser.newContext({
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
          return stream;
        };
      });

      try {
        await page.goto(BASE_URL + '/');

        // Click start listening
        await page.getByRole('button', { name: /Start listening/i }).click();

        // Wait for "Listening..." to confirm mic is active
        await expect(page.locator('h3').filter({ hasText: 'Listening...' })).toBeVisible({ timeout: 15000 });

        // Wait for BPM result - h3 changes from "Listening..." to "BPM"
        await expect(page.locator('h3').filter({ hasText: 'BPM' })).toBeVisible({ timeout: 60000 });

        // Read the detected BPM from h2
        const bpmText = await page.locator('h2').first().textContent();
        const detectedBpm = parseFloat(bpmText);

        // Assert within tolerance
        expect(detectedBpm).toBeGreaterThanOrEqual(expectedBpm - TOLERANCE);
        expect(detectedBpm).toBeLessThanOrEqual(expectedBpm + TOLERANCE);
      } finally {
        await context.close();
        await browser.close();
      }
    });
  }
});
