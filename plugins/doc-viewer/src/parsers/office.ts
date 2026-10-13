import { Doc, MAX_COLS, MAX_ROWS, MAX_TEXT_BYTES } from '../types.js'
import { JFile, JString, ZipFile } from '../jvm.js'
import { decodeBytes, formatRows, paginate, readFileBytes, readStreamBytes, trimRows } from './text.js'
import { t, tf } from '../i18n.js'

export function zreadBytes(zip: JavaObject, name: string): Uint8Array {
  const entry = zip.call('getEntry', name)
  if (!entry) throw new Error(tf('err_zip_entry', name))
  const is = zip.call('getInputStream', entry)
  try {
    return readStreamBytes(is, MAX_TEXT_BYTES)
  } finally {
    try { is.call('close') } catch {}
  }
}

export function zreadString(zip: JavaObject, name: string, charset?: string): string {
  const bytes = zreadBytes(zip, name)
  return charset ? decodeBytes(bytes, charset) : decodeXml(bytes)
}

// XML is parsed locally: no DOM dependency, DTD expansion or JVM reflection.
function entities(value: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' }
  return value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (all, code: string) => {
    if (code[0] !== '#') return named[code] ?? all
    const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : '\ufffd'
  })
}

function decodeXml(bytes: Uint8Array): string {
  let charset = 'utf-8'
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) charset = 'utf-8'
  else if (bytes[0] === 0xff && bytes[1] === 0xfe) charset = 'utf-16le'
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) charset = 'utf-16be'
  else if (bytes[0] === 0 && bytes[1] === 0x3c) charset = 'utf-16be'
  else if (bytes[0] === 0x3c && bytes[1] === 0) charset = 'utf-16le'
  else {
    const head = decodeBytes(bytes.subarray(0, 512), 'latin1').replace(/^\u00ef\u00bb\u00bf/, '')
    const declaration = /^\s*<\?xml\b[^?]*\bencoding\s*=\s*(['"])([^'"]+)\1/i.exec(head)
    if (declaration) charset = declaration[2]
  }
  return decodeBytes(bytes, charset).replace(/^\ufeff/, '')
}

interface XmlNode { name: string, attrs: Record<string, string>, children: Array<XmlNode | string> }
const localName = (name: string) => name.slice(name.lastIndexOf(':') + 1)
function parseXml(xml: string): XmlNode {
  const root: XmlNode = { name: '', attrs: {}, children: [] }
  const stack = [root]
  const tokens = /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE\b(?:[^>\[]|\[[\s\S]*?\])*?>|<\/?[A-Za-z_][\w.:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>|[^<]+/g
  let match: RegExpExecArray | null
  let count = 0
  while ((match = tokens.exec(xml))) {
    const token = match[0]
    const parent = stack[stack.length - 1]
    if (token.startsWith('<![CDATA[')) parent.children.push(token.slice(9, -3))
    else if (token.startsWith('<!') || token.startsWith('<?')) continue
    else if (token.startsWith('</')) {
      const name = localName(token.slice(2, -1).trim())
      if (stack.length > 1 && parent.name === name) stack.pop()
    } else if (token[0] === '<') {
      const tag = /^<([^\s/>]+)/.exec(token)!
      const node: XmlNode = { name: localName(tag[1]), attrs: Object.create(null), children: [] }
      const attrs = /([^\s=<>/]+)\s*=\s*(['"])([\s\S]*?)\2/g
      let attr: RegExpExecArray | null
      while ((attr = attrs.exec(token.slice(tag[0].length)))) node.attrs[attr[1]] = entities(attr[3])
      parent.children.push(node)
      if (++count > 250000 || stack.length > 256) throw new Error('XML complexity limit exceeded')
      if (!/\/\s*>$/.test(token)) stack.push(node)
    } else parent.children.push(entities(token))
  }
  return root
}
function attr(node: XmlNode, name: string): string {
  return node.attrs[name] ?? Object.entries(node.attrs).find(([key]) => localName(key) === name)?.[1] ?? ''
}
function nodes(node: XmlNode, name: string): XmlNode[] {
  const result: XmlNode[] = []
  for (const child of node.children) if (typeof child !== 'string') {
    if (child.name === name) result.push(child)
    else for (const descendant of nodes(child, name)) result.push(descendant)
  }
  return result
}
function nodeText(node: XmlNode): string {
  return node.children.map(child => typeof child === 'string' ? child : nodeText(child)).join('')
}
function richText(node: XmlNode): string {
  return node.children.map(child => typeof child === 'string' ? '' : child.name === 'rPh' ? '' : child.name === 't' ? nodeText(child) : richText(child)).join('')
}
function bookText(node: XmlNode): string {
  const hidden = new Set(['head', 'script', 'style', 'binary', 'description'])
  const blocks = new Set(['p', 'v', 'subtitle', 'title', 'section', 'div', 'h1', 'h2', 'h3', 'h4', 'li', 'tr', 'blockquote', 'empty-line'])
  function render(current: XmlNode): string {
    if (hidden.has(current.name.toLowerCase())) return ''
    if (current.name === 'br') return '\n'
    const text = current.children.map(child => typeof child === 'string' ? child.replace(/\s+/g, ' ') : render(child)).join('')
    return blocks.has(current.name.toLowerCase()) ? `\n${text}\n` : text
  }
  return render(node).replace(/[^\S\n]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}
function zipPath(base: string, href: string): string {
  let path = href.split(/[?#]/, 1)[0].replace(/\\/g, '/')
  try { path = decodeURIComponent(path).replace(/\\/g, '/') } catch { throw new Error('Invalid ZIP URI') }
  if (/^[a-z][\w+.-]*:/i.test(path) || path.startsWith('//') || path.includes('\0')) throw new Error('External ZIP URI')
  const parts: string[] = []
  for (const part of (path.startsWith('/') ? path : base + path).split('/')) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (!parts.length) throw new Error('ZIP path escapes archive')
      parts.pop()
    } else parts.push(part)
  }
  return parts.join('/')
}

// ------------------------------------------------------------- DOCX
export function docxDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  let xml = ''
  try {
    xml = zreadString(zip, 'word/document.xml')
  } finally {
    try { zip.call('close') } catch {}
  }

  const blocks: string[] = []
  const tree = parseXml(xml)
  function inline(node: XmlNode): string {
    if (['del', 'instrText', 'delText'].includes(node.name)) return ''
    if (node.name === 't') return nodeText(node)
    if (node.name === 'tab') return '\t'
    if (node.name === 'br' || node.name === 'cr') return '\n'
    if (node.name === 'noBreakHyphen') return '\u2011'
    return node.children.map(c => typeof c === 'string' ? '' : inline(c)).join('')
  }
  function walk(node: XmlNode): void {
    if (node.name === 'del') return
    if (node.name === 'p') {
      const text = inline(node).trim()
      const style = nodes(node, 'pStyle')[0]
      const heading = style && /^Heading(\d+)$/i.exec(attr(style, 'val'))
      if (text) blocks.push(heading ? `${'#'.repeat(Math.min(4, Number(heading[1])))} ${text}`
        : nodes(node, 'numPr').length ? `• ${text}` : text)
    } else if (node.name === 'tbl') {
      const rows = nodes(node, 'tr').slice(0, MAX_ROWS).map(row =>
        nodes(row, 'tc').slice(0, MAX_COLS).map(cell => nodes(cell, 'p').map(inline).join('\n').trim()))
      const table = formatRows(trimRows(rows), false)
      if (table.trim()) blocks.push(table)
    } else for (const child of node.children) if (typeof child !== 'string') walk(child)
  }
  walk(nodes(tree, 'body')[0] ?? tree)

  const full = blocks.join('\n\n') || String(t('empty_doc'))
  return new Doc(paginate(full), 0, true, '')
}

// ------------------------------------------------------------- XLSX
export function xlsxDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  const pages: string[] = []

  try {
    const rels = new Map<string, string>()
    let sharedPath = 'xl/sharedStrings.xml'
    if (zip.call('getEntry', 'xl/_rels/workbook.xml.rels')) {
      const relXml = parseXml(zreadString(zip, 'xl/_rels/workbook.xml.rels'))
      for (const rel of nodes(relXml, 'Relationship')) {
        if (attr(rel, 'TargetMode').toLowerCase() === 'external') continue
        const target = attr(rel, 'Target')
        if (!target) continue
        let resolved: string
        try { resolved = zipPath('xl/', target) } catch { continue }
        rels.set(attr(rel, 'Id'), resolved)
        if (attr(rel, 'Type').endsWith('/sharedStrings')) sharedPath = resolved
      }
    }
    const shared = zip.call('getEntry', sharedPath)
      ? nodes(parseXml(zreadString(zip, sharedPath)), 'si').map(richText) : []
    const sheetEntries: Array<{ name: string, path: string }> = []
    if (zip.call('getEntry', 'xl/workbook.xml')) {
      for (const sheet of nodes(parseXml(zreadString(zip, 'xl/workbook.xml')), 'sheet')) {
        const target = rels.get(attr(sheet, 'id'))
        if (target) sheetEntries.push({ name: attr(sheet, 'name'), path: target })
      }
    }
    if (!sheetEntries.length) sheetEntries.push({ name: String(t('sheet_default')), path: 'xl/worksheets/sheet1.xml' })
    for (const sheet of sheetEntries) {
      if (!zip.call('getEntry', sheet.path)) continue
      const sheetXml = parseXml(zreadString(zip, sheet.path))
      const rows: string[][] = []
      for (const row of nodes(sheetXml, 'row')) {
        const rowRef = attr(row, 'r')
        const rowIndex = /^\d+$/.test(rowRef) ? Number(rowRef) - 1 : rows.length
        if (rowIndex < 0) continue
        if (rowIndex >= MAX_ROWS) break
        while (rows.length <= rowIndex) rows.push([])
        const cells = rows[rowIndex]
        let nextColumn = 0
        for (const cell of nodes(row, 'c')) {
          const ref = /^([a-z]+)\d+$/i.exec(attr(cell, 'r'))
          let column = nextColumn
          if (ref) {
            column = 0
            for (const letter of ref[1].toUpperCase()) column = column * 26 + letter.charCodeAt(0) - 64
            column--
          }
          nextColumn = column + 1
          if (column < 0 || column >= MAX_COLS) continue
          while (cells.length <= column) cells.push('')
          const valueNode = nodes(cell, 'v')[0]
          const value = valueNode ? nodeText(valueNode) : ''
          const kind = attr(cell, 't')
          cells[column] = kind === 's' ? (/^\d+$/.test(value.trim()) ? shared[Number(value)] ?? '' : '')
            : kind === 'inlineStr' ? richText(cell) : value
        }
      }

      const tableBody = formatRows(trimRows(rows), true) || String(t('sheet_empty'))
      pages.push(...paginate(`── ${sheet.name} ──\n\n${tableBody}`))
    }
  } finally {
    try { zip.call('close') } catch {}
  }

  return new Doc(pages.length > 0 ? pages : [String(t('empty_doc'))], 2, false)
}

// ------------------------------------------------------------- PPTX
export function pptxDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  const pages: string[] = []

  try {
    const paths: string[] = []
    if (zip.call('getEntry', 'ppt/presentation.xml')) {
      const rels = new Map<string, string>()
      const relXml = parseXml(zreadString(zip, 'ppt/_rels/presentation.xml.rels'))
      for (const rel of nodes(relXml, 'Relationship')) {
        if (attr(rel, 'TargetMode').toLowerCase() === 'external') continue
        if (attr(rel, 'Type') && !attr(rel, 'Type').endsWith('/slide')) continue
        try { rels.set(attr(rel, 'Id'), zipPath('ppt/', attr(rel, 'Target'))) } catch { continue }
      }
      for (const slide of nodes(parseXml(zreadString(zip, 'ppt/presentation.xml')), 'sldId').slice(0, 200)) {
        // The numeric unqualified id is NOT the relationship id.
        const id = Object.entries(slide.attrs).find(([key]) => key.includes(':') && localName(key) === 'id')?.[1]
        const target = id && rels.get(id)
        if (target) paths.push(target)
      }
    } else {
      for (let i = 1; i <= 200; i++) if (zip.call('getEntry', `ppt/slides/slide${i}.xml`)) paths.push(`ppt/slides/slide${i}.xml`)
    }
    function inline(node: XmlNode): string {
      if (node.name === 't') return nodeText(node)
      if (node.name === 'br') return '\n'
      return node.children.map(c => typeof c === 'string' ? '' : inline(c)).join('')
    }
    let total = 0
    for (let i = 0; i < paths.length; i++) {
      if (!zip.call('getEntry', paths[i])) continue
      const xml = zreadString(zip, paths[i])
      if ((total += xml.length) > MAX_TEXT_BYTES * 2) throw new Error(String(t('err_unpack_limit')))
      const paras = nodes(parseXml(xml), 'p').map(inline).map(s => s.trim()).filter(Boolean)
      pages.push(...paginate(`── ${tf('slide_n', i + 1)} ──\n\n${paras.join('\n\n') || String(t('no_text'))}`))
    }
  } finally {
    try { zip.call('close') } catch {}
  }

  return new Doc(pages.length > 0 ? pages : [String(t('empty_presentation'))])
}

// ------------------------------------------------------------- ODF
export function odfDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  let xml = ''
  try {
    xml = zreadString(zip, 'content.xml')
  } finally {
    try { zip.call('close') } catch {}
  }

  const blocks: string[] = []
  const tree = parseXml(xml)
  let expanded = 0
  const repeat = (node: XmlNode, key: string, cap: number) => {
    const value = attr(node, key)
    return /^\d+$/.test(value) ? Math.max(1, Math.min(cap, Number(value))) : 1
  }
  function inline(node: XmlNode): string {
    if (node.name === 's') return ' '.repeat(repeat(node, 'c', 1000))
    if (node.name === 'tab') return '\t'
    if (node.name === 'line-break') return '\n'
    if (['annotation', 'tracked-changes', 'binary-data'].includes(node.name)) return ''
    return node.children.map(c => typeof c === 'string' ? c : inline(c)).join('')
  }
  function walk(node: XmlNode): void {
    if (['annotation', 'tracked-changes', 'binary-data'].includes(node.name)) return
    if (node.name === 'table') {
      const rows: string[][] = []
      for (const row of nodes(node, 'table-row')) {
        if (rows.length >= MAX_ROWS) break
        const cells: string[] = []
        for (const cell of row.children) {
          if (typeof cell === 'string' || !['table-cell', 'covered-table-cell'].includes(cell.name)) continue
          if (cells.length >= MAX_COLS) break
          const paras = nodes(cell, 'p')
          const value = cell.name === 'covered-table-cell' ? '' : paras.length ? paras.map(inline).join('\n').trim()
            : attr(cell, 'string-value') || attr(cell, 'value') || attr(cell, 'date-value') || attr(cell, 'boolean-value') || attr(cell, 'time-value')
          const count = repeat(cell, 'number-columns-repeated', MAX_COLS - cells.length)
          for (let i = 0; i < count; i++) cells.push(value)
        }
        const count = repeat(row, 'number-rows-repeated', MAX_ROWS - rows.length)
        expanded += count * cells.reduce((sum, cell) => sum + cell.length + 1, 0)
        if (expanded > MAX_TEXT_BYTES) throw new Error(String(t('err_unpack_limit')))
        for (let i = 0; i < count; i++) rows.push(cells.slice())
      }
      blocks.push(`── ${attr(node, 'name') || String(t('sheet_default'))} ──\n\n${formatRows(trimRows(rows), true)}`)
    } else if (node.name === 'p' || node.name === 'h') {
      const text = inline(node).trim()
      if (text) blocks.push(node.name === 'h' ? `# ${text}` : text)
    } else for (const child of node.children) if (typeof child !== 'string') walk(child)
  }
  walk(nodes(tree, 'body')[0] ?? tree)

  const full = blocks.join('\n\n') || String(t('empty_doc'))
  return new Doc(paginate(full), 0, true, '')
}

// ------------------------------------------------------------- RTF
export function rtfDoc(path: string): Doc {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES)
  const src = byteString(bytes)
  const hidden = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'objdata', 'fldinst', 'header', 'footer', 'filetbl', 'listtable', 'listoverridetable', 'generator'])
  let state = { skip: false, uc: 1, charset: 'windows-1252' }
  const stack: typeof state[] = []
  let fallback = 0
  const out: string[] = []
  let pending: number[] = []
  function flush(): void {
    if (pending.length) out.push(decodeBytes(new Uint8Array(pending), state.charset))
    pending = []
  }
  function emit(value: string): void {
    flush()
    if (fallback > 0) { fallback--; return }
    if (!state.skip) out.push(value)
  }
  for (let i = 0; i < src.length;) {
    const c = src[i++]
    if (c === '{') {
      flush()
      if (stack.length >= 256) throw new Error('RTF complexity limit exceeded')
      stack.push({ ...state })
    } else if (c === '}') { flush(); state = stack.pop() ?? state; fallback = 0 }
    else if (c === '\r' || c === '\n') continue
    else if (c !== '\\') {
      if (fallback > 0) fallback--
      else if (!state.skip) pending.push(c.charCodeAt(0))
    } else {
      const next = src[i]
      if (next === "'" && /^[\da-f]{2}$/i.test(src.slice(i + 1, i + 3))) {
        const b = parseInt(src.slice(i + 1, i + 3), 16); i += 3
        if (fallback > 0) fallback--
        else if (!state.skip) pending.push(b)
        continue
      }
      if (!/[a-z]/i.test(next ?? '')) {
        i++
        if (next === '*') { flush(); state.skip = true }
        else if (['\\', '{', '}'].includes(next)) emit(next)
        else if (next === '~') emit('\u00a0')
        else if (next === '_') emit('\u2011')
        else if (next === '-') emit('\u00ad')
        continue
      }
      const word = /^([a-z]+)(-?\d+)? ?/i.exec(src.slice(i))!
      i += word[0].length
      const key = word[1].toLowerCase(), n = Number(word[2])
      flush()
      if (hidden.has(key)) state.skip = true
      else if (key === 'bin' && n >= 0) i = Math.min(src.length, i + n)
      else if (key === 'ansicpg' && n > 0) {
        const codepages: Record<number, string> = { 65001: 'utf-8', 932: 'shift_jis', 936: 'gbk', 949: 'ms949', 950: 'big5', 437: 'cp437', 850: 'cp850', 866: 'cp866', 10000: 'MacRoman' }
        state.charset = codepages[n] ?? `windows-${n}`
      }
      else if (key === 'uc' && n >= 0) state.uc = Math.min(n, 32)
      else if (key === 'u' && word[2]) {
        if (!state.skip) out.push(String.fromCharCode((n + 65536) % 65536))
        fallback = state.uc
      } else {
        const symbols: Record<string, string> = { par: '\n', line: '\n', tab: '\t', cell: '\t', row: '\n', emdash: '—', endash: '–', bullet: '•', lquote: '‘', rquote: '’', ldblquote: '“', rdblquote: '”' }
        if (symbols[key]) emit(symbols[key])
      }
    }
  }
  flush()
  const text = out.join('').replace(/\n{3,}/g, '\n\n').trim()

  return new Doc(paginate(text || String(t('empty_doc'))), 0, true, '')
}

// Preserve octets before MIME transfer/charset decoding (latin1 decoders may
// map 0x80..0x9f to punctuation and corrupt binary data).
function byteString(bytes: Uint8Array): string {
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)))
  return chunks.join('')
}
function octets(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length)
  for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i) & 255
  return bytes
}
function transfer(value: string, encoding: string): Uint8Array {
  if (encoding === 'quoted-printable') return octets(value.replace(/=\r?\n/g, '').replace(/=([\da-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))))
  if (encoding === 'base64') {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const out: number[] = []
    let bits = 0, buffer = 0
    for (const c of value.replace(/\s/g, '')) {
      if (c === '=') break
      const n = alphabet.indexOf(c)
      if (n < 0) throw new Error('Invalid MIME base64')
      buffer = (buffer << 6) | n; bits += 6
      if (bits >= 8) { bits -= 8; out.push((buffer >> bits) & 255) }
    }
    return new Uint8Array(out)
  }
  return octets(value)
}
function mimeHeaders(raw: string): { headers: Record<string, string>, body: string } {
  const separator = /\r?\n\r?\n/.exec(raw)
  const head = separator ? raw.slice(0, separator.index) : raw
  const headers: Record<string, string> = Object.create(null)
  for (const line of head.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
    const match = /^([^:\s]+):[ \t]*(.*)$/.exec(line)
    if (match) headers[match[1].toLowerCase()] = match[2].trim()
  }
  return { headers, body: separator ? raw.slice(separator.index + separator[0].length) : '' }
}
function mimeParam(value: string, name: string): string {
  const params = /;\s*([\w-]+)\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;\s]+))/g
  let m: RegExpExecArray | null
  while ((m = params.exec(value))) if (m[1].toLowerCase() === name) return (m[2] ?? m[3]).replace(/\\(.)/g, '$1')
  return ''
}
function encodedHeader(value: string): string {
  return value.replace(/(\?=)[ \t]+(?==\?)/g, '$1').replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi, (all, charset, kind, data) => {
    try { return decodeBytes(transfer(kind.toLowerCase() === 'q' ? data.replace(/_/g, ' ') : data, kind.toLowerCase() === 'q' ? 'quoted-printable' : 'base64'), charset) } catch { return all }
  })
}

// ------------------------------------------------------------- EML
export function emlDoc(path: string): Doc {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES)
  const raw = byteString(bytes)
  const { headers } = mimeHeaders(raw)
  let parts = 0
  function extract(rawPart: string, depth = 0): { text: string, plain: boolean } {
    if (++parts > 1000 || depth > 20) throw new Error('MIME complexity limit exceeded')
    const { headers: h, body } = mimeHeaders(rawPart)
    const ct = h['content-type'] || 'text/plain'
    const type = ct.split(';')[0].trim().toLowerCase()
    if (/^attachment\b/i.test(h['content-disposition'] || '') || mimeParam(h['content-disposition'] || '', 'filename') || mimeParam(ct, 'name')) return { text: '', plain: false }
    if (type.startsWith('multipart/')) {
      const boundary = mimeParam(ct, 'boundary')
      if (!boundary || boundary.length > 200) return { text: '', plain: false }
      const children: Array<{ text: string, plain: boolean }> = []
      let start = -1
      const lines = /[^\n]*(?:\n|$)/g
      let m: RegExpExecArray | null
      while ((m = lines.exec(body)) && m[0]) {
        const line = m[0].replace(/\r?\n$/, '').replace(/[ \t]+$/, '')
        if (line !== `--${boundary}` && line !== `--${boundary}--`) continue
        if (start >= 0) children.push(extract(body.slice(start, m.index), depth + 1))
        start = lines.lastIndex
        if (line === `--${boundary}--`) { start = -1; break }
      }
      if (start >= 0 && start < body.length) children.push(extract(body.slice(start), depth + 1))
      const visible = children.filter(c => c.text)
      if (type === 'multipart/alternative') return visible.find(c => c.plain) ?? visible[0] ?? { text: '', plain: false }
      return { text: visible.map(c => c.text).join('\n\n'), plain: visible.some(c => c.plain) }
    }
    if (type !== 'text/plain' && type !== 'text/html') return { text: '', plain: false }
    const decoded = decodeBytes(transfer(body, (h['content-transfer-encoding'] || '').toLowerCase()), mimeParam(ct, 'charset') || 'utf-8')
    const text = type === 'text/html' ? bookText(parseXml(decoded)) : decoded.replace(/\r\n/g, '\n').trim()
    return { text, plain: type === 'text/plain' }
  }
  const headLines: string[] = []
  const getHeader = (name: string, label: string) => {
    const value = headers[name.toLowerCase()]
    if (value) headLines.push(`${label}: ${encodedHeader(value)}`)
  }

  getHeader('From', String(t('email_from')))
  getHeader('To', String(t('email_to')))
  getHeader('Cc', String(t('email_cc')))
  getHeader('Subject', String(t('email_subject')))
  getHeader('Date', String(t('email_date')))

  const plainBody = extract(raw).text
  const out = `${headLines.join('\n')}\n\n${plainBody}`
  return new Doc(paginate(out), 0, true, '')
}

// ------------------------------------------------------------- EPUB
export function epubDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  const pages: string[] = []

  try {
    const container = parseXml(zreadString(zip, 'META-INF/container.xml'))
    const rootfiles = nodes(container, 'rootfile')
    const rootfile = rootfiles.find(node => attr(node, 'media-type') === 'application/oebps-package+xml') ?? rootfiles[0]
    if (!rootfile || !attr(rootfile, 'full-path')) throw new Error(String(t('err_epub_manifest')))
    const opfPath = zipPath('', attr(rootfile, 'full-path'))
    const opfBase = opfPath.slice(0, opfPath.lastIndexOf('/') + 1)
    const opf = parseXml(zreadString(zip, opfPath))
    const manifest = new Map<string, XmlNode>()
    for (const item of nodes(opf, 'item')) manifest.set(attr(item, 'id'), item)
    for (const ref of nodes(opf, 'itemref')) {
      if (attr(ref, 'linear').toLowerCase() === 'no') continue
      const item = manifest.get(attr(ref, 'idref'))
      if (!item || !attr(item, 'href')) continue
      const media = attr(item, 'media-type')
      if (media && media !== 'application/xhtml+xml' && media !== 'text/html') continue
      let chapterPath: string
      try { chapterPath = zipPath(opfBase, attr(item, 'href')) } catch { continue }
      if (!zip.call('getEntry', chapterPath)) continue
      const chapter = parseXml(zreadString(zip, chapterPath))
      const text = bookText(nodes(chapter, 'body')[0] ?? chapter)
      if (text) pages.push(...paginate(text))
    }
  } finally {
    try { zip.call('close') } catch {}
  }

  if (pages.length === 0) throw new Error(String(t('err_no_text_in_book')))
  return new Doc(pages, 1)
}

// ------------------------------------------------------------- FB2
export function fb2Doc(path: string): Doc {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES)
  const xml = parseXml(decodeXml(bytes))
  const info = nodes(xml, 'title-info')[0]
  const blocks: string[] = []
  if (info) {
    const title = nodes(info, 'book-title')[0]
    const authors = nodes(info, 'author').map(author => {
      const names = ['first-name', 'middle-name', 'last-name'].map(name => nodes(author, name)[0]).filter(Boolean)
      return names.length ? names.map(nodeText).join(' ') : nodes(author, 'nickname').map(nodeText).join(' ')
    }).filter(Boolean)
    const header = [...authors, title ? nodeText(title).trim() : ''].filter(Boolean).join('\n')
    if (header) blocks.push(header)
  }
  for (const body of nodes(xml, 'body')) {
    const text = bookText(body)
    if (text) blocks.push(text)
  }

  const full = blocks.join('\n\n') || String(t('empty_doc'))
  return new Doc(paginate(full), 1, true, '')
}

export function buildDoc(
  path: string,
  fmt: string,
  ext: string,
  opts: any,
  enc?: string | null,
): Doc {
  switch (fmt) {
    case 'docx': return docxDoc(path)
    case 'xlsx': return xlsxDoc(path)
    case 'pptx': return pptxDoc(path)
    case 'odf': return odfDoc(path)
    case 'rtf': return rtfDoc(path)
    case 'eml': return emlDoc(path)
    case 'epub': return epubDoc(path)
    case 'fb2': return fb2Doc(path)
    default: throw new Error(tf('err_unknown_format', fmt))
  }
}
