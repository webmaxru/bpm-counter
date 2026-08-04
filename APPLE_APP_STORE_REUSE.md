# Reusing the Apple App Store signing setup

This guide records which parts of the current Windows and GitHub Actions setup
belong to the Apple Developer team and which must be created separately for
every app.

## Current team-wide setup

The following non-secret identifiers describe the current Apple team:

| Item | Current value |
| --- | --- |
| Apple Developer Team ID | `B9FMXAW5TZ` |
| Distribution certificate owner | `Apple Distribution: Maxim Salnikov (B9FMXAW5TZ)` |
| Distribution certificate validity | August 4, 2026 through August 4, 2027 |
| App Store Connect API Key ID | `C6D6DZK5S7` |

The private certificate, `.p12` password, API issuer ID, and `.p8` contents are
secrets and are intentionally not recorded in documentation.

## Reuse matrix

| Asset or setting | Scope | Reuse for another app? | Action for another app |
| --- | --- | --- | --- |
| Apple Developer membership | Apple team | Yes | None while membership remains active |
| Apple Team ID | Apple team | Yes | Use `B9FMXAW5TZ` |
| Apple Distribution certificate | Apple team | Yes | Reuse until it expires or is revoked |
| Distribution private key | Certificate | Yes, with that certificate | Keep securely backed up; never commit it |
| Exported distribution `.p12` | Certificate | Yes | Reuse the same file and password |
| App Store Connect API `.p8` key | Apple team and assigned role | Usually yes | Reuse if its role can access the new app |
| API Key ID and Issuer ID | Apple team/API key | Yes | Reuse with the same `.p8` key |
| Bundle ID | Individual app | No | Register a new explicit identifier |
| App Store Connect app record | Individual app | No | Create a new app with the new bundle ID |
| App Store provisioning profile | Individual app | No | Create a new profile for the new bundle ID |
| `IOS_BUNDLE_ID` variable | Repository/app | No | Set it to the new app's bundle ID |
| `IOS_PROVISIONING_PROFILE_BASE64` | Repository/app | No | Encode the new app's profile |
| App icon, screenshots, copy, privacy answers | Individual app | No | Prepare content that matches the new app |
| Release workflow | Repository structure | Mostly | Copy and adjust project paths, scheme, artifact names, and build commands |
| Windows CSR/export scripts | Machine/repository | Yes | Copy them or point them at another output directory |

One Apple Distribution certificate can sign multiple apps owned by the same
Apple Developer team. The provisioning profile is the app-specific layer: it
combines one app's identifier and capabilities with the reusable distribution
certificate.

## Recommended credential layout

For a small number of personal repositories, use the same team-wide secrets in
each repository and a different provisioning-profile secret in each one:

### Reusable secrets

```text
APPLE_TEAM_ID
IOS_DISTRIBUTION_CERTIFICATE_BASE64
IOS_CERTIFICATE_PASSWORD
APP_STORE_CONNECT_API_KEY_ID
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_API_KEY_BASE64
```

### App-specific secret and variable

```text
IOS_PROVISIONING_PROFILE_BASE64
IOS_BUNDLE_ID
```

For many repositories in the same GitHub organization, the reusable values can
instead be configured as GitHub organization secrets limited to selected
repositories. Keep the provisioning profile and bundle ID at repository scope
to reduce accidental cross-app signing.

Do not place signing material in GitHub Actions variables, workflow files,
repository files, release artifacts, or issue comments. Variables are suitable
for non-secret values such as the bundle ID; secrets are required for private
keys, certificate contents, profiles, and passwords.

## Add another app

1. Register a new explicit bundle ID in Apple Developer.
2. Create the new app in App Store Connect using that bundle ID.
3. Create an **App Store Connect** provisioning profile for the new bundle ID.
4. Select the existing valid Apple Distribution certificate when creating the
   profile.
5. Download the new `.mobileprovision` file.
6. Add the reusable team-wide secrets to the new GitHub repository.
7. Base64-encode the new profile and save it as
   `IOS_PROVISIONING_PROFILE_BASE64`.
8. Set repository variable `IOS_BUNDLE_ID` to the new bundle ID.
9. Copy or adapt the CI and release workflows.
10. Run an unsigned simulator build before attempting the signed archive.
11. Run the signed workflow without TestFlight upload once, then enable upload.

Encode the new profile on Windows:

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("NewApp.mobileprovision")
) | gh secret set IOS_PROVISIONING_PROFILE_BASE64
```

Set its bundle ID:

```powershell
gh variable set IOS_BUNDLE_ID --body "com.example.newapp"
```

## Reuse the Windows scripts

The scripts default to `ios/signing-private`, but now accept custom paths.

Create a completely new distribution identity only when the existing
certificate is expiring, revoked, unavailable, or intentionally being
rotated:

```powershell
powershell -ExecutionPolicy Bypass `
  -File scripts/new-apple-distribution-csr.ps1 `
  -CommonName "Your legal or organization name" `
  -CountryCode "NO" `
  -OutputDirectory "C:\secure\apple-signing"
```

After Apple issues the certificate:

```powershell
powershell -ExecutionPolicy Bypass `
  -File scripts/export-apple-distribution-p12.ps1 `
  -CertificatePath "$HOME\Downloads\distribution.cer" `
  -SigningDirectory "C:\secure\apple-signing" `
  -FriendlyName "Apple Distribution"
```

Do not generate a new distribution certificate merely because you are adding
another app. Apple limits the number of active certificates, and unnecessary
rotation increases the chance of losing the private key used by existing CI
pipelines.

## What must change when copying the workflow

The secret names can remain identical. Review and change these project-specific
values:

- Node version and dependency-install command.
- Web/native synchronization command.
- Xcode project or workspace path.
- Xcode scheme and configuration.
- Default bundle ID.
- Minimum iOS version and supported device families.
- Archive name and artifact name.
- Marketing version and build-number source.
- Export method if the app is not distributed through App Store Connect.
- Native entitlements and capabilities.

The workflow must validate that the provisioning profile's application
identifier matches `APPLE_TEAM_ID.IOS_BUNDLE_ID`. A profile from another app
cannot be reused simply by changing the Xcode bundle-ID build setting.

## Rotation and expiry

Track the certificate and profile expiration dates. Before expiration:

1. Create a replacement Apple Distribution certificate and preserve its new
   private key.
2. Export a new password-protected `.p12`.
3. Recreate every app-specific provisioning profile using the new certificate.
4. Replace the reusable certificate secrets and each app's profile secret.
5. Run signed builds for all repositories before revoking the old certificate.

Revoking an App Store Connect API key requires updating its Key ID and `.p8`
secret in every repository that uses it. The downloaded `.p8` file cannot be
downloaded again, so retain an encrypted backup or deliberately create and
roll out a replacement key.

## BPM Techno-specific values

These values must not be copied unchanged to another app:

| Item | BPM Techno value |
| --- | --- |
| Bundle ID | `no.bpmtech.app` |
| App Store provisioning profile | `BPM Techno provisioning profile` |
| Repository variable | `IOS_BUNDLE_ID=no.bpmtech.app` |
| App Store categories | Music, Utilities |
| Version | `3.0.0` |
| Xcode project | `ios/App/App.xcodeproj` |
| Xcode scheme | `App` |
| App-specific native metadata | Microphone permission and BPM Techno display name |
| Store assets and privacy answers | `store-assets/apple-app-store/` |

The current profile and distribution certificate expire on August 4, 2027.
Set a renewal reminder at least 30 days earlier.
