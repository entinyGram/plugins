# calendar systems

dates in other calendars across entinyGram. clock times stay as they are.

| | |
| :--- | :--- |
| id | `entinygram.calendar-systems` |
| version | `1.2.0` |
| status | active |
| grants | `unsafe.jvm`, `unsafe.xposed` |

## highlights

- [calendars](#calendars): 12 systems
- [settings](#settings): one picker and a live preview
- [how it works](#how-it-works): native routines, no js per row

## calendars

pick one in `Settings → Plugins → Calendar systems`.

| id | calendar |
| :--- | :--- |
| `gregorian` | gregorian, default |
| `islamic` | hijri qamari |
| `islamic-civil` | hijri civil |
| `islamic-umalqura` | umm al-qura |
| `persian` | hijri shamsi (jalali) |
| `indian` | indian national |
| `hebrew` | hebrew |
| `buddhist` | buddhist |
| `japanese` | japanese eras |
| `roc` | minguo |
| `coptic` | coptic |
| `ethiopic` | ethiopic |

## settings

the page shows today's date twice: in long form and with the exact pattern of the profile registration row, so you can check the result before opening a profile.

covered: chat list, date separators, message timestamps, media headers, the date picker, and the profile rows (registration date, created or joined date, birthday).

## how it works

| part | mechanism |
| :--- | :--- |
| hook | `inu.xposed.routine` on the `FastDateFormat` formatters of `LocaleController`, runs in java on the ui thread |
| formatting | `android.icu.text.SimpleDateFormat` with `ULocale` and `@calendar=<id>`, so month names follow the app language |

if hooks are unavailable on the device, dates stay gregorian.

## build

```sh
bun inu build
bun inu push
```
