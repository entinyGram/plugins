# entinyGram Plugins & SDK

[![QuickJS](https://img.shields.io/badge/Runtime-QuickJS-orange.svg)](https://bellard.org/quickjs/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-GPL--2.0-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-entinyGram%20Android-purple.svg)](https://github.com/entaytion/entinyGram)

The official plugin catalog, feature plugins, and developer SDK for **[entinyGram](https://github.com/entaytion/entinyGram)**, an advanced Android fork of [Inugram](https://github.com/teidesu/inugram).

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
│      (entinygram.sdk: Marketplace UI & Embed Engine)   │
├────────────────────────────────────────────────────────┤
│                  Feature Plugins                       │
│  2GIS  │  Calendar Systems  │  Text Animation  │  ...  │
└────────────────────────────────────────────────────────┘
```

### Why this architecture?
1. **Upstream Maintainability**: Upstream Telegram and Inugram releases can be merged cleanly with minimal patchsets.
2. **Instant Updates**: Plugins update independently via GitHub and the in-app Marketplace—no APK re-download or reinstall required.
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
  When installing a plugin via file, marketplace, or ADB, the app checks `PluginDependencies.unmet(manifest)`. If `entinygram.sdk` is missing, disabled, or outdated, installation is **refused immediately** with an explanatory bulletin:
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
| [**entinyGram SDK**](plugins/entiny-sdk/) | `entinygram.sdk` | `0.1.0-alpha` | *None* | In-app Marketplace UI and shared settings embedding engine. |
| [**Text Animation**](plugins/text-animation/) | `entinygram.text-animation` | `1.0.0` | `SDK` | Fluid typing feedback animations and particle burst effects on backspace/deletion. |
| [**2GIS**](plugins/2gis/) | `entinygram.2gis` | `1.0.0` | `SDK` | High-resolution 2GIS raster map tiles and location preview images (requires API key). |
| [**Calendar Systems**](plugins/calendar-systems/) | `entinygram.calendar-systems` | `1.0.0` | `SDK` | Alternative calendar formatting (Hijri, Persian, Indian, Hebrew, Buddhist, etc.) for dates. |
| [**Yandex**](plugins/yandex/) | `entinygram.yandex` | `1.0.0` | `SDK` | In-app translation via Yandex Cloud Translate v2 and Yandex static map previews. |

---

## Installing Plugins

### 1. In-App Marketplace (Recommended)
Open **`Settings → Plugins → Marketplace`**.
- Browse available plugins with live descriptions, version history, and icons.
- Tap **Install** or **Update**. The app downloads the script, validates its SHA-256 against the catalog, and prompts you to review the requested grants.

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

## Publishing to the Catalog

1. Ensure the plugin resides in `plugins/<name>` with an `inu.config.ts`, `icon.svg` (24×24 single-color), and `README.md`.
2. Build and update the catalog:
   ```sh
   bun run build:plugins
   ```
   This compiles all plugins into `plugins/dist/<id>/<version>.inu.js`, computes their SHA-256 hashes, and refreshes [`plugins/index.json`](plugins/index.json) and [`index.json`](index.json).
3. Commit and push your changes to GitHub. The in-app marketplace automatically detects published updates.

---

## Repository Structure

```text
├── index.json             # Root catalog read by the app (paths relative to root)
├── plugins/
│   ├── index.json         # Catalog for the marketplace (paths relative to plugins/)
│   ├── dist/              # Published immutable .inu.js release files
│   ├── 2gis/              # 2GIS map tiles and static previews plugin
│   ├── calendar-systems/  # Alternative calendar systems plugin
│   ├── entiny-sdk/        # Marketplace UI and SDK runtime plugin
│   ├── text-animation/    # Message input typing & deletion animation plugin
│   └── yandex/            # Yandex Translate & static maps plugin
├── sdk/
│   ├── entiny/            # @entiny/sdk: settings placement, slots, map utilities
│   ├── cli/               # @inugram/cli tooling
│   ├── types/             # @inugram/plugin-types typings
│   └── docs/              # Guides for engine APIs (grants, UI, JVM, Xposed)
└── scripts/
    ├── build-plugin-index.ts # Compiles plugins and regenerates index.json
    └── generate-slots.ts     # Extracts available settings slots from app strings
```

---

## License & Credits

Licensed under **GPL-2.0-or-later**, matching entinyGram and Inugram (see [LICENSE](LICENSE)).

- **[entinyGram](https://github.com/entaytion/entinyGram)**: The independent power-user Telegram Android fork.
- **[Inugram](https://github.com/teidesu/inugram)** by [@teidesu](https://github.com/teidesu): The plugin engine, QuickJS bindings, and foundation toolchain.
