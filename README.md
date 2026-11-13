# entinyGram plugins

official plugins for [entinyGram](https://github.com/entaytion/entinyGram), built for the [inugram](https://github.com/teidesu/inugram) plugin engine.

- [plugins](#plugins): what is in the repo
- [install](#install): from the app, a file or adb
- [develop](#develop): build and push a plugin
- [publish](#publish): bundles, catalog, release
- [sdk is deprecated](#sdk-is-deprecated): why plugins no longer need it

## plugins

every plugin is a standalone `.inu.js` bundle with its own settings page under `Settings → Plugins`. none of them needs another plugin.

| plugin | id | version | status | what it does |
| :--- | :--- | :---: | :---: | :--- |
| [text animation](plugins/features/text-animation/) | `entinygram.text-animation` | `1.2.0` | deprecated | animated typing and deleting in the message input |
| [2gis](plugins/features/2gis/) | `entinygram.2gis` | `1.2.0` | active | 2gis map tiles and location previews, needs an api key |
| [calendar systems](plugins/features/calendar-systems/) | `entinygram.calendar-systems` | `1.2.0` | active | hijri, persian, indian and other calendars for dates |
| [doc viewer](plugins/features/doc-viewer/) | `entinygram.doc-viewer` | `1.2.0` | active | in-app viewer for pdf, docx, xlsx, text, code, images, archives |
| [call avatar](plugins/features/call-avatar/) | `entinygram.call-avatar` | `1.2.0` | active | full-screen caller photo in voice calls |
| [yandex](plugins/features/yandex/) | `entinygram.yandex` | `1.2.0` | active | yandex cloud translate and static map previews |
| [no vibration](plugins/features/no-vibration/) | `entinygram.no-vibration` | `1.2.0` | deprecated | haptics, vibration and notification vibration, each on its own switch |
| [registration date](plugins/features/reg-date/) | `entinygram.reg-date` | `1.0.0` | deprecated | estimated account registration date in the profile menu |
| [custom marks](plugins/features/custom-marks/) | `entinygram.custom-marks` | `1.0.0` | active | your own text for the edited and deleted marks |
| [voice changer](plugins/features/voice-changer/) | `entinygram.voice-changer` | `1.2.0` | active | changes your voice in voice and video messages and calls |

## install

| way | how |
| :--- | :--- |
| repository | `Settings → Plugins → Repositories`, the built-in `@entinyGramPlugins` channel, tap a plugin |
| file | open an `.inu.js` file in a chat or use `Settings → Plugins → Load from file` |
| adb | developer mode on, then `bun inu push` |

the app shows the requested grants before installing.

## develop

needs [bun](https://bun.sh/) and a device with entinyGram and developer mode on.

```sh
git clone https://github.com/entinyGram/plugins.git
cd plugins
bun install
```

run inside `plugins/features/<name>`:

| command | action |
| :--- | :--- |
| `bun inu dev` | watch, rebuild, push over adb, reload |
| `bun inu push` | one build, push, print logs |
| `bun inu build` | typecheck and build `dist/<name>.inu.js` |
| `bun inu check` | validate manifest, grants and syntax |
| `bun inu eval "<code>"` | run a snippet in the on-device engine |

a plugin needs `inu.config.ts`, `src/index.ts`, `icon.svg` (24×24, one color) and `README.md`. give it a settings page with `inu.registerSettings`. pick 1 to 3 market tags in `extra['entiny-tags']`, ids from [`scripts/tags.ts`](scripts/tags.ts).

## publish

| step | command |
| :--- | :--- |
| build bundles into `release/` | `bun run build` (or `bun run build 2gis`) |
| regenerate the market catalog | `bun run catalog` |
| post the files to the plugins channel | the app picks them up as updates |

the `Build plugins` workflow does the same on demand and can replace files in the single `plugins` github release.

## sdk is deprecated

`entinygram.sdk` and `@entiny/sdk` are deprecated and no plugin uses them. the sdk carried too much responsibility: it injected settings rows into native screens, and plugins broke or got overloaded because of it. plugins now register their own pages, and entinyGram manages them from its settings. the sources stay in the repo for reference.

| path | status |
| :--- | :--- |
| [`plugins/core/sdk`](plugins/core/sdk/) | deprecated, kept in the repo but not built into `release/` or the catalog |
| [`sdk/entiny`](sdk/entiny/) | deprecated, do not depend on it |
| `sdk/cli`, `sdk/types`, `sdk/docs` | inugram tooling, in use |

## structure

```text
plugins/features/   feature plugins
plugins/core/sdk/   deprecated sdk plugin
sdk/                inugram cli, types, docs, deprecated @entiny/sdk
scripts/            build, catalog, tags
release/            bundles and catalog.json
```

## license

gpl-2.0-or-later, see [LICENSE](LICENSE). thanks to [inugram](https://github.com/teidesu/inugram) by [@teidesu](https://github.com/teidesu) for the engine and toolchain.
