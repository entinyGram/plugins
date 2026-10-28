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
  title: { en: 'Voice changer', uk: 'Зміна голосу', ru: 'Смена голоса' },
  info: {
    en: 'Applies to voice messages, video messages and calls.',
    uk: 'Діє у голосових, відеоповідомленнях і дзвінках.',
    ru: 'Действует в голосовых, видеосообщениях и звонках.',
  },
  off: { en: 'Off', uk: 'Вимкнено', ru: 'Выключено' },
  deep: { en: 'Deep', uk: 'Низький', ru: 'Низкий' },
  high: { en: 'High', uk: 'Високий', ru: 'Высокий' },
  girl: { en: 'Girl', uk: 'Дівчина', ru: 'Девушка' },
  where: { en: 'Change voice in', uk: 'Змінювати голос у', ru: 'Менять голос в' },
  everywhere: { en: 'Messages and calls', uk: 'Повідомленнях і дзвінках', ru: 'Сообщениях и звонках' },
  messages: { en: 'Messages only', uk: 'Лише повідомленнях', ru: 'Только сообщениях' },
  calls: { en: 'Calls only', uk: 'Лише дзвінках', ru: 'Только звонках' },
  robot: { en: 'Robot', uk: 'Робот', ru: 'Робот' },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey): string {
  return STRINGS[key][appLang()]
}
