// The categories a plugin can be filed under in the Market. The same ids are used by the catalog and by the pills in
// the app; hashtags of channel posts are matched against the ids and ALIASES.

export interface TagInfo {
  id: string
  /** the name per language, `en` is always there */
  name: Record<string, string>
  /** one line under the pills when the tag is picked */
  about: Record<string, string>
  /** a Tabler icon name */
  icon: string
  color: string
}

export const TAGS = [
  { id: 'privacy', name: { en: 'Privacy', uk: 'Приватність', ru: 'Приватность' }, about: { en: 'ghost mode, hiding, protection', uk: 'ghost-режим, приховування, захист', ru: 'ghost-режим, скрытие, защита' }, icon: 'shield-lock', color: '#6C8CFF' },
  { id: 'chat', name: { en: 'Chats', uk: 'Чати', ru: 'Чаты' }, about: { en: 'chats, messages, folders, menus', uk: 'чати, повідомлення, папки, меню', ru: 'чаты, сообщения, папки, меню' }, icon: 'message', color: '#4AA8FF' },
  { id: 'media', name: { en: 'Media', uk: 'Медіа', ru: 'Медиа' }, about: { en: 'photos, video, voice, music, files', uk: 'фото, відео, голосові, музика, файли', ru: 'фото, видео, голосовые, музыка, файлы' }, icon: 'photo', color: '#FF7A59' },
  { id: 'ui', name: { en: 'Look', uk: 'Вигляд', ru: 'Внешний вид' }, about: { en: 'themes, icons, animations', uk: 'теми, іконки, анімації', ru: 'темы, иконки, анимации' }, icon: 'palette', color: '#B04CFF' },
  { id: 'calls', name: { en: 'Calls', uk: 'Дзвінки', ru: 'Звонки' }, about: { en: 'voice and video calls', uk: 'голосові й відеодзвінки', ru: 'голосовые и видеозвонки' }, icon: 'phone', color: '#2DC6B4' },
  { id: 'ai', name: { en: 'Language & AI', uk: 'Переклад і ШІ', ru: 'Перевод и ИИ' }, about: { en: 'translation and LLM assistants', uk: 'переклад і LLM-помічники', ru: 'перевод и LLM-помощники' }, icon: 'brain', color: '#A78BFA' },
  { id: 'tools', name: { en: 'Tools', uk: 'Інструменти', ru: 'Инструменты' }, about: { en: 'search, automation, everyday utilities', uk: 'пошук, автоматизація, утиліти', ru: 'поиск, автоматизация, утилиты' }, icon: 'tool', color: '#8B9BB0' },
  { id: 'integrations', name: { en: 'Integrations', uk: 'Інтеграції', ru: 'Интеграции' }, about: { en: 'maps and outside services', uk: 'карти й зовнішні сервіси', ru: 'карты и внешние сервисы' }, icon: 'plug', color: '#F29D49' },
  { id: 'fun', name: { en: 'Fun', uk: 'Розваги', ru: 'Развлечения' }, about: { en: 'games and jokes', uk: 'ігри й жарти', ru: 'игры и шутки' }, icon: 'mood-smile', color: '#FFB454' },
  { id: 'dev', name: { en: 'Developers', uk: 'Для розробників', ru: 'Для разработчиков' }, about: { en: 'SDK, debugging', uk: 'SDK, дебаг', ru: 'SDK, отладка' }, icon: 'code', color: '#7DD3FC' },
] as const satisfies readonly TagInfo[]

export type TagId = typeof TAGS[number]['id']

export const MAX_TAGS = 3

/** other spellings of the tags, as people write them in hashtags; lower case, without the `#` */
export const ALIASES: Record<string, TagId> = {
  'приватность': 'privacy', 'приватність': 'privacy', 'ghost': 'privacy',
  'чаты': 'chat', 'чати': 'chat', 'chats': 'chat', 'messages': 'chat', 'folders': 'chat', 'папки': 'chat', 'notifications': 'chat', 'уведомления': 'chat', 'сповіщення': 'chat',
  'медиа': 'media', 'медіа': 'media', 'music': 'media', 'video': 'media', 'audio': 'media',
  'внешний_вид': 'ui', 'оформление': 'ui', 'оформлення': 'ui', 'themes': 'ui', 'theme': 'ui', 'design': 'ui', 'look': 'ui', 'animations': 'ui', 'анимации': 'ui', 'анімації': 'ui',
  'звонки': 'calls', 'дзвінки': 'calls', 'call': 'calls',
  'translate': 'ai', 'translation': 'ai', 'translator': 'ai', 'перевод': 'ai', 'переклад': 'ai', 'ии': 'ai', 'ші': 'ai', 'llm': 'ai', 'gpt': 'ai',
  'инструменты': 'tools', 'інструменти': 'tools', 'utilities': 'tools', 'utils': 'tools', 'tool': 'tools', 'search': 'tools', 'поиск': 'tools', 'пошук': 'tools', 'automation': 'tools', 'автоматизация': 'tools',
  'интеграции': 'integrations', 'інтеграції': 'integrations', 'integration': 'integrations', 'maps': 'integrations',
  'развлечения': 'fun', 'розваги': 'fun', 'games': 'fun', 'game': 'fun',
  'разработка': 'dev', 'розробка': 'dev', 'developer': 'dev', 'developers': 'dev', 'sdk': 'dev',
}

/** the tag a hashtag or a word stands for, or null */
export function tagOf(word: string): TagId | null {
  const key = word.replace(/^#/, '').toLowerCase()
  const exact = TAGS.find(tag => tag.id === key)
  return exact ? exact.id : (ALIASES[key] ?? null)
}
