// Copies every published bundle from plugins/dist into <dir> as <Name>-<version>.inu.js, checking each against the catalog hash.
// The published files are the source of truth (their hashes are in the catalog), so nothing is rebuilt here.
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { packedName } from './pack-name.ts'

const root = join(import.meta.dir, '..')
const out = join(root, process.argv[2] ?? 'release')
const index = JSON.parse(readFileSync(join(root, 'plugins/index.json'), 'utf8')) as {
  plugins: { id: string, name: string, versions: { version: string, file: string, sha256: string }[] }[]
}

mkdirSync(out, { recursive: true })
let count = 0
for (const plugin of index.plugins) {
  for (const v of plugin.versions) {
    const source = join(root, 'plugins', v.file)
    const hash = createHash('sha256').update(readFileSync(source)).digest('hex')
    if (hash !== v.sha256) throw new Error(`${plugin.id} ${v.version}: ${v.file} does not match the catalog hash`)
    copyFileSync(source, join(out, packedName(plugin.name, v.version)))
    count++
  }
}
console.log(`${count} bundles -> ${out}`)
