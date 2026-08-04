# Store asset requirements

This directory is the source of truth for regenerating BPM Techno store
listings. Keep all generated files in their existing store-specific folders.

## Regenerate everything

```powershell
npm run store-assets:all
```

Individual sets:

```powershell
npm run store-assets:google-play
npm run store-assets:microsoft
npm run store-assets:app-store
```

The screenshot generators capture the current production experience from
`https://bpmtech.no`. Review the generated screenshots whenever the production
layout, navigation, copy, or monetization changes.

## Microsoft Store

All Microsoft Store images must be PNG and smaller than 50 MB.

### Screenshots

Folder: `microsoft-store/screenshots/desktop/`

| Asset | Requirement |
|---|---|
| Desktop screenshots | At least 1; 4 recommended |
| Dimensions | 1366 x 768 or larger; up to 3840 x 2160 |
| Orientation | Landscape or portrait |
| Maximum | 30 files in the current Partner Center UI |

### Store logos and display art

Folder: `microsoft-store/branding/`

| Asset | Dimensions | Title rule |
|---|---:|---|
| Poster art | 720 x 1080 | Include product title |
| Poster art | 1440 x 2160 | Include product title |
| Box art | 1080 x 1080 | Include product title |
| Box art | 2160 x 2160 | Include product title |
| App tile icon | 300 x 300 | Mark only |
| Store logo | 150 x 150 | Mark only |
| Store logo | 71 x 71 | Mark only |
| Super hero art | 1920 x 1080 | Must not include product title |
| Super hero art | 3840 x 2160 | Must not include product title |
| Branded key art | 584 x 800 | Include product title in top 3/4 |
| Titled hero art | 1920 x 1080 | Include product title in top 3/4 |
| Featured promotional square | 1080 x 1080 | Must not include product title |

Poster art is highly recommended and is required for proper Xbox display.
Box art is recommended and becomes the main logo when poster art is absent.
Super hero art appears at the top of eligible Windows and Xbox listings.

Editable source:
`microsoft-store/source/branding.html`

Generator:
`../scripts/generate-microsoft-store-assets.mjs`

Official reference:
https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/pwa/screenshots-and-images

## Google Play

### Listing text

Folder: `google-play/`

| Field | Limit |
|---|---:|
| App name | 30 characters |
| Short description | 80 characters |
| Full description | 4,000 characters |
| Release notes | 500 characters |

### Graphics

Folder: `google-play/graphics/`

| Asset | Requirement |
|---|---|
| App icon | 512 x 512, 32-bit PNG with alpha, maximum 1 MB |
| Feature graphic | 1024 x 500, JPEG or opaque 24-bit PNG |

The Play app icon is copied from `android/store_icon.png` so the listing icon
matches the installed Android launcher identity.

### Screenshots

Folder: `google-play/screenshots/`

Supported sets generated for this app:

- Phone
- 7-inch tablet
- 10-inch tablet
- Chromebook

Each device family contains 5 screenshots. Google Play accepts 2 to 8 per
supported family. Use JPEG or opaque 24-bit PNG, keep every side between
320 and 3840 pixels, keep the aspect ratio between 2:1 and 1:2, and keep each
file below 8 MB. Assets in this repository are at least 1080 pixels wide for
stronger promotional eligibility.

Wear OS, Android TV, Android Automotive OS, and Android XR assets are not
generated because the app does not target those form factors.

Editable source:
`google-play/source/feature-graphic.html`

Generator:
`../scripts/generate-google-play-assets.mjs`

Official references:

- https://support.google.com/googleplay/android-developer/answer/9866151
- https://support.google.com/googleplay/android-developer/answer/9898842

## Apple App Store

### Product page text

Folder: `apple-app-store/`

| Field | Limit |
|---|---:|
| App name | 30 characters |
| Subtitle | 30 characters |
| Promotional text | 170 characters |
| Description | 4,000 characters |
| Keywords | 100 characters |
| What's new | 4,000 characters |

### App icon

Folder: `apple-app-store/graphics/`

| Asset | Requirement |
|---|---|
| App Store icon | 1024 x 1024 PNG, opaque, no alpha, no pre-rounded corners |

Apple applies the platform mask. Keep important artwork away from the outer
edge and do not add a rounded-corner mask to the source file.

### Screenshots

Folder: `apple-app-store/screenshots/`

| Device family | Master portrait size | Count generated |
|---|---:|---:|
| iPhone 6.9-inch | 1320 x 2868 | 5 |
| iPad 13-inch | 2064 x 2752 | 5 |

App Store Connect accepts 1 to 10 screenshots per supported device family and
scales the largest current master size for smaller displays. Use PNG, JPEG, or
JPG without transparency.

The current images are generated from the production web experience. Recapture
from the final iOS/iPadOS build if its safe areas, system bars, navigation, or
permission UI differ visibly.

Apple Watch, Apple TV, Apple Vision Pro, and macOS assets are not generated
because those platforms are not currently targeted.

Generator:
`../scripts/generate-apple-app-store-assets.mjs`

Official references:

- https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- https://developer.apple.com/help/app-store-connect/reference/app-information/
- https://developer.apple.com/design/human-interface-guidelines/app-icons

## Brand rules

- Background: `#071c2b`
- Surface navy: `#0c3046`
- Primary text: `#f7f3ed`
- Secondary text: `#b9cfd8`
- Tempo orange: `#ffb36b`
- Signal cyan: `#69ded5`
- Secondary orange: `#ff8b5c`
- Typeface: Saira, weights 500-700
- Primary mark: orange circle with the five-stem waveform
- Product title: BPM Techno
- Core visual proof: a clear 128 BPM signal, not generic music imagery

Do not add rankings, awards, store badges, prices, promotional discounts, or
claims that are not present in the product. Keep title-free formats free of
the words "BPM Techno", including text embedded in decorative artwork.
