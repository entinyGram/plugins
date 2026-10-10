import { Doc, MAX_ENTRIES } from '../types.js'
import { humanSize, JFile, ZipFile } from '../jvm.js'
import { paginate } from './text.js'
import { t } from '../i18n.js'

interface ArchiveEntry {
  name: string
  size: number
  date: string
  isEncrypted: boolean
}

function formatDate(timeMs: number): string {
  const d = new Date(timeMs)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function archiveDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  const entries: ArchiveEntry[] = []
  let totalCount = 0

  try {
    const enumEntries = zip.call('entries')
    while (enumEntries.call('hasMoreElements')) {
      totalCount++
      const entry = enumEntries.call('nextElement')
      if (entries.length < MAX_ENTRIES) {
        const name = String(entry.call('getName'))
        const size = Number(entry.call('getSize'))
        const time = Number(entry.call('getTime'))
        const isEncrypted = Boolean(entry.call('getMethod') === 0 && entry.call('getCrc') === 0 && size > 0)
        entries.push({
          name,
          size: size >= 0 ? size : 0,
          date: formatDate(time),
          isEncrypted,
        })
      }
    }
  } finally {
    try { zip.call('close') } catch {}
  }

  let folders = 0
  let totalSize = 0
  for (const e of entries) {
    if (e.name.endsWith('/')) {
      folders++
    }
    totalSize += e.size
  }

  const summary = String(t('archive_summary'))
    .replace('{0}', String(totalCount))
    .replace('{1}', String(folders))
    .replace('{2}', humanSize(totalSize))

  const lines = [summary, '']

  for (const e of entries) {
    const sizeStr = e.name.endsWith('/') ? '' : humanSize(e.size)
    const lockStr = e.isEncrypted ? String(t('archive_password')) : ''
    lines.push(`${sizeStr.padStart(9)}  ${e.date}  ${lockStr}${e.name}`)
  }

  if (totalCount > entries.length) {
    lines.push(`\n${String(t('archive_more')).replace('{0}', String(entries.length))}`)
  }

  return new Doc(paginate(lines.join('\n')), 2, false, '')
}

