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
  refreshing: {
    uk: 'Оновлення…',
    ru: 'Обновление…',
    en: 'Refreshing…',
  },
  refreshing_sub: {
    uk: 'Завантажуємо каталоги всіх джерел',
    ru: 'Загружаем каталоги всех источников',
    en: 'Fetching every source',
  },
  catalog_updated: {
    uk: 'Каталог оновлено',
    ru: 'Каталог обновлён',
    en: 'Catalog updated',
  },
  refresh_fail_title: {
    uk: 'Не вдалося оновити каталог',
    ru: 'Не удалось обновить каталог',
    en: 'Could not refresh the catalog',
  },
  updated_at: {
    uk: 'Оновлено: {0}',
    ru: 'Обновлено: {0}',
    en: 'Updated: {0}',
  },
  never_updated: {
    uk: 'ще не оновлювався',
    ru: 'ещё не обновлялся',
    en: 'not updated yet',
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
  source_official: {
    uk: 'entinyGram',
    ru: 'entinyGram',
    en: 'entinyGram',
  },
  source_user: {
    uk: 'Користувацький репозиторій',
    ru: 'Пользовательский репозиторий',
    en: 'User repository',
  },
  source_official_desc: {
    uk: 'Офіційні плагіни entinyGram',
    ru: 'Официальные плагины entinyGram',
    en: 'Official entinyGram plugins',
  },
  source_user_desc: {
    uk: 'Плагіни з користувацького репозиторію',
    ru: 'Плагины из пользовательского репозитория',
    en: 'Plugins from the user repository',
  },
  source_official_msg: {
    uk: 'Плагін опубліковано в офіційному каталозі entinyGram.',
    ru: 'Плагин опубликован в официальном каталоге entinyGram.',
    en: 'This plugin is published in the official entinyGram catalog.',
  },
  source_user_msg: {
    uk: 'Плагін опубліковано в користувацькому репозиторії спільноти.',
    ru: 'Плагин опубликован в пользовательском репозитории сообщества.',
    en: 'This plugin is published in the community user repository.',
  },
  about_desc: {
    uk: 'Опис',
    ru: 'Описание',
    en: 'Description',
  },
  about_author: {
    uk: 'Автор',
    ru: 'Автор',
    en: 'Author',
  },
  about_source: {
    uk: 'Джерело',
    ru: 'Источник',
    en: 'Source',
  },
  about_id: {
    uk: 'ID плагіна',
    ru: 'ID плагина',
    en: 'Plugin ID',
  },
  about_requires: {
    uk: 'Залежності',
    ru: 'Зависимости',
    en: 'Requires',
  },
  unknown_author: {
    uk: 'Невідомий автор',
    ru: 'Неизвестный автор',
    en: 'Unknown author',
  },
  published_date: {
    uk: 'Опубліковано: {0}',
    ru: 'Опубликовано: {0}',
    en: 'Published {0}',
  },
  id_copied: {
    uk: 'ID плагіна скопійовано',
    ru: 'ID плагина скопирован',
    en: 'Plugin ID copied',
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
    uk: 'entinyGram SDK {0}, вбудовування налаштувань {1}{2}. Плагіни надходять з активних джерел; кожне встановлення запитує підтвердження',
    ru: 'entinyGram SDK {0}, встраивание настроек {1}{2}. Плагины поступают из активных источников; каждая установка запрашивает подтверждение',
    en: 'entinyGram SDK {0}, settings embedding {1}{2}. Plugins come from your active sources; every install asks for confirmation',
  },
  standalone_mode: {
    uk: ', автономний режим (встановлення через файл)',
    ru: ', автономный режим (установка через файл)',
    en: ', standalone mode (installing goes through a file)',
  },
  source_channel: {
    uk: 'Спільнота (Telegram)',
    ru: 'Сообщество (Telegram)',
    en: 'Community (Telegram)',
  },
  source_channel_desc: {
    uk: 'Плагіни з каналу {0}',
    ru: 'Плагины из канала {0}',
    en: 'Plugins from the {0} channel',
  },
  source_channel_msg: {
    uk: 'Плагін опубліковано в Telegram-каналі {0}. Його читає ваш клієнт напряму, без стороннього сервера.',
    ru: 'Плагин опубликован в Telegram-канале {0}. Его читает ваш клиент напрямую, без стороннего сервера.',
    en: 'This plugin is published in the {0} Telegram channel. Your client reads it directly, no third-party server involved.',
  },
  sources_title: {
    uk: 'Джерела',
    ru: 'Источники',
    en: 'Sources',
  },
  sources_sub: {
    uk: 'Активно {0} з {1}',
    ru: 'Активно {0} из {1}',
    en: '{0} of {1} active',
  },
  sources_footer: {
    uk: 'Канал читається через ваш обліковий запис Telegram. Тримайте довгий тап на доданому каналі, щоб прибрати його',
    ru: 'Канал читается через ваш аккаунт Telegram. Удерживайте добавленный канал, чтобы убрать его',
    en: 'A channel is read through your own Telegram account. Long-press an added channel to remove it',
  },
  source_add: {
    uk: 'Додати канал',
    ru: 'Добавить канал',
    en: 'Add a channel',
  },
  source_add_sub: {
    uk: '@канал або посилання t.me',
    ru: '@канал или ссылка t.me',
    en: '@channel or a t.me link',
  },
  source_add_title: {
    uk: 'Канал із плагінами',
    ru: 'Канал с плагинами',
    en: 'Plugin channel',
  },
  source_add_bad: {
    uk: 'Це не схоже на публічний канал',
    ru: 'Это не похоже на публичный канал',
    en: 'That does not look like a public channel',
  },
  source_add_warn_title: {
    uk: 'Додати {0}?',
    ru: 'Добавить {0}?',
    en: 'Add {0}?',
  },
  source_add_warn_msg: {
    uk: 'Канал не перевіряється entinyGram. Плагіни можуть містити небезпечний код. Додавайте лише канали, яким довіряєте.',
    ru: 'Канал не проверяется entinyGram. Плагины могут содержать опасный код. Добавляйте только каналы, которым доверяете.',
    en: 'entinyGram does not vet this channel. Its plugins may contain unsafe code. Only add channels you trust.',
  },
  source_add_confirm: {
    uk: 'Додати',
    ru: 'Добавить',
    en: 'Add',
  },
  source_added: {
    uk: 'Джерело додано',
    ru: 'Источник добавлен',
    en: 'Source added',
  },
  source_exists: {
    uk: 'Це джерело вже є',
    ru: 'Этот источник уже есть',
    en: 'That source is already added',
  },
  source_empty: {
    uk: 'У каналі немає плагінів у форматі entinyGram',
    ru: 'В канале нет плагинов в формате entinyGram',
    en: 'No entinyGram plugins found in that channel',
  },
  source_remove_title: {
    uk: 'Прибрати {0}?',
    ru: 'Убрать {0}?',
    en: 'Remove {0}?',
  },
  source_remove_msg: {
    uk: 'Канал зникне зі списку джерел. Вже встановлені плагіни залишаться.',
    ru: 'Канал исчезнет из списка источников. Уже установленные плагины останутся.',
    en: 'The channel leaves your sources. Plugins you already installed stay.',
  },
  source_count: {
    uk: '{0} плагінів',
    ru: '{0} плагинов',
    en: '{0} plugins',
  },
  source_off: {
    uk: 'вимкнено',
    ru: 'отключено',
    en: 'off',
  },
  source_failed: {
    uk: 'помилка: {0}',
    ru: 'ошибка: {0}',
    en: 'failed: {0}',
  },
  source_loading: {
    uk: 'завантаження…',
    ru: 'загрузка…',
    en: 'loading…',
  },
  source_filter: {
    uk: 'Джерело',
    ru: 'Источник',
    en: 'Source',
  },
  source_all: {
    uk: 'Усі джерела',
    ru: 'Все источники',
    en: 'All sources',
  },
  perms: {
    uk: 'Дозволи',
    ru: 'Разрешения',
    en: 'Permissions',
  },
  perms_footer: {
    uk: '⚠ позначає небезпечні дозволи: плагін отримує повний доступ до застосунку',
    ru: '⚠ отмечает опасные разрешения: плагин получает полный доступ к приложению',
    en: '⚠ marks unsafe permissions: the plugin gets full access to the app',
  },
  perm_jvm: {
    uk: 'Повний доступ до коду застосунку',
    ru: 'Полный доступ к коду приложения',
    en: 'Full access to the app code',
  },
  perm_xposed: {
    uk: 'Підміна методів застосунку',
    ru: 'Подмена методов приложения',
    en: 'Hooks app methods',
  },
  perm_fetch: {
    uk: 'Доступ до мережі',
    ru: 'Доступ к сети',
    en: 'Network access',
  },
  perm_fs: {
    uk: 'Доступ до файлів',
    ru: 'Доступ к файлам',
    en: 'File access',
  },
  perm_account: {
    uk: 'Читання даних акаунта',
    ru: 'Чтение данных аккаунта',
    en: 'Reads account data',
  },
  perm_other: {
    uk: 'Додатковий дозвіл',
    ru: 'Дополнительное разрешение',
    en: 'Extra permission',
  },
  trust_title: {
    uk: 'Встановити з {0}?',
    ru: 'Установить из {0}?',
    en: 'Install from {0}?',
  },
  trust_msg: {
    uk: 'Це джерело не перевіряється entinyGram.\nЗапитані дозволи: {0}\n\nВстановлюйте, лише якщо довіряєте автору.',
    ru: 'Этот источник не проверяется entinyGram.\nЗапрошенные разрешения: {0}\n\nУстанавливайте, только если доверяете автору.',
    en: 'entinyGram does not vet this source.\nPermissions asked: {0}\n\nInstall only if you trust the author.',
  },
  trust_none: {
    uk: 'не вказано',
    ru: 'не указаны',
    en: 'not listed',
  },
  download_failed: {
    uk: 'Не вдалося завантажити: {0}',
    ru: 'Не удалось скачать: {0}',
    en: 'Download failed: {0}',
  },
  channel_install_old: {
    uk: 'Ця збірка застосунку ще не вміє ставити плагіни з каналів. Оновіть entinyGram.',
    ru: 'Эта сборка приложения ещё не умеет ставить плагины из каналов. Обновите entinyGram.',
    en: 'This app build cannot install plugins from channels yet. Update entinyGram.',
  },
  channel_install_standalone: {
    uk: 'Встановлення з каналу працює лише в entinyGram.',
    ru: 'Установка из канала работает только в entinyGram.',
    en: 'Installing from a channel works only in entinyGram.',
  },
  size_label: {
    uk: 'Розмір',
    ru: 'Размер',
    en: 'Size',
  },
  open_post: {
    uk: 'Пост у каналі',
    ru: 'Пост в канале',
    en: 'Channel post',
  },
  tab_title: {
    uk: 'Розділ',
    ru: 'Раздел',
    en: 'Section',
  },
  tab_home: {
    uk: '🏠 Головна',
    ru: '🏠 Главная',
    en: '🏠 Home',
  },
  tab_plugins: {
    uk: '🧩 Плагіни',
    ru: '🧩 Плагины',
    en: '🧩 Plugins',
  },
  tab_settings: {
    uk: '⚙️ Налаштування',
    ru: '⚙️ Настройки',
    en: '⚙️ Settings',
  },
  home_summary: {
    uk: '{0} плагінів у каталозі · {1} встановлено',
    ru: '{0} плагинов в каталоге · {1} установлено',
    en: '{0} plugins in the catalog · {1} installed',
  },
  home_summary_sub: {
    uk: 'Торкніться, щоб відкрити каталог',
    ru: 'Нажмите, чтобы открыть каталог',
    en: 'Tap to open the catalog',
  },
  home_updates: {
    uk: 'Оновлення · {0}',
    ru: 'Обновления · {0}',
    en: 'Updates · {0}',
  },
  home_new: {
    uk: 'Нове в каталозі',
    ru: 'Новое в каталоге',
    en: 'New in the catalog',
  },
  home_all_current: {
    uk: 'Усе встановлене актуальне',
    ru: 'Всё установленное актуально',
    en: 'Everything you installed is up to date',
  },
  home_more: {
    uk: 'Усі плагіни',
    ru: 'Все плагины',
    en: 'All plugins',
  },
  settings_entries: {
    uk: 'Записи плагінів',
    ru: 'Записи плагинов',
    en: 'Plugin entries',
  },
  settings_entries_footer: {
    uk: 'Плагіни, що додають власні розділи в налаштування застосунку',
    ru: 'Плагины, добавляющие собственные разделы в настройки приложения',
    en: 'Plugins that add their own sections to the app settings',
  },
  entry_open: {
    uk: 'Відкрити налаштування плагіна',
    ru: 'Открыть настройки плагина',
    en: 'Open the plugin settings',
  },
  entry_inline: {
    uk: 'Вбудовано в налаштування застосунку',
    ru: 'Встроено в настройки приложения',
    en: 'Built into the app settings',
  },
  entry_none: {
    uk: 'Жоден плагін ще не додає записів',
    ru: 'Ни один плагин пока не добавляет записи',
    en: 'No plugin adds entries yet',
  },
  settings_installed: {
    uk: 'Встановлені плагіни',
    ru: 'Установленные плагины',
    en: 'Installed plugins',
  },
  status_off: {
    uk: 'Вимкнено',
    ru: 'Отключено',
    en: 'Off',
  },
  settings_about: {
    uk: 'Про SDK',
    ru: 'О SDK',
    en: 'About the SDK',
  },
  settings_about_sub: {
    uk: 'Версія {0}, вбудовування {1}',
    ru: 'Версия {0}, встраивание {1}',
    en: 'Version {0}, embedding {1}',
  },
  settings_installed_sub: {
    uk: 'Встановлено {0} · оновлень: {1}',
    ru: 'Установлено {0} · обновлений: {1}',
    en: '{0} installed · {1} updates',
  },
  settings_entries_sub: {
    uk: 'Плагінів із власними розділами: {0}',
    ru: 'Плагинов с собственными разделами: {0}',
    en: '{0} plugins add their own sections',
  },
  home_title: {
    uk: 'Маркетплейс',
    ru: 'Маркетплейс',
    en: 'Marketplace',
  },
  home_stats: {
    uk: 'Встановлено {0} · оновлень {1} · у каталозі {2}',
    ru: 'Установлено {0} · обновлений {1} · в каталоге {2}',
    en: '{0} installed · {1} updates · {2} in the catalog',
  },
  home_recent: {
    uk: 'Нещодавно оновлені',
    ru: 'Недавно обновлённые',
    en: 'Recently updated',
  },
  show_all: {
    uk: 'Показати всі ({0})',
    ru: 'Показать все ({0})',
    en: 'Show all ({0})',
  },
  about_channel: {
    uk: 'Канал із плагінами',
    ru: 'Канал с плагинами',
    en: 'Channel with plugins',
  },
  catalog_count: {
    uk: '{0} плагінів у {1} джерелах',
    ru: '{0} плагинов в {1} источниках',
    en: '{0} plugins in {1} sources',
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

