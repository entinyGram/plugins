// Copies the latest published bundle (or all versions with --all) from plugins/dist into <dir> as <Name>-<version>.inu.js, checking each against the catalog hash.
// The published files are the source of truth (their hashes are in the catalog), so nothing is rebuilt here.
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { packedName } from './pack-name.ts'

const root = join(import.meta.dir, '..')
const outArg = process.argv.slice(2).find(arg => !arg.startsWith('--')) ?? 'release'
const out = join(root, outArg)
const all = process.argv.includes('--all')
const index = JSON.parse(readFileSync(join(root, 'plugins/index.json'), 'utf8')) as {
  plugins: { id: string, name: string, versions: { version: string, file: string, sha256: string }[] }[]
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
let count = 0
for (const plugin of index.plugins) {
  const versions = all ? plugin.versions : (plugin.versions[0] ? [plugin.versions[0]] : [])
  for (const v of versions) {
    const source = join(root, 'plugins', v.file)
    const hash = createHash('sha256').update(readFileSync(source)).digest('hex')
    if (hash !== v.sha256) throw new Error(`${plugin.id} ${v.version}: ${v.file} does not match the catalog hash`)
    copyFileSync(source, join(out, packedName(plugin.name, v.version)))
    count++
  }
}
console.log(`${count} bundles -> ${out}`)

