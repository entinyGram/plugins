// Writes release/catalog.json: what the Market in the app lists for the entinyGram source. Run after `bun run build`, it reads
// the bundles in release/ (header, size, hash), the tags the plugin gave itself and the matching entry of its CHANGELOG.md.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MAX_TAGS, TAGS } from '../sdk/entiny/src/tags.ts'

const root = join(import.meta.dir, '..')
const out = join(root, 'release')
const repo = process.env.GITHUB_REPOSITORY ?? 'entinyGram/plugins'
const releaseUrl = `https://github.com/${repo}/releases/download/plugins`

interface Header { [key: string]: string[] }

function parseHeader(source: string): Header {
  const header: Header = {}
  for (const line of source.split('\n')) {
    if (line.startsWith('// ==/InuPlugin==')) break
    const m = line.match(/^\/\/\s*@(\S+)\s*(.*)$/)
    if (m) (header[m[1]] ??= []).push(m[2].trim())
  }
  return header
}

const known = new Set<string>(TAGS.map(tag => tag.id))

/** the CHANGELOG.md entry of this version, as plain lines without the heading */
function changelogOf(dir: string, version: string): string | null {
  const file = join(dir, 'CHANGELOG.md')
  if (!existsSync(file)) return null
  const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex(line => line.trim() === `## ${version}`)
  if (start < 0) return null
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '))
  const body = lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim()
  return body || null
}

function pluginDirs(): Map<string, string> {
  const byId = new Map<string, string>()
  for (const group of ['core', 'features']) {
    const base = join(root, 'plugins', group)
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      const dir = join(base, entry.name)
      const dist = join(dir, 'dist')
      if (!entry.isDirectory() || !existsSync(dist)) continue
      for (const file of readdirSync(dist).filter(name => name.endsWith('.inu.js'))) {
        const id = parseHeader(readFileSync(join(dist, file), 'utf8')).id?.[0]
        if (id) byId.set(id, dir)
      }
    }
  }
  return byId
}

const dirs = pluginDirs()
const plugins = []
for (const file of readdirSync(out).filter(name => name.endsWith('.inu.js')).sort()) {
  const buffer = readFileSync(join(out, file))
  const header = parseHeader(buffer.toString('utf8'))
  const id = header.id?.[0]
  const version = header.version?.[0]
  const name = header.name?.[0]
  if (!id || !version || !name) throw new Error(`${file}: the header needs @id, @name and @version`)

  const tags = (header['entiny-tags']?.[0] ?? '').split(/\s+/).filter(Boolean)
  if (tags.length === 0 || tags.length > MAX_TAGS) throw new Error(`${file}: a plugin takes 1 to ${MAX_TAGS} tags, got ${tags.length}`)
  for (const tag of tags) if (!known.has(tag)) throw new Error(`${file}: unknown tag ${tag}`)

  const description: Record<string, string> = {}
  for (const [key, values] of Object.entries(header)) {
    if (key === 'description') description.en = values[0]
    else if (key.startsWith('description:')) description[key.slice('description:'.length)] = values[0]
  }
  const dir = dirs.get(id)
  const changelog = dir ? changelogOf(dir, version) : null

  plugins.push({
    id,
    slug: id.replace(/^entinygram\./, ''),
    name,
    author: header.author?.[0] ?? '',
    version,
    api: Number(header['plugin-api']?.[0] ?? 1),
    grants: header.grant ?? [],
    requires: header.requires ?? [],
    tags,
    icon: header.icon?.[0] ?? null,
    description,
    changelog: changelog ? { en: changelog } : null,
    file: {
      name: file,
      url: `${releaseUrl}/${file}`,
      size: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'),
    },
  })
}

const catalog = {
  v: 1,
  source: { id: 'entinygram', name: 'entinyGram', official: true },
  tags: TAGS,
  plugins,
}
writeFileSync(join(out, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`catalog.json: ${plugins.length} plugins, ${TAGS.length} tags`)
