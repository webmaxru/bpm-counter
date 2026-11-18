import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const androidDirectory = path.join(repositoryRoot, "android");
const isWindows = process.platform === "win32";
const gradleWrapper = path.join(
  androidDirectory,
  isWindows ? "gradlew.bat" : "gradlew",
);
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-android-gradle.mjs <gradle-task>...");
  process.exit(1);
}

const result = spawnSync(gradleWrapper, args, {
  cwd: androidDirectory,
  env: process.env,
  stdio: "inherit",
  shell: isWindows,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
