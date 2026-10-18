// Builds the user-plugin catalog. Unlike the official plugins these ship as ready-made bundles (they are not built
// from source in this repo): every bundle already carries its ==InuPlugin== header, so the catalog only reads it,
// hashes the file and publishes an immutable copy under plugins/user/dist/<id>/<version>.inu.js.
//
// The marketplace keeps the official and the user catalog apart; the user index is served from
// `<repo>/plugins/user/index.json` and lists the plugins of the separate "User plugins" section.
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const userDir = join(root, 'plugins/user')
const bundlesDir = join(userDir, 'bundles')
const iconsDir = join(userDir, 'icons')
const indexFile = join(userDir, 'index.json')

interface Version { version: string, date: string, notes: string, file: string, sha256: string, requires: string[], pluginApi?: number }
interface Entry { id: string, name: string, author?: string, description?: string, icon?: string, versions: Version[] }

const index: { version: 1, plugins: Entry[] } = existsSync(indexFile)
  ? JSON.parse(readFileSync(indexFile, 'utf8'))
  : { version: 1, plugins: [] }

function header(source: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  let inside = false
  for (const line of source.split('\n')) {
    const text = line.trim().replace(/^\/\/\s?/, '')
    if (text === '==InuPlugin==') { inside = true; continue }
    if (text === '==/InuPlugin==') break
    const m = inside && text.match(/^@(\S+)\s*(.*)$/)
    if (m) (out[m[1].toLowerCase()] ??= []).push(m[2].trim())
  }
  return out
}

const today = new Date().toISOString().slice(0, 10)
let added = 0
for (const file of readdirSync(bundlesDir).filter(f => f.endsWith('.inu.js')).sort()) {
  const bytes = readFileSync(join(bundlesDir, file))
  const h = header(bytes.toString('utf8'))
  const id = h.id?.[0]
  const version = h.version?.[0]
  if (!id || !version) throw new Error(`${file}: a user bundle needs @id and @version to be published`)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const relative = `dist/${id}/${version}.inu.js`
  const target = join(userDir, relative)
  const entry = index.plugins.find(p => p.id === id) ?? (index.plugins.push({ id, name: id, versions: [] }), index.plugins.at(-1)!)
  const existing = entry.versions.find(v => v.version === version)
  if (existing && existing.sha256 !== sha256) {
    throw new Error(`${id} ${version} is already published with different contents; bump @version in ${file}`)
  }
  entry.name = h.name?.[0] ?? entry.name
  entry.author = h.author?.[0] ?? entry.author
  entry.description = h.description?.[0] ?? entry.description
  if (existsSync(join(iconsDir, `${id}.svg`))) entry.icon = `icons/${id}.svg`
  const record: Version = {
    version,
    date: existing?.date ?? today,
    notes: '',
    file: relative,
    sha256,
    requires: h.requires ?? [],
    ...(h['plugin-api'] ? { pluginApi: Number(h['plugin-api'][0]) } : {}),
  }
  if (!existing) { entry.versions.push(record); added++ }
  else Object.assign(existing, record)
  mkdirSync(join(userDir, 'dist', id), { recursive: true })
  copyFileSync(join(bundlesDir, file), target)
}
index.plugins.sort((a, b) => a.id.localeCompare(b.id))
for (const entry of index.plugins) entry.versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`)
console.log(`${index.plugins.length} user plugins, ${added} new versions -> ${indexFile}`)