import { MAX_WEB_BYTES, MD_EXT, THEMES, type Theme } from '../types.js'
import { decodeText, readFileBytes } from './text.js'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const MD_FENCE = /^\s*(```|~~~)/
const MD_HEAD = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const MD_HR = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/
const MD_LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/
const MD_TSEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/
const MD_URL = /^(https?:\/\/|mailto:|tg:\/\/|#)/i

function mdLink(match: string, text: string, url: string): string {
  if (!MD_URL.test(url)) return text
  return `<a href="${url.replace(/"/g, '%22')}">${text}</a>`
}

function mdAutolink(match: string, url: string): string {
  let tail = ''
  while (url && '.,;:!?)'.includes(url[url.length - 1])) {
    tail = url[url.length - 1] + tail
    url = url.slice(0, -1)
  }
  return `<a href="${url}">${url}</a>${tail}`
}

export function mdInline(s: string): string {
  let text = escapeHtml(s)
  const codes: string[] = []

  // Stash inline code
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code)
    return `\0${codes.length - 1}\0`
  })

  // Images -> text placeholder
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '<em>[$1]</em>')

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, mdLink)

  // Autolinks
  text = text.replace(/(?<![">=])(https?:\/\/[^\s<]+)/g, mdAutolink)

  // Bold
  text = text.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => `<strong>${a || b}</strong>`)

  // Italic
  text = text.replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, '<em>$1</em>')
  text = text.replace(/(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])/g, '<em>$1</em>')

  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Unstash code
  text = text.replace(/\0(\d+)\0/g, (_, idx) => `<code>${codes[Number(idx)]}</code>`)

  return text
}

function mdCells(line: string): string[] {
  let trimmed = line.trim()
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1)
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1)
  return trimmed.split(/(?<!\\)\|/).map(c => c.trim())
}

function mdTable(head: string[], rows: string[][]): string {
  const out = ['<div class="t"><table><thead><tr>']
  for (const c of head) {
    out.push(`<th>${mdInline(c)}</th>`)
  }
  out.push('</tr></thead><tbody>')
  for (const r of rows) {
    out.push(`<tr>${r.map(c => `<td>${mdInline(c)}</td>`).join('')}</tr>`)
  }
  out.push('</tbody></table></div>')
  return out.join('')
}

export function mdBlocks(lines: string[]): string {
  const out: string[] = []
  const para: string[] = []
  let i = 0
  const n = lines.length

  function flush() {
    if (para.length > 0) {
      const body = mdInline(para.join('\n'))
      out.push(`<p>${body.replace(/ {2,}\n/g, '<br>\n')}</p>`)
      para.length = 0
    }
  }

  while (i < n) {
    const line = lines[i]
    const fence = line.match(MD_FENCE)
    if (fence) {
      flush()
      const marker = fence[1]
      const code: string[] = []
      i++
      while (i < n && !lines[i].trim().startsWith(marker)) {
        code.push(lines[i])
        i++
      }
      i++
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    if (!line.trim()) {
      flush()
      i++
      continue
    }

    const headMatch = line.match(MD_HEAD)
    if (headMatch) {
      flush()
      const level = headMatch[1].length
      out.push(`<h${level}>${mdInline(headMatch[2])}</h${level}>`)
      i++
      continue
    }

    if (MD_HR.test(line)) {
      flush()
      out.push('<hr>')
      i++
      continue
    }

    if (line.trimStart().startsWith('>')) {
      flush()
      const quote: string[] = []
      while (i < n && lines[i].trimStart().startsWith('>')) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${mdBlocks(quote)}</blockquote>`)
      continue
    }

    if (line.includes('|') && i + 1 < n && lines[i + 1].includes('-') && MD_TSEP.test(lines[i + 1])) {
      flush()
      const head = mdCells(line)
      i += 2
      const rows: string[][] = []
      while (i < n && lines[i].trim() && lines[i].includes('|')) {
        rows.push(mdCells(lines[i]))
        i++
      }
      out.push(mdTable(head, rows))
      continue
    }

    const listMatch = line.match(MD_LIST)
    if (listMatch) {
      flush()
      const indent = listMatch[1].replace(/\t/g, '    ').length
      const marker = listMatch[2]
      const bullet = ['-', '*', '+'].includes(marker) ? '•' : marker
      let item = listMatch[3]
      item = item.replace(/^\[( |x|X)\]\s+/, (_, c) => c === ' ' ? '☐ ' : '☑ ')
      out.push(`<p class="li" style="margin-left:${indent * 8}px"><span>${bullet}</span> ${mdInline(item)}</p>`)
      i++
      continue
    }

    para.push(line.trimStart())
    i++
  }

  flush()
  return out.join('\n')
}

export function mdPage(text: string, theme: Theme): string {
  const body = mdBlocks(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n'))
  const css = `
html,body{margin:0;background:${theme.cssBg};color:${theme.cssFg}}
body{font:16px/1.65 sans-serif;padding:16px;word-wrap:break-word;overflow-wrap:anywhere}
h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.2em 0 .5em}
h1,h2{border-bottom:1px solid ${theme.cssAlt};padding-bottom:.25em}
a{color:#4da3ff}hr{border:0;border-top:1px solid ${theme.cssAlt}}
code{background:${theme.cssAlt};padding:.1em .35em;border-radius:4px;font-family:monospace;font-size:.92em}
pre{background:${theme.cssAlt};padding:12px;border-radius:8px;overflow-x:auto}
pre code{background:none;padding:0}
blockquote{margin:.8em 0;padding:0 0 0 12px;border-left:4px solid ${theme.cssAlt};opacity:.85}
.t{overflow-x:auto}table{border-collapse:collapse}
td,th{border:1px solid ${theme.cssAlt};padding:6px 10px}th{background:${theme.cssAlt}}
.li{margin-top:.25em;margin-bottom:.25em}.li span{display:inline-block;min-width:1.2em}
`.trim()

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style></head><body>${body}</body></html>`
}

export function svgPage(text: string): string {
  const cleaned = text.replace(/<\?xml.*?\?>|<!DOCTYPE[^>\[]*(\[[^\]]*\])?\s*>/gis, '')
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:#fff}
svg{display:block;max-width:100%;height:auto;margin:0 auto}</style></head>
<body>${cleaned}</body></html>`
}

export function buildWeb(path: string, ext: string, themeIndex: number): string {
  const { bytes } = readFileBytes(path, MAX_WEB_BYTES)
  const [text] = decodeText(bytes)
  if (ext === 'svg') {
    return svgPage(text)
  }
  if (MD_EXT.has(ext)) {
    const theme = THEMES[themeIndex % THEMES.length]
    return mdPage(text, theme)
  }
  return text
}

