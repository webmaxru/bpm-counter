import { spawnSync } from "node:child_process";
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

const result = spawnSync(bubblewrapExecutable, process.argv.slice(2), {
  cwd: androidDirectory,
  env: {
    ...process.env,
    PATH: `${androidDirectory}${path.delimiter}${process.env.PATH ?? ""}`,
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
