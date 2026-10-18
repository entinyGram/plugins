import { CELL_MAX, Doc, MAX_COLS, MAX_ROWS, MAX_TEXT_BYTES, PAGE_CHARS, type ViewerOptions } from '../types.js'
import { FileInputStream, JFile, JString } from '../jvm.js'
import { t, tf } from '../i18n.js'

let readChunk: DefinedClass | null = null
let decoder: DefinedClass | null = null

function decodeChunk(bytes: Uint8Array, charset: string): string {
  if (!decoder) {
    const StringClass: any = inu.jvm.cls('java.lang.String')
    decoder = inu.jvm.defineClass({ staticMethods: { decode: {
      params: ['byte[]', 'java.lang.String'], returns: 'java.lang.String',
      body: inu.jvm.routine(function (raw: any, encoding: any) {
        return new StringClass(raw, encoding)
      }),
    } } })
  }
  return String(decoder.callStatic('decode', bytes, charset))
}

// Keep the mutable byte[] on the JVM side: the bridge copies typed arrays.
function streamChunk(stream: JavaObject, count: number): Uint8Array {
  if (!readChunk) {
    const buffer = new Uint8Array(65536)
    const Arrays: any = inu.jvm.cls('java.util.Arrays')
    readChunk = inu.jvm.defineClass({ staticMethods: { read: {
      params: ['java.io.InputStream', 'int'], returns: 'byte[]',
      body: inu.jvm.routine(function (input: any, size: any) {
      const n = input.read(buffer, 0, size)
      if (n < 0) return null
      if (n === 0) {
        const value = input.read()
        if (value < 0) return null
        buffer[0] = value
        return Arrays.copyOf(buffer, 1)
      }
      return Arrays.copyOf(buffer, n)
      }),
    } } })
  }
  return readChunk.callStatic('read', stream, count) ?? new Uint8Array(0)
}

function readBytes(stream: JavaObject, limit: number): Uint8Array {
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < limit) {
    const chunk = streamChunk(stream, Math.min(65536, limit - total))
    if (!chunk.length) break
    chunks.push(chunk)
    total += chunk.length
  }
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

export function readStreamBytes(stream: JavaObject, limit = MAX_TEXT_BYTES): Uint8Array {
  try {
    const bytes = readBytes(stream, limit)
    if (bytes.length === limit && Number(stream.call('read()I')) !== -1) {
      throw new Error(String(t('err_unpack_limit')))
    }
    return bytes
  } finally {
    try { stream.call('close') } catch {}
  }
}

export function readFileBytes(path: string, maxBytes = MAX_TEXT_BYTES): { bytes: Uint8Array, cut: boolean } {
  const file = new JFile(path)
  const stream = new FileInputStream(file)
  try {
    const bytes = readBytes(stream, maxBytes)
    return { bytes, cut: Number(file.call('length')) > maxBytes }
  } finally {
    try { stream.call('close') } catch {}
  }
}

export function looksLikeText(path: string): boolean {
  try {
    const file = new JFile(path)
    if (!file.call('exists') || Number(file.call('length')) === 0) return false
    const { bytes: head } = readFileBytes(path, 8192)
    if (!head.length) return false

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

export function decodeBytes(raw: Uint8Array, charset: string): string {
  if (/^utf-?8$/i.test(charset)) return new TextDecoder('utf-8').decode(raw)
  if (/^utf-?16$/i.test(charset)) {
    const little = raw[0] !== 0xFE || raw[1] !== 0xFF
    charset = little ? 'utf-16le' : 'utf-16be'
  }
  const chunks: string[] = []
  for (let offset = 0; offset < raw.length;) {
    let end = Math.min(raw.length, offset + 65536)
    // Do not decode the two halves of a UTF-16 surrogate pair separately.
    if (end < raw.length && /^utf-?16(?:le|be)$/i.test(charset)) {
      const little = /le$/i.test(charset)
      const unit = little ? raw[end - 2] | (raw[end - 1] << 8) : (raw[end - 2] << 8) | raw[end - 1]
      if (unit >= 0xD800 && unit <= 0xDBFF) end -= 2
    }
    chunks.push(decodeChunk(raw.subarray(offset, end), charset))
    offset = end
  }
  return chunks.join('')
}

export function decodeText(raw: Uint8Array, enc?: string | null): [text: string, used: string] {
  let text = ''
  let used = enc ?? 'utf-8'

  if (enc) {
    try {
      text = decodeBytes(raw, enc)
    } catch {
      text = decodeBytes(raw, 'utf-8')
      used = 'utf-8'
    }
  } else {
    // Check BOM
    if (raw.length >= 3 && raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
      text = decodeBytes(raw.subarray(3), 'utf-8')
      used = 'utf-8'
    } else if (raw.length >= 2 && (
      (raw[0] === 0xFF && raw[1] === 0xFE) || (raw[0] === 0xFE && raw[1] === 0xFF)
    )) {
      text = decodeBytes(raw, 'utf-16')
      used = 'utf-16'
    } else {
      // Try UTF-8 first, fallback to windows-1251
      try {
        // The Android JS runtime has no fatal TextDecoder option.
        for (let i = 0; i < raw.length;) {
          const first = raw[i++]
          if (first < 128) continue
          const count = first >= 0xC2 && first <= 0xDF ? 1 : first >= 0xE0 && first <= 0xEF ? 2 : first >= 0xF0 && first <= 0xF4 ? 3 : -1
          if (count < 0 || i + count > raw.length) throw new Error('Invalid UTF-8')
          const next = raw[i]
          if ((first === 0xE0 && next < 0xA0) || (first === 0xED && next >= 0xA0)
              || (first === 0xF0 && next < 0x90) || (first === 0xF4 && next >= 0x90)) throw new Error('Invalid UTF-8')
          for (let n = 0; n < count; n++) if ((raw[i++] & 0xC0) !== 0x80) throw new Error('Invalid UTF-8')
        }
        const decoded = new TextDecoder('utf-8').decode(raw)
        text = decoded
        used = 'utf-8'
      } catch {
        try {
          text = decodeBytes(raw, 'windows-1251')
          used = 'windows-1251'
        } catch {
          text = decodeBytes(raw, 'utf-8')
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
  if (!Number.isFinite(size) || size < 1) throw new RangeError('Invalid page size')
  size = Math.floor(size)
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
    if (j < n && text.charCodeAt(j - 1) >= 0xD800 && text.charCodeAt(j - 1) <= 0xDBFF
        && text.charCodeAt(j) >= 0xDC00 && text.charCodeAt(j) <= 0xDFFF) {
      j += j - i === 1 ? 1 : -1
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

  const capped = clean.map(r => r.map(c => {
    if (c.length <= CELL_MAX) return c
    let end = CELL_MAX - 1
    if (c.charCodeAt(end - 1) >= 0xD800 && c.charCodeAt(end - 1) <= 0xDBFF
        && c.charCodeAt(end) >= 0xDC00 && c.charCodeAt(end) <= 0xDFFF) end--
    return `${c.slice(0, end)}…`
  }))
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
  text = text.replace(/\r\n?/g, '\n')
  const candidates = [',', ';', '\t', '|']
  const counts = [0, 0, 0, 0]
  let quoted = false
  let started = false
  // Inspect the first nonempty logical record, not delimiters inside quotes.
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      started = true
      if (quoted && text[i + 1] === '"') i++
      else quoted = !quoted
    } else if (!quoted) {
      if (ch === '\n') {
        if (started) break
      } else {
        const index = candidates.indexOf(ch)
        if (index >= 0) counts[index]++
        if (ch.trim() || index >= 0) started = true
      }
    }
  }
  let delim = '\t'
  if (!['tsv', 'tab'].includes(ext.toLowerCase())) {
    const best = Math.max(...counts)
    if (best === 0) return null
    delim = candidates[counts.indexOf(best)]
  }

  const rows: string[][] = []
  let cut = false
  let cells: string[] = []
  let current = ''
  let inQuotes = false
  let recordStarted = false
  function cell() {
    if (cells.length < MAX_COLS) cells.push(current.trim())
    current = ''
  }
  function record(): boolean {
    cell()
    if (!recordStarted && cells.length === 1 && !cells[0]) {
      cells = []
      return true
    }
    if (rows.length === MAX_ROWS) { cut = true; return false }
    rows.push(cells)
    cells = []
    recordStarted = false
    return true
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"' && (inQuotes || !current.trim())) {
      recordStarted = true
      if (inQuotes && text[i + 1] === '"') {
        if (cells.length < MAX_COLS) current += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (ch === delim && !inQuotes) {
      recordStarted = true
      cell()
    } else if (ch === '\n' && !inQuotes) {
      if (!record()) break
    } else {
      if (ch.trim()) recordStarted = true
      if (cells.length < MAX_COLS) current += ch
    }
  }
  // Malformed/truncated quoted data is safer as raw text.
  if (inQuotes) return null
  if (!cut && (recordStarted || current || cells.length)) record()

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
