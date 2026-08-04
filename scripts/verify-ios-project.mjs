import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const readBinary = (relativePath) => readFile(path.join(root, relativePath));
const failures = [];

const config = JSON.parse(await read('capacitor.config.json'));
if (config.appId !== 'no.bpmtech.app') {
  failures.push('Capacitor appId must be no.bpmtech.app.');
}
if (config.webDir !== 'build') {
  failures.push('Capacitor must bundle the production build directory.');
}

const infoPlist = await read('ios/App/App/Info.plist');
if (!infoPlist.includes('<key>NSMicrophoneUsageDescription</key>')) {
  failures.push('Info.plist is missing the microphone usage description.');
}
if (!infoPlist.includes('<key>ITSAppUsesNonExemptEncryption</key>')) {
  failures.push('Info.plist is missing export-compliance metadata.');
}

const project = await read('ios/App/App.xcodeproj/project.pbxproj');
for (const expected of [
  'PRODUCT_BUNDLE_IDENTIFIER = no.bpmtech.app;',
  'MARKETING_VERSION = 3.0.0;',
  'IPHONEOS_DEPLOYMENT_TARGET = 15.0;',
]) {
  if (!project.includes(expected)) {
    failures.push(`Xcode project is missing: ${expected}`);
  }
}

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');
const storeIcon = await readBinary(
  'store-assets/apple-app-store/graphics/app-store-icon-1024x1024.png'
);
const xcodeIcon = await readBinary(
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
);
if (digest(storeIcon) !== digest(xcodeIcon)) {
  failures.push('The Xcode app icon is not synchronized with the store icon.');
}

for (const workflow of [
  '.github/workflows/ios-ci.yml',
  '.github/workflows/ios-release.yml',
]) {
  await read(workflow).catch(() => {
    failures.push(`${workflow} is missing.`);
  });
}

const scheme = await read(
  'ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme'
).catch(() => '');
if (!scheme.includes('BlueprintName = "App"')) {
  failures.push('The shared App Xcode scheme is missing or invalid.');
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('iOS project configuration is complete and internally consistent.');
}
