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
  header_dates: {
    uk: 'Дати',
    ru: 'Даты',
    en: 'Dates',
    fa: 'تاریخ‌ها',
  },
  calendar_system: {
    uk: 'Система календаря',
    ru: 'Система календаря',
    en: 'Calendar system',
    fa: 'سیستم گاه‌شماری',
  },
  today: {
    uk: 'Сьогодні',
    ru: 'Сегодня',
    en: 'Today',
    fa: 'امروز',
  },
  in_profile: {
    uk: 'Як у профілі',
    ru: 'Как в профиле',
    en: 'As shown in profile',
    fa: 'مشابه نمایش در نمایه',
  },
  note_update: {
    uk: 'Вже показані дати оновляться при повторному відкритті екрана',
    ru: 'Уже показанные даты обновятся при повторном открытии экрана',
    en: 'Already shown dates update when the screen is reopened',
    fa: 'تاریخ‌های نمایش‌داده‌شده هنگام باز کردن مجدد صفحه به‌روز می‌شوند',
  },
  note_partial: {
    uk: 'Не вдалося перехопити',
    ru: 'Не удалось перехватить',
    en: 'Could not hook',
    fa: 'قلاب‌گذاری ناموفق بود',
  },
  note_unsupported: {
    uk: 'Цей пристрій не підтримує перехоплення, необхідні для плагіна',
    ru: 'Это устройство не поддерживает перехваты, необходимые для плагина',
    en: 'This device does not allow the hooks the plugin needs',
    fa: 'این دستگاه از قلاب‌های مورد نیاز این پلاگین پشتیبانی نمی‌کند',
  },
  cal_gregorian: {
    uk: 'Григоріанський',
    ru: 'Григорианский',
    en: 'Gregorian',
    fa: 'میلادی',
  },
  cal_islamic: {
    uk: 'Хіджра Камарі (місячний)',
    ru: 'Хиджра Камари (лунный)',
    en: 'Hijri Qamari (lunar)',
    fa: 'هجری قمری',
  },
  cal_islamic_civil: {
    uk: 'Хіджра цивільний',
    ru: 'Хиджра гражданский',
    en: 'Hijri civil',
    fa: 'هجری قمری حسابی (مدنی)',
  },
  cal_islamic_umalqura: {
    uk: 'Умм аль-Кура',
    ru: 'Умм аль-Кура',
    en: 'Umm al-Qura',
    fa: 'ام‌القری',
  },
  cal_persian: {
    uk: 'Хіджра Шамсі (Джалалі)',
    ru: 'Хиджра Шамси (Джалали)',
    en: 'Hijri Shamsi (Jalali)',
    fa: 'هجری شمسی (جلالی)',
  },
  cal_indian: {
    uk: 'Індійський національний (Сака)',
    ru: 'Индийский национальный (Сака)',
    en: 'Indian national (Saka)',
    fa: 'ملی هند (ساکا)',
  },
  cal_hebrew: {
    uk: 'Єврейський',
    ru: 'Еврейский',
    en: 'Hebrew',
    fa: 'عبری',
  },
  cal_buddhist: {
    uk: 'Буддійський',
    ru: 'Буддийский',
    en: 'Buddhist',
    fa: 'بودایی',
  },
  cal_japanese: {
    uk: 'Японський',
    ru: 'Японский',
    en: 'Japanese',
    fa: 'ژاپنی',
  },
  cal_roc: {
    uk: 'Міньго',
    ru: 'Миньго',
    en: 'Minguo',
    fa: 'مینگو',
  },
  cal_coptic: {
    uk: 'Коптський',
    ru: 'Коптский',
    en: 'Coptic',
    fa: 'قبطی',
  },
  cal_ethiopic: {
    uk: 'Ефіопський',
    ru: 'Эфиопский',
    en: 'Ethiopic',
    fa: 'اتیوپیایی',
  },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey): string {
  const l = appLang()
  const entry = STRINGS[key]
  if (!entry) return key
  return (entry as any)[l] ?? (entry as any).en
}

export const CALENDAR_KEYS: Record<string, StringKey> = {
  '': 'cal_gregorian',
  'islamic': 'cal_islamic',
  'islamic-civil': 'cal_islamic_civil',
  'islamic-umalqura': 'cal_islamic_umalqura',
  'persian': 'cal_persian',
  'indian': 'cal_indian',
  'hebrew': 'cal_hebrew',
  'buddhist': 'cal_buddhist',
  'japanese': 'cal_japanese',
  'roc': 'cal_roc',
  'coptic': 'cal_coptic',
  'ethiopic': 'cal_ethiopic',
}

export function calendarTitle(id: string): string {
  const key = CALENDAR_KEYS[id]
  return key ? t(key) : id
}

