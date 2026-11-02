// lists every settings screen, section, item, and choice slot a plugin can target
// (`@entiny-menu`, `@entiny-inline`, `@entiny-choice`) and writes sdk/entiny/slots.json + sdk/entiny/src/slots.ts.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const rootDir = join(import.meta.dir, '..')
// the app's sources: ../entinyGram, or ENTINY_APP_DIR
const appDir = process.env.ENTINY_APP_DIR ?? join(rootDir, '../entinyGram')
const settingsDir = join(appDir, 'src/fork/ui/settings')
const stringsFile = join(appDir, 'src/res/values/strings_inu.xml')

const kebab = (name: string) => name.replace(/(?<=[a-z0-9])(?=[A-Z])/g, '-').toLowerCase()

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.kt') ? [path] : []
  })
}

const english = new Map<string, string>()
for (const m of readFileSync(stringsFile, 'utf8').matchAll(/<string name="(\w+)"[^>]*>([^<]*)<\/string>/g)) {
  english.set(m[1], m[2].replace(/\\'/g, '\'').replace(/\\n/g, ' '))
}

function pageIdOf(cls: string): string {
  const name = cls.replace(/Activity$/, '').replace(/Settings$/, '')
  return name === 'Inu' ? 'root' : kebab(name)
}

interface SlotInfo { slot: string, string: string, title: string }
interface Page { id: string, class: string, sections: SlotInfo[], choices: SlotInfo[], items: SlotInfo[] }

const pages: Page[] = []
for (const file of walk(settingsDir)) {
  const source = readFileSync(file, 'utf8')
  // only screens built on SettingsPageActivity carry the slot hooks
  const decl = source.match(/class\s+(\w+Activity)\b[^{]*:\s*[^{]*SettingsPageActivity\b/)
  if (!decl || /PluginSettingsActivity|SchemaPageActivity/.test(decl[1])) continue
  const pid = pageIdOf(decl[1])

  // 1. Sections from asHeader
  const sections: SlotInfo[] = []
  const seenSections = new Set<string>()
  for (const m of source.matchAll(/asHeader\(\s*(?:[\w.]+\s*,\s*)?(?:LocaleController\.)?getString\(\s*R\.string\.(Inu\w+)\s*\)/g)) {
    if (m[1].endsWith('Info') || seenSections.has(m[1])) continue
    seenSections.add(m[1])
    sections.push({ slot: kebab(m[1].replace(/^Inu/, '')), string: m[1], title: english.get(m[1]) ?? m[1] })
  }

  // 2. Choices from RadioItemOptions
  const choices: SlotInfo[] = []
  const seenChoices = new Set<string>()
  if (source.includes('RadioItemOptions.show')) {
    const branches = [...source.matchAll(/(\b[A-Z0-9_]+)\s*(?:->|==\s*item\.id)(?:[^->;]*?|\s*\{[^}]*?)RadioItemOptions\.show/gs)].map(m => m[1])
    for (const btn of new Set(branches)) {
      const regex = new RegExp('(?:asButton|mkTwoLineEntry|asButtonCheck|mkIconCheckItem)\\(\\s*' + btn + '[^;)]*?R\\.string\\.(Inu\\w+)', 's')
      const m = source.match(regex)
      if (m && !seenChoices.has(m[1])) {
        seenChoices.add(m[1])
        choices.push({ slot: kebab(m[1].replace(/^Inu/, '')), string: m[1], title: english.get(m[1]) ?? m[1] })
      }
    }
  }

  // 3. Items from all setting controls
  const items: SlotInfo[] = []
  const seenItems = new Set<string>()
  for (const m of source.matchAll(/(?:asButton|asCheck|asButtonCheck|mkTwoLineCheckItem|mkIconCheckItem|mkSplitCheckItem|mkTwoLineEntry|mkSubPageButton)\([^;)]*?R\.string\.(Inu\w+)/g)) {
    if (m[1].endsWith('Info') || seenSections.has(m[1]) || seenItems.has(m[1])) continue
    seenItems.add(m[1])
    items.push({ slot: kebab(m[1].replace(/^Inu/, '')), string: m[1], title: english.get(m[1]) ?? m[1] })
  }

  pages.push({ id: pid, class: decl[1], sections, choices, items })
}

// Screens declared with `schema("<slug>", ...)` in Schemas.kt: the page id is the slug, sections are `section(R.string.X)`
// and rows take the name of the first string they use, like the app's EmbedSlots does.
const slotOf = (name: string): SlotInfo => ({ slot: kebab(name.replace(/^Inu/, '')), string: name, title: english.get(name) ?? name })
const schemasSource = readFileSync(join(settingsDir, 'Schemas.kt'), 'utf8')
const schemaStarts = [...schemasSource.matchAll(/\bschema\(\s*"([\w-]+)"/g)]
schemaStarts.forEach((start, n) => {
  const body = schemasSource.slice(start.index, schemaStarts[n + 1]?.index ?? schemasSource.length)
  const sections: SlotInfo[] = []
  const choices: SlotInfo[] = []
  const items: SlotInfo[] = []
  const seen = new Set<string>()
  for (const m of body.matchAll(/\b(section|toggle|choice|link|group|custom|slider)\(\s*(?:[^()]*?,\s*)??(?:"([\w-]+)"\s*,\s*)?R\.string\.(Inu\w+)/gs)) {
    const [, kind, slug, name] = m
    if (seen.has(`${kind}:${name}`) || name.endsWith('Info')) continue
    seen.add(`${kind}:${name}`)
    if (kind === 'section') sections.push(slotOf(name))
    else {
      items.push(slotOf(name))
      if (kind === 'choice') choices.push(slotOf(name))
      if (slug) items.push({ slot: slug, string: name, title: english.get(name) ?? name })
    }
  }
  pages.push({ id: start[1], class: 'Schema', sections, choices, items })
})
pages.sort((a, b) => a.id.localeCompare(b.id))

const choiceSlots = pages.flatMap(p => p.choices.map(c => `${p.id}.${c.slot}`))
const generalSlots = pages.flatMap(p => [
  ...p.sections.flatMap(s => [`${p.id}.${s.slot}`, `${p.id}.${s.slot}.start`, `${p.id}.${s.slot}.end`]),
  ...p.items.flatMap(i => [`${p.id}.${i.slot}`, `${p.id}.${i.slot}.before`, `${p.id}.${i.slot}.after`, `${p.id}.${i.slot}.replace`]),
  `${p.id}.end`,
])

const out = join(rootDir, 'sdk/entiny')
writeFileSync(join(out, 'slots.json'), `${JSON.stringify({ pages }, null, 2)}\n`)
writeFileSync(
  join(out, 'src/slots.ts'),
  `// GENERATED by \`bun run generate-slots\` (scripts/generate-slots.ts)\n\n`
  + `/** choice options in a radio/modal picker list: \`<screen>.<button-name>\` */\n`
  + `export type ChoiceSlot =\n${choiceSlots.map(s => `  | '${s}'`).join('\n')}\n\n`
  + `export const CHOICE_SLOTS: readonly ChoiceSlot[] = [\n${choiceSlots.map(s => `  '${s}',`).join('\n')}\n]\n\n`
  + `/** where \`@entiny-menu\` or \`@entiny-inline\` can place controls: \`<screen>.<section>\`, \`<screen>.<item>\`, or relative positions */\n`
  + `export type EntinySlot =\n${generalSlots.map(s => `  | '${s}'`).join('\n')}\n\n`
  + `export const SLOTS: readonly EntinySlot[] = [\n${generalSlots.map(s => `  '${s}',`).join('\n')}\n]\n`,
)
console.log(`${pages.length} screens, ${choiceSlots.length} choice slots, ${generalSlots.length} general slots`)
