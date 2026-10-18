# Yandex Plugin

Provides **Yandex Cloud Translate** as an in-app translation provider and **Yandex Static Maps** for location previews in entinyGram.

`entinygram.yandex` · version `1.0.0` · requires `entinygram.sdk >=0.1.0-alpha` · requires user API key for translation

---

## Overview

**Yandex** bundles two practical utilities into a single modular plugin:

1. **Yandex Translate**: In-app message translation powered by Yandex Cloud Translate v2.
2. **Yandex Static Maps**: High-contrast location preview images rendered by Yandex Static Maps API.

Both features function independently and can be toggled separately.

---

## Features

### 1. Yandex Translate Provider
- Located in `Settings → Translator → Provider`.
- Appears alongside built-in translation providers (Google, Telegram native).
- Supports translation of incoming messages, chat bubbles, and instant translation sheets.
- Preserves formatting tags and supports all standard language pairs.

### 2. Yandex Map Preview Provider
- Located in `Settings → Behavior & Tools → Maps → Map preview provider`.
- When selected, location preview bubbles in chats render static satellite/vector maps from Yandex with street labels in English, Russian, or Turkish according to the app locale.

---

## Getting a Yandex Cloud API Key

To use Yandex Translate:

1. Create an account in the [Yandex Cloud Console](https://console.yandex.cloud/).
2. Create a service account or generate an API key with the `ai.translate.user` role.
3. Open `Settings → Translator → Provider → Yandex` (or `Settings → Plugins → Yandex`) and enter your API key.
4. The key is stored locally in plugin storage and sent strictly to `https://translate.api.cloud.yandex.net/`.

> [!NOTE]
> Map previews do not require an API key; Yandex Static Maps previews work out of the box.

---

## Architecture & How It Works

```text
┌────────────────────────────────────────────────────────┐
│                   Translation Flow                     │
│  Telegram Message ──► inu.registerTranslationProvider  │
│                       └─► Yandex Cloud Translate API   │
│                                                        │
│                 Location Preview Flow                  │
│  Message Bubble  ──► Xposed Routine Hook               │
│                      └─► AndroidUtilities.formapMapUrl │
│                      └─► Yandex Static Maps URL        │
└────────────────────────────────────────────────────────┘
```

1. **Translation Provider**:
   Registered with `inu.registerTranslationProvider(...)`. When the user taps "Translate" on a message, the engine delegates translation to the plugin's `translate({ texts, to, signal })` handler, calling the Yandex Cloud Translate v2 REST endpoint over HTTPS.
2. **Map Previews**:
   Hooks `AndroidUtilities.formapMapUrl` with a native Java routine (`inu.xposed.routine`). Returns dynamic Yandex Static API URLs (`https://static-maps.yandex.ru/1.x/...`) without blocking the JavaScript thread.
3. **Contextual Settings Display**:
   Uses `@entiny/sdk` to conditionally show the API key input row inside `translate-provider.end` only when Yandex is the active translation provider (`when: 'translation-provider'`).

---

## Permissions (Grants)

| Grant | Purpose |
| :--- | :--- |
| `fetch(translate.api.cloud.yandex.net)` | Make HTTPS requests to the Yandex Cloud Translate API. |
| `unsafe.jvm` | Access AndroidUtilities, LocaleController, and native types. |
| `unsafe.xposed` | Hook `AndroidUtilities.formapMapUrl` for static map previews. |

---

## Dependency on entinyGram SDK

Requires `entinygram.sdk >=0.1.0-alpha`:
- Leverages the SDK embed engine for contextual settings placement and map provider radio options.
- If `entinygram.sdk` is missing or disabled, entinyGram refuses installation and runtime execution.

---

## Development & Building

```sh
# Build bundle
bun inu build

# Deploy to connected device
bun inu push
```
