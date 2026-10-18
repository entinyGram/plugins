import { Doc, MAX_ENTRIES, MAX_UNPACKED } from '../types.js'
import { humanSize, JFile, ZipFile } from '../jvm.js'
import { paginate, readStreamBytes } from './text.js'
import { t, tf } from '../i18n.js'

interface ArchiveEntry {
  name: string
  size: number
  date: string
}

function formatDate(timeMs: number): string {
  if (!Number.isFinite(timeMs) || timeMs < 0) return '—'
  const d = new Date(timeMs)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function archiveDoc(path: string): Doc {
  const zip = new ZipFile(new JFile(path))
  const entries: ArchiveEntry[] = []
  let totalCount = 0
  let folders = 0
  let totalSize = 0

  try {
    const enumEntries = zip.call('entries')
    while (enumEntries.call('hasMoreElements')) {
      totalCount++
      const entry = enumEntries.call('nextElement')
      if (entry.call('isDirectory')) folders++
      totalSize += Math.max(0, Number(entry.call('getSize')))
      if (entries.length < MAX_ENTRIES) {
        const name = String(entry.call('getName'))
        const size = Number(entry.call('getSize'))
        const time = Number(entry.call('getTime'))
        entries.push({
          name,
          size: size >= 0 ? size : 0,
          date: formatDate(time),
        })
      }
    }
  } finally {
    try { zip.call('close') } catch {}
  }

  const summary = String(t('archive_summary'))
    .replace('{0}', String(totalCount))
    .replace('{1}', String(folders))
    .replace('{2}', humanSize(totalSize))

  const lines = [summary, '']

  for (const e of entries) {
    const sizeStr = e.name.endsWith('/') ? '' : humanSize(e.size)
    lines.push(`${sizeStr.padStart(9)}  ${e.date}  ${e.name}`)
  }

  if (totalCount > entries.length) {
    lines.push(`\n${String(t('archive_more')).replace('{0}', String(entries.length))}`)
  }

  return new Doc(paginate(lines.join('\n')), 2, false, '')
}

export function listArchiveFiles(path: string): string[] {
  const zip = new ZipFile(new JFile(path))
  const names: string[] = []
  try {
    const entries = zip.call('entries')
    let count = 0
    while (entries.call('hasMoreElements') && count++ < MAX_ENTRIES) {
      const entry = entries.call('nextElement')
      if (!entry.call('isDirectory')) names.push(String(entry.call('getName')))
    }
    return names
  } finally {
    try { zip.call('close') } catch {}
  }
}

export function extractArchiveFile(path: string, name: string, cacheDir: string): string {
  const zip = new ZipFile(new JFile(path))
  let temp: JavaObject | null = null
  try {
    const entry = zip.call('getEntry', name)
    if (!entry || entry.call('isDirectory')) throw new Error(tf('err_zip_entry', name))
    if (Number(entry.call('getSize')) > MAX_UNPACKED) throw new Error(String(t('err_unpack_limit')))
    const bytes = readStreamBytes(zip.call('getInputStream', entry), MAX_UNPACKED)
    // Never resolve archive paths on disk (zip-slip); use an unrelated private temp name.
    temp = JFile.callStatic('createTempFile', 'docviewer-', '.tmp', new JFile(cacheDir))
    const Output = inu.jvm.cls('java.io.FileOutputStream')
    const output = new Output(temp)
    try {
      for (let offset = 0; offset < bytes.length; offset += 65536) {
        output.call('write([B)V', bytes.subarray(offset, offset + 65536))
      }
    } finally {
      output.call('close')
    }
    return String(temp!.call('getAbsolutePath'))
  } catch (error) {
    try { temp?.call('delete') } catch {}
    throw error
  } finally {
    try { zip.call('close') } catch {}
  }
}

