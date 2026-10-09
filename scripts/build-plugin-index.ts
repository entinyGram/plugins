// Builds every plugin in plugins/, keeps each version as plugins/dist/<id>/<version>.inu.js and writes plugins/index.json,
// the catalog the marketplace reads. A version is published once: its file never changes and is never removed, so older
// versions stay installable. Re-running with an unchanged plugin does nothing; a changed file under a published version
// is an error (bump the version), `--force` overwrites it anyway.
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const pluginsDir = join(root, 'plugins')
const indexFile = join(pluginsDir, 'index.json')
const cli = join(root, 'sdk/cli/src/cli.ts')
const force = process.argv.includes('--force')
// `--pack=<dir>` also writes every built bundle as <Name>-<version>.inu.js (e.g. entinyGram-SDK-0.1.0-alpha.inu.js)
const packArg = process.argv.find(arg => arg.startsWith('--pack='))
const packDir = packArg ? join(root, packArg.slice('--pack='.length) || 'release') : null
const selectedPlugins = new Set(process.argv.slice(2).filter(arg => !arg.startsWith('--')))

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

function packedName(pluginName: string, version: string): string {
  const base = /^entinygram/i.test(pluginName) ? pluginName : `entinyGram ${pluginName}`
  const safe = base.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')
  return `${safe}-${version}.inu.js`
}

function notesFor(dir: string, version: string): string {
  const file = join(dir, 'CHANGELOG.md')
  if (!existsSync(file)) return ''
  const text = readFileSync(file, 'utf8')
  const start = text.search(new RegExp(`^##\\s+v?${version.replace(/\./g, '\\.')}\\b.*$`, 'm'))
  if (start < 0) return ''
  const rest = text.slice(start).split('\n').slice(1)
  const end = rest.findIndex(line => line.startsWith('## '))
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim()
}

const today = new Date().toISOString().slice(0, 10)
let added = 0
for (const name of readdirSync(pluginsDir, { withFileTypes: true })) {
  if (selectedPlugins.size > 0 && !selectedPlugins.has(name.name)) continue
  const dir = join(pluginsDir, name.name)
  if (!name.isDirectory() || !existsSync(join(dir, 'inu.config.ts'))) continue
  const built = Bun.spawnSync(['bun', cli, 'build'], { cwd: dir, env: { ...process.env, INU_OUT_DIR: join(pluginsDir, '.release-build', name.name) }, stdout: 'pipe', stderr: 'pipe' })
  if (built.exitCode !== 0) throw new Error(`${name.name}: build failed\n${built.stderr.toString()}`)
  const buildDir = join(pluginsDir, '.release-build', name.name)
  for (const file of readdirSync(buildDir).filter(f => f.endsWith('.inu.js'))) {
    const bytes = readFileSync(join(buildDir, file))
    const h = header(bytes.toString('utf8'))
    const id = h.id?.[0]
    const version = h.version?.[0]
    if (!id || !version) throw new Error(`${name.name}/${file}: the plugin needs @id and @version to be published`)
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const relative = `dist/${id}/${version}.inu.js`
    const target = join(pluginsDir, relative)
    const entry = index.plugins.find(p => p.id === id) ?? (index.plugins.push({ id, name: id, versions: [] }), index.plugins.at(-1)!)
    const existing = entry.versions.find(v => v.version === version)
    if (existing && existing.sha256 !== sha256 && !force) {
      throw new Error(`${id} ${version} is already published with different contents; bump @version (or --force)`)
    }
    entry.name = h.name?.[0] ?? entry.name
    entry.author = h.author?.[0] ?? entry.author
    entry.description = h.description?.[0] ?? entry.description
    if (existsSync(join(dir, 'icon.svg'))) entry.icon = `${name.name}/icon.svg`
    const record: Version = {
      version,
      date: existing?.date ?? today,
      notes: notesFor(dir, version),
      file: relative,
      sha256,
      requires: h.requires ?? [],
      ...(h['plugin-api'] ? { pluginApi: Number(h['plugin-api'][0]) } : {}),
    }
    if (!existing) { entry.versions.push(record); added++ }
    else Object.assign(existing, record)
    mkdirSync(join(pluginsDir, 'dist', id), { recursive: true })
    copyFileSync(join(buildDir, file), target)
    if (packDir) {
      mkdirSync(packDir, { recursive: true })
      copyFileSync(join(buildDir, file), join(packDir, packedName(h.name?.[0] ?? id, version)))
    }
  }
}
rmSync(join(pluginsDir, '.release-build'), { recursive: true, force: true })
index.plugins.sort((a, b) => a.id.localeCompare(b.id))
for (const entry of index.plugins) entry.versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`)
const rootIndexFile = join(root, 'index.json')
const rootIndex = {
  ...index,
  plugins: index.plugins.map(p => ({
    ...p,
    ...(p.icon ? { icon: `plugins/${p.icon}` } : {}),
    versions: p.versions.map(v => ({
      ...v,
      file: `plugins/${v.file}`,
    })),
  })),
}
writeFileSync(rootIndexFile, `${JSON.stringify(rootIndex, null, 2)}\n`)
console.log(`${index.plugins.length} plugins, ${added} new versions -> ${indexFile} & ${rootIndexFile}`)
