import { expect, mock, test } from 'bun:test'

const files = new Map<string, Uint8Array>()
let closed = 0
class Stream {
  offset = 0
  constructor(public bytes: Uint8Array, public fail = false) {}
  read(buffer?: Uint8Array, start = 0, count = 0): number {
    if (this.fail) throw new Error('read failed')
    if (this.offset >= this.bytes.length) return -1
    if (!buffer) return this.bytes[this.offset++]
    const length = Math.min(count, this.bytes.length - this.offset)
    buffer.set(this.bytes.subarray(this.offset, this.offset + length), start)
    this.offset += length
    return length
  }
  call(method: string) {
    if (method === 'read()I') return this.read()
    if (method === 'close') { closed++; return }
    throw new Error(method)
  }
}
class File {
  constructor(public path: string) {}
  call(method: string) {
    if (method === 'length') return files.get(this.path)?.length ?? 0
    if (method === 'exists') return files.has(this.path)
    throw new Error(method)
  }
}
mock.module('../jvm.js', () => ({
  JFile: File,
  FileInputStream: class extends Stream { constructor(file: File) { super(files.get(file.path)!) } },
  JString: class {
    value: string
    constructor(bytes: Uint8Array, charset: string) { this.value = new TextDecoder(charset).decode(bytes) }
    toString() { return this.value }
    call() { return this.value }
  },
}))
mock.module('../i18n.js', () => ({ t: (key: string) => key, tf: (key: string) => key }))
globalThis.inu = { jvm: {
  cls: (name: string) => name === 'java.lang.String' ? class {
    constructor(bytes: Uint8Array, charset: string) { return new String(new TextDecoder(charset).decode(bytes)) as any }
  } : ({ copyOf: (buffer: Uint8Array, count: number) => buffer.slice(0, count) }),
  routine: (body: Function) => body,
  defineClass: (spec: any) => ({ callStatic: (name: string, ...args: any[]) => spec.staticMethods[name].body(...args) }),
} } as any
const { readFileBytes, readStreamBytes, looksLikeText, decodeText } = await import('./text.js')
const { detectFormat } = await import('../types.js')

test('stream preserves copied chunks beyond bridge quota and closes', () => {
  const bytes = new TextEncoder().encode('привіт😀'.repeat(120000))
  const before = closed
  expect(readStreamBytes(new Stream(bytes) as any, bytes.length)).toEqual(bytes)
  expect(closed).toBe(before + 1)
})
test('exact limit succeeds, over-limit and read failure close streams', () => {
  expect(readStreamBytes(new Stream(new Uint8Array(3)) as any, 3)).toHaveLength(3)
  const before = closed
  expect(() => readStreamBytes(new Stream(new Uint8Array(4)) as any, 3)).toThrow('err_unpack_limit')
  expect(() => readStreamBytes(new Stream(new Uint8Array(4), true) as any, 3)).toThrow('read failed')
  expect(closed).toBe(before + 2)
})
test('file previews truncate safely and sniff binary/text/BOM', () => {
  files.set('text', new TextEncoder().encode('hello world'))
  files.set('binary', new Uint8Array([1, 0, 2]))
  files.set('utf16', new Uint8Array([255, 254, 65, 0]))
  expect(readFileBytes('text', 5)).toEqual({ bytes: new TextEncoder().encode('hello'), cut: true })
  expect(looksLikeText('text')).toBe(true)
  expect(looksLikeText('binary')).toBe(false)
  expect(looksLikeText('utf16')).toBe(true)
  expect(looksLikeText('missing')).toBe(false)
})
test('encoding fallback and UTF16 decoding cross chunk boundary', () => {
  expect(decodeText(new Uint8Array([0xcf, 0xf0, 0xe8, 0xe2, 0xb3, 0xf2]))[1]).toBe('windows-1251')
  const bytes = new Uint8Array(131074)
  bytes.set([255, 254])
  for (let i = 2; i < bytes.length; i += 2) bytes[i] = 65
  expect(decodeText(bytes)[0]).toBe('A'.repeat(65536))
})
test('ZIP MIME parameters work; unsupported TAR does not hit ZipFile', () => {
  expect(detectFormat('file', 'application/zip; charset=utf-8')).toBe('archive')
  expect(detectFormat('book.EPUB', 'application/zip')).toBe('epub')
  for (const name of ['a.tar', 'a.tar.gz', 'a.tgz', 'a.tbz2', 'a.txz']) expect(detectFormat(name)).toBeNull()
  expect(detectFormat('unknown', 'application/x-tar')).toBeNull()
})

const { csvTable, paginate, formatRows, ipynbText, buildTextDoc } = await import('./text.js')
const { mdInline, mdBlocks, buildWeb, svgPage } = await import('./web.js')
const { MAX_ROWS, MAX_COLS, PAGE_CHARS, CELL_MAX } = await import('../types.js')
const options = { wrap: true, prettyjson: true, csvTable: true }
function fixture(path: string, text: string) { files.set(path, new TextEncoder().encode(text)) }

test('CSV escaped quotes, multiline CRLF, quoted delimiters and trailing empty fields', () => {
  expect(csvTable('name,note,last\r\na,"say ""hi""\r\nnext",\r\n', 'csv'))
    .toBe(formatRows([['name', 'note', 'last'], ['a', 'say "hi"\nnext', '']], true))
  expect(csvTable('"a,b,c";d\n"x;y";z', 'csv'))
    .toBe(formatRows([['a,b,c', 'd'], ['x;y', 'z']], true))
  expect(csvTable('"a\nb,c";d\nx;y', 'csv'))
    .toBe(formatRows([['a\nb,c', 'd'], ['x', 'y']], true))
  expect(csvTable('a,b\nx,"unfinished', 'csv')).toBeNull()
})
test('TSV delimiter is explicit or autodetected, never a backslash regex', () => {
  for (const ext of ['csv', 'tsv', 'tab', 'TSV']) {
    expect(csvTable('a\tb\nx\ty', ext)).toBe('a │ b\nx │ y')
  }
  expect(csvTable('a,b\tc\nx,y\tz', 'tsv')).toBe('a,b │ c\nx,y │ z')
})
test('CSV row limit is exact, columns capped, blank trailing lines ignored', () => {
  const exact = Array(MAX_ROWS).fill('a,b').join('\n')
  expect(csvTable(exact + '\n\n', 'csv')).not.toContain('csv_cut')
  expect(csvTable(exact + '\nx,y', 'csv')).toContain('csv_cut')
  expect(csvTable(Array(MAX_COLS + 3).fill('x').join(','), 'csv')!.split(' │ ')).toHaveLength(MAX_COLS)
})
test('Unicode pagination preserves surrogate pairs and rejects stalled sizes', () => {
  for (const size of [1, 2, 3, PAGE_CHARS]) {
    const source = 'a'.repeat(size - 1) + '😀привіт😀\nкінець'
    const pages = paginate(source, size)
    expect(pages.join('')).toBe(source)
    for (const page of pages) {
      expect(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(page)).toBe(false)
    }
  }
  expect(paginate('')).toEqual([''])
  for (const size of [0, -1, NaN, Infinity]) expect(() => paginate('abc', size)).toThrow(RangeError)
  expect(formatRows([['a'.repeat(CELL_MAX - 2) + '😀tail']], true)).toBe('a'.repeat(CELL_MAX - 2) + '…')
})
test('UTF16 supplementary characters cross JVM chunk boundary in either endian', () => {
  const source = 'a'.repeat(32766) + '😀tail'
  for (const little of [true, false]) {
    const bytes = new Uint8Array(2 + source.length * 2)
    bytes.set(little ? [255, 254] : [254, 255])
    for (let i = 0; i < source.length; i++) {
      const code = source.charCodeAt(i)
      bytes[2 + i * 2] = little ? code & 255 : code >> 8
      bytes[3 + i * 2] = little ? code >> 8 : code & 255
    }
    expect(decodeText(bytes)[0]).toBe(source)
  }
  expect(decodeText(new TextEncoder().encode('valid � 😀'))).toEqual(['valid � 😀', 'utf-8'])
})
test('text, JSON and CSV builders preserve raw fallback and viewer options', () => {
  fixture('plain', 'привіт\r\n😀')
  const plain = buildTextDoc('plain', 'text', 'txt', options)
  expect(plain.pages).toEqual(['привіт\n😀'])
  expect(plain.font).toBe(0)
  fixture('json', '{"x":"😀","n":1}')
  expect(buildTextDoc('json', 'json', 'json', options).pages.join('')).toBe('{\n  "x": "😀",\n  "n": 1\n}')
  fixture('badjson', '{broken')
  expect(buildTextDoc('badjson', 'json', 'json', options).pages).toEqual(['{broken'])
  fixture('csv', 'a,b\nx,y')
  expect(buildTextDoc('csv', 'csv', 'csv', options).wrap).toBe(false)
  expect(buildTextDoc('csv', 'csv', 'csv', { ...options, csvTable: false }).pages).toEqual(['a,b\nx,y'])
})


test('notebooks extract source, streams, errors, text and image placeholders', () => {
  const notebook = JSON.stringify({ cells: [
    { cell_type: 'markdown', source: ['# title\n', '😀'] },
    { cell_type: 'code', execution_count: 2, source: ['print(1)'], outputs: [
      { output_type: 'stream', text: ['\u001b[31mhello\u001b[0m\n'] },
      { output_type: 'error', traceback: ['bad', 'trace'] },
      { output_type: 'display_data', data: { 'text/plain': ['result'] } },
      { output_type: 'display_data', data: { 'image/png': 'base64' } },
    ] },
  ] })
  const result = ipynbText(notebook)
  for (const part of ['# title\n😀', 'In [2]:\nprint(1)', 'Out:\nhello', 'bad\ntrace', 'result', '[ipynb_image]']) expect(result).toContain(part)
  expect(result).not.toContain('\u001b')
  fixture('nb', notebook)
  expect(buildTextDoc('nb', 'ipynb', 'ipynb', options).pages.join('')).toBe(result)
  expect(ipynbText(JSON.stringify({ worksheets: [{ cells: [{ cell_type: 'code', input: ['legacy'] }] }] }))).toContain('legacy')
  for (const raw of ['{bad', 'null', '{"cells":{}}']) expect(ipynbText(raw)).toBe(raw)
})
test('Markdown links and code are opaque to autolinking and emphasis', () => {
  expect(mdInline('[https://a.test](https://b.test?q=1&x=2)'))
    .toBe('<a href="https://b.test?q=1&amp;x=2">https://a.test</a>')
  expect(mdInline('https://a.test/a_b_c?q=x&y=2.'))
    .toBe('<a href="https://a.test/a_b_c?q=x&amp;y=2">https://a.test/a_b_c?q=x&amp;y=2</a>.')
  expect(mdInline('<https://a.test>')).toBe('<a href="https://a.test">https://a.test</a>')
  expect(mdInline('`https://a.test **x**`')).toBe('<code>https://a.test **x**</code>')
  expect(mdInline('[`code`](https://a.test)')).toBe('<a href="https://a.test"><code>code</code></a>')
  expect(mdInline('[bad](javascript:alert)')).toBe('bad')
  expect(mdInline('[x](https://a.test/"onclick="evil)')).toBe('<a href="https://a.test/%22onclick=%22evil">x</a>')
  expect(mdInline('<script>bad</script>')).toBe('&lt;script&gt;bad&lt;/script&gt;')
  expect(mdInline('\0' + '0\0')).not.toContain('undefined')
})
test('Markdown blockquote recursion is bounded and remainder is escaped', () => {
  const result = mdBlocks(['>'.repeat(20000) + '<script>x</script>'])
  expect(result.match(/<blockquote>/g)).toHaveLength(32)
  expect(result).toContain('<pre>')
  expect(result).toContain('&lt;script&gt;')
  expect(mdBlocks(['> hello'])).toBe('<blockquote><p>hello</p></blockquote>')
})
test('web builders dispatch Markdown, preserve HTML and wrap SVG without XML prologue', () => {
  fixture('md', '# title\r\n\r\n```\r\n<x>\r\n```')
  expect(buildWeb('md', 'md', 0)).toContain('<h1>title</h1>')
  expect(buildWeb('md', 'md', 0)).toContain('<pre><code>&lt;x&gt;</code></pre>')
  const html = '<!doctype html><html><body>😀</body></html>'
  fixture('html', html)
  expect(buildWeb('html', 'html', 0)).toBe(html)
  const svg = '<?xml version="1.0"?><!DOCTYPE svg><svg><text>😀</text></svg>'
  fixture('svg', svg)
  expect(buildWeb('svg', 'svg', 0)).toBe(svgPage(svg))
  expect(svgPage(svg)).not.toContain('<?xml')
  expect(svgPage(svg)).not.toContain('<!DOCTYPE svg>')
  expect(svgPage(svg)).toContain('<svg><text>😀</text></svg>')
})
