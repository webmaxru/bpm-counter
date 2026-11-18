import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const identityPath = path.join(
  repositoryRoot,
  'store-assets',
  'microsoft-store',
  'package-identity.json',
);
const outputRoot = path.join(
  repositoryRoot,
  'store-assets',
  'microsoft-store',
  'packages',
);
const pwabuilderEndpoint =
  process.env.PWABUILDER_MSIX_ENDPOINT ??
  'https://pwabuilder-windows-docker.azurewebsites.net/msix/generateZip';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is required. Copy the Publisher ID (CN=...) from Partner Center → Product management → Product Identity.`,
    );
  }
  return value;
}

function normalizeVersion(version, label) {
  const parts = String(version).trim().split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
    throw new Error(
      `${label} must be a four-part Store version like 3.0.0.0 (received "${version}").`,
    );
  }
  return parts.map((part) => String(Number(part))).join('.');
}

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 4; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }
  return 0;
}

const identity = JSON.parse(await readFile(identityPath, 'utf8'));
const publisherId = requireEnv(identity.publisherIdEnv || 'MS_STORE_PUBLISHER_ID');
const modernVersion = normalizeVersion(
  process.env.MS_STORE_MODERN_VERSION ?? identity.defaultModernVersion,
  'Modern package version',
);
const classicVersion = normalizeVersion(
  process.env.MS_STORE_CLASSIC_VERSION ?? identity.defaultClassicVersion,
  'Classic package version',
);

if (compareVersions(classicVersion, modernVersion) >= 0) {
  throw new Error(
    `Classic version ${classicVersion} must be lower than modern version ${modernVersion}.`,
  );
}

const packageRequest = {
  name: identity.reservedProductName,
  packageId: identity.packageId,
  applicationId: identity.applicationId || 'App',
  url: identity.url,
  version: modernVersion,
  allowSigning: true,
  publisher: {
    displayName: identity.publisherDisplayName,
    commonName: publisherId,
  },
  generateModernPackage: true,
  classicPackage: {
    generate: true,
    version: classicVersion,
    url: identity.url,
  },
  edgeHtmlPackage: {
    generate: false,
  },
  edgeChannel: 'stable',
  manifestUrl: identity.manifestUrl,
  resourceLanguage: 'EN-US',
};

await mkdir(outputRoot, { recursive: true });

console.log(`Packaging ${identity.url} as ${identity.packageId}`);
console.log(`Modern ${modernVersion} / classic ${classicVersion}`);
console.log(`POST ${pwabuilderEndpoint}`);

const response = await fetch(pwabuilderEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/zip, application/octet-stream, */*',
  },
  body: JSON.stringify(packageRequest),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(
    `PWABuilder packaging failed with HTTP ${response.status}: ${body.slice(0, 2000)}`,
  );
}

const zipBuffer = Buffer.from(await response.arrayBuffer());
if (zipBuffer.byteLength < 10_000) {
  throw new Error(
    `PWABuilder returned an unexpectedly small package (${zipBuffer.byteLength} bytes).`,
  );
}

const stamp = modernVersion.replaceAll('.', '-');
const zipName = `bpm-techno-msstore-${stamp}.zip`;
const zipPath = path.join(outputRoot, zipName);
const requestPath = path.join(outputRoot, `pwabuilder-request-${stamp}.json`);
const infoPath = path.join(outputRoot, 'pwaAppInfo.json');

await writeFile(zipPath, zipBuffer);
await writeFile(requestPath, `${JSON.stringify(packageRequest, null, 2)}\n`);
await writeFile(
  infoPath,
  `${JSON.stringify(
    {
      AppId: identity.storeProductId,
      Uri: identity.url,
      PackageId: identity.packageId,
      PublisherDisplayName: identity.publisherDisplayName,
      PublisherId: publisherId,
      ModernVersion: modernVersion,
      ClassicVersion: classicVersion,
      GeneratedAt: new Date().toISOString(),
      PackageZip: zipName,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${zipPath} (${zipBuffer.byteLength} bytes)`);
console.log(`Wrote ${infoPath}`);
console.log(
  'Upload the .msixbundle and .classic.appxbundle from the zip in Partner Center, or publish them with the Microsoft Store release workflow.',
);
