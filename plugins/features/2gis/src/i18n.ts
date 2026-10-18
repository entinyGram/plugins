export type Lang = 'uk' | 'ru' | 'en' | 'fa'

export function appLang(): Lang {
  try {
    const LocaleController = inu.jvm.cls('org.telegram.messenger.LocaleController')
    const short = String(LocaleController.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName')).toLowerCase()
    if (short.startsWith('uk')) return 'uk'
    if (short.startsWith('ru')) return 'ru'
    if (short.startsWith('fa')) return 'fa'
  } catch {}
  try {
    const JLocale = inu.jvm.cls('java.util.Locale')
    const lang = String(JLocale.callStatic('getDefault').call('getLanguage')).toLowerCase()
    if (lang.startsWith('uk')) return 'uk'
    if (lang.startsWith('ru')) return 'ru'
    if (lang.startsWith('fa')) return 'fa'
  } catch {}
  return 'en'
}

const STRINGS = {
  key_title: {
    uk: 'Ключ API 2GIS',
    ru: 'API-ключ 2GIS',
    en: '2GIS API key',
    fa: 'کلید API 2GIS',
  },
  key_desc: {
    uk: 'Ключ Static API з Platform Manager 2GIS',
    ru: 'Ключ Static API из Platform Manager 2GIS',
    en: 'A Static API key from the 2GIS Platform Manager',
    fa: 'کلید Static API از Platform Manager 2GIS',
  },
  not_set: {
    uk: 'Не вказано',
    ru: 'Не задан',
    en: 'Not set',
    fa: 'تعیین نشده',
  },
  tiles_title: {
    uk: 'Тайли карти',
    ru: 'Тайлы карты',
    en: 'Map tiles',
    fa: 'کاشی‌های نقشه',
  },
  tiles_desc: {
    uk: 'Малює карту в додатку тайлами 2GIS',
    ru: 'Отрисовывает карту в приложении тайлами 2GIS',
    en: 'Draws the map in the app with 2GIS tiles',
    fa: 'نمایش نقشه در برنامه با استفاده از کاشی‌های 2GIS',
  },
  state_active: {
    uk: 'активно',
    ru: 'активно',
    en: 'active',
    fa: 'فعال',
  },
  state_waiting_key: {
    uk: 'очікує ключ',
    ru: 'ожидает ключ',
    en: 'waiting for a key',
    fa: 'در انتظار کلید',
  },
  state_off: {
    uk: 'вимкнено',
    ru: 'выключено',
    en: 'off',
    fa: 'خاموش',
  },
  state_failed: {
    uk: 'помилка: {0}',
    ru: 'ошибка: {0}',
    en: 'failed: {0}',
    fa: 'خطا: {0}',
  },
  maps_title: {
    uk: 'Статичні карти',
    ru: 'Статические карты',
    en: 'Static maps',
    fa: 'نقشه‌های ایستا',
  },
  maps_desc: {
    uk: 'Використовується, коли додаток створює прев\'ю з картографічного сервісу',
    ru: 'Используется, когда приложение строит превью из картографического сервиса',
    en: 'Used whenever the app builds a preview from a map service',
    fa: 'زمانی استفاده می‌شود که برنامه پیش‌نمایشی از سرویس نقشه می‌سازد',
  },
  maps_choice_desc: {
    uk: 'Прев\'ю геопозиції зі Static API 2GIS',
    ru: 'Превью геопозиции из 2GIS Static API',
    en: 'Location previews from the 2GIS Static API',
    fa: 'پیش‌نمایش موقعیت مکانی از 2GIS Static API',
  },
  hook_failed: {
    uk: 'Перехоплення не підтримується на цьому пристрої',
    ru: 'Перехват не поддерживается на этом устройстве',
    en: 'This device does not allow the hooks the plugin needs',
    fa: 'این دستگاه از قلاب‌های مورد نیاز این پلاگین پشتیبانی نمی‌کند',
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

