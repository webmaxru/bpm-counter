import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const failures = [];
const warnings = [];

const requiredRelativePaths = [
  'IOS_RELEASE.md',
  'APPLE_APP_STORE_REUSE.md',
  'APP_STORE_LAUNCH.md',
  'ios/App/App.xcodeproj/project.pbxproj',
  'ios/App/App/BPMTechnoApp.swift',
  'ios/App/App/PrivacyInfo.xcprivacy',
  'ios/App/App/Info.plist',
  '.github/workflows/ios-ci.yml',
  '.github/workflows/ios-release.yml',
  'store-assets/apple-app-store/listing-en-US.txt',
  'store-assets/apple-app-store/app-store-connect-submission.txt',
  'store-assets/apple-app-store/graphics/app-store-icon-1024x1024.png',
  'store-assets/apple-app-store/source/native-screens.html',
  'store-assets/apple-app-store/screenshots/manifest.json',
];

const screenshotDevices = {
  'iphone-6.9-inch': { width: 1320, height: 2868 },
  'ipad-13-inch': { width: 2064, height: 2752 },
};

const expectedScreens = [
  '01-analyze-result.png',
  '02-record-analyze.png',
  '03-file-analyze.png',
  '04-tap-tempo.png',
  '05-metronome.png',
];

const requiredSecrets = [
  'APPLE_TEAM_ID',
  'IOS_DISTRIBUTION_CERTIFICATE_BASE64',
  'IOS_CERTIFICATE_PASSWORD',
  'IOS_PROVISIONING_PROFILE_BASE64',
  'APP_STORE_CONNECT_API_KEY_ID',
  'APP_STORE_CONNECT_ISSUER_ID',
  'APP_STORE_CONNECT_API_KEY_BASE64',
];

async function exists(relativePath) {
  try {
    await access(path.join(repositoryRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

for (const relativePath of requiredRelativePaths) {
  if (!(await exists(relativePath))) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

const listing = await readFile(
  path.join(repositoryRoot, 'store-assets/apple-app-store/listing-en-US.txt'),
  'utf8',
).catch(() => '');
const submission = await readFile(
  path.join(
    repositoryRoot,
    'store-assets/apple-app-store/app-store-connect-submission.txt',
  ),
  'utf8',
).catch(() => '');

for (const [label, text] of [
  ['listing-en-US.txt', listing],
  ['app-store-connect-submission.txt', submission],
]) {
  if (!text.includes('4.0')) {
    failures.push(`${label} still targets a pre-4.0 release.`);
  }
  if (
    /web experience|Audio URL tool|browser-accessible MP3/i.test(text) ||
    /Capacitor web-wrapper shell|ships as a Capacitor/i.test(text)
  ) {
    failures.push(
      `${label} still describes Capacitor/web-wrapper behavior instead of native 4.0.`,
    );
  }
}

if (/Google Analytics|Application Insights|affiliate/i.test(submission)) {
  warnings.push(
    'Submission handoff still mentions analytics/affiliates — confirm App Privacy answers match the native binary.',
  );
}

let sharpAvailable = false;
try {
  createRequire(import.meta.url)('sharp');
  sharpAvailable = true;
} catch {
  // optional; fall back to file presence + byte size checks
}

for (const [deviceId, expected] of Object.entries(screenshotDevices)) {
  const directory = path.join(
    repositoryRoot,
    'store-assets/apple-app-store/screenshots',
    deviceId,
  );
  const entries = await readdir(directory).catch(() => null);
  if (!entries) {
    failures.push(`Missing screenshot directory: screenshots/${deviceId}`);
    continue;
  }

  for (const fileName of expectedScreens) {
    if (!entries.includes(fileName)) {
      failures.push(`Missing screenshot: screenshots/${deviceId}/${fileName}`);
      continue;
    }

    const filePath = path.join(directory, fileName);
    const info = await stat(filePath);
    if (info.size < 20_000) {
      failures.push(
        `Screenshot looks too small to be valid: screenshots/${deviceId}/${fileName}`,
      );
    }

    if (sharpAvailable) {
      const { default: sharp } = await import('sharp');
      const meta = await sharp(filePath).metadata();
      if (meta.width !== expected.width || meta.height !== expected.height) {
        failures.push(
          `Wrong pixel size for screenshots/${deviceId}/${fileName}: got ${meta.width}x${meta.height}, expected ${expected.width}x${expected.height}`,
        );
      }
    }
  }

  const legacyWebScreens = entries.filter((name) =>
    /live-bpm-counter|audio-url-analyzer|bpm-to-milliseconds|half-double-time/.test(
      name,
    ),
  );
  if (legacyWebScreens.length > 0) {
    failures.push(
      `Legacy web screenshots still present under screenshots/${deviceId}: ${legacyWebScreens.join(', ')}`,
    );
  }
}

const iconPath = path.join(
  repositoryRoot,
  'store-assets/apple-app-store/graphics/app-store-icon-1024x1024.png',
);
if (await exists('store-assets/apple-app-store/graphics/app-store-icon-1024x1024.png')) {
  const iconInfo = await stat(iconPath);
  if (iconInfo.size < 10_000) {
    failures.push('App Store icon file is unexpectedly small.');
  }
  if (sharpAvailable) {
    const { default: sharp } = await import('sharp');
    const meta = await sharp(iconPath).metadata();
    if (meta.width !== 1024 || meta.height !== 1024) {
      failures.push(
        `App Store icon must be 1024x1024, got ${meta.width}x${meta.height}`,
      );
    }
  }
}

const releaseWorkflow = await readFile(
  path.join(repositoryRoot, '.github/workflows/ios-release.yml'),
  'utf8',
).catch(() => '');
if (!releaseWorkflow.includes('workflow_dispatch')) {
  failures.push('ios-release.yml is missing workflow_dispatch.');
}
if (!releaseWorkflow.includes('Upload to TestFlight')) {
  failures.push('ios-release.yml is missing the TestFlight upload step.');
}
if (
  !releaseWorkflow.includes('store-assets:check') &&
  !releaseWorkflow.includes('check-app-store-readiness.mjs')
) {
  warnings.push(
    'ios-release.yml does not run the App Store readiness check before signing.',
  );
}

console.log('App Store readiness check');
console.log('=========================');
console.log(`Repository: ${repositoryRoot}`);
console.log('');
console.log('Required GitHub Actions secrets (cannot be verified from CI checkout):');
for (const secret of requiredSecrets) {
  console.log(`  - ${secret}`);
}
console.log('Optional repository variable: IOS_BUNDLE_ID (default no.bpmtech.app)');
console.log('');

if (warnings.length > 0) {
  console.log('Warnings:');
  for (const warning of warnings) {
    console.log(`  ! ${warning}`);
  }
  console.log('');
}

if (failures.length > 0) {
  console.error('Failures:');
  for (const failure of failures) {
    console.error(`  x ${failure}`);
  }
  process.exit(1);
}

console.log('All checked-in App Store assets and release wiring look ready.');
console.log(
  'Next human steps: confirm secrets in GitHub, create/update the ASC app record, dispatch iOS TestFlight Release, then submit for review.',
);
