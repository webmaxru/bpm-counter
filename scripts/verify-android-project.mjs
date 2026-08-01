import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const androidDirectory = path.join(repositoryRoot, "android");
const buildFile = path.join(androidDirectory, "app", "build.gradle");
const buildSource = await readFile(buildFile, "utf8");

const requiredValues = [
  ['applicationId "no.bpmtech.twa"', "package ID"],
  ["compileSdkVersion 36", "compile SDK 36"],
  ["targetSdkVersion 36", "target SDK 36"],
  ["versionCode 1", "version code"],
  ['versionName "1.0.0"', "version name"],
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
  "Android release verified: no.bpmtech.twa, API 36, APK and AAB present.",
);
