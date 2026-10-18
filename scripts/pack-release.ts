// Copies the latest published bundle (or all versions with --all) from plugins/dist and plugins/user/dist into
// <dir> as <Name>-<version>.inu.js, checking each against its catalog hash. Official bundles keep the `entinyGram `
// prefix (the marketplace fetches those release assets by name); user bundles are named by their plugin name so the
// community plugins from plugins/user/ are exported to the release too.
// The published files are the source of truth (their hashes are in the catalog), so nothing is rebuilt here.
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { packedName } from './pack-name.ts'

const root = join(import.meta.dir, '..')
const outArg = process.argv.slice(2).find(arg => !arg.startsWith('--')) ?? 'release'
const out = join(root, outArg)
const all = process.argv.includes('--all')

type SourceKey = 'official' | 'user'

const catalogs: { key: SourceKey, indexFile: string, distDir: string }[] = [
  { key: 'official', indexFile: join(root, 'plugins/index.json'), distDir: join(root, 'plugins') },
  { key: 'user', indexFile: join(root, 'plugins/user/index.json'), distDir: join(root, 'plugins/user') },
]

// official bundles get the `entinyGram ` prefix the marketplace release links use; user ones their own name
function assetName(key: SourceKey, name: string, version: string): string {
  if (key === 'official') return packedName(name, version)
  const safe = name.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')
  return `${safe}-${version}.inu.js`
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
let count = 0
for (const catalog of catalogs) {
  const index = JSON.parse(readFileSync(catalog.indexFile, 'utf8')) as {
    plugins: { id: string, name: string, versions: { version: string, file: string, sha256: string }[] }[]
  }
  for (const plugin of index.plugins) {
    const versions = all ? plugin.versions : (plugin.versions[0] ? [plugin.versions[0]] : [])
    for (const v of versions) {
      const source = join(catalog.distDir, v.file)
      const hash = createHash('sha256').update(readFileSync(source)).digest('hex')
      if (hash !== v.sha256) throw new Error(`${plugin.id} ${v.version}: ${v.file} does not match the catalog hash`)
      copyFileSync(source, join(out, assetName(catalog.key, plugin.name, v.version)))
      count++
    }
  }
}
console.log(`${count} bundles -> ${out}`)