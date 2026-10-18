## 1.1.0

- Fix copied JVM byte buffers and bounded chunked reads without reflection.
- Repair XLSX sheet relationships, sparse cells and rich strings; EPUB manifests, chapter paths and XML entities; FB2 encodings and namespaces.
- Browse ZIP/JAR/AAR entries and open supported files in-app with bounded, private temporary extraction and cleanup.
- Fix archive totals and remove incorrect password detection. Unsupported TAR/compressed TAR files now use the stock viewer.
- Remove reflection from viewer controls and fix viewer resource cleanup.
- Repair DOCX namespaces, PPTX slide ordering, bounded ODF repeated cells, RTF escapes/codepages and MIME email decoding.
- Fix CSV quoted/multiline fields, Markdown links and recursion limits, Unicode chunk boundaries and JVM string decoding.
- Handle mirrored EXIF orientations and PDF failure cleanup; add parser and native-resource regression tests.

## 1.0.0

- Initial release of Doc Viewer for Inugram / entinyGram.
- Ported from the Python plugin by Daxo-Developer & @Daxo_OS.
- In-app viewing for PDF, images, text, code, JSON, CSV, Jupyter Notebooks, Markdown, HTML, SVG, office documents (DOCX, XLSX, PPTX, ODF, RTF, EML), books (EPUB, FB2) and archives (ZIP, TAR).

