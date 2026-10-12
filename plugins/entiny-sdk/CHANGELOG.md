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
