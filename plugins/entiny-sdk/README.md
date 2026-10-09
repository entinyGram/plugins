# entinyGram SDK Plugin

The core foundation plugin providing the **in-app Marketplace**, **dynamic Settings Embedding Engine**, and **dependency anchor** for all entinyGram plugins.

`entinygram.sdk` · version `0.1.2-beta` · required by all entinyGram feature plugins

---

## Overview

The **entinyGram SDK plugin** is the central component that connects the entinyGram app with its plugin ecosystem:

1. **In-App Marketplace**: A full-featured plugin store interface inside `Settings → Plugins → Marketplace`. Users can browse, search, install, update, and manage versions directly from GitHub.
2. **Settings Embed Engine**: Dynamically injects plugin controls into Telegram settings screens (inline switches, buttons, and picker radio options) without modifying the Android application binary.
3. **Dependency Anchor**: Serves as the required runtime (`entinygram.sdk`) for all entinyGram feature plugins.

---

## 1. The In-App Marketplace

Accessible from `Settings → Plugins → Marketplace`.

- **GitHub Catalog Integration**: Fetches `index.json` and SVG icons directly from the official repository (`main` branch, falling back to `dev`).
- **Integrity Verification**: Verifies SHA-256 hashes of all downloaded `.inu.js` files against the catalog before initiating installation.
- **Version Management**: Browse all published versions with release dates and changelog notes. Supports clean install, upgrade, downgrade, and reinstallation.
- **Categorization**: Groups plugins into *Updates available*, *Installed*, and *Available*, with live search and filtering.

---

## 2. Dynamic Settings Embedding Engine (`@entiny/sdk/embed`)

Instead of requiring core client modifications to place plugin settings in native Telegram menus, the SDK plugin hooks the root settings fragment (`UniversalFragment`):

```text
┌────────────────────────────────────────────────────────┐
│               Settings Screen (UniversalFragment)      │
│                                                        │
│  [Screen Header]                                       │
│  [Native Section]                                      │
│  [Plugin Inline Control] ◄── Injected by SDK Engine    │
│  [Plugin Radio Option]   ◄── Injected into Dialog      │
│  [Native Items]                                        │
└────────────────────────────────────────────────────────┘
```

- **Screen Placement**: Adds rows to launch a plugin's settings page from native categories (e.g. `category-chats`, `behavior`).
- **Inline Placement**: Injects controls directly into target sections (`slot.start`, `slot.end`, `slot.before`, `slot.after`, `slot.replace`).
- **Choice Placement**: Adds radio/modal picker options (e.g., custom map tile providers, preview providers, calendar systems).
- **Anti-Spoofing Protections**: Enforces strict limits (maximum 4 inline rows per slot, 2 options per picker) and visibly attributes each injected control to its source plugin.

---

## 3. Dependency Enforcement (`@requires entinygram.sdk`)

All entinyGram feature plugins declare:
```js
// @requires entinygram.sdk >=0.1.0-alpha
```

The app's plugin loader (`PluginDependencies.kt` and `PluginManager.kt`) strictly enforces this:
- **Refused Installation**: Installing a plugin without `entinygram.sdk` installed and active triggers an immediate error dialog (`"Needs the plugin entinygram.sdk. Install it first"`).
- **Runtime Guard**: Disabling `entinygram.sdk` in settings immediately halts dependent plugins. Re-enabling the SDK automatically restarts them.

---

## Permissions (Grants)

| Grant | Purpose |
| :--- | :--- |
| `fetch(raw.githubusercontent.com)` | Fetch marketplace catalog (`index.json`), changelogs, and plugin icons. |
| `unsafe.jvm` | Communicate with the app's internal install bridge and inspect installed plugin status. |
| `unsafe.xposed` | Hook `UniversalFragment` and settings adapter routines for dynamic UI embedding. |

---

## For Plugin Developers

When building plugins that use the SDK:

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
        description: 'Example plugin using entinyGram SDK',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      }, {
        screen: ['category-chats'],
        inline: [{ slot: 'category-chats.end', rows: ['my_switch'] }],
      }),
    },
  },
})
```

`withEntiny(...)` automatically attaches `@requires entinygram.sdk >=0.1.0-alpha` and configures the SDK embed directives.
