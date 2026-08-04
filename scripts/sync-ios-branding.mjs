import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(
  root,
  'store-assets',
  'apple-app-store',
  'graphics',
  'app-store-icon-1024x1024.png'
);
const destination = path.join(
  root,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'AppIcon.appiconset',
  'AppIcon-512@2x.png'
);

await mkdir(path.dirname(destination), { recursive: true });
await copyFile(source, destination);

console.log('Synced the 1024 x 1024 App Store icon into the Xcode project.');
