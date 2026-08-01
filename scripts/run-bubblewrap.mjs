import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const androidDirectory = path.join(repositoryRoot, "android");
const bubblewrapExecutable = path.join(
  repositoryRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "bubblewrap.cmd" : "bubblewrap",
);

const bubblewrapConfig = JSON.parse(
  readFileSync(path.join(homedir(), ".bubblewrap", "config.json"), "utf8"),
);
const jdkBinDirectory = path.join(bubblewrapConfig.jdkPath, "bin");
const pathEnvironmentKey =
  Object.keys(process.env).find((key) => key.toLowerCase() === "path") ??
  "PATH";
const childEnvironment = { ...process.env };

childEnvironment.JAVA_HOME = bubblewrapConfig.jdkPath;
childEnvironment[pathEnvironmentKey] = [
  androidDirectory,
  jdkBinDirectory,
  process.env[pathEnvironmentKey] ?? "",
].join(path.delimiter);

const result = spawnSync(bubblewrapExecutable, process.argv.slice(2), {
  cwd: androidDirectory,
  env: childEnvironment,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
