import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const androidDirectory = path.join(repositoryRoot, "android");
const buildFile = path.join(androidDirectory, "app", "build.gradle");
const manifestFile = path.join(androidDirectory, "twa-manifest.json");
const buildSource = await readFile(buildFile, "utf8");
const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
const assetLinks = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "public", ".well-known", "assetlinks.json"),
    "utf8",
  ),
);

const requiredValues = [
  [`applicationId "${manifest.packageId}"`, "package ID"],
  ["compileSdkVersion 36", "compile SDK 36"],
  ["targetSdkVersion 36", "target SDK 36"],
  [`versionCode ${manifest.appVersionCode}`, "version code"],
  [`versionName "${manifest.appVersion}"`, "version name"],
  [
    "https://bpmtech.no/manifest.webmanifest",
    "production web manifest URL",
  ],
];

for (const [expected, label] of requiredValues) {
  if (!buildSource.includes(expected)) {
    throw new Error(`Android verification failed: missing ${label}.`);
  }
}

if (/localhost|127\.0\.0\.1/.test(buildSource)) {
  throw new Error("Android verification failed: local asset URL was committed.");
}

const expectedFingerprints = manifest.fingerprints.map(({ value }) => value);
const assetLink = assetLinks.find(
  ({ target }) =>
    target?.namespace === "android_app" &&
    target?.package_name === manifest.packageId,
);

if (!assetLink) {
  throw new Error(
    "Android verification failed: Digital Asset Links package is missing.",
  );
}

if (
  !assetLink.relation?.includes("delegate_permission/common.handle_all_urls")
) {
  throw new Error(
    "Android verification failed: handle_all_urls relation is missing.",
  );
}

const publishedFingerprints = assetLink.target.sha256_cert_fingerprints ?? [];
for (const fingerprint of expectedFingerprints) {
  if (!publishedFingerprints.includes(fingerprint)) {
    throw new Error(
      `Android verification failed: fingerprint ${fingerprint} is missing.`,
    );
  }
}

await Promise.all([
  access(path.join(androidDirectory, "app-release-unsigned-aligned.apk")),
  access(
    path.join(
      androidDirectory,
      "app",
      "build",
      "outputs",
      "bundle",
      "release",
      "app-release.aab",
    ),
  ),
]);

console.log(
  `Android release verified: ${manifest.packageId} v${manifest.appVersion} ` +
    `(code ${manifest.appVersionCode}), API 36, Digital Asset Links, APK and AAB.`,
);
