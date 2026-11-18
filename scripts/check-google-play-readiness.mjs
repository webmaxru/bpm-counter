import { access, open, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const failures = [];
const warnings = [];

const requiredRelativePaths = [
  'PLAY_STORE_RELEASE.md',
  '.github/workflows/android-release.yml',
  '.github/workflows/android-ci.yml',
  'store-assets/google-play/listing-en-US.txt',
  'store-assets/google-play/play-console-submission.txt',
  'store-assets/google-play/package-identity.json',
  'store-assets/google-play/source/feature-graphic.html',
  'store-assets/google-play/source/native-phone-screens.html',
  'scripts/generate-google-play-assets.mjs',
  'android/store_icon.png',
  'android/release-notes-v4.txt',
  'android/app/build.gradle',
];

const expectedScreenshots = [
  '01-analyze-home.png',
  '02-analyze-result.png',
  '03-tap-tempo.png',
  '04-metronome.png',
  '05-recording-in-progress.png',
];

const deviceFamilies = [
  'phone',
  'tablet-7-inch',
  'tablet-10-inch',
  'chromebook',
];

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

async function exists(relativePath) {
  try {
    await access(path.join(repositoryRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readPngSize(filePath) {
  const handle = await open(filePath, 'r');
  try {
    const header = Buffer.alloc(24);
    const { bytesRead } = await handle.read(header, 0, 24, 0);
    if (bytesRead < 24) {
      throw new Error('file is shorter than a PNG IHDR header');
    }
    if (!header.subarray(0, 8).equals(PNG_SIGNATURE)) {
      throw new Error('missing PNG signature');
    }
    const chunkType = header.toString('ascii', 12, 16);
    if (chunkType !== 'IHDR') {
      throw new Error(`expected IHDR chunk, found ${chunkType}`);
    }
    return {
      width: header.readUInt32BE(16),
      height: header.readUInt32BE(20),
    };
  } finally {
    await handle.close();
  }
}

function assertDimension(label, actual, expectedWidth, expectedHeight) {
  if (actual.width !== expectedWidth || actual.height !== expectedHeight) {
    failures.push(
      `${label} is ${actual.width}x${actual.height}; expected ${expectedWidth}x${expectedHeight}.`,
    );
  }
}

for (const relativePath of requiredRelativePaths) {
  if (!(await exists(relativePath))) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

const identity = JSON.parse(
  await readFile(
    path.join(repositoryRoot, 'store-assets/google-play/package-identity.json'),
    'utf8',
  ).catch(() => '{}'),
);

for (const key of [
  'packageName',
  'versionName',
  'versionCode',
  'applicationId',
  'defaultTrack',
]) {
  if (identity[key] === undefined || identity[key] === null || identity[key] === '') {
    failures.push(`package-identity.json is missing "${key}".`);
  }
}

if (identity.packageName && identity.packageName !== 'no.bpmtech.twa') {
  failures.push(
    `Unexpected packageName ${identity.packageName}; expected no.bpmtech.twa.`,
  );
}

if (identity.versionCode !== 4) {
  failures.push(`Expected versionCode 4, found ${identity.versionCode}.`);
}

if (identity.versionName !== '4.0.0') {
  failures.push(`Expected versionName 4.0.0, found ${identity.versionName}.`);
}

const gradle = await readFile(
  path.join(repositoryRoot, 'android/app/build.gradle'),
  'utf8',
).catch(() => '');

if (!gradle.includes("applicationId 'no.bpmtech.twa'")) {
  failures.push('android/app/build.gradle is missing applicationId no.bpmtech.twa.');
}
if (!gradle.includes('versionCode 4') || !gradle.includes("versionName '4.0.0'")) {
  failures.push('android/app/build.gradle version is not 4 / 4.0.0.');
}
if (!gradle.includes('ANDROID_KEYSTORE_FILE')) {
  failures.push('Release signing env wiring is missing from android/app/build.gradle.');
}

const listing = await readFile(
  path.join(repositoryRoot, 'store-assets/google-play/listing-en-US.txt'),
  'utf8',
).catch(() => '');

const shortMatch = listing.match(/SHORT DESCRIPTION\s*\n\n([\s\S]*?)\n\nFULL DESCRIPTION/);
const shortDescription = shortMatch?.[1]?.trim() ?? '';
if (!shortDescription) {
  failures.push('listing-en-US.txt is missing a short description.');
} else if ([...shortDescription].length > 80) {
  failures.push(
    `Short description is ${[...shortDescription].length} characters; Play limit is 80.`,
  );
}

if (!listing.includes('On-device') && !listing.includes('on-device')) {
  warnings.push('Listing copy does not mention on-device analysis.');
}

const iconPath = path.join(
  repositoryRoot,
  'store-assets/google-play/graphics/app-icon-512x512.png',
);
const featurePath = path.join(
  repositoryRoot,
  'store-assets/google-play/graphics/feature-graphic-1024x500.png',
);

if (await exists('store-assets/google-play/graphics/app-icon-512x512.png')) {
  const size = await readPngSize(iconPath);
  assertDimension('Play app icon', size, 512, 512);
  const bytes = (await stat(iconPath)).size;
  if (bytes > 1024 * 1024) {
    failures.push(`Play app icon is ${(bytes / 1024 / 1024).toFixed(2)} MB; max is 1 MB.`);
  }
} else {
  failures.push('Missing Play app icon graphics/app-icon-512x512.png');
}

if (await exists('store-assets/google-play/graphics/feature-graphic-1024x500.png')) {
  const size = await readPngSize(featurePath);
  assertDimension('Feature graphic', size, 1024, 500);
} else {
  failures.push('Missing feature graphic graphics/feature-graphic-1024x500.png');
}

for (const family of deviceFamilies) {
  const directory = path.join(
    repositoryRoot,
    'store-assets/google-play/screenshots',
    family,
  );
  let entries = [];
  try {
    entries = await readdir(directory);
  } catch {
    failures.push(`Missing screenshot family folder: screenshots/${family}`);
    continue;
  }

  for (const fileName of expectedScreenshots) {
    if (!entries.includes(fileName)) {
      failures.push(`Missing ${family} screenshot ${fileName}`);
      continue;
    }
    const filePath = path.join(directory, fileName);
    const bytes = (await stat(filePath)).size;
    if (bytes > 8 * 1024 * 1024) {
      failures.push(`${family}/${fileName} exceeds the 8 MB Play screenshot limit.`);
    }
    try {
      const size = await readPngSize(filePath);
      if (size.width < 320 || size.height < 320) {
        failures.push(`${family}/${fileName} is below the 320 px minimum side.`);
      }
      if (size.width > 3840 || size.height > 3840) {
        failures.push(`${family}/${fileName} exceeds the 3840 px maximum side.`);
      }
      const ratio = size.width / size.height;
      if (ratio < 0.5 || ratio > 2) {
        failures.push(
          `${family}/${fileName} aspect ratio ${ratio.toFixed(3)} is outside 1:2–2:1.`,
        );
      }
      if (Math.min(size.width, size.height) < 1080 && family === 'phone') {
        warnings.push(
          `${family}/${fileName} is under 1080 px on the short side; prefer 1080+ for promo eligibility.`,
        );
      }
    } catch (error) {
      failures.push(`${family}/${fileName} is not a valid PNG (${error.message}).`);
    }
  }

  const stale = entries.filter(
    (name) => name.endsWith('.png') && !expectedScreenshots.includes(name),
  );
  for (const name of stale) {
    warnings.push(`Unexpected screenshot still present: screenshots/${family}/${name}`);
  }
}

const releaseNotes = await readFile(
  path.join(repositoryRoot, 'android/release-notes-v4.txt'),
  'utf8',
).catch(() => '');
if ([...releaseNotes.trim()].length === 0) {
  failures.push('android/release-notes-v4.txt is empty.');
} else if ([...releaseNotes.trim()].length > 500) {
  failures.push('android/release-notes-v4.txt exceeds the 500-character Play release-notes limit.');
}

const playReleaseNotes = await readFile(
  path.join(repositoryRoot, 'android/play-whatsnew/whatsnew-en-US'),
  'utf8',
).catch(() => null);
if (playReleaseNotes === null) {
  failures.push('Missing android/play-whatsnew/whatsnew-en-US (uploaded by android-release.yml).');
} else if (playReleaseNotes.trim() !== releaseNotes.trim()) {
  failures.push(
    'android/play-whatsnew/whatsnew-en-US does not match android/release-notes-v4.txt.',
  );
}

const nativeScreens = await readFile(
  path.join(repositoryRoot, 'store-assets/google-play/source/native-phone-screens.html'),
  'utf8',
).catch(() => '');
if (/data-screen=['"]privacy['"]|screen-privacy|>Privacy</i.test(nativeScreens)) {
  failures.push(
    'native-phone-screens.html still includes a Privacy screen that the native app does not expose.',
  );
}
if (/New analysis/i.test(nativeScreens)) {
  failures.push(
    'native-phone-screens.html invents a "New analysis" action; match BpmResultCard ("Share BPM").',
  );
}
if (!/Share BPM/i.test(nativeScreens) || !/Recording analysis/i.test(nativeScreens)) {
  failures.push(
    'native-phone-screens.html result mockup must include "Recording analysis" and "Share BPM".',
  );
}
if (!/Stop &amp; analyze|Stop & analyze/i.test(nativeScreens)) {
  failures.push(
    'native-phone-screens.html must include the real recording-in-progress "Stop & analyze" state.',
  );
}
if (/min-height:\s*100vh/i.test(nativeScreens)) {
  failures.push(
    'native-phone-screens.html must not use min-height: 100vh; phone captures crop content past the viewport.',
  );
}

if (failures.length > 0) {
  console.error('Google Play readiness check failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  if (warnings.length > 0) {
    console.error('\nWarnings:\n');
    for (const warning of warnings) {
      console.error(`- ${warning}`);
    }
  }
  process.exit(1);
}

console.log('Google Play readiness check passed.');
if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}
