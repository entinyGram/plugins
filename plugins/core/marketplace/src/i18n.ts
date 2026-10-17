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
  filter_all: {
    uk: 'Усі',
    ru: 'Все',
    en: 'All',
    fa: 'همه',
  },
  filter_installed: {
    uk: 'Встановлені',
    ru: 'Установленные',
    en: 'Installed',
    fa: 'نصب‌شده',
  },
  filter_updates: {
    uk: 'Оновлення',
    ru: 'Обновления',
    en: 'Updates',
    fa: 'به‌روزرسانی‌ها',
  },
  search_title: {
    uk: 'Пошук',
    ru: 'Поиск',
    en: 'Search',
    fa: 'جستجو',
  },
  search_hint: {
    uk: 'Назва, автор або опис',
    ru: 'Название, автор или описание',
    en: 'Name, author or description',
    fa: 'نام، نویسنده یا توضیحات',
  },
  search_prompt_title: {
    uk: 'Пошук плагінів',
    ru: 'Поиск плагинов',
    en: 'Search plugins',
    fa: 'جستجوی پلاگین‌ها',
  },
  filter_title: {
    uk: 'Показувати',
    ru: 'Показывать',
    en: 'Show',
    fa: 'نمایش',
  },
  loading_catalog: {
    uk: 'Завантаження плагінів…',
    ru: 'Загрузка плагинов…',
    en: 'Loading plugins…',
    fa: 'در حال بارگذاری پلاگین‌ها…',
  },
  catalog_fail: {
    uk: 'Не вдалося завантажити каталог: {0}',
    ru: 'Не удалось загрузить каталог: {0}',
    en: 'Could not load the catalog: {0}',
    fa: 'بارگذاری کاتالوگ ناموفق بود: {0}',
  },
  unknown_error: {
    uk: 'невідома помилка',
    ru: 'неизвестная ошибка',
    en: 'unknown error',
    fa: 'خطای ناشناخته',
  },
  try_again: {
    uk: 'Спробувати знову',
    ru: 'Попробовать снова',
    en: 'Try again',
    fa: 'تلاش دوباره',
  },
  refresh_catalog: {
    uk: 'Оновити каталог',
    ru: 'Обновить каталог',
    en: 'Refresh catalog',
    fa: 'به‌روزرسانی کاتالوگ',
  },
  refreshing: {
    uk: 'Оновлення…',
    ru: 'Обновление…',
    en: 'Refreshing…',
    fa: 'در حال به‌روزرسانی…',
  },
  refreshing_sub: {
    uk: 'Завантажуємо каталоги всіх джерел',
    ru: 'Загружаем каталоги всех источников',
    en: 'Fetching every source',
    fa: 'دریافت اطلاعات همه منابع',
  },
  catalog_updated: {
    uk: 'Каталог оновлено',
    ru: 'Каталог обновлён',
    en: 'Catalog updated',
    fa: 'کاتالوگ به‌روزرسانی شد',
  },
  refresh_fail_title: {
    uk: 'Не вдалося оновити каталог',
    ru: 'Не удалось обновить каталог',
    en: 'Could not refresh the catalog',
    fa: 'به‌روزرسانی کاتالوگ ناموفق بود',
  },
  updated_at: {
    uk: 'Оновлено: {0}',
    ru: 'Обновлено: {0}',
    en: 'Updated: {0}',
    fa: 'به‌روزرسانی شده: {0}',
  },
  never_updated: {
    uk: 'ще не оновлювався',
    ru: 'ещё не обновлялся',
    en: 'not updated yet',
    fa: 'هنوز به‌روزرسانی نشده',
  },
  sec_updates: {
    uk: 'Доступні оновлення',
    ru: 'Доступны обновления',
    en: 'Updates available',
    fa: 'به‌روزرسانی‌های موجود',
  },
  sec_installed: {
    uk: 'Встановлені',
    ru: 'Установленные',
    en: 'Installed',
    fa: 'نصب‌شده',
  },
  sec_available: {
    uk: 'Доступні',
    ru: 'Доступные',
    en: 'Available',
    fa: 'موجود',
  },
  empty_search: {
    uk: 'Нічого не знайдено за запитом',
    ru: 'Ничего не найдено по запросу',
    en: 'Nothing matches the search',
    fa: 'موردی مطابق جستجو یافت نشد',
  },
  empty_list: {
    uk: 'Тут поки нічого немає',
    ru: 'Здесь пока ничего нет',
    en: 'Nothing here yet',
    fa: 'هنوز چیزی در اینجا وجود ندارد',
  },
  status_installed: {
    uk: 'Встановлено',
    ru: 'Установлено',
    en: 'Installed',
    fa: 'نصب شده',
  },
  status_latest: {
    uk: 'Остання',
    ru: 'Последняя',
    en: 'Latest',
    fa: 'آخرین نسخه',
  },
  about: {
    uk: 'Про плагін',
    ru: 'О плагине',
    en: 'About',
    fa: 'درباره پلاگین',
  },
  no_desc: {
    uk: 'Опис відсутній.',
    ru: 'Описание отсутствует.',
    en: 'No description provided.',
    fa: 'توضیحی ارائه نشده است.',
  },
  created_by: {
    uk: 'Автор: {0}',
    ru: 'Автор: {0}',
    en: 'Created by {0}',
    fa: 'ایجاد شده توسط {0}',
  },
  source_official: {
    uk: 'entinyGram',
    ru: 'entinyGram',
    en: 'entinyGram',
    fa: 'entinyGram',
  },
  source_official_desc: {
    uk: 'Офіційні плагіни entinyGram',
    ru: 'Официальные плагины entinyGram',
    en: 'Official entinyGram plugins',
    fa: 'پلاگین‌های رسمی entinyGram',
  },
  source_official_msg: {
    uk: 'Плагін опубліковано в офіційному каталозі entinyGram.',
    ru: 'Плагин опубликован в официальном каталоге entinyGram.',
    en: 'This plugin is published in the official entinyGram catalog.',
    fa: 'این پلاگین در کاتالوگ رسمی entinyGram منتشر شده است.',
  },
  about_desc: {
    uk: 'Опис',
    ru: 'Описание',
    en: 'Description',
    fa: 'توضیحات',
  },
  about_author: {
    uk: 'Автор',
    ru: 'Автор',
    en: 'Author',
    fa: 'نویسنده',
  },
  about_source: {
    uk: 'Джерело',
    ru: 'Источник',
    en: 'Source',
    fa: 'منبع',
  },
  about_id: {
    uk: 'ID плагіна',
    ru: 'ID плагина',
    en: 'Plugin ID',
    fa: 'شناسه پلاگین',
  },
  about_requires: {
    uk: 'Залежності',
    ru: 'Зависимости',
    en: 'Requires',
    fa: 'پیش‌نیازها',
  },
  unknown_author: {
    uk: 'Невідомий автор',
    ru: 'Неизвестный автор',
    en: 'Unknown author',
    fa: 'نویسنده ناشناس',
  },
  published_date: {
    uk: 'Опубліковано: {0}',
    ru: 'Опубликовано: {0}',
    en: 'Published {0}',
    fa: 'منتشر شده: {0}',
  },
  id_copied: {
    uk: 'ID плагіна скопійовано',
    ru: 'ID плагина скопирован',
    en: 'Plugin ID copied',
    fa: 'شناسه پلاگین کپی شد',
  },
  installation: {
    uk: 'Встановлення',
    ru: 'Установка',
    en: 'Installation',
    fa: 'نصب',
  },
  btn_install: {
    uk: 'Встановити v{0}',
    ru: 'Установить v{0}',
    en: 'Install v{0}',
    fa: 'نصب v{0}',
  },
  btn_update: {
    uk: 'Оновити до v{0}',
    ru: 'Обновить до v{0}',
    en: 'Update to v{0}',
    fa: 'به‌روزرسانی به v{0}',
  },
  btn_reinstall: {
    uk: 'Перевстановити',
    ru: 'Переустановить',
    en: 'Reinstall',
    fa: 'نصب مجدد',
  },
  btn_downgrade: {
    uk: 'Понизити версію',
    ru: 'Понизить версию',
    en: 'Downgrade',
    fa: 'بازگشت به نسخه قبل',
  },
  needs_deps: {
    uk: 'Потрібно: {0}',
    ru: 'Требуется: {0}',
    en: 'Needs {0}',
    fa: 'نیاز به: {0}',
  },
  installed_ver: {
    uk: 'Встановлено: v{0}',
    ru: 'Установлено: v{0}',
    en: 'Installed: v{0}',
    fa: 'نصب‌شده: v{0}',
  },
  btn_remove: {
    uk: 'Видалити плагін',
    ru: 'Удалить плагин',
    en: 'Remove plugin',
    fa: 'حذف پلاگین',
  },
  installed_ver_sub: {
    uk: 'Встановлена версія: v{0}',
    ru: 'Установленная версия: v{0}',
    en: 'Installed version: v{0}',
    fa: 'نسخه نصب‌شده: v{0}',
  },
  remove_title: {
    uk: 'Видалити {0}?',
    ru: 'Удалить {0}?',
    en: 'Remove {0}?',
    fa: 'حذف {0}؟',
  },
  remove_msg: {
    uk: 'Плагін та збережені ним дані буде видалено з цього пристрою.',
    ru: 'Плагин и его сохранённые данные будут удалены с этого устройства.',
    en: 'The plugin and its stored data will be removed from this device.',
    fa: 'پلاگین و داده‌های ذخیره‌شده آن از این دستگاه حذف خواهند شد.',
  },
  remove_confirm: {
    uk: 'Видалити',
    ru: 'Удалить',
    en: 'Remove',
    fa: 'حذف',
  },
  cancel: {
    uk: 'Скасувати',
    ru: 'Отмена',
    en: 'Cancel',
    fa: 'لغو',
  },
  remove_unavail_title: {
    uk: 'Видалення недоступне',
    ru: 'Удаление недоступно',
    en: 'Removal unavailable',
    fa: 'حذف در دسترس نیست',
  },
  remove_unavail_msg: {
    uk: 'Ця збірка додатку ще не підтримує видалення через маркетплейс. Видаліть плагін через Налаштування → Плагіни.',
    ru: 'Эта сборка приложения ещё не поддерживает удаление через маркетплейс. Удалите плагин через Настройки → Плагины.',
    en: 'This app build does not expose plugin removal to the marketplace yet. Remove it from Settings → Plugins.',
    fa: 'این نسخه برنامه هنوز از حذف از طریق فروشگاه پشتیبانی نمی‌کند. پلاگین را از بخش تنظیمات ← پلاگین‌ها حذف کنید.',
  },
  ok: {
    uk: 'OK',
    ru: 'OK',
    en: 'OK',
    fa: 'تأیید',
  },
  history: {
    uk: 'Історія версій',
    ru: 'История версий',
    en: 'Version history',
    fa: 'تاریخچه نسخه‌ها',
  },
  confirm_install_ver: {
    uk: 'Встановити цю версію?',
    ru: 'Установить эту версию?',
    en: 'Install this version?',
    fa: 'این نسخه نصب شود؟',
  },
  published_versions: {
    uk: '{0} опублікованих версій',
    ru: '{0} опубликованных версий',
    en: '{0} published versions',
    fa: '{0} نسخه منتشر شده',
  },
  install_file_title: {
    uk: 'Встановлення з файлу',
    ru: 'Установка из файла',
    en: 'Install from file',
    fa: 'نصب از فایل',
  },
  install_file_msg: {
    uk: 'Посилання на завантаження скопійовано. Збережіть файл, потім відкрийте Налаштування → Плагіни → Завантажити з файлу та оберіть його.',
    ru: 'Ссылка на скачивание скопирована. Сохраните файл, затем откройте Настройки → Плагины → Загрузить из файла и выберите его.',
    en: 'The download link is copied. Save the file, then open Settings → Plugins → Load from file and pick it.',
    fa: 'لینک دانلود کپی شد. فایل را ذخیره کنید، سپس از تنظیمات ← پلاگین‌ها ← بارگذاری از فایل آن را انتخاب کنید.',
  },
  open_link: {
    uk: 'Відкрити посилання',
    ru: 'Открыть ссылку',
    en: 'Open link',
    fa: 'باز کردن لینک',
  },
  close: {
    uk: 'Закрити',
    ru: 'Закрыть',
    en: 'Close',
    fa: 'بستن',
  },
  footer_info: {
    uk: 'entinyGram SDK {0}, вбудовування налаштувань {1}{2}. Плагіни надходять з активних джерел; кожне встановлення запитує підтвердження',
    ru: 'entinyGram SDK {0}, встраивание настроек {1}{2}. Плагины поступают из активных источников; каждая установка запрашивает подтверждение',
    en: 'entinyGram SDK {0}, settings embedding {1}{2}. Plugins come from your active sources; every install asks for confirmation',
    fa: 'SDK entinyGram نسخه {0}، جاسازی تنظیمات {1}{2}. پلاگین‌ها از منابع فعال شما می‌آیند؛ هر نصب نیاز به تأیید دارد',
  },
  standalone_mode: {
    uk: ', автономний режим (встановлення через файл)',
    ru: ', автономный режим (установка через файл)',
    en: ', standalone mode (installing goes through a file)',
    fa: '، حالت مستقل (نصب از طریق فایل صورت می‌گیرد)',
  },
  source_channel: {
    uk: 'Спільнота (Telegram)',
    ru: 'Сообщество (Telegram)',
    en: 'Community (Telegram)',
    fa: 'جامعه (تلگرام)',
  },
  source_channel_desc: {
    uk: 'Плагіни з каналу {0}',
    ru: 'Плагины из канала {0}',
    en: 'Plugins from the {0} channel',
    fa: 'پلاگین‌ها از کانال {0}',
  },
  source_channel_msg: {
    uk: 'Плагін опубліковано в Telegram-каналі {0}. Його читає ваш клієнт напряму, без стороннього сервера.',
    ru: 'Плагин опубликован в Telegram-канале {0}. Его читает ваш клиент напрямую, без стороннего сервера.',
    en: 'This plugin is published in the {0} Telegram channel. Your client reads it directly, no third-party server involved.',
    fa: 'این پلاگین در کانال تلگرام {0} منتشر شده است. کلاینت شما آن را مستقیماً و بدون سرور واسط می‌خواند.',
  },
  sources_title: {
    uk: 'Джерела',
    ru: 'Источники',
    en: 'Sources',
    fa: 'منابع',
  },
  sources_sub: {
    uk: 'Активно {0} з {1}',
    ru: 'Активно {0} из {1}',
    en: '{0} of {1} active',
    fa: '{0} از {1} فعال است',
  },
  sources_footer: {
    uk: 'Канал читається через ваш обліковий запис Telegram. Тримайте довгий тап на доданому каналі, щоб прибрати його',
    ru: 'Канал читается через ваш аккаунт Telegram. Удерживайте добавленный канал, чтобы убрать его',
    en: 'A channel is read through your own Telegram account. Long-press an added channel to remove it',
    fa: 'کانال از طریق حساب تلگرام خودتان خوانده می‌شود. برای حذف یک کانال افزوده شده، روی آن لمس طولانی کنید',
  },
  source_add: {
    uk: 'Додати канал',
    ru: 'Добавить канал',
    en: 'Add a channel',
    fa: 'افزودن کانال',
  },
  source_add_sub: {
    uk: '@канал або посилання t.me',
    ru: '@канал или ссылка t.me',
    en: '@channel or a t.me link',
    fa: 'کانال@ یا پیوند t.me',
  },
  source_add_title: {
    uk: 'Канал із плагінами',
    ru: 'Канал с плагинами',
    en: 'Plugin channel',
    fa: 'کانال پلاگین‌ها',
  },
  source_add_bad: {
    uk: 'Це не схоже на публічний канал',
    ru: 'Это не похоже на публичный канал',
    en: 'That does not look like a public channel',
    fa: 'این یک کانال عمومی معتبر به نظر نمی‌رسد',
  },
  source_add_warn_title: {
    uk: 'Додати {0}?',
    ru: 'Добавить {0}?',
    en: 'Add {0}?',
    fa: '{0} افزوده شود؟',
  },
  source_add_warn_msg: {
    uk: 'Канал не перевіряється entinyGram. Плагіни можуть містити небезпечний код. Додавайте лише канали, яким довіряєте.',
    ru: 'Канал не проверяется entinyGram. Плагины могут содержать опасный код. Добавляйте только каналы, которым доверяете.',
    en: 'entinyGram does not vet this channel. Its plugins may contain unsafe code. Only add channels you trust.',
    fa: 'این کانال توسط entinyGram بررسی نشده است. پلاگین‌ها ممکن است حاوی کدهای ناامن باشند. فقط کانال‌های مورد اعتماد را اضافه کنید.',
  },
  source_add_confirm: {
    uk: 'Додати',
    ru: 'Добавить',
    en: 'Add',
    fa: 'افزودن',
  },
  source_added: {
    uk: 'Джерело додано',
    ru: 'Источник добавлен',
    en: 'Source added',
    fa: 'منبع اضافه شد',
  },
  source_exists: {
    uk: 'Це джерело вже є',
    ru: 'Этот источник уже есть',
    en: 'That source is already added',
    fa: 'این منبع از قبل اضافه شده است',
  },
  source_empty: {
    uk: 'У каналі немає плагінів (.inu.js)',
    ru: 'В канале нет плагинов (.inu.js)',
    en: 'No plugins (.inu.js) found in that channel',
    fa: 'هیچ پلاگینی (.inu.js) در این کانال یافت نشد',
  },
  source_remove_title: {
    uk: 'Прибрати {0}?',
    ru: 'Убрать {0}?',
    en: 'Remove {0}?',
    fa: '{0} حذف شود؟',
  },
  source_remove_msg: {
    uk: 'Канал зникне зі списку джерел. Вже встановлені плагіни залишаться.',
    ru: 'Канал исчезнет из списка источников. Уже установленные плагины останутся.',
    en: 'The channel leaves your sources. Plugins you already installed stay.',
    fa: 'کانال از لیست منابع شما حذف خواهد شد. پلاگین‌هایی که قبلاً نصب کرده‌اید باقی می‌مانند.',
  },
  source_count: {
    uk: '{0} плагінів',
    ru: '{0} плагинов',
    en: '{0} plugins',
    fa: '{0} پلاگین',
  },
  source_off: {
    uk: 'вимкнено',
    ru: 'отключено',
    en: 'off',
    fa: 'غیرفعال',
  },
  source_failed: {
    uk: 'помилка: {0}',
    ru: 'ошибка: {0}',
    en: 'failed: {0}',
    fa: 'خطا: {0}',
  },
  source_loading: {
    uk: 'завантаження…',
    ru: 'загрузка…',
    en: 'loading…',
    fa: 'در حال بارگذاری…',
  },
  source_filter: {
    uk: 'Джерело',
    ru: 'Источник',
    en: 'Source',
    fa: 'منبع',
  },
  source_all: {
    uk: 'Усі джерела',
    ru: 'Все источники',
    en: 'All sources',
    fa: 'همه منابع',
  },
  perms: {
    uk: 'Дозволи',
    ru: 'Разрешения',
    en: 'Permissions',
    fa: 'دسترسی‌ها',
  },
  perms_footer: {
    uk: '⚠ позначає небезпечні дозволи: плагін отримує повний доступ до застосунку',
    ru: '⚠ отмечает опасные разрешения: плагин получает полный доступ к приложению',
    en: '⚠ marks unsafe permissions: the plugin gets full access to the app',
    fa: 'علامت ⚠ دسترسی‌های ناامن را مشخص می‌کند: پلاگین دسترسی کامل به برنامه را دریافت می‌کند',
  },
  perm_jvm: {
    uk: 'Повний доступ до коду застосунку',
    ru: 'Полный доступ к коду приложения',
    en: 'Full access to the app code',
    fa: 'دسترسی کامل به کدهای برنامه',
  },
  perm_xposed: {
    uk: 'Підміна методів застосунку',
    ru: 'Подмена методов приложения',
    en: 'Hooks app methods',
    fa: 'تغییر و رهگیری توابع برنامه',
  },
  perm_fetch: {
    uk: 'Доступ до мережі',
    ru: 'Доступ к сети',
    en: 'Network access',
    fa: 'دسترسی به شبکه',
  },
  perm_fs: {
    uk: 'Доступ до файлів',
    ru: 'Доступ к файлам',
    en: 'File access',
    fa: 'دسترسی به فایل‌ها',
  },
  perm_account: {
    uk: 'Читання даних акаунта',
    ru: 'Чтение данных аккаунта',
    en: 'Reads account data',
    fa: 'خواندن اطلاعات حساب کاربری',
  },
  perm_other: {
    uk: 'Додатковий дозвіл',
    ru: 'Дополнительное разрешение',
    en: 'Extra permission',
    fa: 'دسترسی اضافی',
  },
  trust_title: {
    uk: 'Встановити з {0}?',
    ru: 'Установить из {0}?',
    en: 'Install from {0}?',
    fa: 'نصب از {0}؟',
  },
  trust_msg: {
    uk: 'Це джерело не перевіряється entinyGram.\nЗапитані дозволи: {0}\n\nВстановлюйте, лише якщо довіряєте автору.',
    ru: 'Этот источник не проверяется entinyGram.\nЗапрошенные разрешения: {0}\n\nУстанавливайте, только если доверяете автору.',
    en: 'entinyGram does not vet this source.\nPermissions asked: {0}\n\nInstall only if you trust the author.',
    fa: 'این منبع توسط entinyGram بازبینی نشده است.\nدسترسی‌های درخواست شده: {0}\n\nفقط در صورتی نصب کنید که به نویسنده اطمینان دارید.',
  },
  trust_none: {
    uk: 'не вказано',
    ru: 'не указаны',
    en: 'not listed',
    fa: 'ذکر نشده',
  },
  download_failed: {
    uk: 'Не вдалося завантажити: {0}',
    ru: 'Не удалось скачать: {0}',
    en: 'Download failed: {0}',
    fa: 'دانلود ناموفق بود: {0}',
  },
  channel_install_old: {
    uk: 'Ця збірка застосунку ще не вміє ставити плагіни з каналів. Оновіть entinyGram.',
    ru: 'Эта сборка приложения ещё не умеет ставить плагины из каналов. Обновите entinyGram.',
    en: 'This app build cannot install plugins from channels yet. Update entinyGram.',
    fa: 'این نسخه از برنامه هنوز قابلیت نصب پلاگین از کانال‌ها را ندارد. لطفاً entinyGram را به‌روزرسانی کنید.',
  },
  channel_install_standalone: {
    uk: 'Встановлення з каналу працює лише в entinyGram.',
    ru: 'Установка из канала работает только в entinyGram.',
    en: 'Installing from a channel works only in entinyGram.',
    fa: 'نصب از کانال فقط در entinyGram کار می‌کند.',
  },
  size_label: {
    uk: 'Розмір',
    ru: 'Размер',
    en: 'Size',
    fa: 'اندازه',
  },
  open_post: {
    uk: 'Пост у каналі',
    ru: 'Пост в канале',
    en: 'Channel post',
    fa: 'پست در کانال',
  },
  tab_title: {
    uk: 'Розділ',
    ru: 'Раздел',
    en: 'Section',
    fa: 'بخش',
  },
  tab_home: {
    uk: '🏠 Головна',
    ru: '🏠 Главная',
    en: '🏠 Home',
    fa: '🏠 خانه',
  },
  tab_plugins: {
    uk: '🧩 Плагіни',
    ru: '🧩 Плагины',
    en: '🧩 Plugins',
    fa: '🧩 پلاگین‌ها',
  },
  tab_settings: {
    uk: '⚙️ Налаштування',
    ru: '⚙️ Настройки',
    en: '⚙️ Settings',
    fa: '⚙️ تنظیمات',
  },
  home_summary: {
    uk: '{0} плагінів у каталозі · {1} встановлено',
    ru: '{0} плагинов в каталоге · {1} установлено',
    en: '{0} plugins in the catalog · {1} installed',
    fa: '{0} پلاگین در کاتالوگ · {1} نصب شده',
  },
  home_summary_sub: {
    uk: 'Торкніться, щоб відкрити каталог',
    ru: 'Нажмите, чтобы открыть каталог',
    en: 'Tap to open the catalog',
    fa: 'برای باز کردن کاتالوگ ضربه بزنید',
  },
  home_updates: {
    uk: 'Оновлення · {0}',
    ru: 'Обновления · {0}',
    en: 'Updates · {0}',
    fa: 'به‌روزرسانی‌ها · {0}',
  },
  home_new: {
    uk: 'Нове в каталозі',
    ru: 'Новое в каталоге',
    en: 'New in the catalog',
    fa: 'جدید در کاتالوگ',
  },
  home_all_current: {
    uk: 'Усе встановлене актуальне',
    ru: 'Всё установленное актуально',
    en: 'Everything you installed is up to date',
    fa: 'همه پلاگین‌های نصب‌شده به‌روز هستند',
  },
  home_more: {
    uk: 'Усі плагіни',
    ru: 'Все плагины',
    en: 'All plugins',
    fa: 'همه پلاگین‌ها',
  },
  settings_entries: {
    uk: 'Записи плагінів',
    ru: 'Записи плагинов',
    en: 'Plugin entries',
    fa: 'ورودی‌های پلاگین',
  },
  settings_entries_footer: {
    uk: 'Плагіни, що додають власні розділи в налаштування застосунку',
    ru: 'Плагины, добавляющие собственные разделы в настройки приложения',
    en: 'Plugins that add their own sections to the app settings',
    fa: 'پلاگین‌هایی که بخش‌های خود را به تنظیمات برنامه اضافه می‌کنند',
  },
  entry_open: {
    uk: 'Відкрити налаштування плагіна',
    ru: 'Открыть настройки плагина',
    en: 'Open the plugin settings',
    fa: 'باز کردن تنظیمات پلاگین',
  },
  entry_inline: {
    uk: 'Вбудовано в налаштування застосунку',
    ru: 'Встроено в настройки приложения',
    en: 'Built into the app settings',
    fa: 'تعبیه‌شده در تنظیمات برنامه',
  },
  entry_none: {
    uk: 'Жоден плагін ще не додає записів',
    ru: 'Ни один плагин пока не добавляет записи',
    en: 'No plugin adds entries yet',
    fa: 'هنوز هیچ پلاگینی ورودی اضافه نکرده است',
  },
  settings_installed: {
    uk: 'Встановлені плагіни',
    ru: 'Установленные плагины',
    en: 'Installed plugins',
    fa: 'پلاگین‌های نصب‌شده',
  },
  status_off: {
    uk: 'Вимкнено',
    ru: 'Отключено',
    en: 'Off',
    fa: 'خاموش',
  },
  settings_about: {
    uk: 'Про SDK',
    ru: 'О SDK',
    en: 'About the SDK',
    fa: 'درباره SDK',
  },
  settings_about_sub: {
    uk: 'Версія {0}, вбудовування {1}',
    ru: 'Версия {0}, встраивание {1}',
    en: 'Version {0}, embedding {1}',
    fa: 'نسخه {0}، تعبیه‌سازی {1}',
  },
  settings_installed_sub: {
    uk: 'Встановлено {0} · оновлень: {1}',
    ru: 'Установлено {0} · обновлений: {1}',
    en: '{0} installed · {1} updates',
    fa: '{0} نصب‌شده · {1} به‌روزرسانی',
  },
  settings_entries_sub: {
    uk: 'Плагінів із власними розділами: {0}',
    ru: 'Плагинов с собственными разделами: {0}',
    en: '{0} plugins add their own sections',
    fa: '{0} پلاگین بخش‌های اختصاصی اضافه می‌کنند',
  },
  home_dev_title: {
    uk: 'Плагіни від розробника',
    ru: 'Плагины от разработчика',
    en: 'Plugins from the developer',
    fa: 'پلاگین‌های توسعه‌دهنده',
  },
  home_dev_sub: {
    uk: 'Офіційний каталог entinyGram',
    ru: 'Официальный каталог entinyGram',
    en: 'The official entinyGram catalog',
    fa: 'کاتالوگ رسمی entinyGram',
  },
  home_title: {
    uk: 'Маркетплейс',
    ru: 'Маркетплейс',
    en: 'Marketplace',
    fa: 'فروشگاه',
  },
  home_stats: {
    uk: 'Встановлено {0} · оновлень {1} · у каталозі {2}',
    ru: 'Установлено {0} · обновлений {1} · в каталоге {2}',
    en: '{0} installed · {1} updates · {2} in the catalog',
    fa: '{0} نصب‌شده · {1} به‌روزرسانی · {2} در کاتالوگ',
  },
  home_recent: {
    uk: 'Нещодавно оновлені',
    ru: 'Недавно обновлённые',
    en: 'Recently updated',
    fa: 'اخیراً به‌روزرسانی شده',
  },
  show_all: {
    uk: 'Показати всі ({0})',
    ru: 'Показать все ({0})',
    en: 'Show all ({0})',
    fa: 'نمایش همه ({0})',
  },
  about_channel: {
    uk: 'Канал із плагінами',
    ru: 'Канал с плагинами',
    en: 'Channel with plugins',
    fa: 'کانال پلاگین‌ها',
  },
  catalog_count: {
    uk: '{0} плагінів у {1} джерелах',
    ru: '{0} плагинов в {1} источниках',
    en: '{0} plugins in {1} sources',
    fa: '{0} پلاگین در {1} منبع',
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

