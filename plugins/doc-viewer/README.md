# Doc Viewer Plugin

In-app document and file viewer for PDF, office documents, text, code, web markup, e-books, images, and archives throughout entinyGram.

`entinygram.doc-viewer` · version `1.0.0` · requires `entinygram.sdk >=0.1.0-alpha`

---

## Overview

**Doc Viewer** replaces the external Android app intent prompt when opening files in chats with a native, feature-rich in-app reader dialog (`android.app.Dialog`). 

Instead of leaving Telegram or relying on third-party viewer apps, files are opened instantly inside the client with dark/light themes, page navigation, search, pinch-to-zoom, and clipboard copying.

---

## Supported Formats

| Category | Extensions | Viewer Engine | Features |
| :--- | :--- | :--- | :--- |
| **PDF** | `.pdf` | Android `PdfRenderer` | Page caching/prefetching, pinch-to-zoom, 90° rotation, dark mode (color inversion), jump to page, volume-key pagination. |
| **Images** | `.jpg`, `.png`, `.webp`, `.gif`, `.bmp`, `.heic`, `.avif`, `.ico` | Android `BitmapFactory` | EXIF orientation auto-rotation, pinch-to-zoom, pan bounds, double-tap zoom, dark mode inversion. |
| **Web & Markup** | `.html`, `.svg`, `.md`, `.markdown` | Sandboxed Android `WebView` | Offline rendering (JS & network disabled), Markdown-to-HTML parser with dark/light/sepia themes, SVG wrapper, source code toggle. |
| **Text & Code** | `.txt`, `.log`, `.json`, `.csv`, `.tsv`, `.ipynb`, plus 50+ programming languages | Android `ScrollView` + `TextView` | 30k char pagination, fulltext search with `SpannableString` highlights, font picker (sans/serif/monospace), font size +/-. |
| **Structured Data** | `.json`, `.geojson`, `.csv`, `.tsv` | Custom JS Parser | JSON pretty-printing with 2-space indentation; CSV/TSV table formatting with auto-detected delimiters (`,`, `;`, `\t`, `\|`). |
| **Jupyter** | `.ipynb` | Custom JS Parser | Cell formatting with `In [x]:` code inputs and `Out:` outputs without ANSI control escape codes. |
| **Office Documents** | `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.odp`, `.rtf`, `.eml` | `java.util.zip.ZipFile` + XML/RTF Parsers | Paragraphs, headings, bullet lists, sheet tables, slide extraction, email RFC 822 headers and body. |
| **E-Books** | `.epub`, `.fb2` | Zip + XML Parsers | Chapter navigation, author/title metadata extraction, HTML strip to text. |
| **Archives** | `.zip`, `.jar`, `.aar`, `.tar`, `.tgz` | `java.util.zip.ZipFile` | File listing table with sizes, modification dates, and password protection status without extracting to disk. |

---

## Architecture & How It Works

```text
┌────────────────────────────────────────────────────────┐
│             File Open in Chat / Message                │
│                                                        │
│  AndroidUtilities.openForView(File / Message / Doc)    │
│                           │                            │
│                           ▼                            │
│  [Xposed Method Hook on openForView]                   │
│                           │                            │
│           ┌───────────────┴───────────────┐            │
│           │ Resolves file & format match  │            │
│           └───────────────┬───────────────┘            │
│                           │                            │
│         Matches           ▼           No Match         │
│     ┌───────────────────────────┐  ───────────────►    │
│     │ Return true (skip stock)  │    Pass-through      │
│     │ Show DocViewer Dialog     │    to external app   │
│     └─────────────┬─────────────┘                      │
│                   │                                    │
│       ┌───────────┼───────────┬───────────┐            │
│       ▼           ▼           ▼           ▼            │
│  PdfRenderer  BitmapFactory  WebView   TextView        │
│    (PDF)       (Images)       (Web/MD) (Text/Office)   │
└────────────────────────────────────────────────────────┘
```

1. **Method Hooking**:
   Hooks all overloads of `org.telegram.messenger.AndroidUtilities.openForView`. If the tapped file matches any enabled format, the hook cancels the default system intent and launches the in-app viewer.
2. **Quota-Safe File I/O**:
   The Inugram bridge limits single cross-bridge string/byte transfers to 1 MB. To safely handle large documents (up to 12 MB), `DocViewer` reads files in 64 KB buffers using native `FileInputStream` and `ByteArrayOutputStream`.
3. **No Heavy External Dependencies**:
   - PDF pages are rendered into hardware-accelerated bitmaps using Android's native `android.graphics.pdf.PdfRenderer`.
   - Office documents (`.docx`, `.xlsx`, `.pptx`, `.epub`) are parsed directly from their internal XML structures via `java.util.zip.ZipFile`, avoiding heavy NPM dependencies.
4. **Gesture & Touch Controls**:
   Uses `ScaleGestureDetector` and `GestureDetector` mapped to an `android.graphics.Matrix` for smooth zooming and panning with viewport boundary clamping.
5. **Fulltext Search**:
   Performs fast regex searches across paginated text blocks, highlighting hits with `android.text.style.BackgroundColorSpan` and providing next/previous match navigation.

---

## Settings

Configurable via `Settings → Plugins → Doc Viewer`:

- **Language**: Automatic (matches the Telegram client's language: Ukrainian, English, Russian), or manual override (`Українська`, `English`, `Русский`).
- **Formats**: Enable or disable specific format categories (PDF, Office, Books, Text/Code, Web, Images, Archives).
- **Viewing**:
  - Night mode color inversion for PDF and images (`ColorMatrixColorFilter`).
  - Fit page width vs. fit full screen.
  - Remember last viewed page per file (`localStorage`).
  - Turn pages using hardware volume buttons.
  - Keep screen on while reading (`FLAG_KEEP_SCREEN_ON`).
  - Toggle word-wrap, pretty JSON, and CSV table formatting.

---

## Permissions (Grants)

| Grant | Purpose |
| :--- | :--- |
| `unsafe.xposed` | Intercept `AndroidUtilities.openForView` to open files internally. |
| `unsafe.jvm` | Create Android UI (`Dialog`, `PdfRenderer`, `BitmapFactory`, `WebView`, `TextView`, gesture detectors). |
| `clipboard.write` | Copy current page or full document text to system clipboard. |

---

## Dependency on entinyGram SDK

Requires `entinygram.sdk >=0.1.0-alpha`:
- Embeds the plugin settings screen into `category-chats`.
- If `entinygram.sdk` is missing or disabled, the plugin will refuse to install or start.

---

## Credits

- **Original Plugin**: Created by **Daxo-Developer** & **@Daxo_OS** for Materialgram / exteraGram.
- **Inugram / entinyGram Port**: Ported to TypeScript and the Inugram plugin API for entinyGram.

---

## Development & Building

```sh
# Typecheck and validate manifest
bun inu check

# Build bundle
bun inu build

# Deploy to connected device via ADB
bun inu push
```
