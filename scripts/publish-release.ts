import { execFileSync, execSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const now = new Date()
const pad = (n: number) => String(n).padStart(2, '0')
const tag = `plugins-${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`

const files = readdirSync('release')
  .filter(f => f.endsWith('.inu.js'))
  .map(f => join('release', f))

const head = execSync('git rev-parse --short HEAD').toString().trim()

console.log(`Publishing release ${tag} with ${files.length} assets (built from ${head})...`)

execFileSync('gh', ['release', 'create', tag, ...files, '--title', tag, '--notes', `Plugin bundles built from ${head}`], {
  stdio: 'inherit',
})

console.log(`Successfully published release: ${tag}`)
