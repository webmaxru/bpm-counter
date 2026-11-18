import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const failures = [];

const requiredRelativePaths = [
  'STORE_RELEASES.md',
  'WEB_RELEASE.md',
  '.github/workflows/azure-static-web-apps-mango-mud-0136f961e.yml',
  'swa-cli.config.json',
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
    failures.push(`Missing required path: ${relativePath}`);
  }
}

const workflow = await readFile(
  path.join(
    repositoryRoot,
    '.github/workflows/azure-static-web-apps-mango-mud-0136f961e.yml',
  ),
  'utf8',
).catch(() => '');

if (!workflow.includes('workflow_dispatch')) {
  failures.push(
    'Azure Static Web Apps workflow is missing workflow_dispatch for manual redeploys.',
  );
}
if (!workflow.includes('paths-ignore')) {
  failures.push(
    'Azure Static Web Apps workflow should use paths-ignore so native/store-only changes do not redeploy the web app.',
  );
}
if (!workflow.includes('android/**') || !workflow.includes('ios/**') || !workflow.includes('store-assets/**')) {
  failures.push(
    'Azure Static Web Apps paths-ignore must cover android/, ios/, and store-assets/.',
  );
}

console.log('Web release readiness check');
console.log('===========================');
console.log(
  'Required secret: AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_MUD_0136F961E',
);
console.log('Optional VITE_* analytics secrets are listed in WEB_RELEASE.md.');
console.log('');

if (failures.length > 0) {
  console.error('Failures:');
  for (const failure of failures) {
    console.error(`  x ${failure}`);
  }
  process.exit(1);
}

console.log('Web release wiring looks ready.');
