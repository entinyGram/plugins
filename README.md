# entinyGram Plugins & SDK

[![QuickJS](https://img.shields.io/badge/Runtime-QuickJS-orange.svg)](https://bellard.org/quickjs/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-GPL--2.0-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-entinyGram%20Android-purple.svg)](https://github.com/entaytion/entinyGram)

The official feature plugins and developer SDK for **[entinyGram](https://github.com/entaytion/entinyGram)**, an advanced Android fork of [Inugram](https://github.com/teidesu/inugram).

---

## Architecture & Design Philosophy

entinyGram inherits Inugram's **plugin engine**: standalone `.inu.js` bundles executed in a sandboxed QuickJS runtime with granular user-approved permissions (`grants`) and access to Android APIs (`inu.ui`, `inu.jvm`, `inu.xposed`, `inu.io`).

Instead of baking custom functionality directly into the Android application codebase, **entinyGram's features are designed and built as modular plugins**:

```text
┌────────────────────────────────────────────────────────┐
│               Inugram Plugin Engine                    │
│        (QuickJS runtime, grant sandbox, hooks)         │
├────────────────────────────────────────────────────────┤
│                   entinyGram App                       │
│        (Lightweight glue layer & install bridge)       │
├────────────────────────────────────────────────────────┤
│               entinyGram SDK Plugin                    │
│      (entinygram.sdk: settings embed engine)       │
├────────────────────────────────────────────────────────┤
│                  Feature Plugins                       │
│  2GIS  │  Calendar Systems  │  Text Animation  │  ...  │
└────────────────────────────────────────────────────────┘
```

### Why this architecture?
1. **Upstream Maintainability**: Upstream Telegram and Inugram releases can be merged cleanly with minimal patchsets.
2. **Instant Updates**: Plugins update independently through the plugin repository built into the app—no APK re-download or reinstall required.
3. **User Transparency & Choice**: Every plugin explicitly declares its required grants (`fetch`, `unsafe.jvm`, `unsafe.xposed`). Users decide what to run.
4. **Clean Decoupling**: If a plugin fails or is disabled, the core Telegram client continues to function normally.

---

## The SDK Dependency System

All official feature plugins require the **entinyGram SDK plugin** (`entinygram.sdk`):

```js
// @requires entinygram.sdk >=0.1.0-alpha
```

### How the app enforces dependencies:
- **Installation Guard (`PluginManager.kt:329`)**:
  When installing a plugin via file, repository, or ADB, the app checks `PluginDependencies.unmet(manifest)`. If `entinygram.sdk` is missing, disabled, or outdated, installation is **refused immediately** with an explanatory bulletin:
  - *"Needs the plugin entinygram.sdk. Install it first"* (`InuPluginsErrorRequires`)
  - *"Needs entinygram.sdk 0.1.0-alpha or newer"* (`InuPluginsErrorRequiresVersion`)
- **Runtime Lifecycle Guard**:
  If a user disables `entinygram.sdk` in settings, `stopUnmet()` immediately suspends all dependent plugins. When the SDK is re-enabled, `retryUnmet()` automatically restores them.
- **Settings Entrypoint**:
  The SDK plugin carries the runtime embed engine (`@entiny/sdk/embed`). Without it, feature plugins cannot mount their custom rows, switches, or pickers into native Telegram menus.

---

## Official Plugins

| Plugin | Package ID | Version | Requires | Description |
| :--- | :--- | :---: | :---: | :--- |
| [**entinyGram SDK**](plugins/core/sdk/) | `entinygram.sdk` | `0.4.0` | *None* | Shared settings embedding engine for other plugins. |
| [**Text Animation**](plugins/features/text-animation/) | `entinygram.text-animation` | `1.0.0` | `SDK` | Fluid typing feedback animations and particle burst effects on backspace/deletion. |
| [**2GIS**](plugins/features/2gis/) | `entinygram.2gis` | `1.0.0` | `SDK` | High-resolution 2GIS raster map tiles and location preview images (requires API key). |
| [**Calendar Systems**](plugins/features/calendar-systems/) | `entinygram.calendar-systems` | `1.1.0` | `SDK` | Alternative calendar formatting (Hijri, Persian, Indian, Hebrew, Buddhist, etc.) for dates. |
| [**Doc Viewer**](plugins/features/doc-viewer/) | `entinygram.doc-viewer` | `1.1.0` | `SDK` | In-app viewer for PDF, DOCX, XLSX, text, code, images, archives and more. |
| [**Call Avatar**](plugins/features/call-avatar/) | `entinygram.call-avatar` | `1.1` | `SDK` | Full-screen caller photo, display timing modes, translucent voice-call buttons, and uk/en/ru settings. |
| [**Yandex**](plugins/features/yandex/) | `entinygram.yandex` | `1.0.0` | `SDK` | In-app translation via Yandex Cloud Translate v2 and Yandex static map previews. |
| [**No Vibration**](plugins/features/no-vibration/) | `no-vibration` | `1.0.0` | *None* | Turns off haptics and vibration, including notification vibration. By [@akresik](https://t.me/akresik). |

---

## Installing Plugins

### 1. Plugin Repository (Recommended)
Open **`Settings → Plugins → Repositories`**. The **@entinyGramPlugins** repository is built in and cannot be removed; any other Telegram channel can be added next to it.
- Tap a plugin to install it, or **Update** when a newer post is available. The app reviews the requested grants with you before installing.
- A plugin that needs `entinygram.sdk` installs it first from the same repository.

### 2. Loading from a File
Transfer any `.inu.js` file to your Android device and open it via **`Settings → Plugins → Load from file`** or by tapping the file in a chat.

### 3. Developer Push (ADB)
Enable **Developer mode** under `Settings → Plugins` on your device, then push plugins directly from your workstation:
```sh
bun inu push
```

---

## Developing Plugins

### Prerequisites
- [Bun](https://bun.sh/) runtime installed.
- Android device or emulator with entinyGram installed and Developer Mode enabled in `Settings → Plugins`.

```sh
# Clone repository
git clone https://github.com/entinyGram/plugins.git
cd plugins

# Install dependencies
bun install
```

### CLI Commands
Run commands inside a plugin directory (`plugins/<name>`):

| Command | Action |
| :--- | :--- |
| `bun inu dev` | Watch files, auto-rebuild, push to device over ADB, and reload in real-time |
| `bun inu push` | Single build, deploy to device over ADB, and print execution logs |
| `bun inu build` | Typecheck and build release `.inu.js` file into `dist/` |
| `bun inu check` | Validate manifest schema, grants, and syntax |
| `bun inu eval "<code>"` | Evaluate an arbitrary JavaScript snippet inside the on-device QuickJS engine |

---

## Placing Plugin Settings in entinyGram

Using `@entiny/sdk`, any plugin can mount its settings controls directly into native Telegram screens:

```ts
import { defineConfig } from '@inugram/cli'
import { withEntiny } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    'my-plugin': {
      entry: 'src/index.ts',
      manifest: withEntiny({
        id: 'entinygram.my-plugin',
        name: 'My Plugin',
        author: 'entinyGram',
        version: '1.0.0',
        description: 'Demonstrates settings placement',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      }, {
        // 1. Adds a row that navigates to the plugin's full settings screen:
        screen: ['category-chats'],
        // 2. Draws inline switches/sliders at the end of a section:
        inline: [{ slot: 'category-chats.end', rows: ['my_feature_switch'] }],
        // 3. Adds radio options to dialog pickers:
        choice: [{ slot: 'behavior.map-provider', rows: ['my_tile_option'] }],
      }),
    },
  },
})
```

`withEntiny(...)` automatically appends `@requires entinygram.sdk >=0.1.0-alpha` and builds the manifest metadata directives (`@entiny-menu`, `@entiny-inline`, `@entiny-choice`).

Available slot identifiers are cataloged in [`sdk/entiny/slots.json`](sdk/entiny/slots.json) and typed in [`sdk/entiny/src/slots.ts`](sdk/entiny/src/slots.ts).

---

## Publishing

1. Ensure the plugin resides in `plugins/features/<name>` with an `inu.config.ts`, `icon.svg` (24×24 single-color), and `README.md`.
2. Build the bundles:
   ```sh
   bun run build
   ```
   This builds every plugin (or only the ones named, `bun run build 2gis`) into `release/` as `entinyGram-<Name>-<version>.inu.js`.
3. Post the files to the plugins channel. The in-app repository picks up new posts and offers them as updates.

The **Build plugins** workflow (*Actions → Build plugins → Run workflow*) does the same on demand and can also publish the bundles as a GitHub release.

---

## Repository Structure

```text
├── plugins/
│   ├── core/sdk/          # The entinygram.sdk plugin: settings embedding (not the @entiny/sdk library)
│   └── features/          # Feature plugins (2gis, calendar-systems, call-avatar, doc-viewer, no-vibration, text-animation, yandex)
├── sdk/
│   ├── entiny/            # @entiny/sdk: settings placement, slots, map utilities
│   ├── cli/               # @inugram/cli tooling
│   ├── types/             # @inugram/plugin-types typings
│   └── docs/              # Guides for engine APIs (grants, UI, JVM, Xposed)
└── scripts/
    ├── pack-release.ts       # Builds every plugin into release/
    └── generate-slots.ts     # Extracts available settings slots from app strings
```

---

## License & Credits

Licensed under **GPL-2.0-or-later**, matching entinyGram and Inugram (see [LICENSE](LICENSE)).

- **[entinyGram](https://github.com/entaytion/entinyGram)**: The independent power-user Telegram Android fork.
- **[Inugram](https://github.com/teidesu/inugram)** by [@teidesu](https://github.com/teidesu): The plugin engine, QuickJS bindings, and foundation toolchain.
