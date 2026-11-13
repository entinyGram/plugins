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
  header: { en: 'Marks', uk: 'Мітки', ru: 'Метки' },
  edited: { en: 'Edited mark', uk: 'Мітка редагування', ru: 'Метка редактирования' },
  deleted: { en: 'Deleted mark', uk: 'Мітка видалення', ru: 'Метка удаления' },
  prompt: { en: 'Leave empty for the default text', uk: 'Порожнє поле повертає стандартний текст', ru: 'Пустое поле вернёт стандартный текст' },
  default: { en: 'default', uk: 'стандартна', ru: 'стандартная' },
  note: {
    en: 'Applies to messages drawn after the change: reopen the chat. The deleted text shows when the deleted mark style is "text".',
    uk: 'Застосовується до повідомлень, які малюються після зміни: перевідкрийте чат. Текст видалення видно, коли стиль мітки видалення — «текст».',
    ru: 'Применяется к сообщениям, которые рисуются после изменения: переоткройте чат. Текст удаления виден, когда стиль метки удаления — «текст».',
  },
  unsupported: {
    en: 'Hooking is not available on this device.',
    uk: 'Хуки недоступні на цьому пристрої.',
    ru: 'Хуки недоступны на этом устройстве.',
  },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey): string {
  return STRINGS[key][appLang()]
}
