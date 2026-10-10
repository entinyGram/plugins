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
  title: {
    uk: 'Анімація тексту',
    ru: 'Анимация текста',
    en: 'Text animation',
  },
  general: {
    uk: 'Загальні',
    ru: 'Основные',
    en: 'General',
  },
  enable: {
    uk: 'Увімкнути анімацію тексту',
    ru: 'Включить анимацию текста',
    en: 'Enable text animation',
  },
  enabled: {
    uk: 'Увімкнено',
    ru: 'Включено',
    en: 'Enabled',
  },
  duration: {
    uk: 'Тривалість',
    ru: 'Длительность',
    en: 'Duration',
  },
  wave_delay: {
    uk: 'Затримка хвилі',
    ru: 'Задержка волны',
    en: 'Wave delay',
  },
  effects: {
    uk: 'Ефекти',
    ru: 'Эффекты',
    en: 'Effects',
  },
  blur: {
    uk: 'Розмиття',
    ru: 'Размытие',
    en: 'Blur',
  },
  slide: {
    uk: 'Зсув',
    ru: 'Сдвиг',
    en: 'Slide',
  },
  scale: {
    uk: 'Масштабування',
    ru: 'Масштабирование',
    en: 'Scale',
  },
  rotate: {
    uk: 'Поворот',
    ru: 'Вращение',
    en: 'Rotate',
  },
  deletion: {
    uk: 'Видалення',
    ru: 'Удаление',
    en: 'Deletion',
  },
  ghost: {
    uk: 'Привид при видаленні',
    ru: 'Призрак при удалении',
    en: 'Ghost on delete',
  },
  particle_style: {
    uk: 'Стиль частинок',
    ru: 'Стиль частиц',
    en: 'Particle style',
  },
  particles_per_char: {
    uk: 'Частинок на символ',
    ru: 'Частиц на символ',
    en: 'Particles per char',
  },
  note_info: {
    uk: 'Анімація відтворюється в полі введення повідомлення під час друку',
    ru: 'Анимация воспроизводится в поле ввода сообщения при наборе текста',
    en: 'The animation plays in the message input as you type',
  },
  note_unsupported: {
    uk: 'Цей пристрій не підтримує перехоплення, необхідні для плагіна',
    ru: 'Это устройство не поддерживает перехваты, необходимые для этого плагина',
    en: 'This device does not support the hooks needed for this plugin',
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
  return ['Dust', 'Sparks', 'Snow', 'Sakura', 'Letters', 'Fall']
}

