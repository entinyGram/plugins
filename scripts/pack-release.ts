// Builds every plugin and writes the bundles to release/ as entinyGram-<Name>-<version>.inu.js, ready to post to the plugins channel.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { packedName } from './pack-name.ts'

const root = join(import.meta.dir, '..')
const cli = join(root, 'sdk/cli/src/cli.ts')
const out = join(root, 'release')
const only = new Set(process.argv.slice(2))

function header(source: string, key: string): string | undefined {
  for (const line of source.split('\n')) {
    const m = line.match(/^\/\/\s*@(\S+)\s+(.+)$/)
    if (m && m[1] === key) return m[2].trim()
  }
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

for (const group of ['core', 'features']) {
  const base = join(root, 'plugins', group)
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const dir = join(base, entry.name)
    if (!entry.isDirectory() || !existsSync(join(dir, 'inu.config.ts'))) continue
    if (only.size > 0 && !only.has(entry.name)) continue
    const built = Bun.spawnSync(['bun', cli, 'build'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })
    if (built.exitCode !== 0) throw new Error(`${entry.name}: build failed\n${built.stderr.toString()}`)
    for (const file of readdirSync(join(dir, 'dist')).filter(name => name.endsWith('.inu.js'))) {
      const source = readFileSync(join(dir, 'dist', file), 'utf8')
      const name = header(source, 'name')
      const version = header(source, 'version')
      if (!name || !version) throw new Error(`${entry.name}/${file}: the plugin needs @name and @version`)
      copyFileSync(join(dir, 'dist', file), join(out, packedName(name, version)))
      console.log(`${entry.name}: ${packedName(name, version)}`)
    }
  }
}
