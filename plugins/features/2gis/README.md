# 2gis

2gis map tiles and location previews in entinyGram.

| | |
| :--- | :--- |
| id | `entinygram.2gis` |
| version | `1.2.0` |
| status | active |
| needs | your own 2gis api key |
| grants | `unsafe.jvm`, `unsafe.xposed` |

## highlights

- [settings](#settings): key, tiles and previews on one page
- [api key](#api-key): where to get it
- [how it works](#how-it-works): tile source and preview hook

## settings

page: `Settings → Plugins → 2GIS`.

| row | effect |
| :--- | :--- |
| 2GIS API key | key for tiles and previews |
| tiles | the in-app map draws 2gis raster tiles, zoom 1 to 18 |
| previews | location bubbles in chats use 2gis static images |

## api key

1. register on the [2gis platform manager](https://platform.2gis.ru/en/)
2. create a key with access to the static api and the raster tiles api
3. paste it into **2GIS API key**

## how it works

| part | mechanism |
| :--- | :--- |
| tiles | the plugin passes a tile url template to the app's `EntinyMapTiles`, the app's osm renderer loads and caches them |
| previews | a native routine hooks `AndroidUtilities.formapMapUrl` and returns a 2gis static url, no js runs per request |

tiles and images are fetched by the app itself, so there is no `fetch` grant.

## build

```sh
bun inu build
bun inu push
```
