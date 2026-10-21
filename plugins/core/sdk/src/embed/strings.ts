// Finds which settings string a row shows, so a plugin can name a slot after it.
//
// A slot is `<page>.<name>` where the name is a string resource without the `Inu` prefix, kebab-cased. The app
// shows the translated text, so the engine reads every `Inu*` string once per language and goes from the text
// back to the names. The scan runs as a routine: it touches thousands of fields and must stay in Java.

const END = '\u0003'
const FIELD_SEP = '\u0001\u0001'
const ROW_SEP = '\u0002\u0002'

const StringBuilder: any = inu.jvm.cls('java.lang.StringBuilder')
const ApplicationLoader: any = inu.jvm.cls('org.telegram.messenger.ApplicationLoader')
const LocaleController: any = inu.jvm.cls('org.telegram.messenger.LocaleController')

const CHUNK = 500

// Class values cannot be reflected over from a plugin, so the strings are walked by resource id instead: the ids
// of one resource type are consecutive, and the first id that has no entry ends the walk.
const Indexer: any = inu.jvm.defineClass({
  methods: {
    build: {
      params: ['android.content.res.Resources', 'int', 'int', 'int'],
      returns: 'java.lang.String',
      body: inu.jvm.routine(function (res: any, base: any, from: any, to: any) {
        const sb = new StringBuilder()
        let misses = 0
        for (let i = from; i < to; i++) {
          const id = base + i
          let name = null
          try {
            name = res.getResourceEntryName(id)
            misses = 0
          } catch (e) {
            // ids can have gaps; a long run of them means the type is over
            misses++
            if (misses >= 64) {
              sb.append(END)
              break
            }
            continue
          }
          if (name.startsWith('Inu') && !name.endsWith('Info')) {
            try {
              sb.append(name).append(FIELD_SEP).append(res.getString(id)).append(ROW_SEP)
            } catch (e) {
              // not a plain string
            }
          }
        }
        return sb.toString()
      }),
    },
  },
})

const kebabCache = new Map<string, string>()

export function kebab(name: string): string {
  const cachedVal = kebabCache.get(name)
  if (cachedVal !== undefined) return cachedVal
  let out = ''
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i)
    const upper = code >= 65 && code <= 90
    const prevCode = i > 0 ? name.charCodeAt(i - 1) : 0
    const prevUpper = prevCode >= 65 && prevCode <= 90
    if (upper && i > 0 && !prevUpper) out += '-'
    out += name[i].toLowerCase()
  }
  kebabCache.set(name, out)
  return out
}

let cached: { locale: string, byText: Map<string, string[]> } | null = null

export function localeKey(): string {
  return String(LocaleController.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName'))
}

function build(): Map<string, string[]> {
  const context: any = ApplicationLoader.getStaticField('applicationContext')
  const resources: any = context.call('getResources')
  const probe: number = resources.call('getIdentifier', 'InuSettings', 'string', context.call('getPackageName'))
  const base = probe - (probe & 0xffff)
  const indexer = new Indexer()
  const byText = new Map<string, string[]>()
  for (let from = 0; from < 0x10000; from += CHUNK) {
    const part = String(indexer.call('build', resources, base, from, from + CHUNK))
    const ended = part.includes(END)
    for (const row of part.replace(END, '').split(ROW_SEP)) {
      if (!row) continue
      const [name, text] = row.split(FIELD_SEP)
      const slots = byText.get(text) ?? []
      slots.push(kebab(name.replace(/^Inu/, '')))
      byText.set(text, slots)
    }
    if (ended) break
  }
  return byText
}

/** the slot names a row with this text can have, in the current language */
export function slotsFor(text: string): string[] {
  const locale = localeKey()
  if (cached === null || cached.locale !== locale) cached = { locale, byText: build() }
  return cached.byText.get(text) ?? []
}

/** reads the strings now, so the first settings screen is not the one that waits for it */
export function warmUp(): void {
  slotsFor('')
}
