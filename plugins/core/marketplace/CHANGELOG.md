## 0.3.0

- home opens with a card for the developer's own plugins, "Plugins from the developer", instead of a plain entinyGram header
- the card is a real Android view, so the SDK version sits in a colored pill in front of the title
- tapping the card opens a screen of its own with the official catalog as icon cards, one row per plugin
- rows show the version in the title (`v0.3.0  2GIS`) built by `withVersion`, so the trailing value carries the state (Installed, Updates)
- fix oversized text in the card rows

## 0.2.1

- fix crash when updating catalog from channel (@entinyGramPlugins: no such property 'find' on a TL vector)
- parse any telegram channel by .inu.js files, supporting community channels like inugramplugins
- group older versions under the same plugin in channel catalogs instead of displaying duplicates
- add Persian (fa) localization

## 0.2.0

- telegram channels are plugin sources, plugins install straight from channel posts
- bottom bar with home, plugins and settings
- home shows updates, new and recently updated plugins
- plugins has one installed section and a section for every source
- long sections show five rows, the rest opens on its own screen
- settings opens installed plugins, sources and plugin entries, and links to the plugins channel
- add your own channel as a source, long-press it to remove
- channel plugins show their permissions, unsafe ones are marked
- tab icons are plain svg files in src/icons, swap them for your own
- installing from a channel needs an app build with installfile, older builds say so

## 0.2.0-beta

- Telegram channels are plugin sources: the SDK reads the plugins channel through your own account and installs bundles straight from its posts
- The marketplace has a bottom bar with Home, Plugins and Settings; its icons are plain SVG files in `src/icons`
- Home shows updates, new plugins and recently updated ones
- Plugins has one Installed section and a section for each source with what is not installed yet; a long section shows five rows and opens the rest on its own screen
- Settings opens Installed plugins, Sources (add a channel, long-press an added one to remove it) and Plugin entries, and links to the plugins channel
- A plugin from a channel shows the permissions it asks for, unsafe ones marked, and asks to confirm before installing from a channel entinyGram does not vet
- Installing from a channel needs an app build with `installFile` in the market bridge; older builds say so instead of failing silently

## 0.1.4-beta

- The marketplace shows two sections: the official entinyGram catalog and the separate user repository (`user-plugins/index.json`) with community plugins
- The plugin page is redesigned into icon cards: description, author, source repository, plugin ID (tap to copy), requirements and the latest version, each as its own row with an icon
- User plugins are exported to the plugin release too (`pack-release.ts` now packs them as `<Name>-<version>.inu.js`), so in plain inugram they are offered as release downloads just like the official ones

## 0.1.2-beta

- Installing in inugram downloads the file from the plugin release instead of opening a page

## 0.1.1-beta

- Works in plain inugram: without the entinyGram bridge the SDK runs standalone and no longer crashes
- Marketplace reads the installed plugins from the app directory in standalone mode
- Installing from the marketplace in inugram hands over the download link and checksum

## 0.1.0-alpha

- First release: marketplace and settings embedding
