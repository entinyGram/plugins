export type Lang = 'uk' | 'en' | 'ru' | 'fa'

export function detectAppLang(): Lang {
  try {
    const LocaleController = inu.jvm.cls('org.telegram.messenger.LocaleController')
    const short = String(LocaleController.callStatic('getInstance').call('getCurrentLocaleInfo').getField('shortName')).toLowerCase()
    if (short.startsWith('uk')) return 'uk'
    if (short.startsWith('ru')) return 'ru'
    if (short.startsWith('en')) return 'en'
    if (short.startsWith('fa')) return 'fa'
  } catch {}
  try {
    const JLocale = inu.jvm.cls('java.util.Locale')
    const lang = String(JLocale.callStatic('getDefault').call('getLanguage')).toLowerCase()
    if (lang.startsWith('uk')) return 'uk'
    if (lang.startsWith('ru')) return 'ru'
    if (lang.startsWith('en')) return 'en'
    if (lang.startsWith('fa')) return 'fa'
  } catch {}
  return 'uk'
}

export function currentLang(): Lang {
  const chosen = localStorage.getItem('docviewer_lang')
  if (chosen === 'uk' || chosen === 'en' || chosen === 'ru' || chosen === 'fa') {
    return chosen
  }
  return detectAppLang()
}

const STRINGS = {
  err_unpack_limit: {
    uk: 'Файл перевищує ліміт безпечного читання',
    en: 'File exceeds the safe reading limit',
    ru: 'Файл превышает лимит безопасного чтения',
    fa: 'اندازه فایل از حد مجاز خواندن ایمن فراتر رفته است',
  },
  archive_open: {
    uk: 'Відкрити файл з архіву',
    en: 'Open archive file',
    ru: 'Открыть файл из архива',
    fa: 'باز کردن فایل از آرشیو',
  },
  archive_unsupported: {
    uk: 'Цей формат не підтримується для перегляду',
    en: 'This format is not supported for viewing',
    ru: 'Этот формат не поддерживается для просмотра',
    fa: 'این فرمت برای پیش‌نمایش پشتیبانی نمی‌شود',
  },
  // Settings
  settings_title: {
    uk: 'Doc Viewer',
    en: 'Doc Viewer',
    ru: 'Doc Viewer',
    fa: 'Doc Viewer',
  },
  header_language: {
    uk: 'Мова',
    en: 'Language',
    ru: 'Язык',
    fa: 'زبان',
  },
  lang_auto: {
    uk: 'Авто (мова програми)',
    en: 'Auto (app language)',
    ru: 'Авто (язык приложения)',
    fa: 'خودکار (زبان برنامه)',
  },
  header_formats: {
    uk: 'Формати',
    en: 'Formats',
    ru: 'Форматы',
    fa: 'فرمت‌ها',
  },
  setting_pdf: {
    uk: 'PDF',
    en: 'PDF',
    ru: 'PDF',
    fa: 'PDF',
  },
  setting_docs: {
    uk: 'DOCX, XLSX, PPTX, ODF, RTF, листи EML',
    en: 'DOCX, XLSX, PPTX, ODF, RTF, EML emails',
    ru: 'DOCX, XLSX, PPTX, ODF, RTF, письма EML',
    fa: 'DOCX، XLSX، PPTX، ODF، RTF و ایمیل‌های EML',
  },
  setting_books: {
    uk: 'Книги EPUB та FB2',
    en: 'EPUB and FB2 books',
    ru: 'Книги EPUB и FB2',
    fa: 'کتاب‌های EPUB و FB2',
  },
  setting_text: {
    uk: 'Текст, код, JSON, CSV, Jupyter',
    en: 'Text, code, JSON, CSV, Jupyter',
    ru: 'Текст, код, JSON, CSV, Jupyter',
    fa: 'متن، کد، JSON، CSV و Jupyter',
  },
  setting_web: {
    uk: 'Markdown, HTML та SVG',
    en: 'Markdown, HTML and SVG',
    ru: 'Markdown, HTML и SVG',
    fa: 'Markdown، HTML و SVG',
  },
  setting_image: {
    uk: 'Зображення, надіслані файлом',
    en: 'Images sent as files',
    ru: 'Картинки, отправленные файлом',
    fa: 'تصاویر ارسال‌شده به صورت فایل',
  },
  setting_archive: {
    uk: 'Вміст архівів (ZIP, TAR)',
    en: 'Archive contents (ZIP, TAR)',
    ru: 'Содержимое архивов (ZIP, TAR)',
    fa: 'محتویات آرشیو (ZIP، TAR)',
  },
  header_viewing: {
    uk: 'Перегляд',
    en: 'Viewing',
    ru: 'Просмотр',
    fa: 'مشاهده',
  },
  setting_invert: {
    uk: 'Нічний режим для PDF та зображень',
    en: 'Night mode for PDF and images',
    ru: 'Ночной режим для PDF и картинок',
    fa: 'حالت شب برای PDF و تصاویر',
  },
  setting_fitwidth: {
    uk: 'Вписувати сторінку по ширині',
    en: 'Fit page to width',
    ru: 'Вписывать страницу по ширине',
    fa: 'تنظیم عرض صفحه با نمایشگر',
  },
  setting_remember: {
    uk: 'Запам\'ятовувати останню сторінку',
    en: 'Remember last page',
    ru: 'Запоминать последнюю страницу',
    fa: 'به‌خاطر سپردن آخرین صفحه',
  },
  setting_volume: {
    uk: 'Гортати кнопками гучності',
    en: 'Turn pages with volume buttons',
    ru: 'Листать кнопками громкости',
    fa: 'ورق زدن با دکمه‌های صدا',
  },
  setting_keepon: {
    uk: 'Не вимикати екран під час перегляду',
    en: 'Keep screen on while viewing',
    ru: 'Не гасить экран при просмотре',
    fa: 'روشن',
    fa: 'روشن نگه داشتن صفحه هنگام مطالعه',
  },
  setting_wrap: {
    uk: 'Переносити довгі рядки в тексті',
    en: 'Wrap long lines in text',
    ru: 'Переносить длинные строки в тексте',
    fa: 'شکستن خطوط طولانی در متن',
  },
  setting_prettyjson: {
    uk: 'Форматувати JSON з відступами',
    en: 'Format JSON with indentation',
    ru: 'Форматировать JSON с отступами',
    fa: 'روشن',
    fa: 'فرمت‌بندی مرتب JSON با فاصله‌گذاری',
  },
  setting_csv_table: {
    uk: 'Показувати CSV таблицею',
    en: 'Display CSV as a table',
    ru: 'Показывать CSV таблицей',
    fa: 'نمایش CSV به صورت جدول',
  },
  separator_desc: {
    uk: 'Файли відкриваються всередині клієнта при натисканні в чаті',
    en: 'Files open inside the client when tapped in chat',
    ru: 'Файлы открываются внутри клиента при нажатии в чате',
    fa: 'فایل‌ها با ضربه زدن در چت درون کلاینت باز می‌شوند',
  },

  // Viewer
  loading: {
    uk: 'Завантаження…',
    en: 'Loading…',
    ru: 'Загрузка…',
    fa: 'در حال بارگذاری…',
  },
  load_fail: {
    uk: 'Не вдалося відобразити файл',
    en: 'Failed to display file',
    ru: 'Не удалось показать файл',
    fa: 'نمایش فایل ناموفق بود',
  },
  cancel: {
    uk: 'Скасувати',
    en: 'Cancel',
    ru: 'Отмена',
    fa: 'لغو',
  },
  ok: {
    uk: 'OK',
    en: 'OK',
    ru: 'OK',
    fa: 'تأیید',
  },
  search: {
    uk: 'Пошук',
    en: 'Search',
    ru: 'Поиск',
    fa: 'جستجو',
  },
  find: {
    uk: 'Знайти',
    en: 'Find',
    ru: 'Найти',
    fa: 'یافتن',
  },
  not_found: {
    uk: 'Нічого не знайдено',
    en: 'Nothing found',
    ru: 'Ничего не найдено',
    fa: 'موردی یافت نشد',
  },
  jump_to_page: {
    uk: 'Перехід до сторінки',
    en: 'Jump to page',
    ru: 'Переход к странице',
    fa: 'رفتن به صفحه',
  },
  jump: {
    uk: 'Перейти',
    en: 'Jump',
    ru: 'Перейти',
    fa: 'برو',
  },
  copied: {
    uk: 'Текст скопійовано',
    en: 'Text copied',
    ru: 'Текст скопирован',
    fa: 'متن کپی شد',
  },
  copy_fail: {
    uk: 'Не вдалося скопіювати',
    en: 'Failed to copy',
    ru: 'Не удалось скопировать',
    fa: 'کپی ناموفق بود',
  },
  share_file: {
    uk: 'Поділитися файлом',
    en: 'Share file',
    ru: 'Поделиться файлом',
    fa: 'اشتراک‌گذاری فایل',
  },
  share_fail: {
    uk: 'Не вдалося поділитися',
    en: 'Failed to share',
    ru: 'Не удалось поделиться',
    fa: 'اشتراک‌گذاری ناموفق بود',
  },
  open_ext: {
    uk: 'Відкрити в іншій програмі',
    en: 'Open in another app',
    ru: 'Открыть в приложении',
    fa: 'باز کردن در برنامه‌ای دیگر',
  },
  open_fail: {
    uk: 'Не вдалося відкрити',
    en: 'Failed to open',
    ru: 'Не удалось открыть',
    fa: 'باز کردن فایل ناموفق بود',
  },
  about_file: {
    uk: 'Про файл',
    en: 'File info',
    ru: 'О файле',
    fa: 'اطلاعات فایل',
  },
  menu_title: {
    uk: 'Налаштування',
    en: 'Settings',
    ru: 'Настройки',
    fa: 'تنظیمات',
  },
  pages_short: {
    uk: 'стор.',
    en: 'pages',
    ru: 'стр.',
    fa: 'صفحه',
  },

  // Menu entries
  menu_search: {
    uk: 'Пошук…',
    en: 'Search…',
    ru: 'Поиск…',
    fa: 'جستجو…',
    fa: 'جستجو',
  },
  menu_search_reset: {
    uk: 'Скинути пошук',
    en: 'Reset search',
    ru: 'Сбросить поиск',
    fa: 'پاک کردن جستجو',
  },
  menu_jump: {
    uk: 'Перейти до сторінки…',
    en: 'Jump to page…',
    ru: 'Перейти к странице…',
    fa: 'رفتن به صفحه…',
    fa: 'برو',
  },
  menu_start: {
    uk: 'На початок',
    en: 'To start',
    ru: 'В начало',
    fa: 'به ابتدا',
  },
  menu_end: {
    uk: 'В кінець',
    en: 'To end',
    ru: 'В конец',
    fa: 'به انتها',
  },
  menu_night: {
    uk: 'Нічний режим',
    en: 'Night mode',
    ru: 'Ночной режим',
    fa: 'حالت شب',
  },
  menu_rotate: {
    uk: 'Поворот на 90°',
    en: 'Rotate 90°',
    ru: 'Поворот на 90°',
    fa: 'چرخش ۹۰ درجه',
  },
  menu_scale: {
    uk: 'Масштаб',
    en: 'Scale',
    ru: 'Масштаб',
    fa: 'مقیاس',
  },
  scale_screen: {
    uk: 'по екрану',
    en: 'to screen',
    ru: 'по экрану',
    fa: 'متناسب با صفحه',
  },
  scale_width: {
    uk: 'по ширині екрана',
    en: 'to screen width',
    ru: 'по ширине экрана',
    fa: 'متناسب با عرض صفحه',
  },
  menu_font: {
    uk: 'Шрифт',
    en: 'Font',
    ru: 'Шрифт',
    fa: 'قلم',
  },
  menu_font_larger: {
    uk: 'Розмір тексту: більший',
    en: 'Text size: larger',
    ru: 'Размер текста: крупнее',
    fa: 'اندازه متن: بزرگ‌تر',
  },
  menu_font_smaller: {
    uk: 'Розмір тексту: менший',
    en: 'Text size: smaller',
    ru: 'Размер текста: мельче',
    fa: 'اندازه متن: کوچک‌تر',
  },
  menu_wrap: {
    uk: 'Перенесення рядків',
    en: 'Line wrapping',
    ru: 'Перенос строк',
    fa: 'شکستن خطوط',
  },
  menu_theme: {
    uk: 'Тема',
    en: 'Theme',
    ru: 'Тема',
    fa: 'پوسته',
  },
  menu_encoding: {
    uk: 'Кодування',
    en: 'Encoding',
    ru: 'Кодировка',
    fa: 'کدگذاری',
  },
  menu_copy_page: {
    uk: 'Скопіювати сторінку',
    en: 'Copy page',
    ru: 'Скопировать страницу',
    fa: 'کپی این صفحه',
  },
  menu_copy_all: {
    uk: 'Скопіювати весь текст',
    en: 'Copy entire text',
    ru: 'Скопировать весь текст',
    fa: 'کپی کل متن',
  },
  menu_zoom_in: {
    uk: 'Збільшити масштаб',
    en: 'Zoom in',
    ru: 'Увеличить масштаб',
    fa: 'بزرگ‌نمایی',
  },
  menu_zoom_out: {
    uk: 'Зменшити масштаб',
    en: 'Zoom out',
    ru: 'Уменьшить масштаб',
    fa: 'کوچک‌نمایی',
  },
  on: {
    uk: 'увімк.',
    en: 'on',
    ru: 'вкл',
    fa: 'روشن',
  },
  off: {
    uk: 'вимк.',
    en: 'off',
    ru: 'выкл',
    fa: 'خاموش',
  },

  // Info fields
  info_name: {
    uk: 'Ім\'я',
    en: 'Name',
    ru: 'Имя',
    fa: 'نام',
  },
  info_size: {
    uk: 'Розмір',
    en: 'Size',
    ru: 'Размер',
    fa: 'اندازه',
  },
  info_format: {
    uk: 'Формат',
    en: 'Format',
    ru: 'Формат',
    fa: 'فرمت',
  },
  info_pages: {
    uk: 'Сторінок',
    en: 'Pages',
    ru: 'Страниц',
    fa: 'صفحات',
  },
  info_resolution: {
    uk: 'Роздільна здатність',
    en: 'Resolution',
    ru: 'Разрешение',
    fa: 'وضوح',
    fa: 'روشن',
  },
  info_encoding: {
    uk: 'Кодування',
    en: 'Encoding',
    ru: 'Кодировка',
    fa: 'کدگذاری',
  },
  info_mime: {
    uk: 'Тип',
    en: 'Type',
    ru: 'Тип',
    fa: 'نوع',
  },
  info_path: {
    uk: 'Шлях',
    en: 'Path',
    ru: 'Путь',
    fa: 'مسیر',
  },

  // Units & Themes
  units: {
    uk: ['Б', 'КБ', 'МБ', 'ГБ'],
    en: ['B', 'KB', 'MB', 'GB'],
    ru: ['Б', 'КБ', 'МБ', 'ГБ'],
    fa: ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'],
  },
  theme_dark: {
    uk: 'темна',
    en: 'dark',
    ru: 'тёмная',
    fa: 'تاریک',
  },
  theme_light: {
    uk: 'світла',
    en: 'light',
    ru: 'светлая',
    fa: 'روشن',
  },
  theme_sepia: {
    uk: 'сепія',
    en: 'sepia',
    ru: 'сепия',
    fa: 'سپیا',
  },
  font_default: {
    uk: 'звичайний',
    en: 'default',
    ru: 'обычный',
    fa: 'پیش‌فرض',
  },
  font_serif: {
    uk: 'із засічками',
    en: 'serif',
    ru: 'с засечками',
    fa: 'سریف (با دندانه)',
  },
  font_mono: {
    uk: 'моноширинний',
    en: 'monospace',
    ru: 'моноширинный',
    fa: 'تک‌فاصله (Monospace)',
  },
  enc_auto: {
    uk: 'Авто',
    en: 'Auto',
    ru: 'Авто',
    fa: 'خودکار',
  },

  // Parser text
  empty_doc: {
    uk: '(документ порожній)',
    en: '(document is empty)',
    ru: '(документ пуст)',
    fa: '(سند خالی است)',
  },
  cut_text: {
    uk: '… файл обрізано (показано перші {0} МБ)',
    en: '… file truncated (showing first {0} MB)',
    ru: '… файл обрезан (показаны первые {0} МБ)',
    fa: '… فایل کوتاه شد (نمایش {0} مگابایت اول)',
  },
  archive_summary: {
    uk: 'Записів: {0} (папок: {1}), у розпакованому вигляді: {2}',
    en: 'Entries: {0} (folders: {1}), uncompressed size: {2}',
    ru: 'Записей: {0} (папок: {1}), в распакованном виде: {2}',
    fa: 'موارد: {0} (پوشه‌ها: {1})، اندازه غیرفشرده: {2}',
  },
  archive_password: {
    uk: '[пароль] ',
    en: '[password] ',
    ru: '[пароль] ',
    fa: '[رمز عبور] ',
  },
  archive_more: {
    uk: '… показано перші {0} записів',
    en: '… showing first {0} entries',
    ru: '… показаны первые {0} записей',
    fa: '… نمایش {0} مورد اول',
  },
  format_image: {
    uk: 'Зображення',
    en: 'Image',
    ru: 'Изображение',
    fa: 'تصویر',
  },
  format_text: {
    uk: 'Текст',
    en: 'Text',
    ru: 'Текст',
    fa: 'متن',
  },
  format_eml: {
    uk: 'Лист',
    en: 'Email',
    ru: 'Письмо',
    fa: 'ایمیل',
  },
  format_archive: {
    uk: 'Архів',
    en: 'Archive',
    ru: 'Архив',
    fa: 'آرشیو',
  },
  format_file: {
    uk: 'Файл',
    en: 'File',
    ru: 'Файл',
    fa: 'فایل',
  },
  email_from: {
    uk: 'Від',
    en: 'From',
    ru: 'От',
    fa: 'از',
  },
  email_to: {
    uk: 'Кому',
    en: 'To',
    ru: 'Кому',
    fa: 'به',
  },
  email_cc: {
    uk: 'Копія',
    en: 'Cc',
    ru: 'Копия',
    fa: 'رونوشت',
  },
  email_subject: {
    uk: 'Тема',
    en: 'Subject',
    ru: 'Тема',
    fa: 'موضوع',
  },
  email_date: {
    uk: 'Дата',
    en: 'Date',
    ru: 'Дата',
    fa: 'تاریخ',
  },
  sheet_default: {
    uk: 'Аркуш 1',
    en: 'Sheet 1',
    ru: 'Лист 1',
    fa: 'برگه ۱',
  },
  sheet_empty: {
    uk: '(порожній аркуш)',
    en: '(empty sheet)',
    ru: '(пустой лист)',
    fa: '(برگه خالی)',
  },
  slide_n: {
    uk: 'Слайд {0}',
    en: 'Slide {0}',
    ru: 'Слайд {0}',
    fa: 'اسلاید {0}',
  },
  no_text: {
    uk: '(немає тексту)',
    en: '(no text)',
    ru: '(нет текста)',
    fa: '(بدون متن)',
  },
  empty_presentation: {
    uk: '(презентація порожня)',
    en: '(empty presentation)',
    ru: '(пустая презентация)',
    fa: '(ارائه خالی است)',
    fa: 'روشن',
  },
  csv_cut: {
    uk: '… показано перші {0} рядків',
    en: '… showing first {0} rows',
    ru: '… показаны первые {0} строк',
    fa: '… نمایش {0} سطر اول',
  },
  ipynb_image: {
    uk: 'зображення',
    en: 'image',
    ru: 'изображение',
    fa: 'تصویر',
  },
  err_empty_pdf: {
    uk: 'Порожній PDF',
    en: 'Empty PDF',
    ru: 'Пустой PDF',
    fa: 'فایل PDF خالی است',
  },
  err_decode_image: {
    uk: 'Не вдалося декодувати зображення',
    en: 'Failed to decode image',
    ru: 'Не удалось декодировать изображение',
    fa: 'رمزگشایی تصویر ناموفق بود',
  },
  err_zip_entry: {
    uk: 'Не знайдено файл усередині архіву: {0}',
    en: 'File not found inside archive: {0}',
    ru: 'Не найден файл внутри архива: {0}',
    fa: 'فایل درون آرشیو یافت نشد: {0}',
  },
  err_epub_manifest: {
    uk: 'Не знайдено файл опису книги',
    en: 'Book description file not found',
    ru: 'Не найден файл описания книги',
    fa: 'فایل مشخصات کتاب یافت نشد',
  },
  err_no_text_in_book: {
    uk: 'У книзі немає тексту',
    en: 'No text found in book',
    ru: 'В книге нет текста',
    fa: 'متنی در کتاب یافت نشد',
    fa: 'تأیید',
  },
  err_unknown_format: {
    uk: 'Невідомий формат документа: {0}',
    en: 'Unknown document format: {0}',
    ru: 'Неизвестный формат документа: {0}',
    fa: 'فرمت سند ناشناخته است: {0}',
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
