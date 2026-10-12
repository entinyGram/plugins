import { embed, embedChanged } from '@entiny/sdk/embed'
import { calendarTitle, t } from './i18n.js'

// Dates in the app go through FastDateFormat. For a date pattern (one that holds a month or a year) the
// result is replaced by the same pattern rendered with an ICU calendar picked by the "calendar" locale keyword.
// The hooks are routines: they run in Java on the calling thread and never wait for the JS engine, which
// matters because chat lists format a date per row.

const CALENDAR_IDS: string[] = [
  '',
  'islamic',
  'islamic-civil',
  'islamic-umalqura',
  'persian',
  'indian',
  'hebrew',
  'buddhist',
  'japanese',
  'roc',
  'coptic',
  'ethiopic',
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

// Each hook is registered on its own: an app build without one of these methods keeps everything else working.
const missing: string[] = []

function hook(label: string, register: () => void): boolean {
  try {
    register()
    return true
  } catch (error) {
    missing.push(label)
    console.warn(`cannot hook ${label}`, error)
    return false
  }
}

// rewriting how the app formats dates is what the format() pair does; without it nothing changes
const hooked = hook('FastDateFormat.format(long)', () => inu.xposed.hookMethod(
  FastDateFormat.getDeclaredMethod('format(J)Ljava/lang/String;'),
  {
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
  },
))

hook('FastDateFormat.format(Date)', () => inu.xposed.hookMethod(
  FastDateFormat.getDeclaredMethod('format(Ljava/util/Date;)Ljava/lang/String;'),
  {
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
  },
))

// the date picker header: "Mar 4" or "Mar 4, 2026", and "March" or "March 2026"
hook('LocaleController.formatYearMonthDay', () => inu.xposed.hookMethod(
  LocaleController.getDeclaredMethod('formatYearMonthDay(JZ)Ljava/lang/String;'),
  {
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
  },
))

hook('LocaleController.formatYearMont', () => inu.xposed.hookMethod(
  LocaleController.getDeclaredMethod('formatYearMont(JZ)Ljava/lang/String;'),
  {
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
  },
))

// plain JS sees Java objects as handles, so members go through call(); routines above use them directly
function current(): string {
  return selected.call('get')
}

// today's date in the chosen calendar, built the way the hooks build it, so the page proves the setting works.
// the pattern is formatted here rather than by calling the app's formatter: a Java call made from this thread
// would run the hook nested, and a nested hook is skipped, which would show a Gregorian date for a wrong reason
function preview(pattern: string, calendar: string): string {
  if (calendar === '') return ''
  try {
    const locale = ULocale.callStatic('forLocale', LocaleController.callStatic('getInstance').call('getCurrentLocale'))
      .call('setKeywordValue', 'calendar', calendar)
    return new SimpleDateFormat(pattern, locale).call('format', new JDate())
  } catch (error) {
    console.warn('preview failed', error)
    return ''
  }
}

// the profile "registration date" row is LocaleController.formatterYear: reading its pattern shows the page
// rendering a date exactly like that row does
function profilePattern(): string {
  try {
    return String(LocaleController.callStatic('getInstance').call('getFormatterYear').call('getPattern'))
  } catch (error) {
    console.warn('profile pattern failed', error)
    return 'd MMMM y'
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
    text: t('calendar_system'),
    subtitle: current() === '' ? undefined : preview('d MMMM y', current()),
    options: CALENDAR_IDS.map(calendarTitle),
    selected: Math.max(0, CALENDAR_IDS.indexOf(current())),
  }],
  onEvent: (_row, value) => {
    const id = CALENDAR_IDS[Number(value)] ?? ''
    selected.call('set', id)
    localStorage.setItem(STORAGE_KEY, id)
    embedChanged()
  },
})

inu.registerSettings(inu.ui.settingsPage({
  title: 'Calendar systems',
  items: () => [
    inu.ui.header(t('header_dates')),
    inu.ui.select({
      id: 'calendar',
      text: t('calendar_system'),
      items: CALENDAR_IDS.map(calendarTitle),
      selected: Math.max(0, CALENDAR_IDS.indexOf(current())),
      onChange: (index) => {
        const id = CALENDAR_IDS[index] ?? ''
        selected.call('set', id)
        localStorage.setItem(STORAGE_KEY, id)
      },
    }),
    ...(current() === '' ? [] : [
      inu.ui.button({ id: 'today', text: t('today'), value: preview('d MMMM y', current()), onClick: () => {} }),
      inu.ui.button({ id: 'in_profile', text: t('in_profile'), value: preview(profilePattern(), current()), onClick: () => {} }),
    ]),
    inu.ui.separator(hooked
      ? missing.length === 0 ? t('note_update') : `${t('note_update')}\n${t('note_partial')}: ${missing.join(', ')}`
      : t('note_unsupported')),
  ],
}))

