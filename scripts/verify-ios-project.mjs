import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const readBinary = (relativePath) => readFile(path.join(root, relativePath));
const failures = [];

const infoPlist = await read('ios/App/App/Info.plist');
if (!infoPlist.includes('<key>NSMicrophoneUsageDescription</key>')) {
  failures.push('Info.plist is missing the microphone usage description.');
}
if (!infoPlist.includes('<key>ITSAppUsesNonExemptEncryption</key>')) {
  failures.push('Info.plist is missing export-compliance metadata.');
}
if (infoPlist.includes('<key>UIMainStoryboardFile</key>')) {
  failures.push('Info.plist still references a main storyboard; native SwiftUI should not.');
}
if (infoPlist.includes('CAPACITOR_DEBUG')) {
  failures.push('Info.plist still contains Capacitor debug metadata.');
}

const project = await read('ios/App/App.xcodeproj/project.pbxproj');
for (const expected of [
  'PRODUCT_BUNDLE_IDENTIFIER = no.bpmtech.app;',
  'MARKETING_VERSION = 4.0.0;',
  'IPHONEOS_DEPLOYMENT_TARGET = 17.0;',
  'repositoryURL = "https://github.com/dlepaux/realtime-bpm-analyzer-swift";',
  'productName = RealtimeBpmAnalyzer;',
  'BPMTechnoApp.swift in Sources',
  'PrivacyInfo.xcprivacy in Resources',
]) {
  if (!project.includes(expected)) {
    failures.push(`Xcode project is missing: ${expected}`);
  }
}

const privacyManifest = await read('ios/App/App/PrivacyInfo.xcprivacy');
if (!privacyManifest.includes('NSPrivacyAccessedAPICategorySystemBootTime')) {
  failures.push('PrivacyInfo.xcprivacy must declare SystemBootTime access for tap-tempo timing.');
}
if (!privacyManifest.includes('35F9.1')) {
  failures.push('PrivacyInfo.xcprivacy must use reason 35F9.1 for elapsed-time measurement.');
}

if (project.includes('CapApp-SPM') || project.includes('capacitor-swift-pm')) {
  failures.push('Xcode project still references Capacitor packages.');
}

const appEntry = await read('ios/App/App/BPMTechnoApp.swift');
if (!appEntry.includes('@main') || !appEntry.includes('BPMTechnoApp')) {
  failures.push('Native SwiftUI app entry point is missing.');
}

const analyzer = await read('ios/App/App/Services/BpmAnalysisService.swift');
if (!analyzer.includes('import RealtimeBpmAnalyzer')) {
  failures.push('BpmAnalysisService does not import RealtimeBpmAnalyzer.');
}
if (!analyzer.includes('analyzeChannelData')) {
  failures.push('BpmAnalysisService does not call analyzeChannelData.');
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
  console.log('Native iOS project configuration is complete and internally consistent.');
}
