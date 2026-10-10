export type Lang = 'uk' | 'ru' | 'en'

export function appLang(): Lang {
  try {
    const LocaleController = inu.jvm.cls('org.telegram.messenger.LocaleController')
    const short = String(LocaleController.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName')).toLowerCase()
    if (short.startsWith('uk')) return 'uk'
    if (short.startsWith('ru')) return 'ru'
  } catch {}
  try {
    const JLocale = inu.jvm.cls('java.util.Locale')
    const lang = String(JLocale.callStatic('getDefault').call('getLanguage')).toLowerCase()
    if (lang.startsWith('uk')) return 'uk'
    if (lang.startsWith('ru')) return 'ru'
  } catch {}
  return 'en'
}

const STRINGS = {
  provider_name: {
    uk: 'Yandex Translate',
    ru: 'Yandex Translate',
    en: 'Yandex Translate',
  },
  key_title: {
    uk: 'Ключ API Yandex',
    ru: 'API-ключ Yandex',
    en: 'Yandex API key',
  },
  not_set: {
    uk: 'Не вказано',
    ru: 'Не задан',
    en: 'Not set',
  },
  maps_title: {
    uk: 'Yandex',
    ru: 'Yandex',
    en: 'Yandex',
  },
  maps_subtitle: {
    uk: 'Використовується, коли додаток створює прев\'ю з картографічного сервісу',
    ru: 'Используется, когда приложение строит превью из картографического сервиса',
    en: 'Used whenever the app builds a preview from a map service',
  },
  hook_failed: {
    uk: 'Цей пристрій не підтримує перехоплення, необхідні для плагіна',
    ru: 'Это устройство не поддерживает перехваты, необходимые для плагина',
    en: 'This device does not allow the hooks the plugin needs',
  },
  maps_choice_subtitle: {
    uk: 'Прев\'ю геопозиції зі статичних карт Yandex',
    ru: 'Превью геопозиции со статических карт Yandex',
    en: 'Location previews from Yandex static maps',
  },
  err_no_key: {
    uk: 'Вкажіть API-ключ Yandex у налаштуваннях постачальника перекладу',
    ru: 'Укажите API-ключ Yandex в настройках поставщика перевода',
    en: 'Set the Yandex API key in the translation provider settings',
  },
  err_status: {
    uk: 'Yandex Translate відповів зі статусом {0}',
    ru: 'Yandex Translate ответил со статусом {0}',
    en: 'Yandex Translate answered {0}',
  },
  err_empty: {
    uk: 'Yandex Translate повернув порожній результат',
    ru: 'Yandex Translate вернул пустой результат',
    en: 'Yandex Translate returned an empty result',
  },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey): string {
  const l = appLang()
  const entry = STRINGS[key]
  if (!entry) return key
  return (entry as any)[l] ?? (entry as any).en
}

export function tf(key: StringKey, ...args: (string | number)[]): string {
  let str = t(key)
  for (let i = 0; i < args.length; i++) {
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), String(args[i]))
  }
  return str
}

