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
  filter_all: {
    uk: 'Усі',
    ru: 'Все',
    en: 'All',
  },
  filter_installed: {
    uk: 'Встановлені',
    ru: 'Установленные',
    en: 'Installed',
  },
  filter_updates: {
    uk: 'Оновлення',
    ru: 'Обновления',
    en: 'Updates',
  },
  search_title: {
    uk: 'Пошук',
    ru: 'Поиск',
    en: 'Search',
  },
  search_hint: {
    uk: 'Назва, автор або опис',
    ru: 'Название, автор или описание',
    en: 'Name, author or description',
  },
  search_prompt_title: {
    uk: 'Пошук плагінів',
    ru: 'Поиск плагинов',
    en: 'Search plugins',
  },
  filter_title: {
    uk: 'Показувати',
    ru: 'Показывать',
    en: 'Show',
  },
  loading_catalog: {
    uk: 'Завантаження плагінів…',
    ru: 'Загрузка плагинов…',
    en: 'Loading plugins…',
  },
  catalog_fail: {
    uk: 'Не вдалося завантажити каталог: {0}',
    ru: 'Не удалось загрузить каталог: {0}',
    en: 'Could not load the catalog: {0}',
  },
  unknown_error: {
    uk: 'невідома помилка',
    ru: 'неизвестная ошибка',
    en: 'unknown error',
  },
  try_again: {
    uk: 'Спробувати знову',
    ru: 'Попробовать снова',
    en: 'Try again',
  },
  refresh_catalog: {
    uk: 'Оновити каталог',
    ru: 'Обновить каталог',
    en: 'Refresh catalog',
  },
  sec_updates: {
    uk: 'Доступні оновлення',
    ru: 'Доступны обновления',
    en: 'Updates available',
  },
  sec_installed: {
    uk: 'Встановлені',
    ru: 'Установленные',
    en: 'Installed',
  },
  sec_available: {
    uk: 'Доступні',
    ru: 'Доступные',
    en: 'Available',
  },
  empty_search: {
    uk: 'Нічого не знайдено за запитом',
    ru: 'Ничего не найдено по запросу',
    en: 'Nothing matches the search',
  },
  empty_list: {
    uk: 'Тут поки нічого немає',
    ru: 'Здесь пока ничего нет',
    en: 'Nothing here yet',
  },
  status_installed: {
    uk: 'Встановлено',
    ru: 'Установлено',
    en: 'Installed',
  },
  status_latest: {
    uk: 'Остання',
    ru: 'Последняя',
    en: 'Latest',
  },
  about: {
    uk: 'Про плагін',
    ru: 'О плагине',
    en: 'About',
  },
  no_desc: {
    uk: 'Опис відсутній.',
    ru: 'Описание отсутствует.',
    en: 'No description provided.',
  },
  created_by: {
    uk: 'Автор: {0}',
    ru: 'Автор: {0}',
    en: 'Created by {0}',
  },
  installation: {
    uk: 'Встановлення',
    ru: 'Установка',
    en: 'Installation',
  },
  btn_install: {
    uk: 'Встановити v{0}',
    ru: 'Установить v{0}',
    en: 'Install v{0}',
  },
  btn_update: {
    uk: 'Оновити до v{0}',
    ru: 'Обновить до v{0}',
    en: 'Update to v{0}',
  },
  btn_reinstall: {
    uk: 'Перевстановити',
    ru: 'Переустановить',
    en: 'Reinstall',
  },
  btn_downgrade: {
    uk: 'Понизити версію',
    ru: 'Понизить версию',
    en: 'Downgrade',
  },
  needs_deps: {
    uk: 'Потрібно: {0}',
    ru: 'Требуется: {0}',
    en: 'Needs {0}',
  },
  installed_ver: {
    uk: 'Встановлено: v{0}',
    ru: 'Установлено: v{0}',
    en: 'Installed: v{0}',
  },
  btn_remove: {
    uk: 'Видалити плагін',
    ru: 'Удалить плагин',
    en: 'Remove plugin',
  },
  installed_ver_sub: {
    uk: 'Встановлена версія: v{0}',
    ru: 'Установленная версия: v{0}',
    en: 'Installed version: v{0}',
  },
  remove_title: {
    uk: 'Видалити {0}?',
    ru: 'Удалить {0}?',
    en: 'Remove {0}?',
  },
  remove_msg: {
    uk: 'Плагін та збережені ним дані буде видалено з цього пристрою.',
    ru: 'Плагин и его сохранённые данные будут удалены с этого устройства.',
    en: 'The plugin and its stored data will be removed from this device.',
  },
  remove_confirm: {
    uk: 'Видалити',
    ru: 'Удалить',
    en: 'Remove',
  },
  cancel: {
    uk: 'Скасувати',
    ru: 'Отмена',
    en: 'Cancel',
  },
  remove_unavail_title: {
    uk: 'Видалення недоступне',
    ru: 'Удаление недоступно',
    en: 'Removal unavailable',
  },
  remove_unavail_msg: {
    uk: 'Ця збірка додатку ще не підтримує видалення через маркетплейс. Видаліть плагін через Налаштування → Плагіни.',
    ru: 'Эта сборка приложения ещё не поддерживает удаление через маркетплейс. Удалите плагин через Настройки → Плагины.',
    en: 'This app build does not expose plugin removal to the marketplace yet. Remove it from Settings → Plugins.',
  },
  ok: {
    uk: 'OK',
    ru: 'OK',
    en: 'OK',
  },
  history: {
    uk: 'Історія версій',
    ru: 'История версий',
    en: 'Version history',
  },
  confirm_install_ver: {
    uk: 'Встановити цю версію?',
    ru: 'Установить эту версию?',
    en: 'Install this version?',
  },
  published_versions: {
    uk: '{0} опублікованих версій',
    ru: '{0} опубликованных версий',
    en: '{0} published versions',
  },
  install_file_title: {
    uk: 'Встановлення з файлу',
    ru: 'Установка из файла',
    en: 'Install from file',
  },
  install_file_msg: {
    uk: 'Посилання на завантаження скопійовано. Збережіть файл, потім відкрийте Налаштування → Плагіни → Завантажити з файлу та оберіть його.',
    ru: 'Ссылка на скачивание скопирована. Сохраните файл, затем откройте Настройки → Плагины → Загрузить из файла и выберите его.',
    en: 'The download link is copied. Save the file, then open Settings → Plugins → Load from file and pick it.',
  },
  open_link: {
    uk: 'Відкрити посилання',
    ru: 'Открыть ссылку',
    en: 'Open link',
  },
  close: {
    uk: 'Закрити',
    ru: 'Закрыть',
    en: 'Close',
  },
  footer_info: {
    uk: 'entinyGram SDK {0}, вбудовування налаштувань {1}{2}. Плагіни надходять з репозиторію GitHub entinyGram; кожне встановлення запитує підтвердження',
    ru: 'entinyGram SDK {0}, встраивание настроек {1}{2}. Плагины поступают из репозитория GitHub entinyGram; каждая установка запрашивает подтверждение',
    en: 'entinyGram SDK {0}, settings embedding {1}{2}. Plugins come from the entinyGram GitHub repository; every install asks for confirmation',
  },
  standalone_mode: {
    uk: ', автономний режим (встановлення через файл)',
    ru: ', автономный режим (установка через файл)',
    en: ', standalone mode (installing goes through a file)',
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

