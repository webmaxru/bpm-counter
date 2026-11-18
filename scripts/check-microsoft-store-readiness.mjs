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
  'MICROSOFT_STORE_RELEASE.md',
  '.github/workflows/microsoft-store-release.yml',
  '.github/workflows/microsoft-store-ci.yml',
  'store-assets/microsoft-store/listing-en-US.txt',
  'store-assets/microsoft-store/partner-center-submission.txt',
  'store-assets/microsoft-store/package-identity.json',
  'store-assets/microsoft-store/source/branding.html',
  'scripts/generate-microsoft-store-assets.mjs',
  'scripts/package-microsoft-store.mjs',
];

const brandingAssets = [
  ['poster-art', 'poster-art-720x1080.png', 720, 1080],
  ['poster-art', 'poster-art-1440x2160.png', 1440, 2160],
  ['box-art', 'box-art-1080x1080.png', 1080, 1080],
  ['box-art', 'box-art-2160x2160.png', 2160, 2160],
  ['store-logos', 'app-tile-icon-300x300.png', 300, 300],
  ['store-logos', 'store-logo-150x150.png', 150, 150],
  ['store-logos', 'store-logo-71x71.png', 71, 71],
  ['store-display', 'super-hero-art-1920x1080.png', 1920, 1080],
  ['store-display', 'super-hero-art-3840x2160.png', 3840, 2160],
  ['xbox', 'branded-key-art-584x800.png', 584, 800],
  ['xbox', 'titled-hero-art-1920x1080.png', 1920, 1080],
  ['xbox', 'featured-promotional-square-1080x1080.png', 1080, 1080],
];

const expectedScreenshots = [
  '01-live-bpm-counter.png',
  '02-audio-url-analyzer.png',
  '03-tap-tempo.png',
  '04-bpm-to-milliseconds.png',
  '05-half-double-time.png',
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

for (const relativePath of requiredRelativePaths) {
  if (!(await exists(relativePath))) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

const identity = JSON.parse(
  await readFile(
    path.join(
      repositoryRoot,
      'store-assets/microsoft-store/package-identity.json',
    ),
    'utf8',
  ).catch(() => '{}'),
);

for (const key of [
  'storeProductId',
  'packageId',
  'publisherDisplayName',
  'url',
  'manifestUrl',
  'defaultModernVersion',
  'defaultClassicVersion',
]) {
  if (!identity[key]) {
    failures.push(`package-identity.json is missing "${key}".`);
  }
}

if (identity.storeProductId && identity.storeProductId !== '9NQ4M5SC9PQ9') {
  failures.push(
    `Unexpected storeProductId ${identity.storeProductId}; expected 9NQ4M5SC9PQ9.`,
  );
}

const listing = await readFile(
  path.join(repositoryRoot, 'store-assets/microsoft-store/listing-en-US.txt'),
  'utf8',
).catch(() => '');

if (!/SHORT DESCRIPTION/i.test(listing) || !/DESCRIPTION/i.test(listing)) {
  failures.push('listing-en-US.txt is missing required Store copy sections.');
}
if (/Produce some beats using any player, launchpad/i.test(listing)) {
  failures.push(
    'listing-en-US.txt still contains the legacy Store short description.',
  );
}

for (const [folder, fileName, width, height] of brandingAssets) {
  const relativePath = path.join(
    'store-assets/microsoft-store/branding',
    folder,
    fileName,
  );
  if (!(await exists(relativePath))) {
    failures.push(`Missing branding asset: ${relativePath}`);
    continue;
  }

  const filePath = path.join(repositoryRoot, relativePath);
  const info = await stat(filePath);
  if (info.size < 500) {
    failures.push(`Branding asset looks too small: ${relativePath}`);
  }

  try {
    const meta = await readPngSize(filePath);
    if (meta.width !== width || meta.height !== height) {
      failures.push(
        `Wrong pixel size for ${relativePath}: got ${meta.width}x${meta.height}, expected ${width}x${height}`,
      );
    }
  } catch (error) {
    failures.push(
      `Could not read PNG dimensions for ${relativePath}: ${error.message}`,
    );
  }
}

const screenshotDirectory = path.join(
  repositoryRoot,
  'store-assets/microsoft-store/screenshots/desktop',
);
const screenshotEntries = await readdir(screenshotDirectory).catch(() => null);
if (!screenshotEntries) {
  failures.push('Missing screenshot directory: screenshots/desktop');
} else {
  for (const fileName of expectedScreenshots) {
    if (!screenshotEntries.includes(fileName)) {
      failures.push(`Missing screenshot: screenshots/desktop/${fileName}`);
      continue;
    }

    const filePath = path.join(screenshotDirectory, fileName);
    const info = await stat(filePath);
    if (info.size < 20_000) {
      failures.push(
        `Screenshot looks too small: screenshots/desktop/${fileName}`,
      );
    }

    try {
      const meta = await readPngSize(filePath);
      if (meta.width < 1366 || meta.height < 768) {
        failures.push(
          `Screenshot ${fileName} is below Store minimum desktop size (${meta.width}x${meta.height}).`,
        );
      }
    } catch (error) {
      failures.push(
        `Could not read PNG dimensions for screenshots/desktop/${fileName}: ${error.message}`,
      );
    }
  }

  const legacy = screenshotEntries.filter((name) =>
    /listen-idle|bpm-to-ms\.png/.test(name),
  );
  if (legacy.length > 0) {
    failures.push(
      `Legacy screenshot filenames still present: ${legacy.join(', ')}`,
    );
  }
}

const releaseWorkflow = await readFile(
  path.join(repositoryRoot, '.github/workflows/microsoft-store-release.yml'),
  'utf8',
).catch(() => '');
if (!releaseWorkflow.includes('workflow_dispatch')) {
  failures.push('microsoft-store-release.yml is missing workflow_dispatch.');
}
if (
  !releaseWorkflow.includes('package-microsoft-store.mjs') &&
  !releaseWorkflow.includes('microsoft-store:package')
) {
  failures.push(
    'microsoft-store-release.yml does not run the PWABuilder packaging script.',
  );
}

const jobEnvMatch = releaseWorkflow.match(
  /jobs:\s*\n\s*package:[\s\S]*?\n\s*steps:/,
);
if (jobEnvMatch) {
  const jobHeader = jobEnvMatch[0];
  for (const secretName of [
    'AZURE_AD_TENANT_ID',
    'AZURE_AD_APPLICATION_CLIENT_ID',
    'AZURE_AD_APPLICATION_SECRET',
    'SELLER_ID',
    'MS_STORE_PUBLISHER_ID',
  ]) {
    if (jobHeader.includes(secretName)) {
      failures.push(
        `microsoft-store-release.yml exposes ${secretName} at job scope; keep Partner Center secrets step-scoped.`,
      );
    }
  }
}

if (
  /msstore publish .*MS_STORE_MSIX[\s\S]*msstore publish .*MS_STORE_CLASSIC/.test(
    releaseWorkflow,
  )
) {
  failures.push(
    'microsoft-store-release.yml still publishes modern and classic packages with separate msstore publish calls.',
  );
}
if (
  !releaseWorkflow.includes('submission update') ||
  !releaseWorkflow.includes('submission publish')
) {
  failures.push(
    'microsoft-store-release.yml must update one submission with both bundles, then commit once.',
  );
}
if (
  !/Classic \.appxbundle was not found/.test(releaseWorkflow) ||
  /continuing with modern package only/.test(releaseWorkflow)
) {
  failures.push(
    'microsoft-store-release.yml must fail when the classic package is missing.',
  );
}

if (!process.env.MS_STORE_PUBLISHER_ID) {
  warnings.push(
    'MS_STORE_PUBLISHER_ID is not set in this environment; packaging will require it at release time.',
  );
}

console.log('Microsoft Store readiness check');
for (const warning of warnings) {
  console.log(`warning: ${warning}`);
}
for (const failure of failures) {
  console.error(`error: ${failure}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
  console.error(`Failed with ${failures.length} error(s).`);
} else {
  console.log('All required Microsoft Store assets and pipeline files look ready.');
}
