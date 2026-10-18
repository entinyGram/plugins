# Text Animation Plugin

Smooth real-time typing animation and dynamic deletion particle effects in Telegram's message input field.

`entinygram.text-animation` · version `1.0.0` · requires `entinygram.sdk >=0.1.0-alpha`

---

## Overview

**Text Animation** enhances the messaging experience in entinyGram by adding fluid visual feedback whenever you type or delete text in the chat input:

- **Typing feedback**: Letters animate as they appear, with customizable duration, wave delays, subtle blur, smooth slide offsets, scale bouncing, and rotation.
- **Deletion effects**: Deleted characters produce ghost fadeouts and burst into customizable physics particles (Dust, Sparks, Snow, Sakura petals, Floating letters, or Gravity fall).
- **Native performance**: Renders directly onto the Android `Canvas` during `EditTextBoldCursor.onDraw`. Frame rates remain smooth and typing latency is zero.

---

## Why it is a plugin

In stock Telegram or traditional client mods, visual input tweaks require invasive patches in `EditTextBoldCursor.java`, `ChatActivity.java`, and custom rendering pipelines. This creates merge conflicts on every upstream Telegram release.

As an entinyGram plugin:
1. **Zero client bloat**: The feature lives in a single `.inu.js` script executed via QuickJS.
2. **Safe & optional**: Users can install, update, customize, or disable it on the fly without updating the APK.
3. **Settings integration**: Seamlessly integrated into `Settings → Chats` through the `@entiny/sdk` embed engine.

---

## Features & Customization

All settings can be configured via `Settings → Chats` (at the bottom of the section) or in `Settings → Plugins → Text animation`.

### 1. Typing Animations
- **Enable / Disable switch**: Turn typing animations on or off instantly.
- **Duration**: Control the animation length (from snappy 100ms to soft 400ms).
- **Wave Delay**: Stagger effect for rapid keystrokes.
- **Slide Distance**: Configurable vertical/horizontal entry trajectory.
- **Visual Filters**: Adjustable blur radius, initial scale, and rotation tilt.

### 2. Deletion & Particle Effects
- **Enable / Disable Deletion Effects**: Toggle particle bursts on backspace.
- **6 Particle Styles**:
  - `Dust`: Subtle fading particles dispersing with air resistance.
  - `Sparks`: Energetic glowing sparks bursting outward.
  - `Snow`: Gentle falling flakes with horizontal sway.
  - `Sakura`: Soft cherry blossom petals drifting downward.
  - `Letters`: Mini typography glyphs dissipating into the background.
  - `Fall`: Gravity-driven particles tumbling down the input area.
- **Particle Count & Lifetime**: Adjust density from minimal to intense.

---

## Architecture & How It Works

```text
┌────────────────────────────────────────────────────────┐
│               Android UI Thread                        │
│                                                        │
│  EditTextBoldCursor.onDraw                             │
│         │                                              │
│         ▼                                              │
│  [Xposed Hook] ──► TextWatcher indices tracking        │
│         │                                              │
│         ▼                                              │
│  Draw animated glyphs & physics particles on Canvas    │
└────────────────────────────────────────────────────────┘
```

1. **TextWatcher**: Hooks into the input field using `unsafe.jvm` reflection to detect exact cursor positions, typed ranges, and deleted character coordinates.
2. **Canvas Hook**: Hooks `EditTextBoldCursor.onDraw(Canvas)` using `unsafe.xposed`. Custom shaders, transforms, and particle lists are drawn directly onto the view's canvas before the native cursor is rendered.
3. **QuickJS Lifecycle**: Plugin settings and state persist in `localStorage`. Changes update the active renderer parameters immediately.

---

## Permissions (Grants)

| Grant | Purpose |
| :--- | :--- |
| `unsafe.jvm` | Access Android UI classes (`Canvas`, `Paint`, `TextWatcher`, `Layout`, `View`) to track cursor metrics and render effects. |
| `unsafe.xposed` | Intercept `EditTextBoldCursor.onDraw` to draw text animations and particles. |

> [!NOTE]
> Like all plugins relying on method interception, Text Animation requires a device where the engine's hook layer is supported and active.

---

## Dependency on entinyGram SDK

Text Animation requires the **entinyGram SDK** (`entinygram.sdk >=0.1.0-alpha`):
- Uses `@entiny/sdk` to inject its settings entry directly into `Settings → Chats` (`category-chats.end`).
- If `entinygram.sdk` is missing or disabled, entinyGram blocks installation with an error and will not run the plugin until the SDK is present.

---

## Development & Building

Built with [Bun](https://bun.sh/) and `@inugram/cli`:

```sh
# Build the plugin bundle
bun inu build

# Run in watch mode and push to connected ADB device
bun inu dev

# Push once to device
bun inu push
```
