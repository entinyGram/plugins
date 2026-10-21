type Lang = 'uk' | 'ru' | 'en'

function appLang(): Lang {
  try {
    const LocaleController = inu.jvm.cls('org.telegram.messenger.LocaleController')
    const short = String(LocaleController.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName')).toLowerCase()
    if (short.startsWith('uk')) return 'uk'
    if (short.startsWith('ru')) return 'ru'
  } catch {}
  return 'en'
}

const STRINGS = {
  haptics: {
    en: 'Block haptic feedback',
    uk: 'Вимкнути тактильний відгук',
    ru: 'Отключить тактильный отклик',
  },
  hapticsInfo: {
    en: 'Taps, long presses and keyboard feedback.',
    uk: 'Дотики, довгі натискання та відгук клавіатури.',
    ru: 'Касания, долгие нажатия и отклик клавиатуры.',
  },
  vibrator: {
    en: 'Block vibration',
    uk: 'Вимкнути вібрацію',
    ru: 'Отключить вибрацию',
  },
  vibratorInfo: {
    en: 'Calls and everything else that asks the vibrator directly.',
    uk: 'Дзвінки та все інше, що напряму звертається до вібромотора.',
    ru: 'Звонки и всё остальное, что напрямую обращается к вибромотору.',
  },
  notifications: {
    en: 'Block notification vibration',
    uk: 'Вимкнути вібрацію сповіщень',
    ru: 'Отключить вибрацию уведомлений',
  },
  notificationsInfo: {
    en: 'Vibration set on notifications and their channels.',
    uk: 'Вібрація, яку задають сповіщенням та їхнім каналам.',
    ru: 'Вибрация, которую задают уведомлениям и их каналам.',
  },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey): string {
  return STRINGS[key][appLang()]
}
