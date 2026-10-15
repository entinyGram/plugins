export type Lang = 'uk' | 'ru' | 'en' | 'fa'

function language(value: unknown): Lang {
  const short = String(value).toLowerCase()
  if (short.startsWith('uk')) return 'uk'
  if (short.startsWith('ru')) return 'ru'
  if (short.startsWith('fa')) return 'fa'
  return 'en'
}

export function appLang(): Lang {
  try {
    const controller = inu.jvm.cls('org.telegram.messenger.LocaleController')
    const short = controller.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName')
    if (short) return language(short)
  } catch {}
  try {
    const locale = inu.jvm.cls('java.util.Locale')
    return language(locale.callStatic('getDefault').call('getLanguage'))
  } catch {}
  return 'en'
}

const STRINGS = {
  title: {
    uk: 'Фото дзвінка',
    ru: 'Фото звонка',
    en: 'Call avatar',
    fa: 'عکس تماس',
  },
  enabled: {
    uk: 'Фото на весь екран під час дзвінка',
    ru: 'Фото на весь экран во время звонка',
    en: 'Full-screen photo during calls',
    fa: 'عکس تمام‌صفحه در طول تماس',
  },
  mode: {
    uk: 'Коли показувати фото',
    ru: 'Когда показывать фото',
    en: 'When to show the photo',
    fa: 'زمان نمایش عکس',
  },
  always: {
    uk: 'Завжди',
    ru: 'Всегда',
    en: 'Always',
    fa: 'همیشه',
  },
  before: {
    uk: 'До відповіді',
    ru: 'До ответа',
    en: 'Before answer',
    fa: 'قبل از پاسخ',
  },
  after: {
    uk: 'Після відповіді',
    ru: 'После ответа',
    en: 'After answer',
    fa: 'بعد از پاسخ',
  },
  supported: {
    uk: 'Для голосових дзвінків. Без фото залишається штатний аватар; під час відео фон вимикається.',
    ru: 'Для голосовых звонков. Без фото остаётся стандартный аватар; во время видео фон отключается.',
    en: 'For voice calls. Without a photo, the native avatar remains; the background is disabled during video calls.',
    fa: 'برای تماس‌های صوتی. بدون عکس، آواتار پیش‌فرض باقی می‌ماند؛ پس‌زمینه در تماس‌های ویدیویی غیرفعال می‌شود.',
  },
  unsupported: {
    uk: 'Ця версія клієнта не підтримує потрібні хуки дзвінків.',
    ru: 'Эта версия клиента не поддерживает необходимые хуки звонков.',
    en: 'This client version does not support the required call hooks.',
    fa: 'این نسخه از کلاینت از قلاب‌های تماس لازم پشتیبانی نمی‌کند.',
  },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey): string {
  return STRINGS[key][appLang()]
}