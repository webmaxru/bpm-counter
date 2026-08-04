import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const requiredVariables = [
  'APPLE_TEAM_ID',
  'IOS_BUNDLE_ID',
  'IOS_PROVISIONING_PROFILE_NAME',
];

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`${variableName} is required.`);
  }
}

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>destination</key>
  <string>export</string>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
  <key>method</key>
  <string>app-store-connect</string>
  <key>provisioningProfiles</key>
  <dict>
    <key>${escapeXml(process.env.IOS_BUNDLE_ID)}</key>
    <string>${escapeXml(process.env.IOS_PROVISIONING_PROFILE_NAME)}</string>
  </dict>
  <key>signingCertificate</key>
  <string>Apple Distribution</string>
  <key>signingStyle</key>
  <string>manual</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>teamID</key>
  <string>${escapeXml(process.env.APPLE_TEAM_ID)}</string>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
`;

const outputPath = path.resolve(
  process.env.IOS_EXPORT_OPTIONS_PATH ?? 'ios/ExportOptions.plist'
);
await writeFile(outputPath, plist, 'utf8');
console.log(`Generated ${outputPath}.`);
