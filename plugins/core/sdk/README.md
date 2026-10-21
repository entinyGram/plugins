# entinyGram SDK Plugin

The core foundation plugin providing the **dynamic Settings Embedding Engine** and the **dependency anchor** for all entinyGram plugins. Plugins are installed from the app's own plugin repositories; this plugin does not carry a store.

`entinygram.sdk` · version `0.4.0` · required by all entinyGram feature plugins

---

## 1. Dynamic Settings Embedding Engine (`@entiny/sdk/embed`)

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

## 2. Dependency Enforcement (`@requires entinygram.sdk`)

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
| `unsafe.jvm` | Reach `UniversalFragment`, the settings cells and the radio picker. |
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
