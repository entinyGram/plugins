import { t } from './i18n.js'

// LocaleController.getString(...) in all its forms ends in getStringInternal(key, res). The hook is a routine, so it runs
// in Java and never waits for the JS engine: strings are read all the time, including while a chat list scrolls.

const ConcurrentHashMap: any = inu.jvm.cls('java.util.concurrent.ConcurrentHashMap')
const LocaleController: any = inu.jvm.cls('org.telegram.messenger.LocaleController')

const MARKS = [
  { id: 'edited', key: 'EditedMessage' },
  { id: 'deleted', key: 'InuDeletedMarkText' },
] as const

// string key and "#<resource id>" -> your text; shared with the routine by identity
const texts: any = new ConcurrentHashMap()
const ids = new Map<string, string>()

function resId(key: string): number | null {
  try {
    const value = Number(inu.jvm.cls('org.telegram.messenger.R$string').getStaticField(key))
    return Number.isNaN(value) ? null : value
  } catch (error) {
    console.warn(`no resource ${key}`, error)
    return null
  }
}

const stored = (id: string): string => localStorage.getItem(id) ?? ''

function apply(mark: typeof MARKS[number]): void {
  const text = stored(mark.id).trim()
  const res = ids.get(mark.key)
  for (const key of [mark.key, ...(res ? [res] : [])]) {
    if (text === '') texts.call('remove', key)
    else texts.call('put', key, text)
  }
}

for (const mark of MARKS) {
  const id = resId(mark.key)
  if (id !== null) ids.set(mark.key, `#${id}`)
  apply(mark)
}

let hooked = true
try {
  inu.xposed.hookMethod(
    LocaleController.getDeclaredMethod('getStringInternal(Ljava/lang/String;I)Ljava/lang/String;'),
    {
      after: inu.xposed.routine((ctx: any) => {
        const key = ctx.args[0] === null ? '#' + ctx.args[1] : ctx.args[0]
        const text = texts.get(key)
        if (text !== null) ctx.setReturnValue(text)
      }),
    },
  )
} catch (error) {
  hooked = false
  console.warn('cannot hook LocaleController.getStringInternal', error)
}

const page = inu.ui.settingsPage({
  title: 'Custom marks',
  items: () => [
    inu.ui.header(t('header')),
    ...MARKS.map(mark => inu.ui.button({
      id: mark.id,
      text: t(mark.id),
      value: stored(mark.id) === '' ? t('default') : stored(mark.id),
      onClick: async () => {
        const value = await inu.ui.prompt({ title: t(mark.id), hint: t('prompt'), value: stored(mark.id), selectAll: true })
        if (value === null) return
        localStorage.setItem(mark.id, value.trim())
        apply(mark)
        page.invalidate()
      },
    })),
    inu.ui.separator(hooked ? t('note') : t('unsupported')),
  ],
})

inu.registerSettings(page)
