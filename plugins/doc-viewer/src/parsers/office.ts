import { Doc, MAX_COLS, MAX_ROWS, MAX_TEXT_BYTES } from '../types.js'
import { ByteArrayOutputStream, JFile, JString, ZipFile } from '../jvm.js'
import { formatRows, paginate, readFileBytes, trimRows } from './text.js'
import { t, tf } from '../i18n.js'

export function zreadBytes(zip: JavaObject, name: string): Uint8Array {
  const entry = zip.call('getEntry', name)
  if (!entry) throw new Error(tf('err_zip_entry', name))
  const is = zip.call('getInputStream', entry)
  const baos = new ByteArrayOutputStream()

  const JArray = inu.jvm.cls('java.lang.reflect.Array')
  const ByteType = inu.jvm.cls('java.lang.Byte').getStaticField('TYPE')
  const buffer = JArray.callStatic('newInstance', ByteType, 65536)

  try {
    let read = 0
    while ((read = Number(is.call('read([B)I', buffer))) > 0) {
      baos.call('write([BII)V', buffer, 0, read)
    }
  } finally {
    try { is.call('close') } catch {}
  }
  return baos.call('toByteArray')
}

export function zreadString(zip: JavaObject, name: string, charset = 'utf-8'): string {
  const bytes = zreadBytes(zip, name)
  return String(new JString(bytes, charset))
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
  // Match paragraphs and tables
  const tagRe = /<(w:p|w:tbl)\b[\s\S]*?<\/\1>/g
  let match: RegExpExecArray | null

  while ((match = tagRe.exec(xml)) !== null) {
    const chunk = match[0]
    if (match[1] === 'w:p') {
      const isHeading = /w:pStyle\s+w:val="Heading(\d)"/i.exec(chunk)
      const isList = /<w:numPr>/i.test(chunk)
      const texts: string[] = []
      const textRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g
      let tm: RegExpExecArray | null
      while ((tm = textRe.exec(chunk)) !== null) {
        texts.push(tm[1])
      }
      const rawText = texts.join('').trim()
      if (rawText) {
        if (isHeading) {
          blocks.push(`${'#'.repeat(Math.min(4, Number(isHeading[1])))} ${rawText}`)
        } else if (isList) {
          blocks.push(`• ${rawText}`)
        } else {
          blocks.push(rawText)
        }
      }
    } else if (match[1] === 'w:tbl') {
      const rows: string[][] = []
      const trRe = /<w:tr\b[\s\S]*?<\/w:tr>/g
      let trMatch: RegExpExecArray | null
      while ((trMatch = trRe.exec(chunk)) !== null) {
        const cells: string[] = []
        const tcRe = /<w:tc\b[\s\S]*?<\/w:tc>/g
        let tcMatch: RegExpExecArray | null
        while ((tcMatch = tcRe.exec(trMatch[0])) !== null) {
          const tcTexts: string[] = []
          const textRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g
          let tm: RegExpExecArray | null
          while ((tm = textRe.exec(tcMatch[0])) !== null) {
            tcTexts.push(tm[1])
          }
          cells.push(tcTexts.join(' ').trim())
        }
        rows.push(cells)
      }
      const tblStr = formatRows(trimRows(rows), false)
      if (tblStr.trim()) {
        blocks.push(tblStr)
      }
    }
  }

  const full = blocks.join('\n\n') || String(t('empty_doc'))
  return new Doc(paginate(full), 0, true, '')
}

// ------------------------------------------------------------- XLSX
export function xlsxDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  const pages: string[] = []

  try {
    // Shared strings
    const shared: string[] = []
    try {
      const sXml = zreadString(zip, 'xl/sharedStrings.xml')
      const siRe = /<si\b[\s\S]*?<\/si>/g
      let siMatch: RegExpExecArray | null
      while ((siMatch = siRe.exec(sXml)) !== null) {
        const tParts: string[] = []
        const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g
        let tm: RegExpExecArray | null
        while ((tm = tRe.exec(siMatch[0])) !== null) {
          tParts.push(tm[1])
        }
        shared.push(tParts.join(''))
      }
    } catch {}

    // Find sheets
    const sheetEntries: Array<{ name: string, path: string }> = []
    try {
      const wbXml = zreadString(zip, 'xl/workbook.xml')
      const sheetRe = /<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g
      let sm: RegExpExecArray | null
      const rels = new Map<string, string>()
      try {
        const relXml = zreadString(zip, 'xl/_rels/workbook.xml.rels')
        const relRe = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g
        let rm: RegExpExecArray | null
        while ((rm = relRe.exec(relXml)) !== null) {
          rels.set(rm[1], rm[2].startsWith('/') ? rm[2].slice(1) : `xl/${rm[2]}`)
        }
      } catch {}

      while ((sm = sheetRe.exec(wbXml)) !== null) {
        const target = rels.get(sm[2])
        if (target) {
          sheetEntries.push({ name: sm[1], path: target })
        }
      }
    } catch {}

    if (sheetEntries.length === 0) {
      sheetEntries.push({ name: String(t('sheet_default')), path: 'xl/worksheets/sheet1.xml' })
    }

    for (const sheet of sheetEntries) {
      let sheetXml = ''
      try {
        sheetXml = zreadString(zip, sheet.path)
      } catch {
        continue
      }

      const rows: string[][] = []
      const rowRe = /<row\b[\s\S]*?<\/row>/g
      let rm: RegExpExecArray | null
      while ((rm = rowRe.exec(sheetXml)) !== null) {
        const cells: string[] = []
        const cRe = /<c\b([^>]*)>([\s\S]*?)<\/c>/g
        let cm: RegExpExecArray | null
        while ((cm = cRe.exec(rm[0])) !== null) {
          const attrs = cm[1]
          const body = cm[2]
          const isShared = /t="s"/i.test(attrs)
          const isInline = /t="inlineStr"/i.test(attrs)
          const vMatch = /<v>([\s\S]*?)<\/v>/.exec(body)
          let val = ''
          if (isShared && vMatch) {
            const idx = Number(vMatch[1])
            val = shared[idx] ?? ''
          } else if (isInline) {
            const tMatch = /<t>([\s\S]*?)<\/t>/.exec(body)
            val = tMatch ? tMatch[1] : ''
          } else if (vMatch) {
            val = vMatch[1]
          }
          cells.push(val)
        }
        rows.push(cells.slice(0, MAX_COLS))
        if (rows.length >= MAX_ROWS) break
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
    for (let i = 1; i <= 200; i++) {
      let slideXml = ''
      try {
        slideXml = zreadString(zip, `ppt/slides/slide${i}.xml`)
      } catch {
        break
      }
      const paras: string[] = []
      const pRe = /<a:p\b[\s\S]*?<\/a:p>/g
      let pm: RegExpExecArray | null
      while ((pm = pRe.exec(slideXml)) !== null) {
        const texts: string[] = []
        const tRe = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g
        let tm: RegExpExecArray | null
        while ((tm = tRe.exec(pm[0])) !== null) {
          texts.push(tm[1])
        }
        const s = texts.join('').trim()
        if (s) paras.push(s)
      }
      pages.push(`── ${tf('slide_n', i)} ──\n\n${paras.join('\n\n') || String(t('no_text'))}`)
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
  const pRe = /<(text:p|text:h)\b[^>]*>([\s\S]*?)<\/\1>/g
  let pm: RegExpExecArray | null
  while ((pm = pRe.exec(xml)) !== null) {
    const isH = pm[1] === 'text:h'
    const text = pm[2].replace(/<[^>]+>/g, '').trim()
    if (text) {
      blocks.push(isH ? `# ${text}` : text)
    }
  }

  const full = blocks.join('\n\n') || String(t('empty_doc'))
  return new Doc(paginate(full), 0, true, '')
}

// ------------------------------------------------------------- RTF
export function rtfDoc(path: string): Doc {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES)
  const src = String(new JString(bytes, 'latin1'))

  // Quick RTF parsing
  let text = src
    .replace(/\\par[d]?\b/g, '\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\\u(-?\d+)\??/g, (_, code) => {
      const c = Number(code)
      return String.fromCharCode(c < 0 ? c + 65536 : c)
    })
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    .replace(/{\\[^{}]+}/g, '') // remove command groups
    .replace(/\\[a-zA-Z]+(-?\d+)? ?/g, '') // remove remaining control words
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return new Doc(paginate(text || String(t('empty_doc'))), 0, true, '')
}

// ------------------------------------------------------------- EML
export function emlDoc(path: string): Doc {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES)
  const raw = String(new JString(bytes, 'utf-8'))
  const parts = raw.split(/\r?\n\r?\n/, 2)
  const headers = parts[0] ?? ''
  const body = parts[1] ?? ''

  const headLines: string[] = []
  const getHeader = (name: string, label: string) => {
    const m = new RegExp(`^${name}:\\s*(.+)$`, 'im').exec(headers)
    if (m) headLines.push(`${label}: ${m[1].trim()}`)
  }

  getHeader('From', String(t('email_from')))
  getHeader('To', String(t('email_to')))
  getHeader('Cc', String(t('email_cc')))
  getHeader('Subject', String(t('email_subject')))
  getHeader('Date', String(t('email_date')))

  const plainBody = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const out = `${headLines.join('\n')}\n\n${plainBody}`
  return new Doc(paginate(out), 0, true, '')
}

// ------------------------------------------------------------- EPUB
export function epubDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  const pages: string[] = []

  try {
    const containerXml = zreadString(zip, 'META-INF/container.xml')
    const opfMatch = /full-path="([^"]+)"/i.exec(containerXml)
    if (!opfMatch) throw new Error(String(t('err_epub_manifest')))
    const opfPath = opfMatch[1]
    const opfBase = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
    const opfXml = zreadString(zip, opfPath)

    const manifest = new Map<string, string>()
    const itemRe = /<item\b[^>]*id="([^"]+)"[^>]*href="([^"]+)"/g
    let im: RegExpExecArray | null
    while ((im = itemRe.exec(opfXml)) !== null) {
      manifest.set(im[1], im[2])
    }

    const spine: string[] = []
    const refRe = /<itemref\b[^>]*idref="([^"]+)"/g
    let rm: RegExpExecArray | null
    while ((rm = refRe.exec(opfXml)) !== null) {
      spine.push(rm[1])
    }

    for (const idref of spine) {
      const href = manifest.get(idref)
      if (!href) continue
      const chapterPath = `${opfBase}${href.split('#')[0]}`
      let chapterHtml = ''
      try {
        chapterHtml = zreadString(zip, chapterPath)
      } catch {
        continue
      }
      const text = chapterHtml
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text) {
        pages.push(...paginate(text))
      }
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
  const xml = String(new JString(bytes, 'utf-8'))

  const titleMatch = /<book-title>([\s\S]*?)<\/book-title>/i.exec(xml)
  const authorMatch = /<author>([\s\S]*?)<\/author>/i.exec(xml)
  let authorStr = ''
  if (authorMatch) {
    authorStr = authorMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const titleStr = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : ''

  const blocks: string[] = []
  if (authorStr || titleStr) {
    blocks.push([authorStr, titleStr].filter(Boolean).join('\n'))
  }

  const pRe = /<(p|v|subtitle)\b[^>]*>([\s\S]*?)<\/\1>/gi
  let pm: RegExpExecArray | null
  while ((pm = pRe.exec(xml)) !== null) {
    const s = pm[2].replace(/<[^>]+>/g, '').trim()
    if (s) blocks.push(s)
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
