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
  title: {
    uk: 'Анімація тексту',
    ru: 'Анимация текста',
    en: 'Text animation',
    fa: 'پویانمایی متن',
  },
  general: {
    uk: 'Загальні',
    ru: 'Основные',
    en: 'General',
    fa: 'عمومی',
  },
  enable: {
    uk: 'Увімкнути анімацію тексту',
    ru: 'Включить анимацию текста',
    en: 'Enable text animation',
    fa: 'فعال‌سازی پویانمایی متن',
  },
  enabled: {
    uk: 'Увімкнено',
    ru: 'Включено',
    en: 'Enabled',
    fa: 'فعال شد',
  },
  duration: {
    uk: 'Тривалість',
    ru: 'Длительность',
    en: 'Duration',
    fa: 'مدت زمان',
  },
  wave_delay: {
    uk: 'Затримка хвилі',
    ru: 'Задержка волны',
    en: 'Wave delay',
    fa: 'تأخیر موج',
  },
  effects: {
    uk: 'Ефекти',
    ru: 'Эффекты',
    en: 'Effects',
    fa: 'جلوه‌ها',
  },
  blur: {
    uk: 'Розмиття',
    ru: 'Размытие',
    en: 'Blur',
    fa: 'تاری (Blur)',
  },
  slide: {
    uk: 'Зсув',
    ru: 'Сдвиг',
    en: 'Slide',
    fa: 'لغزش',
  },
  scale: {
    uk: 'Масштабування',
    ru: 'Масштабирование',
    en: 'Scale',
    fa: 'مقیاس',
  },
  rotate: {
    uk: 'Поворот',
    ru: 'Вращение',
    en: 'Rotate',
    fa: 'چرخش',
  },
  deletion: {
    uk: 'Видалення',
    ru: 'Удаление',
    en: 'Deletion',
    fa: 'حذف',
  },
  ghost: {
    uk: 'Привид при видаленні',
    ru: 'Призрак при удалении',
    en: 'Ghost on delete',
    fa: 'رد شبهی هنگام حذف',
  },
  particle_style: {
    uk: 'Стиль частинок',
    ru: 'Стиль частиц',
    en: 'Particle style',
    fa: 'سبک ذرات',
  },
  particles_per_char: {
    uk: 'Частинок на символ',
    ru: 'Частиц на символ',
    en: 'Particles per char',
    fa: 'تعداد ذرات به ازای هر حرف',
  },
  note_info: {
    uk: 'Анімація відтворюється в полі введення повідомлення під час друку',
    ru: 'Анимация воспроизводится в поле ввода сообщения при наборе текста',
    en: 'The animation plays in the message input as you type',
    fa: 'پویانمایی هنگام تایپ در کادر پیام نمایش داده می‌شود',
  },
  note_unsupported: {
    uk: 'Цей пристрій не підтримує перехоплення, необхідні для плагіна',
    ru: 'Это устройство не поддерживает перехваты, необходимые для этого плагина',
    en: 'This device does not support the hooks needed for this plugin',
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

export function particleStyleNames(): string[] {
  const l = appLang()
  if (l === 'uk') {
    return ['Пил', 'Іскри', 'Сніг', 'Сакура', 'Літери', 'Падіння']
  }
  if (l === 'ru') {
    return ['Пыль', 'Искры', 'Снег', 'Сакура', 'Буквы', 'Падение']
  }
  if (l === 'fa') {
    return ['گرد و غبار', 'جرقه', 'برف', 'شکوفه گیلاس', 'حروف', 'سقوط']
  }
  return ['Dust', 'Sparks', 'Snow', 'Sakura', 'Letters', 'Fall']
}

