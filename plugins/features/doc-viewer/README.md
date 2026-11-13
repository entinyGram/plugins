# doc viewer

opens files from chats in an in-app reader instead of an external app.

| | |
| :--- | :--- |
| id | `entinygram.doc-viewer` |
| version | `1.2.0` |
| status | active |
| grants | `unsafe.xposed`, `unsafe.jvm`, `clipboard.write` |

## highlights

- [formats](#formats): pdf, images, web, text, office, e-books, archives
- [settings](#settings)
- [limits](#limits)
- [how it works](#how-it-works)

## formats

| category | extensions | engine |
| :--- | :--- | :--- |
| pdf | `.pdf` | `PdfRenderer`: zoom, rotation, dark mode, jump to page, volume-key paging |
| images | `.jpg`, `.png`, `.webp`, `.gif`, `.bmp`, `.heic`, `.avif`, `.ico` | `BitmapFactory`: exif rotation, zoom, dark mode |
| web and markup | `.html`, `.svg`, `.md`, `.markdown` | sandboxed `WebView`, js and network off |
| text and code | `.txt`, `.log`, `.json`, `.csv`, `.tsv`, `.ipynb`, 50+ languages | `TextView`: search, fonts, size |
| office | `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.odp`, `.rtf`, `.eml` | zip and xml parsers, text extraction |
| e-books | `.epub`, `.fb2` | zip and xml parsers |
| archives | `.zip`, `.jar`, `.aar` | `ZipFile`: listing, open entries from private temp files |

## settings

page: `Settings → Plugins → Doc Viewer`.

| group | options |
| :--- | :--- |
| language | auto (uk, en, ru) or manual |
| formats | each category on or off |
| viewing | night inversion for pdf and images, fit width or screen, remember page, volume-key paging, keep screen on, word wrap, pretty json, csv tables |

## limits

- office and e-books are text extraction, macros, formulas, embedded objects and drm are not handled
- heic and avif depend on the device, gif shows a still frame, password-protected pdf is not supported
- markdown is simplified, web previews are capped at 4 mb
- csv: 3,000 rows and 60 columns, archive entries: 64 mb, encrypted zip is not supported, tar is left to the stock viewer

## how it works

| part | mechanism |
| :--- | :--- |
| open | hooks all overloads of `AndroidUtilities.openForView`, a matching file opens in the viewer, others pass through |
| io | buffers stay on the jvm side, only 64 kb chunks cross the bridge, text and xml reads are capped at 12 mb |
| dependencies | none: platform renderers and `ZipFile` parsers only |

## credits

original plugin by **Daxo-Developer** and **@Daxo_OS** for Materialgram and exteraGram, ported to the inugram plugin api for entinyGram.

## build

```sh
bun inu build
bun inu push
```
