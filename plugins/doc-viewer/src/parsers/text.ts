import { CELL_MAX, Doc, MAX_COLS, MAX_ROWS, MAX_TEXT_BYTES, PAGE_CHARS, type ViewerOptions } from '../types.js'
import { ByteArrayOutputStream, FileInputStream, JFile, JString } from '../jvm.js'
import { t, tf } from '../i18n.js'

export function readFileBytes(path: string, maxBytes: number = MAX_TEXT_BYTES): { bytes: Uint8Array, cut: boolean } {
  const file = new JFile(path)
  const length = Number(file.call('length'))
  const toRead = Math.min(length, maxBytes)
  const cut = length > maxBytes

  const fis = new FileInputStream(file)
  const baos = new ByteArrayOutputStream()

  const JArray = inu.jvm.cls('java.lang.reflect.Array')
  const ByteType = inu.jvm.cls('java.lang.Byte').getStaticField('TYPE')
  const bufSize = 65536
  const buffer = JArray.callStatic('newInstance', ByteType, bufSize)

  let total = 0
  try {
    while (total < toRead) {
      const want = Math.min(bufSize, toRead - total)
      const read = Number(fis.call('read([BII)I', buffer, 0, want))
      if (read <= 0) break
      baos.call('write([BII)V', buffer, 0, read)
      total += read
    }
  } finally {
    try { fis.call('close') } catch {}
  }

  const bytes: Uint8Array = baos.call('toByteArray')
  return { bytes, cut }
}

export function looksLikeText(path: string): boolean {
  try {
    const file = new JFile(path)
    if (!file.call('exists') || Number(file.call('length')) === 0) return false
    const fis = new FileInputStream(file)
    const JArray = inu.jvm.cls('java.lang.reflect.Array')
    const ByteType = inu.jvm.cls('java.lang.Byte').getStaticField('TYPE')
    const buffer = JArray.callStatic('newInstance', ByteType, 8192)
    const read = Number(fis.call('read([B)I', buffer))
    fis.call('close')
    if (read <= 0) return false

    const baos = new ByteArrayOutputStream()
    baos.call('write([BII)V', buffer, 0, read)
    const head: Uint8Array = baos.call('toByteArray')

    // Check BOMs
    if (head.length >= 3 && head[0] === 0xEF && head[1] === 0xBB && head[2] === 0xBF) return true
    if (head.length >= 2 && head[0] === 0xFF && head[1] === 0xFE) return true
    if (head.length >= 2 && head[0] === 0xFE && head[1] === 0xFF) return true

    // Check null bytes
    for (let i = 0; i < head.length; i++) {
      if (head[i] === 0) return false
    }

    // Control characters check
    let ctrl = 0
    for (let i = 0; i < head.length; i++) {
      const b = head[i]
      if (b < 9 || (b > 13 && b < 32 && b !== 27)) {
        ctrl++
      }
    }
    return ctrl * 50 < head.length
  } catch {
    return false
  }
}

export function decodeText(raw: Uint8Array, enc?: string | null): [text: string, used: string] {
  let text = ''
  let used = enc ?? 'utf-8'

  if (enc) {
    try {
      text = String(new JString(raw, enc))
    } catch {
      text = String(new JString(raw, 'utf-8'))
      used = 'utf-8'
    }
  } else {
    // Check BOM
    if (raw.length >= 3 && raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
      text = String(new JString(raw.subarray(3), 'utf-8'))
      used = 'utf-8'
    } else if (raw.length >= 2 && (
      (raw[0] === 0xFF && raw[1] === 0xFE) || (raw[0] === 0xFE && raw[1] === 0xFF)
    )) {
      text = String(new JString(raw, 'utf-16'))
      used = 'utf-16'
    } else {
      // Try UTF-8 first, fallback to windows-1251
      try {
        const decoded = new TextDecoder('utf-8').decode(raw)
        text = decoded
        used = 'utf-8'
      } catch {
        try {
          text = String(new JString(raw, 'windows-1251'))
          used = 'windows-1251'
        } catch {
          text = String(new JString(raw, 'utf-8'))
          used = 'utf-8'
        }
      }
    }
  }

  if (text.startsWith('\uFEFF')) {
    text = text.slice(1)
  }
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\0/g, '')
  return [text, used]
}

export function paginate(text: string, size = PAGE_CHARS): string[] {
  if (text.length <= size) {
    return [text]
  }
  const pages: string[] = []
  let i = 0
  const n = text.length
  while (i < n) {
    let j = Math.min(n, i + size)
    if (j < n) {
      const k = text.lastIndexOf('\n', j)
      if (k > i + (size / 2)) {
        j = k + 1
      }
    }
    pages.push(text.slice(i, j))
    i = j
  }
  return pages
}

const NUM_RE = /^-?[\d\s.,]+%?$/

export function trimRows(rows: string[][]): string[][] {
  const out: string[][] = []
  for (const r of rows) {
    const row = [...r]
    while (row.length > 0 && !row[row.length - 1]) {
      row.pop()
    }
    out.push(row)
  }
  while (out.length > 0 && out[out.length - 1].length === 0) {
    out.pop()
  }
  return out
}

export function formatRows(rows: string[][], pad: boolean): string {
  const clean = rows.map(r => r.map(c => (c ?? '').replace(/\s+/g, ' ').trim()))
  if (!pad) {
    return clean.map(r => r.join(' │ ')).join('\n')
  }

  const capped = clean.map(r => r.map(c => c.length <= CELL_MAX ? c : `${c.slice(0, CELL_MAX - 1)}…`))
  let cols = 0
  for (const r of capped) {
    cols = Math.max(cols, r.length)
  }
  const widths = new Array(cols).fill(0)
  for (const r of capped) {
    for (let i = 0; i < r.length; i++) {
      widths[i] = Math.max(widths[i], r[i].length)
    }
  }

  const lines: string[] = []
  for (const r of capped) {
    const cells = r.map((c, i) => {
      const w = widths[i]
      if (NUM_RE.test(c)) {
        return c.padStart(w)
      }
      return c.padEnd(w)
    })
    lines.push(cells.join(' │ ').trimEnd())
  }
  return lines.join('\n')
}

export function csvTable(text: string, ext: string): string | null {
  const firstLines = text.split('\n', 20).filter(l => l.trim().length > 0)
  const head = firstLines[0] ?? ''

  let delim = '\t'
  if (ext === 'tsv' || ext === 'tab') {
    delim = '\t'
  } else {
    const candidates = [',', ';', '\t', '|']
    let best = ','
    let bestCount = 0
    for (const c of candidates) {
      const count = (head.match(new RegExp(`\\${c}`, 'g')) || []).length
      if (count > bestCount) {
        bestCount = count
        best = c
      }
    }
    if (bestCount === 0) return null
    delim = best
  }

  // Parse CSV lines
  const rows: string[][] = []
  let cut = false
  const lines = text.split('\n')
  for (const line of lines) {
    if (!line.trim() && rows.length === 0) continue
    // Simple split respecting basic quotes
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === delim && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current.trim())
    rows.push(cells.slice(0, MAX_COLS))
    if (rows.length >= MAX_ROWS) {
      cut = true
      break
    }
  }

  let body = formatRows(rows, true)
  if (cut) {
    body += `\n\n${tf('csv_cut', MAX_ROWS)}`
  }
  return body
}

const ANSI_RE = /\x1B\[[0-9;]*[A-Za-z]/g

export function ipynbText(text: string): string {
  try {
    const nb = JSON.parse(text)
    let cells = nb.cells
    if (!cells && nb.worksheets) {
      cells = nb.worksheets.flatMap((ws: any) => ws.cells ?? [])
    }
    if (!Array.isArray(cells)) return text

    const parts: string[] = []
    for (const c of cells) {
      let src = c.source ?? c.input ?? ''
      src = Array.isArray(src) ? src.join('') : String(src)
      if (c.cell_type !== 'code') {
        parts.push(src)
        continue
      }
      const execCount = c.execution_count ?? ' '
      const block = [`In [${execCount}]:\n${src}`]
      for (const o of (c.outputs ?? [])) {
        let chunk = ''
        if (o.output_type === 'stream') {
          chunk = Array.isArray(o.text) ? o.text.join('') : String(o.text ?? '')
        } else if (o.output_type === 'error') {
          chunk = Array.isArray(o.traceback) ? o.traceback.join('\n') : String(o.traceback ?? '')
        } else if (o.data) {
          chunk = o.data['text/plain'] ?? ''
          if (!chunk && Object.keys(o.data).some(k => k.startsWith('image/'))) {
            chunk = `[${t('ipynb_image')}]`
          }
        }
        chunk = (Array.isArray(chunk) ? chunk.join('') : String(chunk)).replace(ANSI_RE, '').trimEnd()
        if (chunk.trim()) {
          block.push(`Out:\n${chunk}`)
        }
      }
      parts.push(block.join('\n\n'))
    }
    return parts.join('\n\n────────────────────────\n\n')
  } catch {
    return text
  }
}

export function buildTextDoc(
  path: string,
  fmt: string,
  ext: string,
  opts: ViewerOptions,
  enc?: string | null,
): Doc {
  const { bytes, cut } = readFileBytes(path, MAX_TEXT_BYTES)
  let [text, used] = decodeText(bytes, enc)
  let font = 2 // monospace
  let wrap = opts.wrap

  if (fmt === 'json' && opts.prettyjson && text.length <= 3 * 1024 * 1024) {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2)
    } catch {}
  } else if (fmt === 'csv' && opts.csvTable) {
    const table = csvTable(text, ext)
    if (table !== null) {
      text = table
      wrap = false
    }
  } else if (fmt === 'ipynb') {
    text = ipynbText(text)
  } else if (fmt === 'text' && ['txt', 'text', 'nfo', 'srt', 'vtt', 'lrc', 'rst', 'adoc', 'org'].includes(ext)) {
    font = 0 // default
  }

  if (cut) {
    const mb = String(Math.floor(MAX_TEXT_BYTES / (1024 * 1024)))
    text += `\n\n${String(t('cut_text')).replace('{0}', mb)}`
  }

  return new Doc(paginate(text), font, wrap, '', true, used)
}
