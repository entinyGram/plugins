# 2GIS Plugin

Integrates 2GIS map tiles and location preview images directly into entinyGram.

`entinygram.2gis` · version `1.0.0` · requires `entinygram.sdk >=0.1.0-alpha` · requires user API key

---

## Overview

**2GIS** provides detailed maps, buildings, and navigation data across supported regions. This plugin seamlessly substitutes stock map providers with 2GIS services inside entinyGram:

- **Interactive Map Tiles**: Replaces the in-app map view in location pickers and venue previews with high-resolution 2GIS raster tiles via the **2GIS Raster Tiles API**.
- **Static Map Previews**: Replaces preview thumbnails for shared location messages with 2GIS Static API renders.
- **Privacy & Independence**: Uses the app's built-in `osmdroid` renderer; Google Maps and Google Play Services are completely bypassed.

---

## Features

### 1. Map Tiles (`Map view provider`)
- Located in `Settings → Behavior & Tools → Maps → Map view provider`.
- When selected, full interactive maps use 2GIS online HD raster tiles with official attribution.
- Supports zoom levels from 1 to 18 with high-density display support (`@2x`).

### 2. Static Map Previews (`Map preview provider`)
- Located in `Settings → Behavior & Tools → Maps → Map preview provider`.
- Location bubbles in chats render 2GIS static snapshots with pins centered on coordinates.

---

## Getting a 2GIS API Key

A 2GIS API key is required for map tiles and preview requests:

1. Register on the [2GIS Platform Manager](https://platform.2gis.ru/en/).
2. Create an API key with access to **Static API** and **Raster Tiles API** (free demo tier available).
3. Open `Settings → Plugins → 2GIS` (or the 2GIS entry in settings) and paste your key into **2GIS API key**.
4. The plugin automatically validates and activates tile streaming and preview hooks.

---

## How It Works

```text
┌────────────────────────────────────────────────────────┐
│               entinyGram Map Layer                     │
│                                                        │
│  Interactive Map ──► @entiny/sdk/maps (setTileSource)  │
│                      └─► 2GIS Raster Tiles API         │
│                                                        │
│  Location Previews ─► Xposed Routine Hook              │
│                       └─► AndroidUtilities.formapMapUrl│
│                       └─► 2GIS Static API URL          │
└────────────────────────────────────────────────────────┘
```

1. **Tile Source Injection**:
   The plugin calls `@entiny/sdk/maps.setTileSource(...)` to register the 2GIS tile server template (`https://tile{n}.maps.2gis.com/v2/tiles/online_hd/{z}/{x}/{y}.png?key=...`). The app's OSM engine loads and caches tiles natively.
2. **Preview Hook via Java Routine**:
   The plugin hooks `AndroidUtilities.formapMapUrl` using `inu.xposed.routine(...)`. Routines execute directly in native Java on the caller thread without waking the QuickJS engine, ensuring immediate URL resolution with zero thread contention.
3. **Settings Embedding**:
   Uses `@entiny/sdk/embed` to insert radio choices into `behavior.map-provider` and `behavior.map-preview-provider`.

---

## Permissions (Grants)

| Grant | Purpose |
| :--- | :--- |
| `unsafe.jvm` | Pass tile provider configurations to the app runtime and access Android utilities. |
| `unsafe.xposed` | Hook `AndroidUtilities.formapMapUrl` for static map previews. |

> [!NOTE]
> Network requests for tiles and preview images are performed by the app's native image loaders (`ImageLoader` and `osmdroid`), so no `fetch` grant is needed for this plugin.

---

## Dependency on entinyGram SDK

Requires `entinygram.sdk >=0.1.0-alpha`:
- Settings options and map provider pickers are managed via the SDK embed engine.
- If `entinygram.sdk` is missing or disabled, the plugin will not install or run.

---

## Development & Building

```sh
# Build bundle
bun inu build

# Deploy to connected device
bun inu push
```
