/**
 * generate-test-audio.js
 *
 * Generates WAV test files with a synthesised 4/4 kick-drum pattern at
 * specific BPM values.  Used to validate the real-time BPM detection
 * pipeline (realtime-bpm-analyzer v5 + AudioWorklet).
 *
 * Run:  node scripts/generate-test-audio.js
 *
 * Zero external dependencies — raw PCM → WAV.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────
const SAMPLE_RATE = 44100;
const BIT_DEPTH = 16;
const NUM_CHANNELS = 1;
const DURATION_SEC = 45; // long enough for stabilizationTime: 10 000 ms
const TARGET_BPMS = [80, 90, 100, 110, 120, 130, 140];
const OUT_DIR = path.join(__dirname, '..', 'public', 'samples');

// ── Kick drum parameters ────────────────────────────────────────────
const KICK_DURATION = 0.10;      // seconds
const KICK_FREQ_START = 150;     // Hz — initial pitch
const KICK_FREQ_END = 45;        // Hz — pitch sweeps down
const KICK_AMP = 0.85;           // peak amplitude (0-1)

// ── Hi-hat parameters (off-beat 8th-note) ───────────────────────────
const HAT_DURATION = 0.03;       // seconds
const HAT_AMP = 0.20;            // much quieter than kick

// ── WAV helpers ─────────────────────────────────────────────────────

function writeWavHeader(buffer, numSamples) {
  const bytesPerSample = BIT_DEPTH / 8;
  const dataSize = numSamples * NUM_CHANNELS * bytesPerSample;
  const fileSize = 36 + dataSize;

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);

  // fmt  sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);                                          // sub-chunk size
  buffer.writeUInt16LE(1, 20);                                           // PCM
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(NUM_CHANNELS * bytesPerSample, 32);               // block align
  buffer.writeUInt16LE(BIT_DEPTH, 34);

  // data sub-chunk header
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
}

// ── Sound synthesis ─────────────────────────────────────────────────

/**
 * Synthesise a kick drum hit into `samples` starting at `offset`.
 * Technique: sine wave with exponential frequency sweep (150 → 45 Hz)
 * and exponential amplitude decay.
 */
function renderKick(samples, offset) {
  const len = Math.min(Math.floor(KICK_DURATION * SAMPLE_RATE), samples.length - offset);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / KICK_DURATION; // 0 → 1

    // Exponential frequency sweep
    const freq = KICK_FREQ_START * Math.pow(KICK_FREQ_END / KICK_FREQ_START, progress);

    // Exponential amplitude decay (fast attack, smooth tail)
    const amp = KICK_AMP * Math.exp(-progress * 5);

    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    samples[offset + i] += amp * Math.sin(phase);
  }
}

/**
 * Synthesise a short hi-hat (filtered noise burst) into `samples`.
 */
function renderHiHat(samples, offset) {
  const len = Math.min(Math.floor(HAT_DURATION * SAMPLE_RATE), samples.length - offset);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / HAT_DURATION;
    const amp = HAT_AMP * Math.exp(-progress * 12);
    // Band-limited noise: average two random values for slightly less harsh sound
    const noise = (Math.random() * 2 - 1 + Math.random() * 2 - 1) * 0.5;
    samples[offset + i] += amp * noise;
  }
}

// ── Main generation ─────────────────────────────────────────────────

function generateTrack(bpm) {
  const totalSamples = SAMPLE_RATE * DURATION_SEC;
  const samples = new Float64Array(totalSamples); // floating-point mix buffer

  const beatInterval = 60 / bpm;                              // seconds per beat
  const halfBeat = beatInterval / 2;                           // 8th-note interval
  const totalBeats = Math.floor(DURATION_SEC / beatInterval);

  // Render kick on every beat, hi-hat on every off-beat 8th note
  for (let beat = 0; beat < totalBeats; beat++) {
    const beatTime = beat * beatInterval;
    const kickOffset = Math.floor(beatTime * SAMPLE_RATE);
    renderKick(samples, kickOffset);

    const hatTime = beatTime + halfBeat;
    const hatOffset = Math.floor(hatTime * SAMPLE_RATE);
    if (hatOffset < totalSamples) {
      renderHiHat(samples, hatOffset);
    }
  }

  // Clamp & convert to 16-bit PCM
  const bytesPerSample = BIT_DEPTH / 8;
  const headerSize = 44;
  const buf = Buffer.alloc(headerSize + totalSamples * bytesPerSample);
  writeWavHeader(buf, totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    let val = Math.max(-1, Math.min(1, samples[i]));
    val = Math.round(val * 32767);
    buf.writeInt16LE(val, headerSize + i * bytesPerSample);
  }

  return buf;
}

// ── Run ─────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`Generating ${TARGET_BPMS.length} test WAV files → ${OUT_DIR}\n`);

  for (const bpm of TARGET_BPMS) {
    const filename = `test-${bpm}bpm.wav`;
    const filepath = path.join(OUT_DIR, filename);
    const wav = generateTrack(bpm);
    fs.writeFileSync(filepath, wav);
    const sizeMB = (wav.length / (1024 * 1024)).toFixed(1);
    console.log(`  ✔ ${filename}  (${sizeMB} MB, ${DURATION_SEC}s @ ${bpm} BPM)`);
  }

  console.log('\nDone. Play through speakers and run the mic-based BPM detector to validate.');
}

main();
