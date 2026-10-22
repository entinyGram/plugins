import table from './id-date.json'

type Lang = 'uk' | 'ru' | 'en'

const STRINGS = {
  title: { en: 'Registration date', uk: 'Дата реєстрації', ru: 'Дата регистрации' },
  note: {
    en: 'Telegram does not expose it, so this is estimated from the account id',
    uk: 'Telegram її не віддає, тож це оцінка за id акаунта',
    ru: 'Telegram её не отдаёт, так что это оценка по id аккаунта',
  },
}

function appLang(): Lang {
  try {
    const LocaleController = inu.jvm.cls('org.telegram.messenger.LocaleController')
    const short = String(LocaleController.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName')).toLowerCase()
    if (short.startsWith('uk')) return 'uk'
    if (short.startsWith('ru')) return 'ru'
  } catch {}
  return 'en'
}

const t = (key: keyof typeof STRINGS): string => STRINGS[key][appLang()]

const entries = table as Array<[number, number]>

function fmt(seconds: number): string {
  const d = new Date(seconds * 1000)
  return d.toLocaleDateString(appLang(), { year: 'numeric', month: 'long' })
}

function estimate(userId: number): string {
  for (let i = 1; i < entries.length; i++) {
    const [aId, aDate] = entries[i - 1]
    const [bId, bDate] = entries[i]
    if (userId >= aId && userId <= bId) return `~${fmt(aDate + (userId - aId) / (bId - aId) * (bDate - aDate))}`
  }
  if (userId < entries[0][0]) return fmt(entries[0][1])
  return `>${fmt(entries[entries.length - 1][1])}`
}

inu.registerProfileAction({
  id: 'reg-date',
  text: t('title'),
  icon: inu.icons.common('info'),
  visible: ctx => ctx.dialogId > 0,
  callback: (ctx) => {
    inu.ui.bulletin({ text: estimate(ctx.dialogId), subtitle: t('note'), icon: inu.icons.common('info') })
  },
})
