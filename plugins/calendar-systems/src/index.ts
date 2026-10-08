import { embed, embedChanged } from '@entiny/sdk/embed'

// Dates in the app go through FastDateFormat. For a date pattern (one that holds a month or a year) the
// result is replaced by the same pattern rendered with an ICU calendar picked by the "calendar" locale keyword.
// The hooks are routines: they run in Java on the calling thread and never wait for the JS engine, which
// matters because chat lists format a date per row.

const CALENDARS: Array<[id: string, title: string]> = [
  ['', 'Gregorian'],
  ['islamic', 'Hijri Qamari (lunar)'],
  ['islamic-civil', 'Hijri civil'],
  ['islamic-umalqura', 'Umm al-Qura'],
  ['persian', 'Hijri Shamsi (Jalali)'],
  ['indian', 'Indian national (Saka)'],
  ['hebrew', 'Hebrew'],
  ['buddhist', 'Buddhist'],
  ['japanese', 'Japanese'],
  ['roc', 'Minguo'],
  ['coptic', 'Coptic'],
  ['ethiopic', 'Ethiopic'],
]

const STORAGE_KEY = 'calendar'

const AtomicReference: any = inu.jvm.cls('java.util.concurrent.atomic.AtomicReference')
const ConcurrentHashMap: any = inu.jvm.cls('java.util.concurrent.ConcurrentHashMap')
const SimpleDateFormat: any = inu.jvm.cls('android.icu.text.SimpleDateFormat')
const ULocale: any = inu.jvm.cls('android.icu.util.ULocale')
const JDate: any = inu.jvm.cls('java.util.Date')
const JThread: any = inu.jvm.cls('java.lang.Thread')
const LocaleController: any = inu.jvm.cls('org.telegram.messenger.LocaleController')
const FastDateFormat = inu.jvm.cls('org.telegram.messenger.time.FastDateFormat')

// shared with the routines by identity: a capture of a Java object is the object itself, not a copy
const selected: any = new AtomicReference(localStorage.getItem(STORAGE_KEY) ?? '')
// ICU formats are not thread safe, so each thread keeps its own
const formats: any = new ConcurrentHashMap()

let hooked = true
try {
  inu.xposed.hookMethod(FastDateFormat.getDeclaredMethod('format(J)Ljava/lang/String;'), {
    after: inu.xposed.routine((ctx: any) => {
      const calendar = selected.get()
      if (calendar === '') return
      const self = ctx.thisObject
      const pattern = self.getPattern()
      if (pattern.indexOf('M') < 0 && pattern.indexOf('y') < 0) return
      const locale = self.getLocale()
      const key = JThread.currentThread().getId() + '|' + pattern + '|' + calendar + '|' + locale.toString()
      let format = formats.get(key)
      if (format === null) {
        format = new SimpleDateFormat(pattern, ULocale.forLocale(locale).setKeywordValue('calendar', calendar))
        formats.put(key, format)
      }
      ctx.setReturnValue(format.format(new JDate(ctx.args[0])))
    }),
  })

  inu.xposed.hookMethod(FastDateFormat.getDeclaredMethod('format(Ljava/util/Date;)Ljava/lang/String;'), {
    after: inu.xposed.routine((ctx: any) => {
      const calendar = selected.get()
      if (calendar === '') return
      const self = ctx.thisObject
      const pattern = self.getPattern()
      if (pattern.indexOf('M') < 0 && pattern.indexOf('y') < 0) return
      const locale = self.getLocale()
      const key = JThread.currentThread().getId() + '|' + pattern + '|' + calendar + '|' + locale.toString()
      let format = formats.get(key)
      if (format === null) {
        format = new SimpleDateFormat(pattern, ULocale.forLocale(locale).setKeywordValue('calendar', calendar))
        formats.put(key, format)
      }
      ctx.setReturnValue(format.format(ctx.args[0]))
    }),
  })

  // the date picker header: "Mar 4" or "Mar 4, 2026", and "March" or "March 2026"
  inu.xposed.hookMethod(LocaleController.getDeclaredMethod('formatYearMonthDay(JZ)Ljava/lang/String;'), {
    before: inu.xposed.routine((ctx: any) => {
      const calendar = selected.get()
      if (calendar === '') return
      const locale = ULocale.forLocale(LocaleController.getInstance().getCurrentLocale()).setKeywordValue('calendar', calendar)
      const date = new JDate(ctx.args[0] * 1000)
      const year = new SimpleDateFormat('y', locale)
      const sameYear = year.format(date) === year.format(new JDate())
      const pattern = sameYear && !ctx.args[1] ? 'MMM d' : 'MMM d, y'
      ctx.setReturnValue(new SimpleDateFormat(pattern, locale).format(date))
    }),
  })

  inu.xposed.hookMethod(LocaleController.getDeclaredMethod('formatYearMont(JZ)Ljava/lang/String;'), {
    before: inu.xposed.routine((ctx: any) => {
      const calendar = selected.get()
      if (calendar === '') return
      const locale = ULocale.forLocale(LocaleController.getInstance().getCurrentLocale()).setKeywordValue('calendar', calendar)
      const date = new JDate(ctx.args[0] * 1000)
      const year = new SimpleDateFormat('y', locale)
      const sameYear = year.format(date) === year.format(new JDate())
      const pattern = sameYear && !ctx.args[1] ? 'MMMM' : 'MMMM y'
      ctx.setReturnValue(new SimpleDateFormat(pattern, locale).format(date))
    }),
  })
} catch (error) {
  // some devices cannot hook at all; the page says so instead of failing the plugin
  hooked = false
  console.warn('hooking is not available', error)
}

// plain JS sees Java objects as handles, so members go through call(); routines above use them directly
function current(): string {
  return selected.call('get')
}

// today's date in the chosen calendar, built the way the hooks build it, so the page proves the setting works
function preview(calendar: string): string {
  if (calendar === '') return ''
  try {
    const locale = ULocale.callStatic('forLocale', LocaleController.callStatic('getInstance').call('getCurrentLocale'))
      .call('setKeywordValue', 'calendar', calendar)
    return new SimpleDateFormat('d MMMM y', locale).call('format', new JDate())
  } catch (error) {
    console.warn('preview failed', error)
    return ''
  }
}

// The SDK puts this picker directly in Behavior & Tools → Formatting.
embed({
  id: 'entinygram.calendar-systems',
  name: 'Calendar systems',
  placements: { inline: [{ slot: 'behavior.formatting', rows: ['calendar'] }] },
  rows: () => [{
    id: 'calendar',
    type: 'select',
    text: 'Calendar system',
    subtitle: current() === '' ? undefined : preview(current()),
    options: CALENDARS.map(([, title]) => title),
    selected: Math.max(0, CALENDARS.findIndex(([id]) => id === current())),
  }],
  onEvent: (_row, value) => {
    const id = CALENDARS[Number(value)][0]
    selected.call('set', id)
    localStorage.setItem(STORAGE_KEY, id)
    embedChanged()
  },
})

inu.registerSettings(inu.ui.settingsPage({
  title: 'Calendar systems',
  items: () => [
    inu.ui.header('Dates'),
    inu.ui.select({
      id: 'calendar',
      text: 'Calendar system',
      items: CALENDARS.map(([, title]) => title),
      selected: Math.max(0, CALENDARS.findIndex(([id]) => id === current())),
      onChange: (index) => {
        const id = CALENDARS[index][0]
        selected.call('set', id)
        localStorage.setItem(STORAGE_KEY, id)
      },
    }),
    ...(current() === '' ? [] : [inu.ui.button({ id: 'today', text: 'Today', value: preview(current()), onClick: () => {} })]),
    inu.ui.separator(hooked
      ? 'Already shown dates update when the screen is reopened'
      : 'This device does not allow the hooks the plugin needs'),
  ],
}))

