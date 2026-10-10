export type Lang = 'uk' | 'en' | 'ru'

export function detectAppLang(): Lang {
  try {
    const LocaleController = inu.jvm.cls('org.telegram.messenger.LocaleController')
    const short = String(LocaleController.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName')).toLowerCase()
    if (short.startsWith('uk')) return 'uk'
    if (short.startsWith('ru')) return 'ru'
    if (short.startsWith('en')) return 'en'
  } catch {}
  try {
    const JLocale = inu.jvm.cls('java.util.Locale')
    const lang = String(JLocale.callStatic('getDefault').call('getLanguage')).toLowerCase()
    if (lang.startsWith('uk')) return 'uk'
    if (lang.startsWith('ru')) return 'ru'
    if (lang.startsWith('en')) return 'en'
  } catch {}
  return 'uk'
}

export function currentLang(): Lang {
  const chosen = localStorage.getItem('docviewer_lang')
  if (chosen === 'uk' || chosen === 'en' || chosen === 'ru') {
    return chosen
  }
  return detectAppLang()
}

const STRINGS = {
  // Settings
  settings_title: {
    uk: 'Doc Viewer',
    en: 'Doc Viewer',
    ru: 'Doc Viewer',
  },
  header_language: {
    uk: 'Мова',
    en: 'Language',
    ru: 'Язык',
  },
  lang_auto: {
    uk: 'Авто (мова програми)',
    en: 'Auto (app language)',
    ru: 'Авто (язык приложения)',
  },
  header_formats: {
    uk: 'Формати',
    en: 'Formats',
    ru: 'Форматы',
  },
  setting_pdf: {
    uk: 'PDF',
    en: 'PDF',
    ru: 'PDF',
  },
  setting_docs: {
    uk: 'DOCX, XLSX, PPTX, ODF, RTF, листи EML',
    en: 'DOCX, XLSX, PPTX, ODF, RTF, EML emails',
    ru: 'DOCX, XLSX, PPTX, ODF, RTF, письма EML',
  },
  setting_books: {
    uk: 'Книги EPUB та FB2',
    en: 'EPUB and FB2 books',
    ru: 'Книги EPUB и FB2',
  },
  setting_text: {
    uk: 'Текст, код, JSON, CSV, Jupyter',
    en: 'Text, code, JSON, CSV, Jupyter',
    ru: 'Текст, код, JSON, CSV, Jupyter',
  },
  setting_web: {
    uk: 'Markdown, HTML та SVG',
    en: 'Markdown, HTML and SVG',
    ru: 'Markdown, HTML и SVG',
  },
  setting_image: {
    uk: 'Зображення, надіслані файлом',
    en: 'Images sent as files',
    ru: 'Картинки, отправленные файлом',
  },
  setting_archive: {
    uk: 'Вміст архівів (ZIP, TAR)',
    en: 'Archive contents (ZIP, TAR)',
    ru: 'Содержимое архивов (ZIP, TAR)',
  },
  header_viewing: {
    uk: 'Перегляд',
    en: 'Viewing',
    ru: 'Просмотр',
  },
  setting_invert: {
    uk: 'Нічний режим для PDF та зображень',
    en: 'Night mode for PDF and images',
    ru: 'Ночной режим для PDF и картинок',
  },
  setting_fitwidth: {
    uk: 'Вписувати сторінку по ширині',
    en: 'Fit page to width',
    ru: 'Вписывать страницу по ширине',
  },
  setting_remember: {
    uk: 'Запам\'ятовувати останню сторінку',
    en: 'Remember last page',
    ru: 'Запоминать последнюю страницу',
  },
  setting_volume: {
    uk: 'Гортати кнопками гучності',
    en: 'Turn pages with volume buttons',
    ru: 'Листать кнопками громкости',
  },
  setting_keepon: {
    uk: 'Не вимикати екран під час перегляду',
    en: 'Keep screen on while viewing',
    ru: 'Не гасить экран при просмотре',
  },
  setting_wrap: {
    uk: 'Переносити довгі рядки в тексті',
    en: 'Wrap long lines in text',
    ru: 'Переносить длинные строки в тексте',
  },
  setting_prettyjson: {
    uk: 'Форматувати JSON з відступами',
    en: 'Format JSON with indentation',
    ru: 'Форматировать JSON с отступами',
  },
  setting_csv_table: {
    uk: 'Показувати CSV таблицею',
    en: 'Display CSV as a table',
    ru: 'Показывать CSV таблицей',
  },
  separator_desc: {
    uk: 'Файли відкриваються всередині клієнта при натисканні в чаті',
    en: 'Files open inside the client when tapped in chat',
    ru: 'Файлы открываются внутри клиента при нажатии в чате',
  },

  // Viewer
  loading: {
    uk: 'Завантаження…',
    en: 'Loading…',
    ru: 'Загрузка…',
  },
  load_fail: {
    uk: 'Не вдалося відобразити файл',
    en: 'Failed to display file',
    ru: 'Не удалось показать файл',
  },
  cancel: {
    uk: 'Скасувати',
    en: 'Cancel',
    ru: 'Отмена',
  },
  ok: {
    uk: 'OK',
    en: 'OK',
    ru: 'OK',
  },
  search: {
    uk: 'Пошук',
    en: 'Search',
    ru: 'Поиск',
  },
  find: {
    uk: 'Знайти',
    en: 'Find',
    ru: 'Найти',
  },
  not_found: {
    uk: 'Нічого не знайдено',
    en: 'Nothing found',
    ru: 'Ничего не найдено',
  },
  jump_to_page: {
    uk: 'Перехід до сторінки',
    en: 'Jump to page',
    ru: 'Переход к странице',
  },
  jump: {
    uk: 'Перейти',
    en: 'Jump',
    ru: 'Перейти',
  },
  copied: {
    uk: 'Текст скопійовано',
    en: 'Text copied',
    ru: 'Текст скопирован',
  },
  copy_fail: {
    uk: 'Не вдалося скопіювати',
    en: 'Failed to copy',
    ru: 'Не удалось скопировать',
  },
  share_file: {
    uk: 'Поділитися файлом',
    en: 'Share file',
    ru: 'Поделиться файлом',
  },
  share_fail: {
    uk: 'Не вдалося поділитися',
    en: 'Failed to share',
    ru: 'Не удалось поделиться',
  },
  open_ext: {
    uk: 'Відкрити в іншій програмі',
    en: 'Open in another app',
    ru: 'Открыть в приложении',
  },
  open_fail: {
    uk: 'Не вдалося відкрити',
    en: 'Failed to open',
    ru: 'Не удалось открыть',
  },
  about_file: {
    uk: 'Про файл',
    en: 'File info',
    ru: 'О файле',
  },
  menu_title: {
    uk: 'Налаштування',
    en: 'Settings',
    ru: 'Настройки',
  },
  pages_short: {
    uk: 'стор.',
    en: 'pages',
    ru: 'стр.',
  },

  // Menu entries
  menu_search: {
    uk: 'Пошук…',
    en: 'Search…',
    ru: 'Поиск…',
  },
  menu_search_reset: {
    uk: 'Скинути пошук',
    en: 'Reset search',
    ru: 'Сбросить поиск',
  },
  menu_jump: {
    uk: 'Перейти до сторінки…',
    en: 'Jump to page…',
    ru: 'Перейти к странице…',
  },
  menu_start: {
    uk: 'На початок',
    en: 'To start',
    ru: 'В начало',
  },
  menu_end: {
    uk: 'В кінець',
    en: 'To end',
    ru: 'В конец',
  },
  menu_night: {
    uk: 'Нічний режим',
    en: 'Night mode',
    ru: 'Ночной режим',
  },
  menu_rotate: {
    uk: 'Поворот на 90°',
    en: 'Rotate 90°',
    ru: 'Поворот на 90°',
  },
  menu_scale: {
    uk: 'Масштаб',
    en: 'Scale',
    ru: 'Масштаб',
  },
  scale_screen: {
    uk: 'по екрану',
    en: 'to screen',
    ru: 'по экрану',
  },
  scale_width: {
    uk: 'по ширині екрана',
    en: 'to screen width',
    ru: 'по ширине экрана',
  },
  menu_font: {
    uk: 'Шрифт',
    en: 'Font',
    ru: 'Шрифт',
  },
  menu_font_larger: {
    uk: 'Розмір тексту: більший',
    en: 'Text size: larger',
    ru: 'Размер текста: крупнее',
  },
  menu_font_smaller: {
    uk: 'Розмір тексту: менший',
    en: 'Text size: smaller',
    ru: 'Размер текста: мельче',
  },
  menu_wrap: {
    uk: 'Перенесення рядків',
    en: 'Line wrapping',
    ru: 'Перенос строк',
  },
  menu_theme: {
    uk: 'Тема',
    en: 'Theme',
    ru: 'Тема',
  },
  menu_encoding: {
    uk: 'Кодування',
    en: 'Encoding',
    ru: 'Кодировка',
  },
  menu_copy_page: {
    uk: 'Скопіювати сторінку',
    en: 'Copy page',
    ru: 'Скопировать страницу',
  },
  menu_copy_all: {
    uk: 'Скопіювати весь текст',
    en: 'Copy entire text',
    ru: 'Скопировать весь текст',
  },
  menu_zoom_in: {
    uk: 'Збільшити масштаб',
    en: 'Zoom in',
    ru: 'Увеличить масштаб',
  },
  menu_zoom_out: {
    uk: 'Зменшити масштаб',
    en: 'Zoom out',
    ru: 'Уменьшить масштаб',
  },
  on: {
    uk: 'увімк.',
    en: 'on',
    ru: 'вкл',
  },
  off: {
    uk: 'вимк.',
    en: 'off',
    ru: 'выкл',
  },

  // Info fields
  info_name: {
    uk: 'Ім\'я',
    en: 'Name',
    ru: 'Имя',
  },
  info_size: {
    uk: 'Розмір',
    en: 'Size',
    ru: 'Размер',
  },
  info_format: {
    uk: 'Формат',
    en: 'Format',
    ru: 'Формат',
  },
  info_pages: {
    uk: 'Сторінок',
    en: 'Pages',
    ru: 'Страниц',
  },
  info_resolution: {
    uk: 'Роздільна здатність',
    en: 'Resolution',
    ru: 'Разрешение',
  },
  info_encoding: {
    uk: 'Кодування',
    en: 'Encoding',
    ru: 'Кодировка',
  },
  info_mime: {
    uk: 'Тип',
    en: 'Type',
    ru: 'Тип',
  },
  info_path: {
    uk: 'Шлях',
    en: 'Path',
    ru: 'Путь',
  },

  // Units & Themes
  units: {
    uk: ['Б', 'КБ', 'МБ', 'ГБ'],
    en: ['B', 'KB', 'MB', 'GB'],
    ru: ['Б', 'КБ', 'МБ', 'ГБ'],
  },
  theme_dark: {
    uk: 'темна',
    en: 'dark',
    ru: 'тёмная',
  },
  theme_light: {
    uk: 'світла',
    en: 'light',
    ru: 'светлая',
  },
  theme_sepia: {
    uk: 'сепія',
    en: 'sepia',
    ru: 'сепия',
  },
  font_default: {
    uk: 'звичайний',
    en: 'default',
    ru: 'обычный',
  },
  font_serif: {
    uk: 'із засічками',
    en: 'serif',
    ru: 'с засечками',
  },
  font_mono: {
    uk: 'моноширинний',
    en: 'monospace',
    ru: 'моноширинный',
  },
  enc_auto: {
    uk: 'Авто',
    en: 'Auto',
    ru: 'Авто',
  },

  // Parser text
  empty_doc: {
    uk: '(документ порожній)',
    en: '(document is empty)',
    ru: '(документ пуст)',
  },
  cut_text: {
    uk: '… файл обрізано (показано перші {0} МБ)',
    en: '… file truncated (showing first {0} MB)',
    ru: '… файл обрезан (показаны первые {0} МБ)',
  },
  archive_summary: {
    uk: 'Записів: {0} (папок: {1}), у розпакованому вигляді: {2}',
    en: 'Entries: {0} (folders: {1}), uncompressed size: {2}',
    ru: 'Записей: {0} (папок: {1}), в распакованном виде: {2}',
  },
  archive_password: {
    uk: '[пароль] ',
    en: '[password] ',
    ru: '[пароль] ',
  },
  archive_more: {
    uk: '… показано перші {0} записів',
    en: '… showing first {0} entries',
    ru: '… показаны первые {0} записей',
  },
  format_image: {
    uk: 'Зображення',
    en: 'Image',
    ru: 'Изображение',
  },
  format_text: {
    uk: 'Текст',
    en: 'Text',
    ru: 'Текст',
  },
  format_eml: {
    uk: 'Лист',
    en: 'Email',
    ru: 'Письмо',
  },
  format_archive: {
    uk: 'Архів',
    en: 'Archive',
    ru: 'Архив',
  },
  format_file: {
    uk: 'Файл',
    en: 'File',
    ru: 'Файл',
  },
  email_from: {
    uk: 'Від',
    en: 'From',
    ru: 'От',
  },
  email_to: {
    uk: 'Кому',
    en: 'To',
    ru: 'Кому',
  },
  email_cc: {
    uk: 'Копія',
    en: 'Cc',
    ru: 'Копия',
  },
  email_subject: {
    uk: 'Тема',
    en: 'Subject',
    ru: 'Тема',
  },
  email_date: {
    uk: 'Дата',
    en: 'Date',
    ru: 'Дата',
  },
  sheet_default: {
    uk: 'Аркуш 1',
    en: 'Sheet 1',
    ru: 'Лист 1',
  },
  sheet_empty: {
    uk: '(порожній аркуш)',
    en: '(empty sheet)',
    ru: '(пустой лист)',
  },
  slide_n: {
    uk: 'Слайд {0}',
    en: 'Slide {0}',
    ru: 'Слайд {0}',
  },
  no_text: {
    uk: '(немає тексту)',
    en: '(no text)',
    ru: '(нет текста)',
  },
  empty_presentation: {
    uk: '(презентація порожня)',
    en: '(empty presentation)',
    ru: '(пустая презентация)',
  },
  csv_cut: {
    uk: '… показано перші {0} рядків',
    en: '… showing first {0} rows',
    ru: '… показаны первые {0} строк',
  },
  ipynb_image: {
    uk: 'зображення',
    en: 'image',
    ru: 'изображение',
  },
  err_empty_pdf: {
    uk: 'Порожній PDF',
    en: 'Empty PDF',
    ru: 'Пустой PDF',
  },
  err_decode_image: {
    uk: 'Не вдалося декодувати зображення',
    en: 'Failed to decode image',
    ru: 'Не удалось декодировать изображение',
  },
  err_zip_entry: {
    uk: 'Не знайдено файл усередині архіву: {0}',
    en: 'File not found inside archive: {0}',
    ru: 'Не найден файл внутри архива: {0}',
  },
  err_epub_manifest: {
    uk: 'Не знайдено файл опису книги',
    en: 'Book description file not found',
    ru: 'Не найден файл описания книги',
  },
  err_no_text_in_book: {
    uk: 'У книзі немає тексту',
    en: 'No text found in book',
    ru: 'В книге нет текста',
  },
  err_unknown_format: {
    uk: 'Невідомий формат документа: {0}',
    en: 'Unknown document format: {0}',
    ru: 'Неизвестный формат документа: {0}',
  },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey, lang?: Lang): any {
  const l = lang ?? currentLang()
  const entry = STRINGS[key]
  if (!entry) return key
  return (entry as any)[l] ?? (entry as any).uk ?? (entry as any).en
}

export function tf(key: StringKey, ...args: (string | number)[]): string {
  let str = String(t(key))
  for (let i = 0; i < args.length; i++) {
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), String(args[i]))
  }
  return str
}

export function formatLabel(fmt: string, ext?: string): string {
  if (fmt === 'web') {
    const e = (ext ?? '').toLowerCase()
    if (e === 'md' || e === 'markdown' || e === 'mdown') return 'Markdown'
    if (e === 'svg') return 'SVG'
    return 'HTML'
  }
  switch (fmt) {
    case 'image': return t('format_image')
    case 'text': return t('format_text')
    case 'eml': return t('format_eml')
    case 'archive': return t('format_archive')
    case 'pdf': return 'PDF'
    case 'csv': return 'CSV'
    case 'json': return 'JSON'
    case 'ipynb': return 'Jupyter'
    case 'docx': return 'DOCX'
    case 'xlsx': return 'Excel'
    case 'pptx': return 'PowerPoint'
    case 'odf': return 'OpenDocument'
    case 'rtf': return 'RTF'
    case 'epub': return 'EPUB'
    case 'fb2': return 'FB2'
    default: return t('format_file')
  }
}
