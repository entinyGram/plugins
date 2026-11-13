# yandex

yandex cloud translate as a translation provider, and yandex static maps for location previews.

| | |
| :--- | :--- |
| id | `entinygram.yandex` |
| version | `1.2.0` |
| status | active |
| needs | a yandex cloud api key for translation, none for maps |
| grants | `fetch(translate.api.cloud.yandex.net)`, `unsafe.jvm`, `unsafe.xposed` |

## highlights

- [settings](#settings)
- [api key](#api-key)
- [how it works](#how-it-works)

## settings

page: `Settings → Plugins → Yandex`.

| row | effect |
| :--- | :--- |
| Yandex API key | key for translation, stored locally, sent only to `https://translate.api.cloud.yandex.net/` |
| maps | location previews use yandex static maps, labels in en, ru or tr by app language |

the translation provider is registered with the app and appears in the translator's provider list next to the built-in ones.

## api key

1. open the [yandex cloud console](https://console.yandex.cloud/)
2. create an api key with the `ai.translate.user` role
3. paste it into **Yandex API key**

## how it works

| part | mechanism |
| :--- | :--- |
| translation | `inu.registerTranslationProvider`, the handler calls yandex cloud translate v2 over https |
| previews | a native routine hooks `AndroidUtilities.formapMapUrl` and returns a `https://static-maps.yandex.ru/1.x/` url |

## build

```sh
bun inu build
bun inu push
```
