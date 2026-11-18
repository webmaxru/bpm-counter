import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const androidDirectory = path.join(repositoryRoot, "android");
const failures = [];

const read = async (relativePath) =>
  readFile(path.join(repositoryRoot, relativePath), "utf8");

const buildSource = await read("android/app/build.gradle");
const manifest = await read("android/app/src/main/AndroidManifest.xml");
const mainActivity = await read(
  "android/app/src/main/java/no/bpmtech/twa/MainActivity.kt",
);
const analysisService = await read(
  "android/app/src/main/java/no/bpmtech/twa/services/BpmAnalysisService.kt",
);
const assetLinks = JSON.parse(
  await read("public/.well-known/assetlinks.json"),
);

const requiredBuildSnippets = [
  ["applicationId 'no.bpmtech.twa'", "package ID"],
  ["compileSdk 36", "compile SDK 36"],
  ["targetSdk 36", "target SDK 36"],
  ["versionCode 4", "version code 4"],
  ["versionName '4.0.0'", "version name 4.0.0"],
  [
    "io.github.dlepaux:realtime-bpm-analyzer:6.3.0",
    "realtime-bpm-analyzer 6.3.0 dependency",
  ],
  ["org.jetbrains.kotlin.android", "Kotlin Android plugin"],
  ["org.jetbrains.kotlin.plugin.compose", "Compose compiler plugin"],
  ["compose true", "Compose build feature"],
];

for (const [snippet, label] of requiredBuildSnippets) {
  if (!buildSource.includes(snippet)) {
    failures.push(`app/build.gradle is missing ${label}.`);
  }
}

if (
  buildSource.includes("androidbrowserhelper") ||
  buildSource.includes("bubblewrap")
) {
  failures.push("app/build.gradle still references the TWA / Bubblewrap stack.");
}

if (!manifest.includes('android:name=".MainActivity"')) {
  failures.push("AndroidManifest.xml is missing MainActivity.");
}
if (!manifest.includes("RECORD_AUDIO")) {
  failures.push("AndroidManifest.xml is missing RECORD_AUDIO permission.");
}
if (manifest.includes("androidbrowserhelper") || manifest.includes("LauncherActivity")) {
  failures.push("AndroidManifest.xml still contains TWA activities.");
}

if (!mainActivity.includes("RootScreen") || !mainActivity.includes("setContent")) {
  failures.push("MainActivity is not a Compose entry point.");
}

if (!analysisService.includes("io.github.dlepaux.realtimebpmanalyzer.BpmAnalyzer")) {
  failures.push("BpmAnalysisService does not import BpmAnalyzer.");
}
if (!analysisService.includes("analyzeChannelData")) {
  failures.push("BpmAnalysisService does not call analyzeChannelData.");
}

for (const relativePath of [
  "android/app/src/main/java/no/bpmtech/twa/ui/AnalyzeScreen.kt",
  "android/app/src/main/java/no/bpmtech/twa/ui/TapTempoScreen.kt",
  "android/app/src/main/java/no/bpmtech/twa/ui/MetronomeScreen.kt",
  "android/app/src/main/java/no/bpmtech/twa/ui/RootScreen.kt",
  "android/release-notes-v4.txt",
  "ANDROID.md",
]) {
  try {
    await access(path.join(repositoryRoot, relativePath));
  } catch {
    failures.push(`${relativePath} is missing.`);
  }
}

try {
  await access(path.join(androidDirectory, "twa-manifest.json"));
  failures.push("android/twa-manifest.json still exists; Bubblewrap manifest should be removed.");
} catch {
  // expected
}

const assetLink = assetLinks.find(
  ({ target }) =>
    target?.namespace === "android_app" &&
    target?.package_name === "no.bpmtech.twa",
);

if (!assetLink) {
  failures.push("Digital Asset Links package no.bpmtech.twa is missing.");
} else if (
  !assetLink.relation?.includes("delegate_permission/common.handle_all_urls")
) {
  failures.push("Digital Asset Links handle_all_urls relation is missing.");
} else {
  const fingerprint =
    "EB:4A:CA:4B:33:AB:06:BE:1E:8A:D0:71:B3:96:94:DB:AB:41:83:BE:E3:9F:0D:5B:11:4A:86:82:4F:0E:74:84";
  if (!assetLink.target.sha256_cert_fingerprints?.includes(fingerprint)) {
    failures.push("Play app-signing fingerprint is missing from assetlinks.json.");
  }
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    "Native Android project verified: no.bpmtech.twa v4.0.0, API 36, realtime-bpm-analyzer 6.3.0, Compose entry, Asset Links.",
  );
}
