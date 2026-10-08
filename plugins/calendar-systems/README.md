# Calendar Systems Plugin

Displays dates across alternative calendars (Hijri, Persian, Indian, Hebrew, Buddhist, etc.) throughout entinyGram.

`entinygram.calendar-systems` · version `1.0.0` · requires `entinygram.sdk >=0.1.0-alpha`

---

## Overview

**Calendar Systems** enables international date systems throughout entinyGram without patching the core Telegram client. Anywhere a date contains a month or year (chat list rows, in-chat sticky date separators, message timestamps, profile media headers), the date is formatted using the selected calendar.

Clock times (hours, minutes, seconds) remain standard and untouched.

---

## Supported Calendar Systems

Select any of the following systems from `Settings → Behavior & Tools → Formatting → Calendar`:

| Identifier | Calendar System | Notes |
| :--- | :--- | :--- |
| `gregorian` | Gregorian (default) | Standard Western calendar |
| `islamic` | Hijri Qamari (lunar) | Observational lunar Islamic calendar |
| `islamic-civil` | Hijri civil | Tabular civil Islamic calendar |
| `islamic-umalqura` | Umm al-Qura | Saudi Arabian official astronomical calendar |
| `persian` | Hijri Shamsi (Jalali) | Iranian solar calendar |
| `indian` | Indian national (Saka) | Official civil calendar of India |
| `hebrew` | Hebrew | Traditional Jewish lunisolar calendar |
| `buddhist` | Buddhist | Solar calendar counted from the Parinirvana |
| `japanese` | Japanese | Era-based calendar (Reiwa, Heisei, etc.) |
| `roc` | Minguo (ROC) | Republic of China era calendar |
| `coptic` | Coptic | Ancient Egyptian / Alexandrian calendar |
| `ethiopic` | Ethiopic | Ge'ez calendar used in Ethiopia and Eritrea |

---

## Architecture & How It Works

```text
┌────────────────────────────────────────────────────────┐
│               Native Java Date Pipeline                │
│                                                        │
│  FastDateFormat.format(long timestamp)                 │
│         │                                              │
│         ▼                                              │
│  [Xposed Routine Hook]                                 │
│         │                                              │
│         ▼                                              │
│  android.icu.text.SimpleDateFormat (selected calendar) │
│         │                                              │
│         ▼                                              │
│  Returns formatted date string directly to UI          │
└────────────────────────────────────────────────────────┘
```

1. **Native Performance via Routines**:
   Telegram formats dates on the UI thread for every visible row in the chat list. Calling into JavaScript for each row would cause frame drops.
   The hook is implemented as an **`inu.xposed.routine(...)`**:
   - The routine runs directly in native JVM bytecode on the thread calling `FastDateFormat.format(...)`.
   - The QuickJS engine is never interrupted or blocked.
   - Per-thread `SimpleDateFormat` instances are cached in a `ConcurrentHashMap` for maximum throughput and thread safety.
2. **ICU Localization**:
   Utilizes Android's built-in `android.icu.util.ULocale` with calendar keyword extensions (`@calendar=<id>`), ensuring culturally accurate month and day names matching the user's current app language.
3. **Settings Integration**:
   Uses `@entiny/sdk` to insert the **Calendar** selection picker directly into `behavior.formatting`.

---

## Permissions (Grants)

| Grant | Purpose |
| :--- | :--- |
| `unsafe.jvm` | Access `FastDateFormat`, Android ICU libraries, and Java concurrency primitives. |
| `unsafe.xposed` | Intercept date formatting methods in `FastDateFormat`. |

> [!NOTE]
> Requires a device where the engine's Xposed hook layer is active. If hooks are unavailable on the device, dates remain Gregorian.

---

## Dependency on entinyGram SDK

Requires `entinygram.sdk >=0.1.0-alpha`:
- Required for embedding the calendar picker into the app's formatting settings.
- If `entinygram.sdk` is missing or disabled, the plugin will refuse to install or start.

---

## Development & Building

```sh
# Build bundle
bun inu build

# Deploy to connected device
bun inu push
```
