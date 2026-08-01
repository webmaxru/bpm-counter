import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ConsoleLog,
  TwaGenerator,
  TwaManifest,
} from "@bubblewrap/core";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const androidDirectory = path.join(repositoryRoot, "android");
const manifestPath = path.join(androidDirectory, "twa-manifest.json");
const assetOrigin = process.env.BUBBLEWRAP_ASSET_ORIGIN;
const productionOrigin = "https://bpmtech.no";

await mkdir(androidDirectory, { recursive: true });

const sourceManifest = JSON.parse(await readFile(manifestPath, "utf8"));
const generationManifest = structuredClone(sourceManifest);

if (assetOrigin) {
  const localOrigin = assetOrigin.replace(/\/$/, "");

  for (const field of [
    "iconUrl",
    "maskableIconUrl",
    "monochromeIconUrl",
    "webManifestUrl",
  ]) {
    if (generationManifest[field]?.startsWith(productionOrigin)) {
      generationManifest[field] = generationManifest[field].replace(
        productionOrigin,
        localOrigin,
      );
    }
  }

  for (const shortcut of generationManifest.shortcuts ?? []) {
    for (const field of [
      "chosenIconUrl",
      "chosenMaskableIconUrl",
      "chosenMonochromeIconUrl",
    ]) {
      if (shortcut[field]?.startsWith(productionOrigin)) {
        shortcut[field] = shortcut[field].replace(
          productionOrigin,
          localOrigin,
        );
      }
    }
  }
}

const twaManifest = new TwaManifest(generationManifest);
const validationError = twaManifest.validate();

if (validationError) {
  throw new Error(`Invalid android/twa-manifest.json: ${validationError}`);
}

const generator = new TwaGenerator();
await generator.removeTwaProject(androidDirectory);
await generator.createTwaProject(
  androidDirectory,
  twaManifest,
  new ConsoleLog("android:generate"),
);

if (assetOrigin) {
  const buildFile = path.join(androidDirectory, "app", "build.gradle");
  const localOrigin = assetOrigin.replace(/\/$/, "");
  const buildSource = await readFile(buildFile, "utf8");
  await writeFile(buildFile, buildSource.replaceAll(localOrigin, productionOrigin));
}

const checksum = createHash("sha1")
  .update(await readFile(manifestPath))
  .digest("hex");
await writeFile(path.join(androidDirectory, "manifest-checksum.txt"), checksum);

console.log("Generated the Bubblewrap Android project in android/.");
