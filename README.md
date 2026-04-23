# react-native-app-icon

[![npm](https://img.shields.io/npm/v/react-native-app-icon)](https://www.npmjs.com/package/react-native-app-icon)
[![GitHub](https://img.shields.io/badge/github-gtsalva%2Freact-native-app-icon-blue)](https://github.com/gtsalva/react-native-app-icon)

Generate all iOS and Android app icons from a single source image. One command, zero manual resizing.

## What it generates

### iOS
37 PNG files inside `ios/*/Images.xcassets/AppIcon.appiconset/` — the asset catalog is auto-detected from any React Native project structure.

Sizes: 16, 20, 29, 32, 40, 48, 50, 55, 57, 58, 60, 64, 66, 72, 76, 80, 87, 88, 92, 100, 102, 108, 114, 120, 128, 144, 152, 167, 172, 180, 196, 216, 234, 256, 258, 512, 1024.

### Android
Inside `android/app/src/main/res/`:

| File | Density | Size |
|---|---|---|
| `mipmap-mdpi/ic_launcher` | mdpi | 48×48 |
| `mipmap-hdpi/ic_launcher` | hdpi | 72×72 |
| `mipmap-xhdpi/ic_launcher` | xhdpi | 96×96 |
| `mipmap-xxhdpi/ic_launcher` | xxhdpi | 144×144 |
| `mipmap-xxxhdpi/ic_launcher` | xxxhdpi | 192×192 |

Plus the adaptive icon foreground layer at each density (named `android_{appSlug}` or `ic_launcher_foreground` depending on config), and optionally `ic_launcher_round` at each density.

Play Store icon: `android/app/src/main/ic_launcher-playstore.png` (512×512, always PNG).

---

## Install

```bash
npm install --save-dev react-native-app-icon
```

---

## Usage

```bash
npx app-icon                        # generate iOS + Android
npx app-icon --only ios
npx app-icon --only android
npx app-icon --dry-run              # preview without writing files
npx app-icon --verbose              # show each file as it's written
npx app-icon --config other.json    # use a custom config path
```

Add it to your `package.json` scripts:

```json
"scripts": {
  "icons": "app-icon"
}
```

---

## Configuration

Create `doicon.config.json` in your project root (next to `package.json`).

### Minimal config — just your image

If your source image already has its own background or design, omit `background` entirely and doicon will resize it as-is:

```json
{
  "source": "./assets/icon-source.png",
  "ios": {},
  "android": {
    "appSlug": "myapp"
  }
}
```

### With background

```json
{
  "source": "./assets/icon-source.png",
  "background": {
    "type": "solid",
    "color": "#1A1A2E"
  },
  "ios": {},
  "android": {
    "appSlug": "myapp"
  }
}
```

### Full config reference

```json
{
  "source": "./assets/icon-source.png",

  "background": { ... },

  "transform": {
    "padding": 0.1,
    "borderRadius": 0,
    "rotate": 0,
    "flipX": false,
    "flipY": false,
    "scale": 1.0
  },

  "ios": {},

  "android": {
    "appSlug": "myapp",
    "format": "png",
    "round": false,
    "adaptiveIcon": {
      "background": { ... },
      "foreground": {
        "padding": 0.25,
        "image": null
      }
    }
  }
}
```

---

## Background

The `background` field controls what's rendered behind your icon. It applies to all iOS icons and Android `ic_launcher`. The `android.adaptiveIcon.background` overrides it for the adaptive foreground layer.

### Solid color

```json
"background": {
  "type": "solid",
  "color": "#1A1A2E"
}
```

### Linear gradient

```json
"background": {
  "type": "gradient",
  "gradient": {
    "type": "linear",
    "angle": 135,
    "stops": [
      { "color": "#1A1A2E", "position": 0 },
      { "color": "#0F0F1A", "position": 1 }
    ]
  }
}
```

`angle` follows CSS convention: `0` = bottom→top, `90` = left→right, `135` = top-left→bottom-right.

### Radial gradient

```json
"background": {
  "type": "gradient",
  "gradient": {
    "type": "radial",
    "stops": [
      { "color": "#FBBF24", "position": 0 },
      { "color": "#1A1A2E", "position": 1 }
    ]
  }
}
```

### Transparent

```json
"background": {
  "type": "transparent"
}
```

Useful when your source image already has a background or you want no fill (e.g. for adaptive icon foreground layers).

### Color formats

All color values accept any valid CSS color string — not just hex:

```json
{ "color": "#1A1A2E" }
{ "color": "rgb(26, 26, 46)" }
{ "color": "hsl(240, 28%, 14%)" }
{ "color": "lab(49.688% -45.0514 38.7399)" }
{ "color": "oklch(55% 0.18 142)" }
```

---

## Transform options

Controls how the source image is placed over the background.

| Option | Type | Default | Description |
|---|---|---|---|
| `padding` | `number` | `0.1` | Space around the icon as a fraction of total size. `0.1` = 10% padding on each side. Range: `0`–`0.5` |
| `borderRadius` | `number` | `0` | Rounded corners as a fraction of size. `0` = square, `0.5` = circle. Range: `0`–`1` |
| `rotate` | `number` | `0` | Rotation in degrees. Range: `-360`–`360` |
| `flipX` | `boolean` | `false` | Flip the icon horizontally |
| `flipY` | `boolean` | `false` | Flip the icon vertically |
| `scale` | `number` | `1.0` | Scale the icon relative to its padded area. Range: `0.1`–`2` |

---

## Android options

| Option | Type | Default | Description |
|---|---|---|---|
| `appSlug` | `string` | — | If set, foreground layer is named `android_{appSlug}.png`. If omitted, uses `ic_launcher_foreground` (default React Native naming) |
| `format` | `"png"` \| `"webp"` | `"png"` | Output format for Android icons. Play Store icon is always PNG |
| `round` | `boolean` | `false` | Generate `ic_launcher_round` at each density |
| `adaptiveIcon.background` | Background | main `background` | Background for the adaptive icon foreground layer. Accepts same values as the top-level `background` |
| `adaptiveIcon.foreground.padding` | `number` | `0.25` | Padding for the adaptive foreground layer. Android safe zone is 25% |
| `adaptiveIcon.foreground.image` | `string \| null` | `null` | Path to an alternate source image for the foreground layer. Uses main `source` if null |

---

## Source image

- Minimum size: **1024×1024 px**
- Format: PNG with transparency recommended
- The image is composited over the background — use a transparent PNG if your icon has a non-rectangular shape

---

## Requirements

- Node.js ≥ 18
- Run from the root of your React Native project (where `ios/` and `android/` folders are)
