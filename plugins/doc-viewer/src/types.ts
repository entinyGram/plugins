export function argb(a: number, r: number, g: number, b: number): number {
  const v = ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)
  return v | 0
}

export const C_BG = argb(255, 9, 9, 13)
export const C_BAR = argb(215, 22, 22, 30)
export const C_PILL = argb(225, 30, 30, 42)
export const C_BTN = argb(255, 44, 44, 60)
export const C_TEXT = argb(255, 241, 241, 246)
export const C_SUB = argb(255, 150, 152, 170)
export const C_ERR = argb(255, 255, 140, 140)

export interface Theme {
  name: string
  bg: number
  fg: number
  hit: number
  cur: number
  cssBg: string
  cssFg: string
  cssAlt: string
}

export const THEMES: Theme[] = [
  {
    name: 'dark',
    bg: argb(255, 9, 9, 13),
    fg: argb(255, 232, 232, 238),
    hit: argb(255, 120, 98, 10),
    cur: argb(255, 214, 120, 0),
    cssBg: '#09090d',
    cssFg: '#e8e8ee',
    cssAlt: '#1c1c26',
  },
  {
    name: 'light',
    bg: argb(255, 250, 250, 247),
    fg: argb(255, 28, 28, 32),
    hit: argb(255, 255, 230, 120),
    cur: argb(255, 255, 170, 60),
    cssBg: '#fafaf7',
    cssFg: '#1c1c20',
    cssAlt: '#ecece6',
  },
  {
    name: 'sepia',
    bg: argb(255, 244, 236, 216),
    fg: argb(255, 67, 52, 34),
    hit: argb(255, 255, 222, 110),
    cur: argb(255, 255, 165, 55),
    cssBg: '#f4ecd8',
    cssFg: '#433422',
    cssAlt: '#e8dcc0',
  },
]

export const FONT_NAMES = ['default', 'serif', 'monospace']

export const ENCODINGS: Array<[name: string, charset: string | null]> = [
  ['Auto', null],
  ['UTF-8', 'utf-8'],
  ['Windows-1251', 'windows-1251'],
  ['KOI8-R', 'koi8-r'],
  ['CP866', 'cp866'],
  ['UTF-16', 'utf-16'],
  ['Windows-1252', 'windows-1252'],
]

export const MAX_TEXT_BYTES = 12 * 1024 * 1024
export const MAX_WEB_BYTES = 4 * 1024 * 1024
export const MAX_UNPACKED = 64 * 1024 * 1024
export const MAX_ROWS = 3000
export const MAX_COLS = 60
export const MAX_ENTRIES = 20000
export const MAX_HITS = 5000
export const MAX_SPANS = 1500
export const PAGE_CHARS = 30000
export const CELL_MAX = 40

export const EXT_FORMAT: Record<string, string> = {}

function registerExts(fmt: string, exts: string) {
  for (const e of exts.split(/\s+/)) {
    if (e) EXT_FORMAT[e.toLowerCase()] = fmt
  }
}

registerExts('pdf', 'pdf')
registerExts('image', 'jpg jpeg jpe png webp bmp gif heic heif avif ico dib')
registerExts('web', 'html htm xhtml svg md markdown mdown')
registerExts('csv', 'csv tsv tab')
registerExts('json', 'json geojson')
registerExts('ipynb', 'ipynb')
registerExts('docx', 'docx docm dotx dotm')
registerExts('xlsx', 'xlsx xlsm xltx xltm')
registerExts('pptx', 'pptx pptm ppsx potx')
registerExts('odf', 'odt ott ods ots odp otp')
registerExts('rtf', 'rtf')
registerExts('eml', 'eml')
registerExts('epub', 'epub')
registerExts('fb2', 'fb2')
registerExts('archive', 'zip jar aar tar tgz tbz2 txz')
registerExts('text', [
  'txt text log jsonl ndjson xml plist yaml yml toml ini cfg conf env properties gradle cmake',
  'srt vtt ass ssa lrc tex bib rst adoc org nfo diff patch vcf ics gpx kml tcx opml rss atom',
  'xsd xsl xslt wsdl plugin py pyw pyi js mjs cjs jsx ts tsx java kt kts scala groovy c h cpp',
  'cc cxx hpp hh cs go rs swift m mm php rb pl lua r dart sh bash zsh fish bat cmd ps1 psm1',
  'vbs sql css scss sass less vue svelte gql graphql proto tf hcl asm s v sv vhd vhdl hs ml',
  'clj ex exs erl jl nim zig dockerfile makefile mk ninja gitignore gitattributes editorconfig',
  'lock sum mod pro pri qml smali csproj sln vcxproj xaml aidl pem crt csr pub asc reg inf',
  'desktop service ahk au3',
].join(' '))

export const TEXT_NAMES = new Set([
  'readme', 'license', 'licence', 'changelog', 'makefile', 'dockerfile', 'gemfile', 'procfile',
  'authors', 'contributors', 'todo', 'notice', 'copying', 'vagrantfile', 'jenkinsfile',
  'cmakelists', 'requirements',
])

export const MIME_FORMAT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/svg+xml': 'web',
  'text/html': 'web',
  'text/markdown': 'web',
  'text/csv': 'csv',
  'text/tab-separated-values': 'csv',
  'application/json': 'json',
  'application/rtf': 'rtf',
  'text/rtf': 'rtf',
  'application/epub+zip': 'epub',
  'application/x-fictionbook+xml': 'fb2',
  'message/rfc822': 'eml',
  'application/zip': 'archive',
  'application/x-tar': 'archive',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.oasis.opendocument.text': 'odf',
  'application/vnd.oasis.opendocument.spreadsheet': 'odf',
  'application/vnd.oasis.opendocument.presentation': 'odf',
}

export const TEXTUAL = new Set(['text', 'csv', 'json', 'ipynb'])

export const KIND: Record<string, string> = {
  pdf: 'pdf',
  image: 'image',
  web: 'web',
}

export const SETTING_OF: Record<string, string> = {
  pdf: 'pdf',
  image: 'image',
  web: 'web',
  archive: 'archive',
  text: 'text',
  csv: 'text',
  json: 'text',
  ipynb: 'text',
  docx: 'docs',
  xlsx: 'docs',
  pptx: 'docs',
  odf: 'docs',
  rtf: 'docs',
  eml: 'docs',
  epub: 'books',
  fb2: 'books',
}

export const LABELS: Record<string, string> = {
  pdf: 'PDF',
  image: 'Image',
  text: 'Text',
  csv: 'CSV',
  json: 'JSON',
  ipynb: 'Jupyter',
  docx: 'DOCX',
  xlsx: 'Excel',
  pptx: 'PowerPoint',
  odf: 'OpenDocument',
  rtf: 'RTF',
  eml: 'Email',
  epub: 'EPUB',
  fb2: 'FB2',
  archive: 'Archive',
}

export const WEB_LABELS: Record<string, string> = {
  md: 'Markdown',
  markdown: 'Markdown',
  mdown: 'Markdown',
  svg: 'SVG',
}

export const MD_EXT = new Set(['md', 'markdown', 'mdown'])

export function fileExt(name: string): string {
  const low = name.toLowerCase()
  const idx = low.lastIndexOf('.')
  return idx < 0 ? '' : low.slice(idx + 1)
}

export function detectFormat(name: string, mime?: string | null): string | null {
  const low = name.toLowerCase()
  const ml = (mime ?? '').toLowerCase()
  if (low.endsWith('.tar.gz') || low.endsWith('.tar.bz2') || low.endsWith('.tar.xz')) {
    return 'archive'
  }
  const ext = fileExt(low)
  if (EXT_FORMAT[ext]) {
    return EXT_FORMAT[ext]
  }
  if (MIME_FORMAT[ml]) {
    return MIME_FORMAT[ml]
  }
  if (ml.includes('pdf')) {
    return 'pdf'
  }
  if (ml.startsWith('image/')) {
    const sub = ml.split('/')[1]?.split('+')[0]
    if (['jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'avif', 'x-icon', 'vnd.microsoft.icon', 'x-ms-bmp'].includes(sub)) {
      return 'image'
    }
  }
  const base = low.replace(/^\./, '').split('.')[0]
  if ((low.startsWith('.') && !low.slice(1).includes('.')) || (TEXT_NAMES.has(base) && !low.slice(1).includes('.'))) {
    return 'text'
  }
  if (!ext || ml === '' || ml === 'application/octet-stream' || ml.startsWith('text/')
      || ml.endsWith('json') || ml.endsWith('xml') || ml.endsWith('javascript') || ml.endsWith('yaml')
      || ml.endsWith('x-sh') || ml.endsWith('x-sql') || ml.endsWith('toml') || ml.endsWith('x-httpd-php')) {
    return 'sniff'
  }
  return null
}

export class Doc {
  pages: string[]
  font: number
  wrap: boolean
  sep: string
  raw: boolean
  enc: string | null
  note?: string | null

  constructor(
    pages: string[],
    font = 0,
    wrap = true,
    sep = '\n\n',
    raw = false,
    enc: string | null = null,
    note?: string | null,
  ) {
    this.pages = pages.length > 0 ? pages : ['']
    this.font = font
    this.wrap = wrap
    this.sep = sep
    this.raw = raw
    this.enc = enc
    this.note = note
  }
}

export interface ViewerOptions {
  wrap: boolean
  prettyjson: boolean
  csvTable: boolean
}

