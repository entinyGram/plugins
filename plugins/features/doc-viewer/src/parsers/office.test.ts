import { beforeEach, expect, mock, test } from 'bun:test'

// Run this suite separately from io.test.ts: these module mocks intentionally
// test office parsing independently of the compiled JVM stream reader.
const text = await import('./text.js')
const files = new Map<string, Uint8Array>()
let entries: Record<string, string | Uint8Array> = {}
let closed = 0
let streamsClosed = 0
let readLimit = 0
let failRead = false
const encode = (value: string) => new TextEncoder().encode(value)
globalThis.inu = { jvm: {
  cls: () => class {
    constructor(bytes: Uint8Array, charset: string) { return new String(new TextDecoder(charset).decode(bytes)) as any }
  },
  routine: (body: Function) => body,
  defineClass: (spec: any) => ({ callStatic: (name: string, ...args: any[]) => spec.staticMethods[name].body(...args) }),
} } as any

mock.module('./text.js', () => ({
  ...text,
  readFileBytes: (path: string) => ({ bytes: files.get(path)!, cut: false }),
  readStreamBytes: (stream: any, limit: number) => {
    readLimit = limit
    if (failRead) throw new Error('read failed')
    return stream.bytes.subarray(0, limit)
  },
}))
mock.module('../jvm.js', () => ({
  JFile: class { constructor(public path: string) {} },
  JString: class {
    value: string
    constructor(bytes: Uint8Array, charset: string) { this.value = new TextDecoder(charset === 'latin1' ? 'windows-1252' : charset).decode(bytes) }
    toString() { return this.value }
    call() { return this.value }
  },
  ZipFile: class {
    call(method: string, value?: string) {
      if (method === 'close') { closed++; return }
      if (method === 'getEntry') return Object.hasOwn(entries, value!) ? value : null
      if (method === 'getInputStream') return {
        bytes: typeof entries[value!] === 'string' ? encode(entries[value!] as string) : entries[value!],
        call: (method: string) => { if (method === 'close') streamsClosed++ },
      }
      throw new Error(method)
    }
  },
}))
mock.module('../i18n.js', () => ({ t: (key: string) => key, tf: (key: string, value: unknown) => `${key}: ${value}` }))
const { xlsxDoc, epubDoc, fb2Doc, docxDoc, pptxDoc, odfDoc, rtfDoc, emlDoc, zreadBytes } = await import('./office.js')
const { MAX_TEXT_BYTES } = await import('../types.js')

beforeEach(() => { entries = {}; files.clear(); closed = 0; streamsClosed = 0; failRead = false })

test('xlsx: reordered attributes, namespace prefixes, rich text, sparse cells and rows', () => {
  entries = {
    'xl/workbook.xml': `<s:workbook><s:sheets><s:sheet r:id='r1' name='a &amp; b'/></s:sheets></s:workbook>`,
    'xl/_rels/workbook.xml.rels': `<Relationships><Relationship Target='./worksheets/../worksheets/sheet%201.xml' Id='r1'/></Relationships>`,
    'xl/sharedStrings.xml': `<s:sst><s:si/><s:si><s:r><s:t>a &amp; </s:t></s:r><s:r><s:t>&#x1f600;</s:t></s:r><s:rPh><s:t>ignore</s:t></s:rPh></s:si></s:sst>`,
    'xl/worksheets/sheet 1.xml': `<s:worksheet><s:sheetData><s:row r='1'><s:c r='A1'/><s:c r='C1' t='s'><s:v>1</s:v></s:c><s:c r='D1' t='inlineStr'><s:is><s:r><s:t>x</s:t></s:r><s:r><s:t>&lt;y&gt;</s:t></s:r></s:is></s:c></s:row><s:row r='3'><s:c r='B3'><s:f>1+1</s:f><s:v>2</s:v></s:c></s:row></s:sheetData></s:worksheet>`,
  }
  const out = xlsxDoc('book').pages.join('\n')
  expect(out).toContain('a & b')
  expect(out).toContain('a & 😀')
  expect(out).toContain('x<y>')
  expect(out).not.toContain('ignore')
  expect(out.split('\n').find(line => line.includes('a & 😀'))!.split('│')).toHaveLength(4)
  expect(out).toContain('\n\n')
  expect(closed).toBe(1)
  expect(readLimit).toBe(MAX_TEXT_BYTES)
})

test('epub: prefixed manifest, encoded normalized href and body-only text in spine order', () => {
  entries = {
    'META-INF/container.xml': `<c:container><c:rootfiles><c:rootfile media-type='application/oebps-package+xml' full-path='OPS/./book.opf'/></c:rootfiles></c:container>`,
    'OPS/book.opf': `<o:package><o:manifest><o:item href='../Text/ch%201.xhtml#part' media-type='application/xhtml+xml' id='one'/><o:item id='two' href='/Text/two.xhtml'/><o:item id='ext' href='https://example.com/x'/></o:manifest><o:spine><o:itemref idref='two'/><o:itemref idref='one'/><o:itemref idref='ext'/></o:spine></o:package>`,
    'Text/two.xhtml': `<html><head><title>hidden</title></head><body><p>first</p></body></html>`,
    'Text/ch 1.xhtml': `<h:html><h:body><h:script>hidden</h:script><h:p>hello <h:em>world</h:em>&amp;&#33;</h:p><h:p><![CDATA[<raw>]]></h:p></h:body></h:html>`,
  }
  expect(epubDoc('book').pages).toEqual(['first', 'hello world&!\n\n<raw>'])
  expect(closed).toBe(1)
})

test('fb2: utf-16 BOM, multiple authors, entities and only body paragraphs', () => {
  const source = `<?xml version='1.0'?><f:FictionBook><f:description><f:title-info><f:book-title>книга &amp; &#x1f600;</f:book-title><f:author><f:first-name>іван</f:first-name><f:last-name>тест</f:last-name></f:author><f:author><f:nickname>автор</f:nickname></f:author><f:annotation><f:p>hidden</f:p></f:annotation></f:title-info></f:description><f:body><f:section><f:title><f:p>розділ</f:p></f:title><f:p>а<f:strong>б</f:strong>&lt;в&gt;</f:p></f:section></f:body><f:binary>secret</f:binary></f:FictionBook>`
  const bytes = new Uint8Array(2 + source.length * 2)
  bytes.set([255, 254])
  for (let i = 0; i < source.length; i++) { bytes[2 + i * 2] = source.charCodeAt(i) & 255; bytes[3 + i * 2] = source.charCodeAt(i) >> 8 }
  files.set('book', bytes)
  const out = fb2Doc('book').pages.join('\n')
  expect(out).toContain('іван тест\nавтор\nкнига & 😀')
  expect(out).toContain('аб<в>')
  expect(out).not.toContain('hidden')
  expect(out).not.toContain('secret')
})

test('xml declaration encoding without BOM', () => {
  const prefix = encode(`<?xml version='1.0' encoding='windows-1251'?><FictionBook><body><p>`)
  files.set('book', new Uint8Array([...prefix, 0xcf, 0xf0, 0xe8, 0xe2, 0xb3, 0xf2, ...encode('</p></body></FictionBook>')]))
  expect(fb2Doc('book').pages[0]).toBe('Привіт')
})

test('stream and zip closed when reading fails', () => {
  entries = { 'word/document.xml': 'text' }
  failRead = true
  expect(() => docxDoc('book')).toThrow('read failed')
  expect(closed).toBe(1)
  expect(streamsClosed).toBe(1)
})

test('docx entities decode once; email keeps body after blank lines', () => {
  entries = { 'word/document.xml': '<w:document><w:p><w:r><w:t>&amp;lt; &lt; &#65;</w:t></w:r></w:p></w:document>' }
  expect(docxDoc('book').pages[0]).toBe('&lt; < A')
  files.set('mail', encode('Subject: title\r\n\r\none\r\n\r\ntwo'))
  expect(emlDoc('mail').pages[0]).toContain('one\n\ntwo')
})

test('missing ZIP entry does not open a stream', () => {
  expect(() => zreadBytes({ call: () => null } as any, 'absent')).toThrow('err_zip_entry')
  expect(streamsClosed).toBe(0)
})

test('epub rejects traversal and external chapter paths, and closes the ZIP', () => {
  entries = {
    'META-INF/container.xml': `<container><rootfile full-path='book.opf'/></container>`,
    'book.opf': `<package><manifest><item id='bad' href='%2e%2e/%2e%2e/secret.xhtml'/><item id='remote' href='//example.com/chapter'/></manifest><spine><itemref idref='bad'/><itemref idref='remote'/></spine></package>`,
    'secret.xhtml': '<body><p>secret</p></body>',
  }
  expect(() => epubDoc('book')).toThrow('err_no_text_in_book')
  expect(closed).toBe(1)
  expect(streamsClosed).toBe(2)
})

test('xlsx caps huge sparse references instead of allocating huge arrays', () => {
  entries = {
    'xl/worksheets/sheet1.xml': `<worksheet><row r='1'><c r='A1'><v>safe</v></c><c r='ZZZZZZ1'><v>hidden</v></c></row><row r='999999999'><c><v>hidden</v></c></row></worksheet>`,
  }
  const out = xlsxDoc('book').pages.join('\n')
  expect(out).toContain('safe')
  expect(out).not.toContain('hidden')
})

test('xml skips DTDs and comments without expanding arbitrary entities', () => {
  files.set('book', encode(`<!DOCTYPE FictionBook [<!ENTITY leak SYSTEM 'file:///secret'>]><FictionBook><body><!-- <p>hidden</p> --><p>&leak; &#x110000; <![CDATA[a &amp; b]]></p></body></FictionBook>`))
  expect(fb2Doc('book').pages[0]).toBe('&leak; � a &amp; b')
})

test('docx: alternate prefixes, headings, list, run adjacency, controls and tables', () => {
  entries = { 'word/document.xml': `<x:document><x:body><x:p><x:pPr><x:pStyle other='x' x:val='Heading2'/></x:pPr><x:r><x:t>head</x:t></x:r></x:p><x:p><x:pPr><x:numPr/></x:pPr><x:r><x:t>a</x:t><x:tab/><x:t>b</x:t><x:br/><x:t>c</x:t></x:r><x:del><x:r><x:t>hidden</x:t></x:r></x:del></x:p><x:tbl><x:tr><x:tc><x:p><x:r><x:t>hel</x:t></x:r><x:r><x:t>lo</x:t></x:r></x:p></x:tc><x:tc><x:p><x:r><x:t>world</x:t></x:r></x:p></x:tc></x:tr></x:tbl><x:p><x:r><x:t>end</x:t></x:r></x:p></x:body></x:document>` }
  const out = docxDoc('book').pages.join('\n')
  expect(out).toContain('## head\n\n• a\tb\nc')
  expect(out).toContain('hello')
  expect(out).toContain('world')
  expect(out).not.toContain('hidden')
  expect(out.endsWith('end')).toBe(true)
})

test('pptx: relationship order, numeric id collision, gaps and external paths', () => {
  entries = {
    'ppt/presentation.xml': `<q:presentation><q:sldIdLst><q:sldId id='256' z:id='r2'/><q:sldId id='257' z:id='r1'/><q:sldId z:id='bad'/><q:sldId z:id='remote'/></q:sldIdLst></q:presentation>`,
    'ppt/_rels/presentation.xml.rels': `<Relationships><Relationship Id='r1' Target='slides/slide7.xml'/><Relationship Id='r2' Target='./slides/slide%203.xml'/><Relationship Id='bad' Target='../../secret'/><Relationship Id='remote' TargetMode='External' Target='https://example.org'/></Relationships>`,
    'ppt/slides/slide 3.xml': `<slide><d:p><d:r><d:t>first&amp;</d:t></d:r><d:br/><d:r><d:t>line</d:t></d:r></d:p></slide>`,
    'ppt/slides/slide7.xml': `<slide><p><r><t>second</t></r></p></slide>`,
  }
  const pages = pptxDoc('deck').pages
  expect(pages).toHaveLength(2)
  expect(pages[0]).toContain('first&\nline')
  expect(pages[1]).toContain('second')
  expect(closed).toBe(1)
})

test('pptx: fallback gaps and read errors are not silently swallowed', () => {
  entries = { 'ppt/slides/slide3.xml': '<slide><p><t>third</t></p></slide>' }
  expect(pptxDoc('deck').pages[0]).toContain('third')
  failRead = true
  expect(() => pptxDoc('deck')).toThrow('read failed')
  expect(closed).toBe(2)
})

test('odf: prefixed text controls and spreadsheet repeats, covered and typed cells', () => {
  entries = { 'content.xml': `<o:document-content><o:body><o:spreadsheet><t:table t:name='sheet &amp; one'><t:table-row t:number-rows-repeated='2'><t:table-cell t:number-columns-repeated='2'><x:p>a<x:span>b</x:span><x:s x:c='2'/>c<x:tab/>d<x:line-break/>e</x:p></t:table-cell><t:covered-table-cell/><t:table-cell o:value='42'/></t:table-row></t:table><x:h>heading</x:h></o:spreadsheet></o:body></o:document-content>` }
  const out = odfDoc('sheet').pages.join('\n')
  expect(out).toContain('sheet & one')
  expect(out).toContain('ab c d e │ ab c d e │  │ 42') // table formatter deliberately flattens whitespace
  expect(out.match(/42/g)).toHaveLength(2)
  expect(out).toContain('# heading')
})

test('odf: enormous repetitions are capped and expanded text is bounded', () => {
  entries = { 'content.xml': `<body><table><table-row number-rows-repeated='999999999'><table-cell number-columns-repeated='999999999' value='x'/></table-row></table></body>` }
  expect(odfDoc('sheet').pages.join('').length).toBeLessThan(1000000)
  entries['content.xml'] = `<body><table><table-row number-rows-repeated='3000'><table-cell number-columns-repeated='60'><p>${'x'.repeat(100)}</p></table-cell></table-row></table></body>`
  expect(() => odfDoc('sheet')).toThrow('err_unpack_limit')
})

test('rtf: nested formatting, destinations, escaped literals, codepage and unicode fallback', () => {
  files.set('rtf', encode(String.raw`{\rtf1\ansi\ansicpg1251{\fonttbl{\f0 hidden;}}{\*\unknown hidden}hi {\b bold} \{x\} \\ \'cf\'f0\'e8\'e2\'b3\'f2\par\uc2\u1040??\uc1\u-10179?\u-8704?{\field{\*\fldinst hidden}{\fldrslt visible}}}`))
  expect(rtfDoc('rtf').pages[0]).toBe('hi bold {x} \\ Привіт\nА😀visible')
})

test('rtf: binary payload braces and scoped uc do not leak', () => {
  files.set('rtf', encode(String.raw`{\rtf1 start{\pict\bin4 }{\\}end {\uc0\u1040}\u1041?}`))
  const out = rtfDoc('rtf').pages[0]
  expect(out).toContain('startend АБ')
  expect(out).not.toContain('pict')
})


test('eml: folded encoded headers, nested alternatives, transfers and attachment exclusion', () => {
  files.set('mail', encode('Subject: =?utf-8?Q?hello_?=\r\n =?utf-8?B?d29ybGQ=?=\r\nContent-Type: multipart/mixed; boundary="outer.+"\r\n\r\npreamble\r\n--outer.+\r\nContent-Type: multipart/alternative; boundary=inner\r\n\r\n--inner\r\nContent-Type: text/html\r\n\r\n<p>html duplicate</p>\r\n--inner\r\nContent-Type: text/plain; charset=windows-1251\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n=CF=F0=E8=E2=B3=F2=\r\n! <literal>\r\n\r\nnext\r\n--inner--\r\n--outer.+\r\nContent-Type: text/plain\r\nContent-Disposition: attachment; filename="secret.txt"\r\n\r\nsecret\r\n--outer.+--\r\nepilogue'))
  const out = emlDoc('mail').pages[0]
  expect(out).toContain('email_subject: hello world')
  expect(out).toContain('Привіт! <literal>\n\nnext')
  for (const hidden of ['duplicate', 'secret', 'preamble', 'epilogue', 'inner']) expect(out).not.toContain(hidden)
})

test('eml: base64 html fallback ignores scripts and decodes entities once', () => {
  const html = '<html><head><title>hidden</title></head><body><p>hi &amp;lt; &amp; 😀</p><script>secret</script><p>next</p></body></html>'
  files.set('mail', encode(`Content-Type: text/html; charset=utf-8\nContent-Transfer-Encoding: base64\n\n${Buffer.from(html).toString('base64')}`))
  const out = emlDoc('mail').pages[0]
  expect(out).toContain('hi &lt; & 😀\n\nnext')
  expect(out).not.toContain('secret')
  expect(out).not.toContain('hidden')
})

test('eml: raw single-byte body preserves octets and deep MIME fails boundedly', () => {
  files.set('mail', new Uint8Array([...encode('Content-Type: text/plain; charset=windows-1251\r\n\r\n'), 0xcf, 0xf0, 0xe8, 0xe2, 0xb3, 0xf2]))
  expect(emlDoc('mail').pages[0]).toContain('Привіт')
  let nested = 'Content-Type: text/plain\n\nsafe'
  for (let i = 0; i < 22; i++) nested = `Content-Type: multipart/mixed; boundary=b${i}\n\n--b${i}\n${nested}\n--b${i}--`
  files.set('mail', encode(nested))
  expect(() => emlDoc('mail')).toThrow('MIME complexity limit exceeded')
})


test('odf: text/presentation paragraphs preserve controls and ignore metadata outside body', () => {
  entries = { 'content.xml': `<document-content><meta><p>hidden</p></meta><body><presentation><page><h>title</h><p>a<s c='2'/>b<tab/>c<line-break/>d<span>&amp;lt;</span></p></page><page><p>second</p></page></presentation></body></document-content>` }
  expect(odfDoc('slides').pages[0]).toBe('# title\n\na  b\tc\nd&lt;\n\nsecond')
})

test('rtf: multibyte escaped byte runs, windows-1252 punctuation and nesting limit', () => {
  files.set('rtf', encode(String.raw`{\rtf1\ansicpg932 \'82\'a0{\ansicpg1252 \'80}}`))
  expect(rtfDoc('rtf').pages[0]).toBe('あ€')
  files.set('rtf', encode('{'.repeat(257)))
  expect(() => rtfDoc('rtf')).toThrow('RTF complexity limit exceeded')
})
