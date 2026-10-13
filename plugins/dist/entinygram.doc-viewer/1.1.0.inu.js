// ==InuPlugin==
// @name         Doc Viewer
// @id           entinygram.doc-viewer
// @author       Daxo-Developer && @Daxo_OS (original), entinyGram (Inugram port)
// @version      1.1.0
// @description  In-app viewer for PDF, DOCX, XLSX, text, code, images, archives and more
// @icon         inu://document
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @grant        clipboard.write
// @plugin-api   1
// @platform     android
// @entiny-menu  category-chats
// @requires     entinygram.sdk >=0.1.0-alpha
// ==/InuPlugin==


// src/i18n.ts
function detectAppLang() {
  try {
    const LocaleController = inu.jvm.cls("org.telegram.messenger.LocaleController");
    const short = String(LocaleController.callStatic("getInstance").call("getCurrentLocaleInfo").getField("shortName")).toLowerCase();
    if (short.startsWith("uk")) return "uk";
    if (short.startsWith("ru")) return "ru";
    if (short.startsWith("en")) return "en";
  } catch {
  }
  try {
    const JLocale = inu.jvm.cls("java.util.Locale");
    const lang = String(JLocale.callStatic("getDefault").call("getLanguage")).toLowerCase();
    if (lang.startsWith("uk")) return "uk";
    if (lang.startsWith("ru")) return "ru";
    if (lang.startsWith("en")) return "en";
  } catch {
  }
  return "uk";
}
function currentLang() {
  const chosen = localStorage.getItem("docviewer_lang");
  if (chosen === "uk" || chosen === "en" || chosen === "ru") {
    return chosen;
  }
  return detectAppLang();
}
var STRINGS = {
  err_unpack_limit: {
    uk: "Файл перевищує ліміт безпечного читання",
    en: "File exceeds the safe reading limit",
    ru: "Файл превышает лимит безопасного чтения"
  },
  archive_open: {
    uk: "Відкрити файл з архіву",
    en: "Open archive file",
    ru: "Открыть файл из архива"
  },
  archive_unsupported: {
    uk: "Цей формат не підтримується для перегляду",
    en: "This format is not supported for viewing",
    ru: "Этот формат не поддерживается для просмотра"
  },
  // Settings
  settings_title: {
    uk: "Doc Viewer",
    en: "Doc Viewer",
    ru: "Doc Viewer"
  },
  header_language: {
    uk: "Мова",
    en: "Language",
    ru: "Язык"
  },
  lang_auto: {
    uk: "Авто (мова програми)",
    en: "Auto (app language)",
    ru: "Авто (язык приложения)"
  },
  header_formats: {
    uk: "Формати",
    en: "Formats",
    ru: "Форматы"
  },
  setting_pdf: {
    uk: "PDF",
    en: "PDF",
    ru: "PDF"
  },
  setting_docs: {
    uk: "DOCX, XLSX, PPTX, ODF, RTF, листи EML",
    en: "DOCX, XLSX, PPTX, ODF, RTF, EML emails",
    ru: "DOCX, XLSX, PPTX, ODF, RTF, письма EML"
  },
  setting_books: {
    uk: "Книги EPUB та FB2",
    en: "EPUB and FB2 books",
    ru: "Книги EPUB и FB2"
  },
  setting_text: {
    uk: "Текст, код, JSON, CSV, Jupyter",
    en: "Text, code, JSON, CSV, Jupyter",
    ru: "Текст, код, JSON, CSV, Jupyter"
  },
  setting_web: {
    uk: "Markdown, HTML та SVG",
    en: "Markdown, HTML and SVG",
    ru: "Markdown, HTML и SVG"
  },
  setting_image: {
    uk: "Зображення, надіслані файлом",
    en: "Images sent as files",
    ru: "Картинки, отправленные файлом"
  },
  setting_archive: {
    uk: "Вміст архівів (ZIP, TAR)",
    en: "Archive contents (ZIP, TAR)",
    ru: "Содержимое архивов (ZIP, TAR)"
  },
  header_viewing: {
    uk: "Перегляд",
    en: "Viewing",
    ru: "Просмотр"
  },
  setting_invert: {
    uk: "Нічний режим для PDF та зображень",
    en: "Night mode for PDF and images",
    ru: "Ночной режим для PDF и картинок"
  },
  setting_fitwidth: {
    uk: "Вписувати сторінку по ширині",
    en: "Fit page to width",
    ru: "Вписывать страницу по ширине"
  },
  setting_remember: {
    uk: "Запам'ятовувати останню сторінку",
    en: "Remember last page",
    ru: "Запоминать последнюю страницу"
  },
  setting_volume: {
    uk: "Гортати кнопками гучності",
    en: "Turn pages with volume buttons",
    ru: "Листать кнопками громкости"
  },
  setting_keepon: {
    uk: "Не вимикати екран під час перегляду",
    en: "Keep screen on while viewing",
    ru: "Не гасить экран при просмотре"
  },
  setting_wrap: {
    uk: "Переносити довгі рядки в тексті",
    en: "Wrap long lines in text",
    ru: "Переносить длинные строки в тексте"
  },
  setting_prettyjson: {
    uk: "Форматувати JSON з відступами",
    en: "Format JSON with indentation",
    ru: "Форматировать JSON с отступами"
  },
  setting_csv_table: {
    uk: "Показувати CSV таблицею",
    en: "Display CSV as a table",
    ru: "Показывать CSV таблицей"
  },
  separator_desc: {
    uk: "Файли відкриваються всередині клієнта при натисканні в чаті",
    en: "Files open inside the client when tapped in chat",
    ru: "Файлы открываются внутри клиента при нажатии в чате"
  },
  // Viewer
  loading: {
    uk: "Завантаження…",
    en: "Loading…",
    ru: "Загрузка…"
  },
  load_fail: {
    uk: "Не вдалося відобразити файл",
    en: "Failed to display file",
    ru: "Не удалось показать файл"
  },
  cancel: {
    uk: "Скасувати",
    en: "Cancel",
    ru: "Отмена"
  },
  ok: {
    uk: "OK",
    en: "OK",
    ru: "OK"
  },
  search: {
    uk: "Пошук",
    en: "Search",
    ru: "Поиск"
  },
  find: {
    uk: "Знайти",
    en: "Find",
    ru: "Найти"
  },
  not_found: {
    uk: "Нічого не знайдено",
    en: "Nothing found",
    ru: "Ничего не найдено"
  },
  jump_to_page: {
    uk: "Перехід до сторінки",
    en: "Jump to page",
    ru: "Переход к странице"
  },
  jump: {
    uk: "Перейти",
    en: "Jump",
    ru: "Перейти"
  },
  copied: {
    uk: "Текст скопійовано",
    en: "Text copied",
    ru: "Текст скопирован"
  },
  copy_fail: {
    uk: "Не вдалося скопіювати",
    en: "Failed to copy",
    ru: "Не удалось скопировать"
  },
  share_file: {
    uk: "Поділитися файлом",
    en: "Share file",
    ru: "Поделиться файлом"
  },
  share_fail: {
    uk: "Не вдалося поділитися",
    en: "Failed to share",
    ru: "Не удалось поделиться"
  },
  open_ext: {
    uk: "Відкрити в іншій програмі",
    en: "Open in another app",
    ru: "Открыть в приложении"
  },
  open_fail: {
    uk: "Не вдалося відкрити",
    en: "Failed to open",
    ru: "Не удалось открыть"
  },
  about_file: {
    uk: "Про файл",
    en: "File info",
    ru: "О файле"
  },
  menu_title: {
    uk: "Налаштування",
    en: "Settings",
    ru: "Настройки"
  },
  pages_short: {
    uk: "стор.",
    en: "pages",
    ru: "стр."
  },
  // Menu entries
  menu_search: {
    uk: "Пошук…",
    en: "Search…",
    ru: "Поиск…"
  },
  menu_search_reset: {
    uk: "Скинути пошук",
    en: "Reset search",
    ru: "Сбросить поиск"
  },
  menu_jump: {
    uk: "Перейти до сторінки…",
    en: "Jump to page…",
    ru: "Перейти к странице…"
  },
  menu_start: {
    uk: "На початок",
    en: "To start",
    ru: "В начало"
  },
  menu_end: {
    uk: "В кінець",
    en: "To end",
    ru: "В конец"
  },
  menu_night: {
    uk: "Нічний режим",
    en: "Night mode",
    ru: "Ночной режим"
  },
  menu_rotate: {
    uk: "Поворот на 90°",
    en: "Rotate 90°",
    ru: "Поворот на 90°"
  },
  menu_scale: {
    uk: "Масштаб",
    en: "Scale",
    ru: "Масштаб"
  },
  scale_screen: {
    uk: "по екрану",
    en: "to screen",
    ru: "по экрану"
  },
  scale_width: {
    uk: "по ширині екрана",
    en: "to screen width",
    ru: "по ширине экрана"
  },
  menu_font: {
    uk: "Шрифт",
    en: "Font",
    ru: "Шрифт"
  },
  menu_font_larger: {
    uk: "Розмір тексту: більший",
    en: "Text size: larger",
    ru: "Размер текста: крупнее"
  },
  menu_font_smaller: {
    uk: "Розмір тексту: менший",
    en: "Text size: smaller",
    ru: "Размер текста: мельче"
  },
  menu_wrap: {
    uk: "Перенесення рядків",
    en: "Line wrapping",
    ru: "Перенос строк"
  },
  menu_theme: {
    uk: "Тема",
    en: "Theme",
    ru: "Тема"
  },
  menu_encoding: {
    uk: "Кодування",
    en: "Encoding",
    ru: "Кодировка"
  },
  menu_copy_page: {
    uk: "Скопіювати сторінку",
    en: "Copy page",
    ru: "Скопировать страницу"
  },
  menu_copy_all: {
    uk: "Скопіювати весь текст",
    en: "Copy entire text",
    ru: "Скопировать весь текст"
  },
  menu_zoom_in: {
    uk: "Збільшити масштаб",
    en: "Zoom in",
    ru: "Увеличить масштаб"
  },
  menu_zoom_out: {
    uk: "Зменшити масштаб",
    en: "Zoom out",
    ru: "Уменьшить масштаб"
  },
  on: {
    uk: "увімк.",
    en: "on",
    ru: "вкл"
  },
  off: {
    uk: "вимк.",
    en: "off",
    ru: "выкл"
  },
  // Info fields
  info_name: {
    uk: "Ім'я",
    en: "Name",
    ru: "Имя"
  },
  info_size: {
    uk: "Розмір",
    en: "Size",
    ru: "Размер"
  },
  info_format: {
    uk: "Формат",
    en: "Format",
    ru: "Формат"
  },
  info_pages: {
    uk: "Сторінок",
    en: "Pages",
    ru: "Страниц"
  },
  info_resolution: {
    uk: "Роздільна здатність",
    en: "Resolution",
    ru: "Разрешение"
  },
  info_encoding: {
    uk: "Кодування",
    en: "Encoding",
    ru: "Кодировка"
  },
  info_mime: {
    uk: "Тип",
    en: "Type",
    ru: "Тип"
  },
  info_path: {
    uk: "Шлях",
    en: "Path",
    ru: "Путь"
  },
  // Units & Themes
  units: {
    uk: ["Б", "КБ", "МБ", "ГБ"],
    en: ["B", "KB", "MB", "GB"],
    ru: ["Б", "КБ", "МБ", "ГБ"]
  },
  theme_dark: {
    uk: "темна",
    en: "dark",
    ru: "тёмная"
  },
  theme_light: {
    uk: "світла",
    en: "light",
    ru: "светлая"
  },
  theme_sepia: {
    uk: "сепія",
    en: "sepia",
    ru: "сепия"
  },
  font_default: {
    uk: "звичайний",
    en: "default",
    ru: "обычный"
  },
  font_serif: {
    uk: "із засічками",
    en: "serif",
    ru: "с засечками"
  },
  font_mono: {
    uk: "моноширинний",
    en: "monospace",
    ru: "моноширинный"
  },
  enc_auto: {
    uk: "Авто",
    en: "Auto",
    ru: "Авто"
  },
  // Parser text
  empty_doc: {
    uk: "(документ порожній)",
    en: "(document is empty)",
    ru: "(документ пуст)"
  },
  cut_text: {
    uk: "… файл обрізано (показано перші {0} МБ)",
    en: "… file truncated (showing first {0} MB)",
    ru: "… файл обрезан (показаны первые {0} МБ)"
  },
  archive_summary: {
    uk: "Записів: {0} (папок: {1}), у розпакованому вигляді: {2}",
    en: "Entries: {0} (folders: {1}), uncompressed size: {2}",
    ru: "Записей: {0} (папок: {1}), в распакованном виде: {2}"
  },
  archive_password: {
    uk: "[пароль] ",
    en: "[password] ",
    ru: "[пароль] "
  },
  archive_more: {
    uk: "… показано перші {0} записів",
    en: "… showing first {0} entries",
    ru: "… показаны первые {0} записей"
  },
  format_image: {
    uk: "Зображення",
    en: "Image",
    ru: "Изображение"
  },
  format_text: {
    uk: "Текст",
    en: "Text",
    ru: "Текст"
  },
  format_eml: {
    uk: "Лист",
    en: "Email",
    ru: "Письмо"
  },
  format_archive: {
    uk: "Архів",
    en: "Archive",
    ru: "Архив"
  },
  format_file: {
    uk: "Файл",
    en: "File",
    ru: "Файл"
  },
  email_from: {
    uk: "Від",
    en: "From",
    ru: "От"
  },
  email_to: {
    uk: "Кому",
    en: "To",
    ru: "Кому"
  },
  email_cc: {
    uk: "Копія",
    en: "Cc",
    ru: "Копия"
  },
  email_subject: {
    uk: "Тема",
    en: "Subject",
    ru: "Тема"
  },
  email_date: {
    uk: "Дата",
    en: "Date",
    ru: "Дата"
  },
  sheet_default: {
    uk: "Аркуш 1",
    en: "Sheet 1",
    ru: "Лист 1"
  },
  sheet_empty: {
    uk: "(порожній аркуш)",
    en: "(empty sheet)",
    ru: "(пустой лист)"
  },
  slide_n: {
    uk: "Слайд {0}",
    en: "Slide {0}",
    ru: "Слайд {0}"
  },
  no_text: {
    uk: "(немає тексту)",
    en: "(no text)",
    ru: "(нет текста)"
  },
  empty_presentation: {
    uk: "(презентація порожня)",
    en: "(empty presentation)",
    ru: "(пустая презентация)"
  },
  csv_cut: {
    uk: "… показано перші {0} рядків",
    en: "… showing first {0} rows",
    ru: "… показаны первые {0} строк"
  },
  ipynb_image: {
    uk: "зображення",
    en: "image",
    ru: "изображение"
  },
  err_empty_pdf: {
    uk: "Порожній PDF",
    en: "Empty PDF",
    ru: "Пустой PDF"
  },
  err_decode_image: {
    uk: "Не вдалося декодувати зображення",
    en: "Failed to decode image",
    ru: "Не удалось декодировать изображение"
  },
  err_zip_entry: {
    uk: "Не знайдено файл усередині архіву: {0}",
    en: "File not found inside archive: {0}",
    ru: "Не найден файл внутри архива: {0}"
  },
  err_epub_manifest: {
    uk: "Не знайдено файл опису книги",
    en: "Book description file not found",
    ru: "Не найден файл описания книги"
  },
  err_no_text_in_book: {
    uk: "У книзі немає тексту",
    en: "No text found in book",
    ru: "В книге нет текста"
  },
  err_unknown_format: {
    uk: "Невідомий формат документа: {0}",
    en: "Unknown document format: {0}",
    ru: "Неизвестный формат документа: {0}"
  }
};
function t(key, lang) {
  const l = lang ?? currentLang();
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[l] ?? entry.uk ?? entry.en;
}
function tf(key, ...args) {
  let str = String(t(key));
  for (let i = 0; i < args.length; i++) {
    str = str.replace(new RegExp(`\\{${i}\\}`, "g"), String(args[i]));
  }
  return str;
}
function formatLabel(fmt, ext) {
  if (fmt === "web") {
    const e = (ext ?? "").toLowerCase();
    if (e === "md" || e === "markdown" || e === "mdown") return "Markdown";
    if (e === "svg") return "SVG";
    return "HTML";
  }
  switch (fmt) {
    case "image":
      return t("format_image");
    case "text":
      return t("format_text");
    case "eml":
      return t("format_eml");
    case "archive":
      return t("format_archive");
    case "pdf":
      return "PDF";
    case "csv":
      return "CSV";
    case "json":
      return "JSON";
    case "ipynb":
      return "Jupyter";
    case "docx":
      return "DOCX";
    case "xlsx":
      return "Excel";
    case "pptx":
      return "PowerPoint";
    case "odf":
      return "OpenDocument";
    case "rtf":
      return "RTF";
    case "epub":
      return "EPUB";
    case "fb2":
      return "FB2";
    default:
      return t("format_file");
  }
}

// src/jvm.ts
var jvmLoaded = false;
var View;
var MotionEvent;
var Gravity;
var Dialog;
var FrameLayout;
var LinearLayout;
var FLP;
var LLP;
var TextView;
var EditText;
var ImageView;
var ScaleType;
var ScrollView;
var HScrollView;
var Toast;
var WebView;
var InputType;
var SpannableString;
var BgSpan;
var GradientDrawable;
var ColorDrawable;
var Matrix;
var RectF;
var Bitmap;
var BitmapConfig;
var BitmapFactory;
var BFOptions;
var ColorMatrix;
var ColorMatrixColorFilter;
var Typeface;
var TruncateAt;
var PdfRenderer;
var PdfPage;
var ExifInterface;
var ParcelFileDescriptor;
var JFile;
var JString;
var Intent;
var ClipData;
var ClipboardManager;
var ScaleGestureDetector;
var GestureDetector;
var RStyle;
var AlertBuilder;
var AndroidUtilities;
var FileLoader;
var UserConfig;
var FileProvider;
var FileInputStream;
var ByteArrayOutputStream;
var ZipFile;
var Looper;
var Handler;
var Activity;
var MessageObject;
var TLObject;
var uiHandler = null;
var callbackSeq = 1;
var callbacks = /* @__PURE__ */ new Map();
function registerCallback(fn) {
  const id = callbackSeq++;
  callbacks.set(id, fn);
  return id;
}
function unregisterCallback(id) {
  callbacks.delete(id);
}
var ClickListenerCls;
var DlgClickListenerCls;
var DismissListenerCls;
var KeyListenerCls;
var TouchListenerCls;
var LayoutListenerCls;
var ScaleListenerCls;
var GestureListenerCls;
function initJvm() {
  if (jvmLoaded) return;
  jvmLoaded = true;
  View = inu.jvm.cls("android.view.View");
  MotionEvent = inu.jvm.cls("android.view.MotionEvent");
  Gravity = inu.jvm.cls("android.view.Gravity");
  Dialog = inu.jvm.cls("android.app.Dialog");
  FrameLayout = inu.jvm.cls("android.widget.FrameLayout");
  LinearLayout = inu.jvm.cls("android.widget.LinearLayout");
  FLP = inu.jvm.cls("android.widget.FrameLayout$LayoutParams");
  LLP = inu.jvm.cls("android.widget.LinearLayout$LayoutParams");
  TextView = inu.jvm.cls("android.widget.TextView");
  EditText = inu.jvm.cls("android.widget.EditText");
  ImageView = inu.jvm.cls("android.widget.ImageView");
  ScaleType = inu.jvm.cls("android.widget.ImageView$ScaleType");
  ScrollView = inu.jvm.cls("android.widget.ScrollView");
  HScrollView = inu.jvm.cls("android.widget.HorizontalScrollView");
  Toast = inu.jvm.cls("android.widget.Toast");
  WebView = inu.jvm.cls("android.webkit.WebView");
  InputType = inu.jvm.cls("android.text.InputType");
  SpannableString = inu.jvm.cls("android.text.SpannableString");
  BgSpan = inu.jvm.cls("android.text.style.BackgroundColorSpan");
  GradientDrawable = inu.jvm.cls("android.graphics.drawable.GradientDrawable");
  ColorDrawable = inu.jvm.cls("android.graphics.drawable.ColorDrawable");
  Matrix = inu.jvm.cls("android.graphics.Matrix");
  RectF = inu.jvm.cls("android.graphics.RectF");
  Bitmap = inu.jvm.cls("android.graphics.Bitmap");
  BitmapConfig = inu.jvm.cls("android.graphics.Bitmap$Config");
  BitmapFactory = inu.jvm.cls("android.graphics.BitmapFactory");
  BFOptions = inu.jvm.cls("android.graphics.BitmapFactory$Options");
  ColorMatrix = inu.jvm.cls("android.graphics.ColorMatrix");
  ColorMatrixColorFilter = inu.jvm.cls("android.graphics.ColorMatrixColorFilter");
  Typeface = inu.jvm.cls("android.graphics.Typeface");
  TruncateAt = inu.jvm.cls("android.text.TextUtils$TruncateAt");
  PdfRenderer = inu.jvm.cls("android.graphics.pdf.PdfRenderer");
  PdfPage = inu.jvm.cls("android.graphics.pdf.PdfRenderer$Page");
  ExifInterface = inu.jvm.cls("android.media.ExifInterface");
  ParcelFileDescriptor = inu.jvm.cls("android.os.ParcelFileDescriptor");
  JFile = inu.jvm.cls("java.io.File");
  JString = inu.jvm.cls("java.lang.String");
  Intent = inu.jvm.cls("android.content.Intent");
  ClipData = inu.jvm.cls("android.content.ClipData");
  ClipboardManager = inu.jvm.cls("android.content.ClipboardManager");
  ScaleGestureDetector = inu.jvm.cls("android.view.ScaleGestureDetector");
  GestureDetector = inu.jvm.cls("android.view.GestureDetector");
  RStyle = inu.jvm.cls("android.R$style");
  AlertBuilder = inu.jvm.cls("android.app.AlertDialog$Builder");
  AndroidUtilities = inu.jvm.cls("org.telegram.messenger.AndroidUtilities");
  FileLoader = inu.jvm.cls("org.telegram.messenger.FileLoader");
  UserConfig = inu.jvm.cls("org.telegram.messenger.UserConfig");
  FileProvider = inu.jvm.cls("androidx.core.content.FileProvider");
  FileInputStream = inu.jvm.cls("java.io.FileInputStream");
  ByteArrayOutputStream = inu.jvm.cls("java.io.ByteArrayOutputStream");
  ZipFile = inu.jvm.cls("java.util.zip.ZipFile");
  Looper = inu.jvm.cls("android.os.Looper");
  Handler = inu.jvm.cls("android.os.Handler");
  Activity = inu.jvm.cls("android.app.Activity");
  MessageObject = inu.jvm.cls("org.telegram.messenger.MessageObject");
  TLObject = inu.jvm.cls("org.telegram.tgnet.TLObject");
  uiHandler = new Handler(Looper.callStatic("getMainLooper"));
  ClickListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls("android.view.View$OnClickListener")],
    fields: { cbId: "int" },
    methods: {
      onClick: (self, v) => {
        const id = self.getField("cbId");
        callbacks.get(id)?.(v);
      }
    }
  });
  DlgClickListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls("android.content.DialogInterface$OnClickListener")],
    fields: { cbId: "int" },
    methods: {
      onClick: (self, dialog, which) => {
        const id = self.getField("cbId");
        callbacks.get(id)?.(dialog, which);
      }
    }
  });
  DismissListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls("android.content.DialogInterface$OnDismissListener")],
    fields: { cbId: "int" },
    methods: {
      onDismiss: (self, dialog) => {
        const id = self.getField("cbId");
        callbacks.get(id)?.(dialog);
      }
    }
  });
  KeyListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls("android.content.DialogInterface$OnKeyListener")],
    fields: { cbId: "int" },
    methods: {
      onKey: {
        params: ["android.content.DialogInterface", "int", "android.view.KeyEvent"],
        returns: "boolean",
        body: (self, dialog, keyCode, event) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.(keyCode, event));
        }
      }
    }
  });
  TouchListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls("android.view.View$OnTouchListener")],
    fields: { cbId: "int" },
    methods: {
      onTouch: {
        params: ["android.view.View", "android.view.MotionEvent"],
        returns: "boolean",
        body: (self, view, event) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.(event));
        }
      }
    }
  });
  LayoutListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls("android.view.View$OnLayoutChangeListener")],
    fields: { cbId: "int" },
    methods: {
      onLayoutChange: (self, v, l, t2, r, b, ol, ot, or, ob) => {
        const id = self.getField("cbId");
        callbacks.get(id)?.(l, t2, r, b, ol, ot, or, ob);
      }
    }
  });
  ScaleListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls("android.view.ScaleGestureDetector$OnScaleGestureListener")],
    fields: { cbId: "int" },
    methods: {
      onScale: {
        params: ["android.view.ScaleGestureDetector"],
        returns: "boolean",
        body: (self, detector) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("scale", detector));
        }
      },
      onScaleBegin: {
        params: ["android.view.ScaleGestureDetector"],
        returns: "boolean",
        body: (self, detector) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("scaleBegin", detector) ?? true);
        }
      },
      onScaleEnd: {
        params: ["android.view.ScaleGestureDetector"],
        returns: "void",
        body: (self, detector) => {
          const id = self.getField("cbId");
          callbacks.get(id)?.("scaleEnd", detector);
        }
      }
    }
  });
  GestureListenerCls = inu.jvm.defineClass({
    interfaces: [
      inu.jvm.cls("android.view.GestureDetector$OnGestureListener"),
      inu.jvm.cls("android.view.GestureDetector$OnDoubleTapListener")
    ],
    fields: { cbId: "int" },
    methods: {
      onDown: {
        params: ["android.view.MotionEvent"],
        returns: "boolean",
        body: (self, e) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("down", e) ?? true);
        }
      },
      onShowPress: (self, e) => {
        const id = self.getField("cbId");
        callbacks.get(id)?.("showPress", e);
      },
      onSingleTapUp: {
        params: ["android.view.MotionEvent"],
        returns: "boolean",
        body: (self, e) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("singleTapUp", e));
        }
      },
      onScroll: {
        params: ["android.view.MotionEvent", "android.view.MotionEvent", "float", "float"],
        returns: "boolean",
        body: (self, e1, e2, dx, dy) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("scroll", e1, e2, dx, dy));
        }
      },
      onLongPress: (self, e) => {
        const id = self.getField("cbId");
        callbacks.get(id)?.("longPress", e);
      },
      onFling: {
        params: ["android.view.MotionEvent", "android.view.MotionEvent", "float", "float"],
        returns: "boolean",
        body: (self, e1, e2, vx, vy) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("fling", e1, e2, vx, vy));
        }
      },
      onSingleTapConfirmed: {
        params: ["android.view.MotionEvent"],
        returns: "boolean",
        body: (self, e) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("singleTapConfirmed", e) ?? true);
        }
      },
      onDoubleTap: {
        params: ["android.view.MotionEvent"],
        returns: "boolean",
        body: (self, e) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("doubleTap", e) ?? true);
        }
      },
      onDoubleTapEvent: {
        params: ["android.view.MotionEvent"],
        returns: "boolean",
        body: (self, e) => {
          const id = self.getField("cbId");
          return Boolean(callbacks.get(id)?.("doubleTapEvent", e));
        }
      }
    }
  });
}
function createClickListener(fn) {
  const id = registerCallback(fn);
  const listener = new ClickListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function createDlgClickListener(fn) {
  const id = registerCallback(fn);
  const listener = new DlgClickListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function createDismissListener(fn) {
  const id = registerCallback(fn);
  const listener = new DismissListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function createKeyListener(fn) {
  const id = registerCallback(fn);
  const listener = new KeyListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function createTouchListener(fn) {
  const id = registerCallback(fn);
  const listener = new TouchListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function createLayoutListener(fn) {
  const id = registerCallback(fn);
  const listener = new LayoutListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function createScaleListener(fn) {
  const id = registerCallback(fn);
  const listener = new ScaleListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function createGestureListener(fn) {
  const id = registerCallback(fn);
  const listener = new GestureListenerCls();
  listener.setField("cbId", id);
  return [listener, () => unregisterCallback(id)];
}
function runOnUI(fn) {
  if (uiHandler) {
    uiHandler.call("post", inu.jvm.runnable(fn));
  }
}
function dp(density, val) {
  return Math.round(val * density) | 0;
}
function rounded(color, radius) {
  const gd = new GradientDrawable();
  gd.call("setColor", color | 0);
  gd.call("setCornerRadius", Number(radius));
  return gd;
}
function fillWhite(bmp) {
  try {
    bmp.call("eraseColor(I)V", -1);
    return;
  } catch (e) {
    console.warn("DocViewer eraseColor failed, using canvas:", e);
  }
  try {
    const Canvas = inu.jvm.cls("android.graphics.Canvas");
    const c = new Canvas(bmp);
    c.call("drawColor(I)V", -1);
  } catch (e) {
    console.warn("DocViewer canvas fill failed:", e);
  }
}
function humanSize(bytes) {
  let n = Number(bytes);
  const units = t("units");
  const last = units[units.length - 1];
  for (const u of units) {
    if (n < 1024 || u === last) {
      return u === units[0] ? `${Math.round(n)} ${u}` : `${n.toFixed(1)} ${u}`;
    }
    n /= 1024;
  }
  return `${bytes} ${units[0]}`;
}
function fmtErr(e) {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`.slice(0, 400);
  }
  return String(e).slice(0, 400);
}

// src/types.ts
function argb(a, r, g, b) {
  const v = (a & 255) << 24 | (r & 255) << 16 | (g & 255) << 8 | b & 255;
  return v | 0;
}
var C_BG = argb(255, 9, 9, 13);
var C_BAR = argb(215, 22, 22, 30);
var C_PILL = argb(225, 30, 30, 42);
var C_BTN = argb(255, 44, 44, 60);
var C_TEXT = argb(255, 241, 241, 246);
var C_SUB = argb(255, 150, 152, 170);
var C_ERR = argb(255, 255, 140, 140);
var THEMES = [
  {
    name: "dark",
    bg: argb(255, 9, 9, 13),
    fg: argb(255, 232, 232, 238),
    hit: argb(255, 120, 98, 10),
    cur: argb(255, 214, 120, 0),
    cssBg: "#09090d",
    cssFg: "#e8e8ee",
    cssAlt: "#1c1c26"
  },
  {
    name: "light",
    bg: argb(255, 250, 250, 247),
    fg: argb(255, 28, 28, 32),
    hit: argb(255, 255, 230, 120),
    cur: argb(255, 255, 170, 60),
    cssBg: "#fafaf7",
    cssFg: "#1c1c20",
    cssAlt: "#ecece6"
  },
  {
    name: "sepia",
    bg: argb(255, 244, 236, 216),
    fg: argb(255, 67, 52, 34),
    hit: argb(255, 255, 222, 110),
    cur: argb(255, 255, 165, 55),
    cssBg: "#f4ecd8",
    cssFg: "#433422",
    cssAlt: "#e8dcc0"
  }
];
var ENCODINGS = [
  ["Auto", null],
  ["UTF-8", "utf-8"],
  ["Windows-1251", "windows-1251"],
  ["KOI8-R", "koi8-r"],
  ["CP866", "cp866"],
  ["UTF-16", "utf-16"],
  ["Windows-1252", "windows-1252"]
];
var MAX_TEXT_BYTES = 12 * 1024 * 1024;
var MAX_WEB_BYTES = 4 * 1024 * 1024;
var MAX_UNPACKED = 64 * 1024 * 1024;
var MAX_ROWS = 3e3;
var MAX_COLS = 60;
var MAX_ENTRIES = 2e4;
var MAX_HITS = 5e3;
var MAX_SPANS = 1500;
var PAGE_CHARS = 3e4;
var CELL_MAX = 40;
var EXT_FORMAT = {};
function registerExts(fmt, exts) {
  for (const e of exts.split(/\s+/)) {
    if (e) EXT_FORMAT[e.toLowerCase()] = fmt;
  }
}
registerExts("pdf", "pdf");
registerExts("image", "jpg jpeg jpe png webp bmp gif heic heif avif ico dib");
registerExts("web", "html htm xhtml svg md markdown mdown");
registerExts("csv", "csv tsv tab");
registerExts("json", "json geojson");
registerExts("ipynb", "ipynb");
registerExts("docx", "docx docm dotx dotm");
registerExts("xlsx", "xlsx xlsm xltx xltm");
registerExts("pptx", "pptx pptm ppsx potx");
registerExts("odf", "odt ott ods ots odp otp");
registerExts("rtf", "rtf");
registerExts("eml", "eml");
registerExts("epub", "epub");
registerExts("fb2", "fb2");
registerExts("archive", "zip jar aar");
registerExts("text", [
  "txt text log jsonl ndjson xml plist yaml yml toml ini cfg conf env properties gradle cmake",
  "srt vtt ass ssa lrc tex bib rst adoc org nfo diff patch vcf ics gpx kml tcx opml rss atom",
  "xsd xsl xslt wsdl plugin py pyw pyi js mjs cjs jsx ts tsx java kt kts scala groovy c h cpp",
  "cc cxx hpp hh cs go rs swift m mm php rb pl lua r dart sh bash zsh fish bat cmd ps1 psm1",
  "vbs sql css scss sass less vue svelte gql graphql proto tf hcl asm s v sv vhd vhdl hs ml",
  "clj ex exs erl jl nim zig dockerfile makefile mk ninja gitignore gitattributes editorconfig",
  "lock sum mod pro pri qml smali csproj sln vcxproj xaml aidl pem crt csr pub asc reg inf",
  "desktop service ahk au3"
].join(" "));
var TEXT_NAMES = /* @__PURE__ */ new Set([
  "readme",
  "license",
  "licence",
  "changelog",
  "makefile",
  "dockerfile",
  "gemfile",
  "procfile",
  "authors",
  "contributors",
  "todo",
  "notice",
  "copying",
  "vagrantfile",
  "jenkinsfile",
  "cmakelists",
  "requirements"
]);
var MIME_FORMAT = {
  "application/pdf": "pdf",
  "image/svg+xml": "web",
  "text/html": "web",
  "text/markdown": "web",
  "text/csv": "csv",
  "text/tab-separated-values": "csv",
  "application/json": "json",
  "application/rtf": "rtf",
  "text/rtf": "rtf",
  "application/epub+zip": "epub",
  "application/x-fictionbook+xml": "fb2",
  "message/rfc822": "eml",
  "application/zip": "archive",
  "application/x-zip-compressed": "archive",
  "application/java-archive": "archive",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.oasis.opendocument.text": "odf",
  "application/vnd.oasis.opendocument.spreadsheet": "odf",
  "application/vnd.oasis.opendocument.presentation": "odf"
};
var TEXTUAL = /* @__PURE__ */ new Set(["text", "csv", "json", "ipynb"]);
var KIND = {
  pdf: "pdf",
  image: "image",
  web: "web"
};
var SETTING_OF = {
  pdf: "pdf",
  image: "image",
  web: "web",
  archive: "archive",
  text: "text",
  csv: "text",
  json: "text",
  ipynb: "text",
  docx: "docs",
  xlsx: "docs",
  pptx: "docs",
  odf: "docs",
  rtf: "docs",
  eml: "docs",
  epub: "books",
  fb2: "books"
};
var MD_EXT = /* @__PURE__ */ new Set(["md", "markdown", "mdown"]);
function fileExt(name) {
  const low = name.toLowerCase();
  const idx = low.lastIndexOf(".");
  return idx < 0 ? "" : low.slice(idx + 1);
}
function detectFormat(name, mime) {
  const low = name.toLowerCase();
  const ml = (mime ?? "").split(";")[0].trim().toLowerCase();
  if (["application/x-tar", "application/gzip", "application/x-gzip", "application/x-bzip2", "application/x-xz"].includes(ml)) return null;
  if (/\.(?:tar(?:\.(?:gz|bz2|xz))?|tgz|tbz2|txz)$/.test(low)) return null;
  const ext = fileExt(low);
  if (EXT_FORMAT[ext]) {
    return EXT_FORMAT[ext];
  }
  if (MIME_FORMAT[ml]) {
    return MIME_FORMAT[ml];
  }
  if (ml.includes("pdf")) {
    return "pdf";
  }
  if (ml.startsWith("image/")) {
    const sub = ml.split("/")[1]?.split("+")[0];
    if (["jpeg", "png", "webp", "gif", "bmp", "heic", "heif", "avif", "x-icon", "vnd.microsoft.icon", "x-ms-bmp"].includes(sub)) {
      return "image";
    }
  }
  const base = low.replace(/^\./, "").split(".")[0];
  if (low.startsWith(".") && !low.slice(1).includes(".") || TEXT_NAMES.has(base) && !low.slice(1).includes(".")) {
    return "text";
  }
  if (!ext || ml === "" || ml === "application/octet-stream" || ml.startsWith("text/") || ml.endsWith("json") || ml.endsWith("xml") || ml.endsWith("javascript") || ml.endsWith("yaml") || ml.endsWith("x-sh") || ml.endsWith("x-sql") || ml.endsWith("toml") || ml.endsWith("x-httpd-php")) {
    return "sniff";
  }
  return null;
}
var Doc = class {
  pages;
  font;
  wrap;
  sep;
  raw;
  enc;
  note;
  constructor(pages, font = 0, wrap = true, sep = "\n\n", raw = false, enc = null, note) {
    this.pages = pages.length > 0 ? pages : [""];
    this.font = font;
    this.wrap = wrap;
    this.sep = sep;
    this.raw = raw;
    this.enc = enc;
    this.note = note;
  }
};

// src/parsers/text.ts
var readChunk = null;
var decoder = null;
function decodeChunk(bytes, charset) {
  if (!decoder) {
    const StringClass = inu.jvm.cls("java.lang.String");
    decoder = inu.jvm.defineClass({ staticMethods: { decode: {
      params: ["byte[]", "java.lang.String"],
      returns: "java.lang.String",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (raw: any, encoding: any) {
                return new StringClass(raw, encoding)
              }`,
        captures: ["StringClass"],
        slots: 0,
        code: [
          ["capture", 0],
          ["arg", [0]],
          ["arg", [1]],
          ["new", 0, [1, 2]],
          ["return", 3]
        ],
        tries: []
      }, [StringClass])
    } } });
  }
  return String(decoder.callStatic("decode", bytes, charset));
}
function streamChunk(stream, count) {
  if (!readChunk) {
    const buffer = new Uint8Array(65536);
    const Arrays = inu.jvm.cls("java.util.Arrays");
    readChunk = inu.jvm.defineClass({ staticMethods: { read: {
      params: ["java.io.InputStream", "int"],
      returns: "byte[]",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (input: any, size: any) {
              const n = input.read(buffer, 0, size)
              if (n < 0) return null
              if (n === 0) {
                const value = input.read()
                if (value < 0) return null
                buffer[0] = value
                return Arrays.copyOf(buffer, 1)
              }
              return Arrays.copyOf(buffer, n)
              }`,
        captures: ["buffer", "Arrays"],
        slots: 0,
        code: [
          ["capture", 0],
          ["capture", 1],
          ["arg", [0]],
          ["arg", [1]],
          ["call", 2, ["read"], [0, [0], 3]],
          ["lt", 4, [0]],
          ["jumpIfFalsy", 5, 8],
          ["return", [null]],
          ["eq", 4, [0]],
          ["jumpIfFalsy", 8, 17],
          ["call", 2, ["read"], []],
          ["lt", 10, [0]],
          ["jumpIfFalsy", 11, 14],
          ["return", [null]],
          ["set", 0, [0], 10],
          ["call", 1, ["copyOf"], [0, [1]]],
          ["return", 15],
          ["call", 1, ["copyOf"], [0, 4]],
          ["return", 17]
        ],
        tries: []
      }, [buffer, Arrays])
    } } });
  }
  return readChunk.callStatic("read", stream, count) ?? new Uint8Array(0);
}
function readBytes(stream, limit) {
  const chunks = [];
  let total = 0;
  while (total < limit) {
    const chunk = streamChunk(stream, Math.min(65536, limit - total));
    if (!chunk.length) break;
    chunks.push(chunk);
    total += chunk.length;
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
function readStreamBytes(stream, limit = MAX_TEXT_BYTES) {
  try {
    const bytes = readBytes(stream, limit);
    if (bytes.length === limit && Number(stream.call("read()I")) !== -1) {
      throw new Error(String(t("err_unpack_limit")));
    }
    return bytes;
  } finally {
    try {
      stream.call("close");
    } catch {
    }
  }
}
function readFileBytes(path, maxBytes = MAX_TEXT_BYTES) {
  const file = new JFile(path);
  const stream = new FileInputStream(file);
  try {
    const bytes = readBytes(stream, maxBytes);
    return { bytes, cut: Number(file.call("length")) > maxBytes };
  } finally {
    try {
      stream.call("close");
    } catch {
    }
  }
}
function looksLikeText(path) {
  try {
    const file = new JFile(path);
    if (!file.call("exists") || Number(file.call("length")) === 0) return false;
    const { bytes: head } = readFileBytes(path, 8192);
    if (!head.length) return false;
    if (head.length >= 3 && head[0] === 239 && head[1] === 187 && head[2] === 191) return true;
    if (head.length >= 2 && head[0] === 255 && head[1] === 254) return true;
    if (head.length >= 2 && head[0] === 254 && head[1] === 255) return true;
    for (let i = 0; i < head.length; i++) {
      if (head[i] === 0) return false;
    }
    let ctrl = 0;
    for (let i = 0; i < head.length; i++) {
      const b = head[i];
      if (b < 9 || b > 13 && b < 32 && b !== 27) {
        ctrl++;
      }
    }
    return ctrl * 50 < head.length;
  } catch {
    return false;
  }
}
function decodeBytes(raw, charset) {
  if (/^utf-?8$/i.test(charset)) return new TextDecoder("utf-8").decode(raw);
  if (/^utf-?16$/i.test(charset)) {
    const little = raw[0] !== 254 || raw[1] !== 255;
    charset = little ? "utf-16le" : "utf-16be";
  }
  const chunks = [];
  for (let offset = 0; offset < raw.length; ) {
    let end = Math.min(raw.length, offset + 65536);
    if (end < raw.length && /^utf-?16(?:le|be)$/i.test(charset)) {
      const little = /le$/i.test(charset);
      const unit = little ? raw[end - 2] | raw[end - 1] << 8 : raw[end - 2] << 8 | raw[end - 1];
      if (unit >= 55296 && unit <= 56319) end -= 2;
    }
    chunks.push(decodeChunk(raw.subarray(offset, end), charset));
    offset = end;
  }
  return chunks.join("");
}
function decodeText(raw, enc) {
  let text = "";
  let used = enc ?? "utf-8";
  if (enc) {
    try {
      text = decodeBytes(raw, enc);
    } catch {
      text = decodeBytes(raw, "utf-8");
      used = "utf-8";
    }
  } else {
    if (raw.length >= 3 && raw[0] === 239 && raw[1] === 187 && raw[2] === 191) {
      text = decodeBytes(raw.subarray(3), "utf-8");
      used = "utf-8";
    } else if (raw.length >= 2 && (raw[0] === 255 && raw[1] === 254 || raw[0] === 254 && raw[1] === 255)) {
      text = decodeBytes(raw, "utf-16");
      used = "utf-16";
    } else {
      try {
        for (let i = 0; i < raw.length; ) {
          const first = raw[i++];
          if (first < 128) continue;
          const count = first >= 194 && first <= 223 ? 1 : first >= 224 && first <= 239 ? 2 : first >= 240 && first <= 244 ? 3 : -1;
          if (count < 0 || i + count > raw.length) throw new Error("Invalid UTF-8");
          const next = raw[i];
          if (first === 224 && next < 160 || first === 237 && next >= 160 || first === 240 && next < 144 || first === 244 && next >= 144) throw new Error("Invalid UTF-8");
          for (let n = 0; n < count; n++) if ((raw[i++] & 192) !== 128) throw new Error("Invalid UTF-8");
        }
        const decoded = new TextDecoder("utf-8").decode(raw);
        text = decoded;
        used = "utf-8";
      } catch {
        try {
          text = decodeBytes(raw, "windows-1251");
          used = "windows-1251";
        } catch {
          text = decodeBytes(raw, "utf-8");
          used = "utf-8";
        }
      }
    }
  }
  if (text.startsWith("\uFEFF")) {
    text = text.slice(1);
  }
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\0/g, "");
  return [text, used];
}
function paginate(text, size = PAGE_CHARS) {
  if (!Number.isFinite(size) || size < 1) throw new RangeError("Invalid page size");
  size = Math.floor(size);
  if (text.length <= size) {
    return [text];
  }
  const pages = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    let j = Math.min(n, i + size);
    if (j < n) {
      const k = text.lastIndexOf("\n", j);
      if (k > i + size / 2) {
        j = k + 1;
      }
    }
    if (j < n && text.charCodeAt(j - 1) >= 55296 && text.charCodeAt(j - 1) <= 56319 && text.charCodeAt(j) >= 56320 && text.charCodeAt(j) <= 57343) {
      j += j - i === 1 ? 1 : -1;
    }
    pages.push(text.slice(i, j));
    i = j;
  }
  return pages;
}
var NUM_RE = /^-?[\d\s.,]+%?$/;
function trimRows(rows) {
  const out = [];
  for (const r of rows) {
    const row = [...r];
    while (row.length > 0 && !row[row.length - 1]) {
      row.pop();
    }
    out.push(row);
  }
  while (out.length > 0 && out[out.length - 1].length === 0) {
    out.pop();
  }
  return out;
}
function formatRows(rows, pad) {
  const clean = rows.map((r) => r.map((c) => (c ?? "").replace(/\s+/g, " ").trim()));
  if (!pad) {
    return clean.map((r) => r.join(" │ ")).join("\n");
  }
  const capped = clean.map((r) => r.map((c) => {
    if (c.length <= CELL_MAX) return c;
    let end = CELL_MAX - 1;
    if (c.charCodeAt(end - 1) >= 55296 && c.charCodeAt(end - 1) <= 56319 && c.charCodeAt(end) >= 56320 && c.charCodeAt(end) <= 57343) end--;
    return `${c.slice(0, end)}…`;
  }));
  let cols = 0;
  for (const r of capped) {
    cols = Math.max(cols, r.length);
  }
  const widths = new Array(cols).fill(0);
  for (const r of capped) {
    for (let i = 0; i < r.length; i++) {
      widths[i] = Math.max(widths[i], r[i].length);
    }
  }
  const lines = [];
  for (const r of capped) {
    const cells = r.map((c, i) => {
      const w = widths[i];
      if (NUM_RE.test(c)) {
        return c.padStart(w);
      }
      return c.padEnd(w);
    });
    lines.push(cells.join(" │ ").trimEnd());
  }
  return lines.join("\n");
}
function csvTable(text, ext) {
  text = text.replace(/\r\n?/g, "\n");
  const candidates = [",", ";", "	", "|"];
  const counts = [0, 0, 0, 0];
  let quoted = false;
  let started = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      started = true;
      if (quoted && text[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted) {
      if (ch === "\n") {
        if (started) break;
      } else {
        const index = candidates.indexOf(ch);
        if (index >= 0) counts[index]++;
        if (ch.trim() || index >= 0) started = true;
      }
    }
  }
  let delim = "	";
  if (!["tsv", "tab"].includes(ext.toLowerCase())) {
    const best = Math.max(...counts);
    if (best === 0) return null;
    delim = candidates[counts.indexOf(best)];
  }
  const rows = [];
  let cut = false;
  let cells = [];
  let current = "";
  let inQuotes = false;
  let recordStarted = false;
  function cell() {
    if (cells.length < MAX_COLS) cells.push(current.trim());
    current = "";
  }
  function record() {
    cell();
    if (!recordStarted && cells.length === 1 && !cells[0]) {
      cells = [];
      return true;
    }
    if (rows.length === MAX_ROWS) {
      cut = true;
      return false;
    }
    rows.push(cells);
    cells = [];
    recordStarted = false;
    return true;
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && (inQuotes || !current.trim())) {
      recordStarted = true;
      if (inQuotes && text[i + 1] === '"') {
        if (cells.length < MAX_COLS) current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      recordStarted = true;
      cell();
    } else if (ch === "\n" && !inQuotes) {
      if (!record()) break;
    } else {
      if (ch.trim()) recordStarted = true;
      if (cells.length < MAX_COLS) current += ch;
    }
  }
  if (inQuotes) return null;
  if (!cut && (recordStarted || current || cells.length)) record();
  let body = formatRows(rows, true);
  if (cut) {
    body += `

${tf("csv_cut", MAX_ROWS)}`;
  }
  return body;
}
var ANSI_RE = /\x1B\[[0-9;]*[A-Za-z]/g;
function ipynbText(text) {
  try {
    const nb = JSON.parse(text);
    let cells = nb.cells;
    if (!cells && nb.worksheets) {
      cells = nb.worksheets.flatMap((ws) => ws.cells ?? []);
    }
    if (!Array.isArray(cells)) return text;
    const parts = [];
    for (const c of cells) {
      let src = c.source ?? c.input ?? "";
      src = Array.isArray(src) ? src.join("") : String(src);
      if (c.cell_type !== "code") {
        parts.push(src);
        continue;
      }
      const execCount = c.execution_count ?? " ";
      const block = [`In [${execCount}]:
${src}`];
      for (const o of c.outputs ?? []) {
        let chunk = "";
        if (o.output_type === "stream") {
          chunk = Array.isArray(o.text) ? o.text.join("") : String(o.text ?? "");
        } else if (o.output_type === "error") {
          chunk = Array.isArray(o.traceback) ? o.traceback.join("\n") : String(o.traceback ?? "");
        } else if (o.data) {
          chunk = o.data["text/plain"] ?? "";
          if (!chunk && Object.keys(o.data).some((k) => k.startsWith("image/"))) {
            chunk = `[${t("ipynb_image")}]`;
          }
        }
        chunk = (Array.isArray(chunk) ? chunk.join("") : String(chunk)).replace(ANSI_RE, "").trimEnd();
        if (chunk.trim()) {
          block.push(`Out:
${chunk}`);
        }
      }
      parts.push(block.join("\n\n"));
    }
    return parts.join("\n\n────────────────────────\n\n");
  } catch {
    return text;
  }
}
function buildTextDoc(path, fmt, ext, opts, enc) {
  const { bytes, cut } = readFileBytes(path, MAX_TEXT_BYTES);
  let [text, used] = decodeText(bytes, enc);
  let font = 2;
  let wrap = opts.wrap;
  if (fmt === "json" && opts.prettyjson && text.length <= 3 * 1024 * 1024) {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
    }
  } else if (fmt === "csv" && opts.csvTable) {
    const table = csvTable(text, ext);
    if (table !== null) {
      text = table;
      wrap = false;
    }
  } else if (fmt === "ipynb") {
    text = ipynbText(text);
  } else if (fmt === "text" && ["txt", "text", "nfo", "srt", "vtt", "lrc", "rst", "adoc", "org"].includes(ext)) {
    font = 0;
  }
  if (cut) {
    const mb = String(Math.floor(MAX_TEXT_BYTES / (1024 * 1024)));
    text += `

${String(t("cut_text")).replace("{0}", mb)}`;
  }
  return new Doc(paginate(text), font, wrap, "", true, used);
}

// src/parsers/pdf.ts
function openPdf(path) {
  const pfd = ParcelFileDescriptor.callStatic(
    "open",
    new JFile(path),
    ParcelFileDescriptor.getStaticField("MODE_READ_ONLY")
  );
  let renderer = null;
  try {
    renderer = new PdfRenderer(pfd);
    const count = Number(renderer.call("getPageCount"));
    if (!Number.isInteger(count) || count < 1) throw new Error(String(t("err_empty_pdf")));
    return { renderer, pfd, count };
  } catch (error) {
    try {
      renderer?.call("close");
    } catch {
    }
    try {
      pfd.call("close");
    } catch {
    }
    throw error;
  }
}
function renderPdfPage(renderer, index, displayWidth) {
  const page = renderer.call("openPage", index);
  try {
    const pw = Number(page.call("getWidth"));
    const ph = Number(page.call("getHeight"));
    if (![pw, ph, displayWidth].every((value) => Number.isFinite(value) && value > 0)) {
      throw new Error("Invalid PDF dimensions");
    }
    let sc = Math.min(displayWidth * 2 / pw, 3200 / Math.max(pw, ph));
    const w = Math.max(1, Math.round(pw * sc));
    const h = Math.max(1, Math.round(ph * sc));
    const bmp = Bitmap.callStatic("createBitmap", w, h, BitmapConfig.getStaticField("ARGB_8888"));
    try {
      fillWhite(bmp);
      page.call("render", bmp, null, null, PdfPage.getStaticField("RENDER_MODE_FOR_DISPLAY"));
      return bmp;
    } catch (error) {
      try {
        bmp.call("recycle");
      } catch {
      }
      throw error;
    }
  } finally {
    try {
      page.call("close");
    } catch {
    }
  }
}

// src/parsers/office.ts
function zreadBytes(zip, name) {
  const entry = zip.call("getEntry", name);
  if (!entry) throw new Error(tf("err_zip_entry", name));
  const is = zip.call("getInputStream", entry);
  try {
    return readStreamBytes(is, MAX_TEXT_BYTES);
  } finally {
    try {
      is.call("close");
    } catch {
    }
  }
}
function zreadString(zip, name, charset) {
  const bytes = zreadBytes(zip, name);
  return charset ? decodeBytes(bytes, charset) : decodeXml(bytes);
}
function entities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (all, code) => {
    if (code[0] !== "#") return named[code] ?? all;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return n > 0 && n <= 1114111 && !(n >= 55296 && n <= 57343) ? String.fromCodePoint(n) : "�";
  });
}
function decodeXml(bytes) {
  let charset = "utf-8";
  if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) charset = "utf-8";
  else if (bytes[0] === 255 && bytes[1] === 254) charset = "utf-16le";
  else if (bytes[0] === 254 && bytes[1] === 255) charset = "utf-16be";
  else if (bytes[0] === 0 && bytes[1] === 60) charset = "utf-16be";
  else if (bytes[0] === 60 && bytes[1] === 0) charset = "utf-16le";
  else {
    const head = decodeBytes(bytes.subarray(0, 512), "latin1").replace(/^\u00ef\u00bb\u00bf/, "");
    const declaration = /^\s*<\?xml\b[^?]*\bencoding\s*=\s*(['"])([^'"]+)\1/i.exec(head);
    if (declaration) charset = declaration[2];
  }
  return decodeBytes(bytes, charset).replace(/^\ufeff/, "");
}
var localName = (name) => name.slice(name.lastIndexOf(":") + 1);
function parseXml(xml) {
  const root = { name: "", attrs: {}, children: [] };
  const stack = [root];
  const tokens = /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE\b(?:[^>\[]|\[[\s\S]*?\])*?>|<\/?[A-Za-z_][\w.:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>|[^<]+/g;
  let match;
  let count = 0;
  while (match = tokens.exec(xml)) {
    const token = match[0];
    const parent = stack[stack.length - 1];
    if (token.startsWith("<![CDATA[")) parent.children.push(token.slice(9, -3));
    else if (token.startsWith("<!") || token.startsWith("<?")) continue;
    else if (token.startsWith("</")) {
      const name = localName(token.slice(2, -1).trim());
      if (stack.length > 1 && parent.name === name) stack.pop();
    } else if (token[0] === "<") {
      const tag = /^<([^\s/>]+)/.exec(token);
      const node = { name: localName(tag[1]), attrs: /* @__PURE__ */ Object.create(null), children: [] };
      const attrs = /([^\s=<>/]+)\s*=\s*(['"])([\s\S]*?)\2/g;
      let attr2;
      while (attr2 = attrs.exec(token.slice(tag[0].length))) node.attrs[attr2[1]] = entities(attr2[3]);
      parent.children.push(node);
      if (++count > 25e4 || stack.length > 256) throw new Error("XML complexity limit exceeded");
      if (!/\/\s*>$/.test(token)) stack.push(node);
    } else parent.children.push(entities(token));
  }
  return root;
}
function attr(node, name) {
  return node.attrs[name] ?? Object.entries(node.attrs).find(([key]) => localName(key) === name)?.[1] ?? "";
}
function nodes(node, name) {
  const result = [];
  for (const child of node.children) if (typeof child !== "string") {
    if (child.name === name) result.push(child);
    else for (const descendant of nodes(child, name)) result.push(descendant);
  }
  return result;
}
function nodeText(node) {
  return node.children.map((child) => typeof child === "string" ? child : nodeText(child)).join("");
}
function richText(node) {
  return node.children.map((child) => typeof child === "string" ? "" : child.name === "rPh" ? "" : child.name === "t" ? nodeText(child) : richText(child)).join("");
}
function bookText(node) {
  const hidden = /* @__PURE__ */ new Set(["head", "script", "style", "binary", "description"]);
  const blocks = /* @__PURE__ */ new Set(["p", "v", "subtitle", "title", "section", "div", "h1", "h2", "h3", "h4", "li", "tr", "blockquote", "empty-line"]);
  function render(current) {
    if (hidden.has(current.name.toLowerCase())) return "";
    if (current.name === "br") return "\n";
    const text = current.children.map((child) => typeof child === "string" ? child.replace(/\s+/g, " ") : render(child)).join("");
    return blocks.has(current.name.toLowerCase()) ? `
${text}
` : text;
  }
  return render(node).replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function zipPath(base, href) {
  let path = href.split(/[?#]/, 1)[0].replace(/\\/g, "/");
  try {
    path = decodeURIComponent(path).replace(/\\/g, "/");
  } catch {
    throw new Error("Invalid ZIP URI");
  }
  if (/^[a-z][\w+.-]*:/i.test(path) || path.startsWith("//") || path.includes("\0")) throw new Error("External ZIP URI");
  const parts = [];
  for (const part of (path.startsWith("/") ? path : base + path).split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) throw new Error("ZIP path escapes archive");
      parts.pop();
    } else parts.push(part);
  }
  return parts.join("/");
}
function docxDoc(path) {
  const zip = new ZipFile(new JFile(path));
  let xml = "";
  try {
    xml = zreadString(zip, "word/document.xml");
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
  const blocks = [];
  const tree = parseXml(xml);
  function inline(node) {
    if (["del", "instrText", "delText"].includes(node.name)) return "";
    if (node.name === "t") return nodeText(node);
    if (node.name === "tab") return "	";
    if (node.name === "br" || node.name === "cr") return "\n";
    if (node.name === "noBreakHyphen") return "‑";
    return node.children.map((c) => typeof c === "string" ? "" : inline(c)).join("");
  }
  function walk(node) {
    if (node.name === "del") return;
    if (node.name === "p") {
      const text = inline(node).trim();
      const style = nodes(node, "pStyle")[0];
      const heading = style && /^Heading(\d+)$/i.exec(attr(style, "val"));
      if (text) blocks.push(heading ? `${"#".repeat(Math.min(4, Number(heading[1])))} ${text}` : nodes(node, "numPr").length ? `• ${text}` : text);
    } else if (node.name === "tbl") {
      const rows = nodes(node, "tr").slice(0, MAX_ROWS).map((row) => nodes(row, "tc").slice(0, MAX_COLS).map((cell) => nodes(cell, "p").map(inline).join("\n").trim()));
      const table = formatRows(trimRows(rows), false);
      if (table.trim()) blocks.push(table);
    } else for (const child of node.children) if (typeof child !== "string") walk(child);
  }
  walk(nodes(tree, "body")[0] ?? tree);
  const full = blocks.join("\n\n") || String(t("empty_doc"));
  return new Doc(paginate(full), 0, true, "");
}
function xlsxDoc(path) {
  const zip = new ZipFile(new JFile(path));
  const pages = [];
  try {
    const rels = /* @__PURE__ */ new Map();
    let sharedPath = "xl/sharedStrings.xml";
    if (zip.call("getEntry", "xl/_rels/workbook.xml.rels")) {
      const relXml = parseXml(zreadString(zip, "xl/_rels/workbook.xml.rels"));
      for (const rel of nodes(relXml, "Relationship")) {
        if (attr(rel, "TargetMode").toLowerCase() === "external") continue;
        const target = attr(rel, "Target");
        if (!target) continue;
        let resolved;
        try {
          resolved = zipPath("xl/", target);
        } catch {
          continue;
        }
        rels.set(attr(rel, "Id"), resolved);
        if (attr(rel, "Type").endsWith("/sharedStrings")) sharedPath = resolved;
      }
    }
    const shared = zip.call("getEntry", sharedPath) ? nodes(parseXml(zreadString(zip, sharedPath)), "si").map(richText) : [];
    const sheetEntries = [];
    if (zip.call("getEntry", "xl/workbook.xml")) {
      for (const sheet of nodes(parseXml(zreadString(zip, "xl/workbook.xml")), "sheet")) {
        const target = rels.get(attr(sheet, "id"));
        if (target) sheetEntries.push({ name: attr(sheet, "name"), path: target });
      }
    }
    if (!sheetEntries.length) sheetEntries.push({ name: String(t("sheet_default")), path: "xl/worksheets/sheet1.xml" });
    for (const sheet of sheetEntries) {
      if (!zip.call("getEntry", sheet.path)) continue;
      const sheetXml = parseXml(zreadString(zip, sheet.path));
      const rows = [];
      for (const row of nodes(sheetXml, "row")) {
        const rowRef = attr(row, "r");
        const rowIndex = /^\d+$/.test(rowRef) ? Number(rowRef) - 1 : rows.length;
        if (rowIndex < 0) continue;
        if (rowIndex >= MAX_ROWS) break;
        while (rows.length <= rowIndex) rows.push([]);
        const cells = rows[rowIndex];
        let nextColumn = 0;
        for (const cell of nodes(row, "c")) {
          const ref = /^([a-z]+)\d+$/i.exec(attr(cell, "r"));
          let column = nextColumn;
          if (ref) {
            column = 0;
            for (const letter of ref[1].toUpperCase()) column = column * 26 + letter.charCodeAt(0) - 64;
            column--;
          }
          nextColumn = column + 1;
          if (column < 0 || column >= MAX_COLS) continue;
          while (cells.length <= column) cells.push("");
          const valueNode = nodes(cell, "v")[0];
          const value = valueNode ? nodeText(valueNode) : "";
          const kind = attr(cell, "t");
          cells[column] = kind === "s" ? /^\d+$/.test(value.trim()) ? shared[Number(value)] ?? "" : "" : kind === "inlineStr" ? richText(cell) : value;
        }
      }
      const tableBody = formatRows(trimRows(rows), true) || String(t("sheet_empty"));
      pages.push(...paginate(`── ${sheet.name} ──

${tableBody}`));
    }
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
  return new Doc(pages.length > 0 ? pages : [String(t("empty_doc"))], 2, false);
}
function pptxDoc(path) {
  const zip = new ZipFile(new JFile(path));
  const pages = [];
  try {
    let inline2 = function(node) {
      if (node.name === "t") return nodeText(node);
      if (node.name === "br") return "\n";
      return node.children.map((c) => typeof c === "string" ? "" : inline2(c)).join("");
    };
    var inline = inline2;
    const paths = [];
    if (zip.call("getEntry", "ppt/presentation.xml")) {
      const rels = /* @__PURE__ */ new Map();
      const relXml = parseXml(zreadString(zip, "ppt/_rels/presentation.xml.rels"));
      for (const rel of nodes(relXml, "Relationship")) {
        if (attr(rel, "TargetMode").toLowerCase() === "external") continue;
        if (attr(rel, "Type") && !attr(rel, "Type").endsWith("/slide")) continue;
        try {
          rels.set(attr(rel, "Id"), zipPath("ppt/", attr(rel, "Target")));
        } catch {
          continue;
        }
      }
      for (const slide of nodes(parseXml(zreadString(zip, "ppt/presentation.xml")), "sldId").slice(0, 200)) {
        const id = Object.entries(slide.attrs).find(([key]) => key.includes(":") && localName(key) === "id")?.[1];
        const target = id && rels.get(id);
        if (target) paths.push(target);
      }
    } else {
      for (let i = 1; i <= 200; i++) if (zip.call("getEntry", `ppt/slides/slide${i}.xml`)) paths.push(`ppt/slides/slide${i}.xml`);
    }
    let total = 0;
    for (let i = 0; i < paths.length; i++) {
      if (!zip.call("getEntry", paths[i])) continue;
      const xml = zreadString(zip, paths[i]);
      if ((total += xml.length) > MAX_TEXT_BYTES * 2) throw new Error(String(t("err_unpack_limit")));
      const paras = nodes(parseXml(xml), "p").map(inline2).map((s) => s.trim()).filter(Boolean);
      pages.push(...paginate(`── ${tf("slide_n", i + 1)} ──

${paras.join("\n\n") || String(t("no_text"))}`));
    }
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
  return new Doc(pages.length > 0 ? pages : [String(t("empty_presentation"))]);
}
function odfDoc(path) {
  const zip = new ZipFile(new JFile(path));
  let xml = "";
  try {
    xml = zreadString(zip, "content.xml");
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
  const blocks = [];
  const tree = parseXml(xml);
  let expanded = 0;
  const repeat = (node, key, cap) => {
    const value = attr(node, key);
    return /^\d+$/.test(value) ? Math.max(1, Math.min(cap, Number(value))) : 1;
  };
  function inline(node) {
    if (node.name === "s") return " ".repeat(repeat(node, "c", 1e3));
    if (node.name === "tab") return "	";
    if (node.name === "line-break") return "\n";
    if (["annotation", "tracked-changes", "binary-data"].includes(node.name)) return "";
    return node.children.map((c) => typeof c === "string" ? c : inline(c)).join("");
  }
  function walk(node) {
    if (["annotation", "tracked-changes", "binary-data"].includes(node.name)) return;
    if (node.name === "table") {
      const rows = [];
      for (const row of nodes(node, "table-row")) {
        if (rows.length >= MAX_ROWS) break;
        const cells = [];
        for (const cell of row.children) {
          if (typeof cell === "string" || !["table-cell", "covered-table-cell"].includes(cell.name)) continue;
          if (cells.length >= MAX_COLS) break;
          const paras = nodes(cell, "p");
          const value = cell.name === "covered-table-cell" ? "" : paras.length ? paras.map(inline).join("\n").trim() : attr(cell, "string-value") || attr(cell, "value") || attr(cell, "date-value") || attr(cell, "boolean-value") || attr(cell, "time-value");
          const count2 = repeat(cell, "number-columns-repeated", MAX_COLS - cells.length);
          for (let i = 0; i < count2; i++) cells.push(value);
        }
        const count = repeat(row, "number-rows-repeated", MAX_ROWS - rows.length);
        expanded += count * cells.reduce((sum, cell) => sum + cell.length + 1, 0);
        if (expanded > MAX_TEXT_BYTES) throw new Error(String(t("err_unpack_limit")));
        for (let i = 0; i < count; i++) rows.push(cells.slice());
      }
      blocks.push(`── ${attr(node, "name") || String(t("sheet_default"))} ──

${formatRows(trimRows(rows), true)}`);
    } else if (node.name === "p" || node.name === "h") {
      const text = inline(node).trim();
      if (text) blocks.push(node.name === "h" ? `# ${text}` : text);
    } else for (const child of node.children) if (typeof child !== "string") walk(child);
  }
  walk(nodes(tree, "body")[0] ?? tree);
  const full = blocks.join("\n\n") || String(t("empty_doc"));
  return new Doc(paginate(full), 0, true, "");
}
function rtfDoc(path) {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES);
  const src = byteString(bytes);
  const hidden = /* @__PURE__ */ new Set(["fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "objdata", "fldinst", "header", "footer", "filetbl", "listtable", "listoverridetable", "generator"]);
  let state = { skip: false, uc: 1, charset: "windows-1252" };
  const stack = [];
  let fallback = 0;
  const out = [];
  let pending = [];
  function flush() {
    if (pending.length) out.push(decodeBytes(new Uint8Array(pending), state.charset));
    pending = [];
  }
  function emit(value) {
    flush();
    if (fallback > 0) {
      fallback--;
      return;
    }
    if (!state.skip) out.push(value);
  }
  for (let i = 0; i < src.length; ) {
    const c = src[i++];
    if (c === "{") {
      flush();
      if (stack.length >= 256) throw new Error("RTF complexity limit exceeded");
      stack.push({ ...state });
    } else if (c === "}") {
      flush();
      state = stack.pop() ?? state;
      fallback = 0;
    } else if (c === "\r" || c === "\n") continue;
    else if (c !== "\\") {
      if (fallback > 0) fallback--;
      else if (!state.skip) pending.push(c.charCodeAt(0));
    } else {
      const next = src[i];
      if (next === "'" && /^[\da-f]{2}$/i.test(src.slice(i + 1, i + 3))) {
        const b = parseInt(src.slice(i + 1, i + 3), 16);
        i += 3;
        if (fallback > 0) fallback--;
        else if (!state.skip) pending.push(b);
        continue;
      }
      if (!/[a-z]/i.test(next ?? "")) {
        i++;
        if (next === "*") {
          flush();
          state.skip = true;
        } else if (["\\", "{", "}"].includes(next)) emit(next);
        else if (next === "~") emit(" ");
        else if (next === "_") emit("‑");
        else if (next === "-") emit("­");
        continue;
      }
      const word = /^([a-z]+)(-?\d+)? ?/i.exec(src.slice(i));
      i += word[0].length;
      const key = word[1].toLowerCase(), n = Number(word[2]);
      flush();
      if (hidden.has(key)) state.skip = true;
      else if (key === "bin" && n >= 0) i = Math.min(src.length, i + n);
      else if (key === "ansicpg" && n > 0) {
        const codepages = { 65001: "utf-8", 932: "shift_jis", 936: "gbk", 949: "ms949", 950: "big5", 437: "cp437", 850: "cp850", 866: "cp866", 1e4: "MacRoman" };
        state.charset = codepages[n] ?? `windows-${n}`;
      } else if (key === "uc" && n >= 0) state.uc = Math.min(n, 32);
      else if (key === "u" && word[2]) {
        if (!state.skip) out.push(String.fromCharCode((n + 65536) % 65536));
        fallback = state.uc;
      } else {
        const symbols = { par: "\n", line: "\n", tab: "	", cell: "	", row: "\n", emdash: "—", endash: "–", bullet: "•", lquote: "‘", rquote: "’", ldblquote: "“", rdblquote: "”" };
        if (symbols[key]) emit(symbols[key]);
      }
    }
  }
  flush();
  const text = out.join("").replace(/\n{3,}/g, "\n\n").trim();
  return new Doc(paginate(text || String(t("empty_doc"))), 0, true, "");
}
function byteString(bytes) {
  const chunks = [];
  for (let i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  return chunks.join("");
}
function octets(value) {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i) & 255;
  return bytes;
}
function transfer(value, encoding) {
  if (encoding === "quoted-printable") return octets(value.replace(/=\r?\n/g, "").replace(/=([\da-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
  if (encoding === "base64") {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const out = [];
    let bits = 0, buffer = 0;
    for (const c of value.replace(/\s/g, "")) {
      if (c === "=") break;
      const n = alphabet.indexOf(c);
      if (n < 0) throw new Error("Invalid MIME base64");
      buffer = buffer << 6 | n;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out.push(buffer >> bits & 255);
      }
    }
    return new Uint8Array(out);
  }
  return octets(value);
}
function mimeHeaders(raw) {
  const separator = /\r?\n\r?\n/.exec(raw);
  const head = separator ? raw.slice(0, separator.index) : raw;
  const headers = /* @__PURE__ */ Object.create(null);
  for (const line of head.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const match = /^([^:\s]+):[ \t]*(.*)$/.exec(line);
    if (match) headers[match[1].toLowerCase()] = match[2].trim();
  }
  return { headers, body: separator ? raw.slice(separator.index + separator[0].length) : "" };
}
function mimeParam(value, name) {
  const params = /;\s*([\w-]+)\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;\s]+))/g;
  let m;
  while (m = params.exec(value)) if (m[1].toLowerCase() === name) return (m[2] ?? m[3]).replace(/\\(.)/g, "$1");
  return "";
}
function encodedHeader(value) {
  return value.replace(/(\?=)[ \t]+(?==\?)/g, "$1").replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi, (all, charset, kind, data) => {
    try {
      return decodeBytes(transfer(kind.toLowerCase() === "q" ? data.replace(/_/g, " ") : data, kind.toLowerCase() === "q" ? "quoted-printable" : "base64"), charset);
    } catch {
      return all;
    }
  });
}
function emlDoc(path) {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES);
  const raw = byteString(bytes);
  const { headers } = mimeHeaders(raw);
  let parts = 0;
  function extract(rawPart, depth = 0) {
    if (++parts > 1e3 || depth > 20) throw new Error("MIME complexity limit exceeded");
    const { headers: h, body } = mimeHeaders(rawPart);
    const ct = h["content-type"] || "text/plain";
    const type = ct.split(";")[0].trim().toLowerCase();
    if (/^attachment\b/i.test(h["content-disposition"] || "") || mimeParam(h["content-disposition"] || "", "filename") || mimeParam(ct, "name")) return { text: "", plain: false };
    if (type.startsWith("multipart/")) {
      const boundary = mimeParam(ct, "boundary");
      if (!boundary || boundary.length > 200) return { text: "", plain: false };
      const children = [];
      let start = -1;
      const lines = /[^\n]*(?:\n|$)/g;
      let m;
      while ((m = lines.exec(body)) && m[0]) {
        const line = m[0].replace(/\r?\n$/, "").replace(/[ \t]+$/, "");
        if (line !== `--${boundary}` && line !== `--${boundary}--`) continue;
        if (start >= 0) children.push(extract(body.slice(start, m.index), depth + 1));
        start = lines.lastIndex;
        if (line === `--${boundary}--`) {
          start = -1;
          break;
        }
      }
      if (start >= 0 && start < body.length) children.push(extract(body.slice(start), depth + 1));
      const visible = children.filter((c) => c.text);
      if (type === "multipart/alternative") return visible.find((c) => c.plain) ?? visible[0] ?? { text: "", plain: false };
      return { text: visible.map((c) => c.text).join("\n\n"), plain: visible.some((c) => c.plain) };
    }
    if (type !== "text/plain" && type !== "text/html") return { text: "", plain: false };
    const decoded = decodeBytes(transfer(body, (h["content-transfer-encoding"] || "").toLowerCase()), mimeParam(ct, "charset") || "utf-8");
    const text = type === "text/html" ? bookText(parseXml(decoded)) : decoded.replace(/\r\n/g, "\n").trim();
    return { text, plain: type === "text/plain" };
  }
  const headLines = [];
  const getHeader = (name, label) => {
    const value = headers[name.toLowerCase()];
    if (value) headLines.push(`${label}: ${encodedHeader(value)}`);
  };
  getHeader("From", String(t("email_from")));
  getHeader("To", String(t("email_to")));
  getHeader("Cc", String(t("email_cc")));
  getHeader("Subject", String(t("email_subject")));
  getHeader("Date", String(t("email_date")));
  const plainBody = extract(raw).text;
  const out = `${headLines.join("\n")}

${plainBody}`;
  return new Doc(paginate(out), 0, true, "");
}
function epubDoc(path) {
  const zip = new ZipFile(new JFile(path));
  const pages = [];
  try {
    const container = parseXml(zreadString(zip, "META-INF/container.xml"));
    const rootfiles = nodes(container, "rootfile");
    const rootfile = rootfiles.find((node) => attr(node, "media-type") === "application/oebps-package+xml") ?? rootfiles[0];
    if (!rootfile || !attr(rootfile, "full-path")) throw new Error(String(t("err_epub_manifest")));
    const opfPath = zipPath("", attr(rootfile, "full-path"));
    const opfBase = opfPath.slice(0, opfPath.lastIndexOf("/") + 1);
    const opf = parseXml(zreadString(zip, opfPath));
    const manifest = /* @__PURE__ */ new Map();
    for (const item of nodes(opf, "item")) manifest.set(attr(item, "id"), item);
    for (const ref of nodes(opf, "itemref")) {
      if (attr(ref, "linear").toLowerCase() === "no") continue;
      const item = manifest.get(attr(ref, "idref"));
      if (!item || !attr(item, "href")) continue;
      const media = attr(item, "media-type");
      if (media && media !== "application/xhtml+xml" && media !== "text/html") continue;
      let chapterPath;
      try {
        chapterPath = zipPath(opfBase, attr(item, "href"));
      } catch {
        continue;
      }
      if (!zip.call("getEntry", chapterPath)) continue;
      const chapter = parseXml(zreadString(zip, chapterPath));
      const text = bookText(nodes(chapter, "body")[0] ?? chapter);
      if (text) pages.push(...paginate(text));
    }
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
  if (pages.length === 0) throw new Error(String(t("err_no_text_in_book")));
  return new Doc(pages, 1);
}
function fb2Doc(path) {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES);
  const xml = parseXml(decodeXml(bytes));
  const info = nodes(xml, "title-info")[0];
  const blocks = [];
  if (info) {
    const title = nodes(info, "book-title")[0];
    const authors = nodes(info, "author").map((author) => {
      const names = ["first-name", "middle-name", "last-name"].map((name) => nodes(author, name)[0]).filter(Boolean);
      return names.length ? names.map(nodeText).join(" ") : nodes(author, "nickname").map(nodeText).join(" ");
    }).filter(Boolean);
    const header = [...authors, title ? nodeText(title).trim() : ""].filter(Boolean).join("\n");
    if (header) blocks.push(header);
  }
  for (const body of nodes(xml, "body")) {
    const text = bookText(body);
    if (text) blocks.push(text);
  }
  const full = blocks.join("\n\n") || String(t("empty_doc"));
  return new Doc(paginate(full), 1, true, "");
}
function buildDoc(path, fmt, ext, opts, enc) {
  switch (fmt) {
    case "docx":
      return docxDoc(path);
    case "xlsx":
      return xlsxDoc(path);
    case "pptx":
      return pptxDoc(path);
    case "odf":
      return odfDoc(path);
    case "rtf":
      return rtfDoc(path);
    case "eml":
      return emlDoc(path);
    case "epub":
      return epubDoc(path);
    case "fb2":
      return fb2Doc(path);
    default:
      throw new Error(tf("err_unknown_format", fmt));
  }
}

// src/parsers/archive.ts
function formatDate(timeMs) {
  if (!Number.isFinite(timeMs) || timeMs < 0) return "—";
  const d = new Date(timeMs);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function archiveDoc(path) {
  const zip = new ZipFile(new JFile(path));
  const entries = [];
  let totalCount = 0;
  let folders = 0;
  let totalSize = 0;
  try {
    const enumEntries = zip.call("entries");
    while (enumEntries.call("hasMoreElements")) {
      totalCount++;
      const entry = enumEntries.call("nextElement");
      if (entry.call("isDirectory")) folders++;
      totalSize += Math.max(0, Number(entry.call("getSize")));
      if (entries.length < MAX_ENTRIES) {
        const name = String(entry.call("getName"));
        const size = Number(entry.call("getSize"));
        const time = Number(entry.call("getTime"));
        entries.push({
          name,
          size: size >= 0 ? size : 0,
          date: formatDate(time)
        });
      }
    }
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
  const summary = String(t("archive_summary")).replace("{0}", String(totalCount)).replace("{1}", String(folders)).replace("{2}", humanSize(totalSize));
  const lines = [summary, ""];
  for (const e of entries) {
    const sizeStr = e.name.endsWith("/") ? "" : humanSize(e.size);
    lines.push(`${sizeStr.padStart(9)}  ${e.date}  ${e.name}`);
  }
  if (totalCount > entries.length) {
    lines.push(`
${String(t("archive_more")).replace("{0}", String(entries.length))}`);
  }
  return new Doc(paginate(lines.join("\n")), 2, false, "");
}
function listArchiveFiles(path) {
  const zip = new ZipFile(new JFile(path));
  const names = [];
  try {
    const entries = zip.call("entries");
    let count = 0;
    while (entries.call("hasMoreElements") && count++ < MAX_ENTRIES) {
      const entry = entries.call("nextElement");
      if (!entry.call("isDirectory")) names.push(String(entry.call("getName")));
    }
    return names;
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
}
function extractArchiveFile(path, name, cacheDir) {
  const zip = new ZipFile(new JFile(path));
  let temp = null;
  try {
    const entry = zip.call("getEntry", name);
    if (!entry || entry.call("isDirectory")) throw new Error(tf("err_zip_entry", name));
    if (Number(entry.call("getSize")) > MAX_UNPACKED) throw new Error(String(t("err_unpack_limit")));
    const bytes = readStreamBytes(zip.call("getInputStream", entry), MAX_UNPACKED);
    temp = JFile.callStatic("createTempFile", "docviewer-", ".tmp", new JFile(cacheDir));
    const Output = inu.jvm.cls("java.io.FileOutputStream");
    const output = new Output(temp);
    try {
      for (let offset = 0; offset < bytes.length; offset += 65536) {
        output.call("write([B)V", bytes.subarray(offset, offset + 65536));
      }
    } finally {
      output.call("close");
    }
    return String(temp.call("getAbsolutePath"));
  } catch (error) {
    try {
      temp?.call("delete");
    } catch {
    }
    throw error;
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
}

// src/parsers/web.ts
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var MD_FENCE = /^\s*(```|~~~)/;
var MD_HEAD = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
var MD_HR = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
var MD_LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
var MD_TSEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
var MD_URL = /^(https?:\/\/|mailto:|tg:\/\/|#)/i;
function mdLink(match, text, url) {
  if (!MD_URL.test(url)) return text;
  return `<a href="${url.replace(/"/g, "%22")}">${text}</a>`;
}
function mdAutolink(match, url) {
  let tail = "";
  while (url && ".,;:!?)".includes(url[url.length - 1])) {
    tail = url[url.length - 1] + tail;
    url = url.slice(0, -1);
  }
  return `<a href="${url.replace(/"/g, "%22")}">${url}</a>${tail}`;
}
function mdInline(s) {
  let text = escapeHtml(s.replace(/\0/g, "�"));
  const fragments = [];
  const stash = (html) => {
    fragments.push(html.replace(/\0(\d+)\0/g, (_, idx) => fragments[Number(idx)]));
    return `\0${fragments.length - 1}\0`;
  };
  text = text.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${code}</code>`));
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, label) => stash(`<em>[${label}]</em>`));
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (match, label, url) => stash(mdLink(match, label, url))
  );
  text = text.replace(
    /&lt;(https?:\/\/[^\s\0]+?)&gt;/g,
    (_, url) => stash(mdLink("", url, url))
  );
  text = text.replace(
    /https?:\/\/[^\s\0<>"']+/g,
    (url) => stash(mdAutolink(url, url))
  );
  text = text.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => `<strong>${a || b}</strong>`);
  text = text.replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "<em>$1</em>");
  text = text.replace(/(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])/g, "<em>$1</em>");
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
  text = text.replace(/\0(\d+)\0/g, (_, idx) => fragments[Number(idx)]);
  return text;
}
function mdCells(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split(/(?<!\\)\|/).map((c) => c.trim());
}
function mdTable(head, rows) {
  const out = ['<div class="t"><table><thead><tr>'];
  for (const c of head) {
    out.push(`<th>${mdInline(c)}</th>`);
  }
  out.push("</tr></thead><tbody>");
  for (const r of rows) {
    out.push(`<tr>${r.map((c) => `<td>${mdInline(c)}</td>`).join("")}</tr>`);
  }
  out.push("</tbody></table></div>");
  return out.join("");
}
function mdBlocks(lines, depth = 0) {
  if (depth >= 32) return `<pre>${escapeHtml(lines.join("\n"))}</pre>`;
  const out = [];
  const para = [];
  let i = 0;
  const n = lines.length;
  function flush() {
    if (para.length > 0) {
      const body = mdInline(para.join("\n"));
      out.push(`<p>${body.replace(/ {2,}\n/g, "<br>\n")}</p>`);
      para.length = 0;
    }
  }
  while (i < n) {
    const line = lines[i];
    const fence = line.match(MD_FENCE);
    if (fence) {
      flush();
      const marker = fence[1];
      const code = [];
      i++;
      while (i < n && !lines[i].trim().startsWith(marker)) {
        code.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    if (!line.trim()) {
      flush();
      i++;
      continue;
    }
    const headMatch = line.match(MD_HEAD);
    if (headMatch) {
      flush();
      const level = headMatch[1].length;
      out.push(`<h${level}>${mdInline(headMatch[2])}</h${level}>`);
      i++;
      continue;
    }
    if (MD_HR.test(line)) {
      flush();
      out.push("<hr>");
      i++;
      continue;
    }
    if (line.trimStart().startsWith(">")) {
      flush();
      const quote = [];
      while (i < n && lines[i].trimStart().startsWith(">")) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${mdBlocks(quote, depth + 1)}</blockquote>`);
      continue;
    }
    if (line.includes("|") && i + 1 < n && lines[i + 1].includes("-") && MD_TSEP.test(lines[i + 1])) {
      flush();
      const head = mdCells(line);
      i += 2;
      const rows = [];
      while (i < n && lines[i].trim() && lines[i].includes("|")) {
        rows.push(mdCells(lines[i]));
        i++;
      }
      out.push(mdTable(head, rows));
      continue;
    }
    const listMatch = line.match(MD_LIST);
    if (listMatch) {
      flush();
      const indent = listMatch[1].replace(/\t/g, "    ").length;
      const marker = listMatch[2];
      const bullet = ["-", "*", "+"].includes(marker) ? "•" : marker;
      let item = listMatch[3];
      item = item.replace(/^\[( |x|X)\]\s+/, (_, c) => c === " " ? "☐ " : "☑ ");
      out.push(`<p class="li" style="margin-left:${indent * 8}px"><span>${bullet}</span> ${mdInline(item)}</p>`);
      i++;
      continue;
    }
    para.push(line.trimStart());
    i++;
  }
  flush();
  return out.join("\n");
}
function mdPage(text, theme) {
  const body = mdBlocks(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n"));
  const css = `
html,body{margin:0;background:${theme.cssBg};color:${theme.cssFg}}
body{font:16px/1.65 sans-serif;padding:16px;word-wrap:break-word;overflow-wrap:anywhere}
h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.2em 0 .5em}
h1,h2{border-bottom:1px solid ${theme.cssAlt};padding-bottom:.25em}
a{color:#4da3ff}hr{border:0;border-top:1px solid ${theme.cssAlt}}
code{background:${theme.cssAlt};padding:.1em .35em;border-radius:4px;font-family:monospace;font-size:.92em}
pre{background:${theme.cssAlt};padding:12px;border-radius:8px;overflow-x:auto}
pre code{background:none;padding:0}
blockquote{margin:.8em 0;padding:0 0 0 12px;border-left:4px solid ${theme.cssAlt};opacity:.85}
.t{overflow-x:auto}table{border-collapse:collapse}
td,th{border:1px solid ${theme.cssAlt};padding:6px 10px}th{background:${theme.cssAlt}}
.li{margin-top:.25em;margin-bottom:.25em}.li span{display:inline-block;min-width:1.2em}
`.trim();
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style></head><body>${body}</body></html>`;
}
function svgPage(text) {
  const cleaned = text.replace(/<\?xml.*?\?>|<!DOCTYPE[^>\[]*(\[[^\]]*\])?\s*>/gis, "");
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:#fff}
svg{display:block;max-width:100%;height:auto;margin:0 auto}</style></head>
<body>${cleaned}</body></html>`;
}
function buildWeb(path, ext, themeIndex) {
  const { bytes } = readFileBytes(path, MAX_WEB_BYTES);
  const [text] = decodeText(bytes);
  if (ext === "svg") {
    return svgPage(text);
  }
  if (MD_EXT.has(ext)) {
    const theme = THEMES[themeIndex % THEMES.length];
    return mdPage(text, theme);
  }
  return text;
}

// src/parsers/image.ts
function exifOrientation(path) {
  try {
    const exif = new ExifInterface(path);
    return Number(exif.call("getAttributeInt", "Orientation", 1));
  } catch {
    return 1;
  }
}
function rotation(orientation) {
  switch (orientation) {
    case 3:
      return 180;
    case 6:
      return 90;
    case 8:
      return 270;
    default:
      return 0;
  }
}
function recycle(bmp) {
  try {
    bmp.call("recycle");
  } catch {
  }
}
function decodeImage(path) {
  const o = new BFOptions();
  o.setField("inJustDecodeBounds", true);
  BitmapFactory.callStatic("decodeFile", path, o);
  const outWidth = Number(o.getField("outWidth"));
  const outHeight = Number(o.getField("outHeight"));
  if (!Number.isFinite(outWidth) || !Number.isFinite(outHeight) || outWidth <= 0 || outHeight <= 0) {
    throw new Error(String(t("err_decode_image")));
  }
  let sample = 1;
  while (Math.max(outWidth, outHeight) / sample > 4096) {
    sample *= 2;
  }
  const o2 = new BFOptions();
  o2.setField("inSampleSize", sample);
  const bmp = BitmapFactory.callStatic("decodeFile", path, o2);
  if (!bmp) {
    throw new Error(String(t("err_decode_image")));
  }
  const orientation = exifOrientation(path);
  if (![2, 4, 5, 7].includes(orientation)) {
    return { bmp, rot: rotation(orientation) };
  }
  let mirrored = null;
  try {
    const matrix = new Matrix();
    if (orientation === 2) matrix.call("setScale", -1, 1);
    if (orientation === 4) matrix.call("setScale", 1, -1);
    if (orientation === 5 || orientation === 7) {
      matrix.call("setRotate", 90);
      matrix.call("postScale", orientation === 5 ? -1 : 1, orientation === 5 ? 1 : -1);
    }
    mirrored = Bitmap.callStatic("createBitmap", bmp, 0, 0, bmp.call("getWidth"), bmp.call("getHeight"), matrix, true);
    if (!mirrored) throw new Error(String(t("err_decode_image")));
    if (!mirrored.call("equals", bmp)) recycle(bmp);
    return { bmp: mirrored, rot: 0 };
  } catch (error) {
    if (mirrored) recycle(mirrored);
    recycle(bmp);
    throw error;
  }
}

// src/native.ts
var helpers = null;
function native() {
  if (helpers) return helpers;
  const FloatBuffer = inu.jvm.cls("java.nio.FloatBuffer");
  const ColorMatrix3 = inu.jvm.cls("android.graphics.ColorMatrix");
  const Filter = inu.jvm.cls("android.graphics.ColorMatrixColorFilter");
  const StringClass = inu.jvm.cls("java.lang.String");
  helpers = inu.jvm.defineClass({ staticMethods: {
    strings: { params: ["java.util.ArrayList"], returns: "java.lang.String[]", body: inu.jvm.routine({
      v: 1,
      source: `
      function (list: any) {\r
            return list.toArray(new StringClass('').split(','))\r
          }`,
      captures: ["StringClass"],
      slots: 0,
      code: [
        ["capture", 0],
        ["arg", [0]],
        ["new", 0, [[""]]],
        ["call", 2, ["split"], [[","]]],
        ["call", 1, ["toArray"], [3]],
        ["return", 4]
      ],
      tries: []
    }, [StringClass]) },
    scale: { params: ["android.graphics.Matrix"], returns: "float", body: inu.jvm.routine({
      v: 1,
      source: `
      function (matrix: any) {\r
            const values = FloatBuffer.allocate(9).array()\r
            matrix.getValues(values)\r
            return values[0]\r
          }`,
      captures: ["FloatBuffer"],
      slots: 0,
      code: [
        ["capture", 0],
        ["call", 0, ["allocate"], [[9]]],
        ["call", 1, ["array"], []],
        ["arg", [0]],
        ["call", 3, ["getValues"], [2]],
        ["get", 2, [0]],
        ["return", 5]
      ],
      tries: []
    }, [FloatBuffer]) },
    invert: { params: [], returns: "android.graphics.ColorMatrixColorFilter", body: inu.jvm.routine({
      v: 1,
      source: `
      function () {\r
            const values = FloatBuffer.allocate(20).array()\r
            values[0] = -1\r
            values[4] = 255\r
            values[6] = -1\r
            values[9] = 255\r
            values[12] = -1\r
            values[14] = 255\r
            values[18] = 1\r
            return new Filter(new ColorMatrix(values))\r
          }`,
      captures: ["FloatBuffer", "Filter", "ColorMatrix"],
      slots: 0,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["capture", 2],
        ["call", 0, ["allocate"], [[20]]],
        ["call", 3, ["array"], []],
        ["set", 4, [0], [-1]],
        ["set", 4, [4], [255]],
        ["set", 4, [6], [-1]],
        ["set", 4, [9], [255]],
        ["set", 4, [12], [-1]],
        ["set", 4, [14], [255]],
        ["set", 4, [18], [1]],
        ["new", 2, [4]],
        ["new", 1, [12]],
        ["return", 13]
      ],
      tries: []
    }, [FloatBuffer, Filter, ColorMatrix3]) }
  } });
  return helpers;
}
function matrixScale(matrix) {
  return Number(native().callStatic("scale", matrix));
}
function inversionFilter() {
  return native().callStatic("invert");
}
function stringArray(items) {
  const list = new (inu.jvm.cls("java.util.ArrayList"))();
  for (const item of items) list.call("add", item);
  return native().callStatic("strings", list);
}

// src/viewer.ts
var DocViewer = class _DocViewer {
  act;
  path;
  name;
  fmt;
  ext;
  kind;
  label;
  mime;
  renderer;
  pfd;
  count;
  index = 0;
  token = 0;
  shownTok = -1;
  closed = false;
  srcBitmap = null;
  bitmap = null;
  cache = /* @__PURE__ */ new Map();
  cacheOrder = [];
  rot = 0;
  bw = 1;
  bh = 1;
  fit = 1;
  minScale = 1;
  maxZoom = 6;
  matrix;
  vals = null;
  lx = 0;
  ly = 0;
  chrome = true;
  dlg = null;
  root = null;
  iv = null;
  loading = null;
  topBar = null;
  box = null;
  pager = null;
  searchBar = null;
  sv = null;
  hsv = null;
  tv = null;
  wv = null;
  nameTv = null;
  subTv = null;
  prevB = null;
  nextB = null;
  counter = null;
  sCount = null;
  doc = null;
  pages = [];
  loadTok = 0;
  keepIndex = null;
  enc = null;
  font = 0;
  wrap = true;
  webZoom = 100;
  hits = [];
  hitsByPage = /* @__PURE__ */ new Map();
  cur = -1;
  invert = false;
  fitWidth = false;
  textSize = 15;
  theme = 0;
  density = 1;
  sizeTxt;
  cleanupFns = [];
  onClose;
  children = /* @__PURE__ */ new Set();
  constructor(act, path, name, fmt, ext, mime, renderer = null, pfd = null, count = 1) {
    this.act = act;
    this.path = path;
    this.name = name;
    this.fmt = fmt;
    this.ext = ext;
    this.kind = KIND[fmt] ?? "text";
    this.label = formatLabel(fmt, ext);
    this.mime = mime ?? "";
    this.renderer = renderer;
    this.pfd = pfd;
    this.count = Math.max(1, count);
    this.matrix = new Matrix();
    this.invert = localStorage.getItem("invert") === "true";
    this.fitWidth = localStorage.getItem("fitwidth") === "true";
    this.textSize = Number(localStorage.getItem("text_size") ?? "15.0");
    this.theme = Number(localStorage.getItem("theme") ?? "0") % THEMES.length;
    const res = act.call("getResources");
    const dm = res.call("getDisplayMetrics");
    this.density = Number(dm.getField("density"));
    const file = new JFile(path);
    this.sizeTxt = humanSize(Number(file.call("length")));
  }
  dp(v) {
    return dp(this.density, v);
  }
  toast(text) {
    try {
      Toast.callStatic("makeText", this.act, text, 0).call("show");
    } catch {
    }
  }
  sysDim(name) {
    try {
      const res = this.act.call("getResources");
      const rid = Number(res.call("getIdentifier", name, "dimen", "android"));
      if (rid > 0) {
        return Number(res.call("getDimensionPixelSize", rid));
      }
    } catch {
    }
    return 0;
  }
  viewSize() {
    let w = this.iv ? Number(this.iv.call("getWidth")) : 0;
    let h = this.iv ? Number(this.iv.call("getHeight")) : 0;
    if (w <= 0 || h <= 0) {
      const dm = this.act.call("getResources").call("getDisplayMetrics");
      w = Number(dm.getField("widthPixels"));
      h = Number(dm.getField("heightPixels"));
    }
    return [w, h];
  }
  button(text, size, fn, w = 44, h = 44, bg = C_BTN) {
    const tv = new TextView(this.act);
    tv.call("setText", text);
    tv.call("setTextSize", Number(size));
    tv.call("setTextColor", C_TEXT);
    tv.call("setGravity", Gravity.getStaticField("CENTER"));
    tv.call("setBackground", rounded(bg, this.dp(h / 2)));
    tv.call("setLayoutParams", new LLP(this.dp(w), this.dp(h)));
    const [listener, unreg] = createClickListener(fn);
    this.cleanupFns.push(unreg);
    tv.call("setOnClickListener", listener);
    return tv;
  }
  pill() {
    const p = new LinearLayout(this.act);
    p.call("setOrientation", LinearLayout.getStaticField("HORIZONTAL"));
    p.call("setGravity", Gravity.getStaticField("CENTER_VERTICAL"));
    p.call("setBackground", rounded(C_PILL, this.dp(30)));
    p.call("setPadding", this.dp(8), this.dp(8), this.dp(8), this.dp(8));
    return p;
  }
  counterView(minWidth) {
    const tv = new TextView(this.act);
    tv.call("setTextColor", C_TEXT);
    tv.call("setTextSize", 15);
    tv.call("setTypeface", Typeface.getStaticField("DEFAULT_BOLD"));
    tv.call("setGravity", Gravity.getStaticField("CENTER"));
    tv.call("setMinWidth", this.dp(minWidth));
    return tv;
  }
  setLoading(text, color = C_SUB) {
    if (this.loading) {
      this.loading.call("setText", text);
      this.loading.call("setTextColor", color);
      this.loading.call("setVisibility", View.getStaticField("VISIBLE"));
    }
  }
  showError(text) {
    if (this.loading) {
      this.setLoading(`${t("load_fail")}

${text}`, C_ERR);
    } else {
      this.toast(text);
    }
  }
  builder() {
    try {
      return new AlertBuilder(this.act, RStyle.getStaticField("Theme_DeviceDefault_Dialog_Alert"));
    } catch {
      return new AlertBuilder(this.act);
    }
  }
  inputDialog(title, initial, number, okText, onOk) {
    const et = new EditText(this.act);
    et.call("setInputType", number ? InputType.getStaticField("TYPE_CLASS_NUMBER") : InputType.getStaticField("TYPE_CLASS_TEXT"));
    et.call("setSingleLine", true);
    et.call("setText", initial);
    et.call("setSelectAllOnFocus", true);
    const [dlgClick, unreg] = createDlgClickListener((_, which) => {
      onOk(String(et.call("getText").call("toString")).trim());
    });
    this.cleanupFns.push(unreg);
    const b = this.builder();
    b.call("setTitle", title);
    b.call("setPositiveButton", okText, dlgClick);
    b.call("setNegativeButton", t("cancel"), null);
    const d = b.call("create");
    d.call("setView", et, this.dp(20), this.dp(8), this.dp(20), 0);
    try {
      d.call("getWindow").call("setSoftInputMode", 5);
    } catch {
    }
    d.call("show");
    et.call("requestFocus");
  }
  loadPos() {
    try {
      const raw = localStorage.getItem("docviewer_pos");
      if (raw) {
        const d = JSON.parse(raw);
        return Number(d[this.path] ?? 0);
      }
    } catch {
    }
    return 0;
  }
  savePos() {
    if (this.kind !== "pdf" && this.kind !== "text" || this.count < 2) return;
    if (localStorage.getItem("remember") === "false") return;
    try {
      const raw = localStorage.getItem("docviewer_pos");
      const d = raw ? JSON.parse(raw) : {};
      d[this.path] = this.index;
      localStorage.setItem("docviewer_pos", JSON.stringify(d));
    } catch {
    }
  }
  show() {
    const act = this.act;
    const dlg = new Dialog(act, RStyle.getStaticField("Theme_Black_NoTitleBar_Fullscreen"));
    this.dlg = dlg;
    const win = dlg.call("getWindow");
    try {
      win.call("setBackgroundDrawable", new ColorDrawable(C_BG));
      const p = win.call("getAttributes");
      p.setField("windowAnimations", RStyle.getStaticField("Animation_Dialog"));
      win.call("setAttributes", p);
      if (localStorage.getItem("keepon") !== "false") {
        win.call("addFlags", 128);
      }
    } catch (e) {
      console.warn("DocViewer window error:", e);
    }
    const sbh = this.sysDim("status_bar_height");
    const nbh = this.sysDim("navigation_bar_height");
    const root = new FrameLayout(act);
    root.call("setBackgroundColor", C_BG);
    this.root = root;
    if (this.kind === "text") {
      this.buildTextView(root, sbh, nbh);
    } else if (this.kind === "web") {
      this.buildWebView(root, sbh);
    } else {
      this.buildImageView(root);
    }
    const ld = new TextView(act);
    ld.call("setText", t("loading"));
    ld.call("setTextColor", C_SUB);
    ld.call("setTextSize", 15);
    ld.call("setGravity", Gravity.getStaticField("CENTER"));
    ld.call("setPadding", this.dp(28), 0, this.dp(28), 0);
    try {
      ld.call("setTextIsSelectable", true);
    } catch {
    }
    this.loading = ld;
    root.call("addView", ld, new FLP(-1, -2, Gravity.getStaticField("CENTER")));
    this.buildTopBar(root, sbh);
    if (this.kind === "pdf" || this.kind === "text") {
      this.buildBottom(root, nbh);
    }
    dlg.call("setContentView", root);
    const [dismissL, unregDismiss] = createDismissListener(() => this.cleanup());
    this.cleanupFns.push(unregDismiss);
    dlg.call("setOnDismissListener", dismissL);
    const [keyL, unregKey] = createKeyListener((keyCode, ev) => this.onKey(keyCode, ev));
    this.cleanupFns.push(unregKey);
    dlg.call("setOnKeyListener", keyL);
    this.updateSub();
    this.syncChrome();
    dlg.call("show");
    if (this.kind === "pdf") {
      const start = localStorage.getItem("remember") !== "false" ? this.loadPos() : 0;
      this.showPage(Math.max(0, Math.min(this.count - 1, start)));
    } else if (this.kind === "image") {
      this.loadImage();
    } else if (this.kind === "text") {
      this.startLoad();
    } else {
      this.startWeb();
    }
  }
  buildImageView(root) {
    const act = this.act;
    const iv = new ImageView(act);
    iv.call("setScaleType", ScaleType.getStaticField("MATRIX"));
    iv.call("setBackgroundColor", C_BG);
    this.iv = iv;
    const [scaleL, unregScale] = createScaleListener((ev, det) => {
      if (ev === "scale") {
        const factor = Number(det.call("getScaleFactor"));
        const fx = Number(det.call("getFocusX"));
        const fy = Number(det.call("getFocusY"));
        this.zoomBy(factor, fx, fy);
        return true;
      }
      return true;
    });
    this.cleanupFns.push(unregScale);
    const scaleDet = new ScaleGestureDetector(act, scaleL);
    const [gestL, unregGest] = createGestureListener((ev, ...args) => {
      if (ev === "doubleTap") {
        const e = args[0];
        this.doubleTap(Number(e.call("getX")), Number(e.call("getY")));
        return true;
      }
      if (ev === "singleTapConfirmed") {
        this.toggleChrome();
        return true;
      }
      if (ev === "fling") {
        const vx = Number(args[2]);
        const vy = Number(args[3]);
        if (this.fitsWidth() && Math.abs(vx) > 900 && Math.abs(vx) > Math.abs(vy) * 1.5) {
          this.go(this.index + (vx < 0 ? 1 : -1));
          return true;
        }
      }
      return false;
    });
    this.cleanupFns.push(unregGest);
    const gestDet = new GestureDetector(act, gestL);
    gestDet.call("setOnDoubleTapListener", gestL);
    const [touchL, unregTouch] = createTouchListener((ev) => {
      try {
        scaleDet.call("onTouchEvent", ev);
        gestDet.call("onTouchEvent", ev);
        const a = Number(ev.call("getActionMasked"));
        if (a === MotionEvent.getStaticField("ACTION_DOWN")) {
          this.lx = Number(ev.call("getX"));
          this.ly = Number(ev.call("getY"));
        } else if (a === MotionEvent.getStaticField("ACTION_MOVE") && Number(ev.call("getPointerCount")) === 1) {
          if (!scaleDet.call("isInProgress")) {
            const x = Number(ev.call("getX"));
            const y = Number(ev.call("getY"));
            if (this.bitmap) {
              this.matrix.call("postTranslate", Number(x - this.lx), Number(y - this.ly));
              this.fixBounds();
              this.applyMatrix();
            }
            this.lx = x;
            this.ly = y;
          }
        }
      } catch (e) {
        console.warn("DocViewer touch error:", e);
      }
      return true;
    });
    this.cleanupFns.push(unregTouch);
    iv.call("setOnTouchListener", touchL);
    const [layoutL, unregLayout] = createLayoutListener(() => {
      if (this.bitmap) this.resetZoom();
    });
    this.cleanupFns.push(unregLayout);
    iv.call("addOnLayoutChangeListener", layoutL);
    root.call("addView", iv, new FLP(-1, -1));
  }
  buildTextView(root, sbh, nbh) {
    const act = this.act;
    const sv = new ScrollView(act);
    sv.call("setVerticalScrollBarEnabled", true);
    const tv = new TextView(act);
    tv.call("setLineSpacing", 0, 1.25);
    tv.call("setPadding", this.dp(18), sbh + this.dp(86), this.dp(18), nbh + this.dp(130));
    try {
      tv.call("setTextIsSelectable", true);
    } catch {
    }
    const [clickL, unreg] = createClickListener(() => this.toggleChrome());
    this.cleanupFns.push(unreg);
    tv.call("setOnClickListener", clickL);
    this.sv = sv;
    this.tv = tv;
    this.attachText();
    this.applyFont();
    this.applyTheme();
    root.call("addView", sv, new FLP(-1, -1));
  }
  attachText() {
    if (!this.sv || !this.tv) return;
    if (this.hsv) {
      this.hsv.call("removeAllViews");
      this.hsv = null;
    }
    this.sv.call("removeAllViews");
    if (this.wrap) {
      this.tv.call("setMinWidth", 0);
      this.sv.call("addView", this.tv, new FLP(-1, -2));
    } else {
      const hsv = new HScrollView(this.act);
      hsv.call("setHorizontalScrollBarEnabled", true);
      const dm = this.act.call("getResources").call("getDisplayMetrics");
      this.tv.call("setMinWidth", Number(dm.getField("widthPixels")));
      hsv.call("addView", this.tv, new FLP(-2, -2));
      this.sv.call("addView", hsv, new FLP(-1, -2));
      this.hsv = hsv;
    }
  }
  buildWebView(root, sbh) {
    const wv = new WebView(this.act);
    const s = wv.call("getSettings");
    s.call("setJavaScriptEnabled", false);
    s.call("setBlockNetworkLoads", true);
    s.call("setAllowFileAccess", false);
    s.call("setAllowContentAccess", false);
    s.call("setSupportZoom", true);
    s.call("setBuiltInZoomControls", true);
    s.call("setDisplayZoomControls", false);
    s.call("setUseWideViewPort", true);
    s.call("setLoadWithOverviewMode", true);
    this.wv = wv;
    this.applyTheme();
    const lp = new FLP(-1, -1);
    lp.call("setMargins", 0, sbh + this.dp(76), 0, 0);
    root.call("addView", wv, lp);
  }
  buildTopBar(root, sbh) {
    const act = this.act;
    const bar = new LinearLayout(act);
    bar.call("setOrientation", LinearLayout.getStaticField("HORIZONTAL"));
    bar.call("setGravity", Gravity.getStaticField("CENTER_VERTICAL"));
    bar.call("setBackground", rounded(C_BAR, this.dp(28)));
    bar.call("setPadding", this.dp(6), this.dp(6), this.dp(6), this.dp(6));
    bar.call("addView", this.button("✕", 18, () => this.close()));
    const titles = new LinearLayout(act);
    titles.call("setOrientation", LinearLayout.getStaticField("VERTICAL"));
    this.nameTv = new TextView(act);
    this.nameTv.call("setText", this.name);
    this.nameTv.call("setTextColor", C_TEXT);
    this.nameTv.call("setTextSize", 16);
    this.nameTv.call("setTypeface", Typeface.getStaticField("DEFAULT_BOLD"));
    this.nameTv.call("setSingleLine", true);
    this.nameTv.call("setEllipsize", TruncateAt.getStaticField("END"));
    this.subTv = new TextView(act);
    this.subTv.call("setTextColor", C_SUB);
    this.subTv.call("setTextSize", 12.5);
    this.subTv.call("setSingleLine", true);
    titles.call("addView", this.nameTv);
    titles.call("addView", this.subTv);
    const tlp = new LLP(0, -2, 1);
    tlp.call("setMargins", this.dp(12), 0, this.dp(8), 0);
    bar.call("addView", titles, tlp);
    bar.call("addView", this.button("•••", 13, () => this.openMenu()));
    const blp = new FLP(-1, -2, Gravity.getStaticField("TOP"));
    blp.call("setMargins", this.dp(12), sbh + this.dp(8), this.dp(12), 0);
    root.call("addView", bar, blp);
    this.topBar = bar;
  }
  buildBottom(root, nbh) {
    const act = this.act;
    const box = new LinearLayout(act);
    box.call("setOrientation", LinearLayout.getStaticField("VERTICAL"));
    box.call("setGravity", Gravity.getStaticField("CENTER_HORIZONTAL"));
    if (this.kind === "text") {
      const sb = this.pill();
      this.sCount = this.counterView(96);
      sb.call("addView", this.button("✕", 15, () => this.endSearch(), 42, 42));
      sb.call("addView", this.button("‹", 22, () => this.stepHit(-1), 42, 42));
      sb.call("addView", this.sCount);
      sb.call("addView", this.button("›", 22, () => this.stepHit(1), 42, 42));
      sb.call("setVisibility", View.getStaticField("GONE"));
      const slp = new LLP(-2, -2);
      slp.call("setMargins", 0, 0, 0, this.dp(8));
      box.call("addView", sb, slp);
      this.searchBar = sb;
    }
    const pager = this.pill();
    this.prevB = this.button("‹", 24, () => this.go(this.index - 1), 46, 46);
    this.nextB = this.button("›", 24, () => this.go(this.index + 1), 46, 46);
    this.counter = this.counterView(86);
    const [clickL, unreg] = createClickListener(() => this.jumpDialog());
    this.cleanupFns.push(unreg);
    this.counter.call("setOnClickListener", clickL);
    pager.call("addView", this.prevB);
    pager.call("addView", this.counter);
    pager.call("addView", this.nextB);
    box.call("addView", pager, new LLP(-2, -2));
    this.pager = pager;
    const plp = new FLP(-2, -2, Gravity.getStaticField("BOTTOM") | Gravity.getStaticField("CENTER_HORIZONTAL"));
    plp.call("setMargins", 0, 0, 0, nbh + this.dp(20));
    root.call("addView", box, plp);
    this.box = box;
  }
  updateSub() {
    const parts = [this.label];
    if ((this.kind === "pdf" || this.kind === "text") && this.count > 1) {
      parts.push(`${this.count} ${t("pages_short")}`);
    }
    parts.push(this.sizeTxt);
    this.subTv?.call("setText", parts.join(" · "));
    this.updateCounter();
  }
  updateCounter() {
    if (!this.pager) return;
    this.counter?.call("setText", `${this.index + 1} / ${this.count}`);
    this.prevB?.call("setAlpha", Number(this.index <= 0 ? 0.35 : 1));
    this.nextB?.call("setAlpha", Number(this.index >= this.count - 1 ? 0.35 : 1));
  }
  syncChrome() {
    const vis = this.chrome ? View.getStaticField("VISIBLE") : View.getStaticField("GONE");
    if (this.kind !== "web") {
      this.topBar?.call("setVisibility", vis);
    }
    if (this.box) {
      this.box.call("setVisibility", vis);
      this.pager?.call("setVisibility", this.count > 1 ? View.getStaticField("VISIBLE") : View.getStaticField("GONE"));
    }
  }
  toggleChrome() {
    this.chrome = !this.chrome;
    this.syncChrome();
  }
  close() {
    try {
      this.dlg?.call("dismiss");
    } finally {
      this.cleanup();
    }
  }
  cleanup() {
    if (this.closed) return;
    this.closed = true;
    this.token++;
    this.loadTok++;
    this.savePos();
    for (const child of [...this.children]) {
      try {
        child.close();
      } catch {
      }
    }
    this.children.clear();
    if (this.wv) {
      try {
        this.root?.call("removeView", this.wv);
        this.wv.call("destroy");
      } catch {
      }
      this.wv = null;
    }
    try {
      this.renderer?.call("close");
    } catch {
    }
    this.renderer = null;
    try {
      this.pfd?.call("close");
    } catch {
    }
    this.pfd = null;
    const bitmaps = /* @__PURE__ */ new Set([...this.cache.values(), this.bitmap, this.srcBitmap]);
    try {
      this.iv?.call("setImageBitmap", null);
    } catch {
    }
    for (const bitmap of bitmaps) {
      try {
        bitmap?.call("recycle");
      } catch {
      }
    }
    this.cache.clear();
    this.cacheOrder.length = 0;
    this.bitmap = this.srcBitmap = null;
    for (const fn of this.cleanupFns) {
      try {
        fn();
      } catch {
      }
    }
    this.cleanupFns.length = 0;
    this.onClose?.();
  }
  onKey(code, ev) {
    if (code !== 24 && code !== 25 || localStorage.getItem("volume") === "false") {
      return false;
    }
    const step = code === 25 ? 1 : -1;
    const action = Number(ev.call("getAction"));
    if (this.kind === "pdf") {
      if (action === 0) this.go(this.index + step);
      return true;
    }
    if (this.kind === "text" && this.doc) {
      if (action === 0) {
        if (this.sv?.call("canScrollVertically", step)) {
          const svH = Number(this.sv.call("getHeight"));
          this.sv.call("smoothScrollBy", 0, Math.round(step * svH * 0.85));
        } else if (this.index + step >= 0 && this.index + step < this.count) {
          this.go(this.index + step);
        }
      }
      return true;
    }
    return false;
  }
  startLoad(keepIndex = false) {
    this.loadTok++;
    const tok = this.loadTok;
    this.keepIndex = keepIndex ? this.index : null;
    this.clearHits();
    this.setLoading(t("loading"));
    setTimeout(() => {
      try {
        const opts = {
          wrap: this.wrap,
          prettyjson: localStorage.getItem("prettyjson") !== "false",
          csvTable: localStorage.getItem("csv_table") !== "false"
        };
        let doc;
        if (TEXTUAL.has(this.fmt)) {
          doc = buildTextDoc(this.path, this.fmt, this.ext, opts, this.enc);
        } else if (this.fmt === "archive") {
          doc = archiveDoc(this.path);
        } else {
          doc = buildDoc(this.path, this.fmt, this.ext, opts, this.enc);
        }
        runOnUI(() => this.onDoc(doc, tok));
      } catch (e) {
        const msg = fmtErr(e);
        runOnUI(() => this.showError(msg));
      }
    }, 10);
  }
  onDoc(doc, tok) {
    if (this.closed || tok !== this.loadTok) return;
    this.doc = doc;
    this.pages = doc.pages;
    this.count = doc.pages.length;
    this.font = doc.font;
    this.wrap = doc.wrap;
    this.attachText();
    this.applyFont();
    this.loading?.call("setVisibility", View.getStaticField("GONE"));
    let start = 0;
    if (this.keepIndex !== null) {
      start = this.keepIndex;
    } else if (localStorage.getItem("remember") !== "false") {
      start = this.loadPos();
    }
    this.updateSub();
    this.syncChrome();
    this.showTextPage(start);
  }
  applyFont() {
    if (!this.tv) return;
    const faces = [
      Typeface.getStaticField("DEFAULT"),
      Typeface.getStaticField("SERIF"),
      Typeface.getStaticField("MONOSPACE")
    ];
    this.tv.call("setTypeface", faces[this.font % faces.length]);
    this.tv.call("setTextSize", Number(this.textSize));
  }
  applyTheme() {
    const t2 = THEMES[this.theme];
    if (this.kind === "text") {
      this.root?.call("setBackgroundColor", t2.bg);
      this.sv?.call("setBackgroundColor", t2.bg);
      this.tv?.call("setTextColor", t2.fg);
    } else if (this.kind === "web") {
      this.wv?.call("setBackgroundColor", MD_EXT.has(this.ext) ? t2.bg : -1);
    }
  }
  renderPage() {
    if (!this.tv) return;
    const text = this.pages[this.index] ?? "";
    const ids = this.hitsByPage.get(this.index);
    if (!ids || ids.length === 0) {
      this.tv.call("setText", text);
      return;
    }
    const t2 = THEMES[this.theme];
    const chosen = ids.filter((i) => i !== this.cur).slice(0, MAX_SPANS);
    if (ids.includes(this.cur)) chosen.push(this.cur);
    const ss = new SpannableString(text);
    for (const i of chosen) {
      const hit = this.hits[i];
      if (hit) {
        const spanColor = i === this.cur ? t2.cur : t2.hit;
        ss.call("setSpan", new BgSpan(spanColor), hit[1], hit[2], 33);
      }
    }
    this.tv.call("setText", ss);
  }
  showTextPage(idx) {
    this.index = Math.max(0, Math.min(this.count - 1, idx));
    this.renderPage();
    this.updateCounter();
    this.savePos();
    this.sv?.call("scrollTo", 0, 0);
  }
  searchDialog() {
    this.inputDialog(t("search"), "", false, t("find"), (q) => this.runSearch(q));
  }
  runSearch(query) {
    this.clearHits();
    if (!query) {
      this.renderPage();
      return;
    }
    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const hits = [];
    const byPage = /* @__PURE__ */ new Map();
    for (let p = 0; p < this.pages.length; p++) {
      const text = this.pages[p];
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(text)) !== null) {
        const hitIdx = hits.length;
        if (!byPage.has(p)) byPage.set(p, []);
        byPage.get(p).push(hitIdx);
        hits.push([p, m.index, m.index + m[0].length]);
        if (hits.length >= MAX_HITS) break;
      }
      if (hits.length >= MAX_HITS) break;
    }
    if (hits.length === 0) {
      this.toast(t("not_found"));
      this.renderPage();
      return;
    }
    this.hits = hits;
    this.hitsByPage = byPage;
    const first = hits.findIndex((h) => h[0] >= this.index);
    this.searchBar?.call("setVisibility", View.getStaticField("VISIBLE"));
    this.gotoHit(first >= 0 ? first : 0);
  }
  gotoHit(i) {
    this.cur = i;
    const total = `${i + 1} / ${this.hits.length}${this.hits.length >= MAX_HITS ? "+" : ""}`;
    this.sCount?.call("setText", total);
    this.showTextPage(this.hits[i][0]);
  }
  stepHit(d) {
    if (this.hits.length > 0) {
      this.gotoHit((this.cur + d + this.hits.length) % this.hits.length);
    }
  }
  clearHits() {
    this.hits = [];
    this.hitsByPage.clear();
    this.cur = -1;
    this.searchBar?.call("setVisibility", View.getStaticField("GONE"));
  }
  endSearch() {
    const had = this.hits.length > 0;
    this.clearHits();
    if (had && this.doc) this.renderPage();
  }
  startWeb() {
    this.loadTok++;
    const tok = this.loadTok;
    this.setLoading(t("loading"));
    setTimeout(() => {
      try {
        const page = buildWeb(this.path, this.ext, this.theme);
        runOnUI(() => {
          if (this.closed || tok !== this.loadTok || !this.wv) return;
          this.wv.call("loadDataWithBaseURL", null, page, "text/html", "utf-8", null);
          this.loading?.call("setVisibility", View.getStaticField("GONE"));
        });
      } catch (e) {
        const msg = fmtErr(e);
        runOnUI(() => this.showError(msg));
      }
    }, 10);
  }
  zoomWeb(delta) {
    this.webZoom = Math.max(50, Math.min(300, this.webZoom + delta));
    this.wv?.call("getSettings").call("setTextZoom", this.webZoom | 0);
  }
  loadImage() {
    setTimeout(() => {
      try {
        const { bmp, rot } = decodeImage(this.path);
        this.rot = rot;
        this.token++;
        const tok = this.token;
        runOnUI(() => this.setBitmap(bmp, tok));
      } catch (e) {
        const msg = fmtErr(e);
        runOnUI(() => this.showError(msg));
      }
    }, 10);
  }
  setBitmap(src, tok) {
    if (this.closed || tok !== this.token) {
      try {
        src.call("recycle");
      } catch {
      }
      return;
    }
    this.srcBitmap = src;
    this.shownTok = tok;
    this.display(src);
    this.loading?.call("setVisibility", View.getStaticField("GONE"));
  }
  display(src) {
    let bmp = src;
    if (this.rot) {
      const m = new Matrix();
      m.call("postRotate", Number(this.rot));
      bmp = Bitmap.callStatic("createBitmap", src, 0, 0, src.call("getWidth"), src.call("getHeight"), m, true);
    }
    this.bitmap = bmp;
    this.bw = Math.max(1, Number(bmp.call("getWidth")));
    this.bh = Math.max(1, Number(bmp.call("getHeight")));
    this.iv?.call("setImageBitmap", bmp);
    this.applyInvert();
    this.resetZoom();
  }
  applyInvert() {
    if (!this.iv) return;
    if (this.invert) {
      this.iv.call("setColorFilter", inversionFilter());
    } else {
      this.iv.call("clearColorFilter");
    }
  }
  rotate() {
    this.rot = (this.rot + 90) % 360;
    if (this.srcBitmap) this.display(this.srcBitmap);
  }
  toggleFit() {
    this.fitWidth = !this.fitWidth;
    localStorage.setItem("fitwidth", String(this.fitWidth));
    this.resetZoom();
  }
  toggleInvert() {
    this.invert = !this.invert;
    localStorage.setItem("invert", String(this.invert));
    this.applyInvert();
  }
  curScale() {
    return matrixScale(this.matrix);
  }
  contentRect() {
    const rf = new RectF(0, 0, Number(this.bw), Number(this.bh));
    this.matrix.call("mapRect", rf);
    return rf;
  }
  fitsWidth() {
    if (!this.bitmap) return true;
    const [vw] = this.viewSize();
    return Number(this.contentRect().call("width")) <= vw * 1.02;
  }
  applyMatrix() {
    this.iv?.call("setImageMatrix", this.matrix);
    this.iv?.call("invalidate");
  }
  resetZoom() {
    if (!this.bitmap) return;
    const [vw, vh] = this.viewSize();
    const pageFit = Math.min(vw / this.bw, vh / this.bh);
    this.minScale = pageFit;
    this.fit = this.fitWidth ? Math.max(pageFit, vw / this.bw) : pageFit;
    this.matrix.call("reset");
    this.matrix.call("postScale", Number(this.fit), Number(this.fit));
    this.fixBounds();
    this.applyMatrix();
  }
  fixBounds() {
    const [vw, vh] = this.viewSize();
    const rf = this.contentRect();
    const rfW = Number(rf.call("width"));
    const rfH = Number(rf.call("height"));
    const rfLeft = Number(rf.getField("left"));
    const rfRight = Number(rf.getField("right"));
    const rfTop = Number(rf.getField("top"));
    const rfBottom = Number(rf.getField("bottom"));
    let dx = 0;
    let dy = 0;
    if (rfW <= vw) {
      dx = (vw - rfW) / 2 - rfLeft;
    } else if (rfLeft > 0) {
      dx = -rfLeft;
    } else if (rfRight < vw) {
      dx = vw - rfRight;
    }
    if (rfH <= vh) {
      dy = (vh - rfH) / 2 - rfTop;
    } else if (rfTop > 0) {
      dy = -rfTop;
    } else if (rfBottom < vh) {
      dy = vh - rfBottom;
    }
    this.matrix.call("postTranslate", Number(dx), Number(dy));
  }
  zoomBy(f, fx, fy) {
    if (!this.bitmap) return;
    const cur = this.curScale();
    const next = Math.max(this.minScale, Math.min(this.fit * this.maxZoom, cur * f));
    const factor = next / cur;
    this.matrix.call("postScale", Number(factor), Number(factor), Number(fx), Number(fy));
    this.fixBounds();
    this.applyMatrix();
  }
  doubleTap(x, y) {
    if (!this.bitmap) return;
    if (this.curScale() > this.fit * 1.1) {
      this.resetZoom();
    } else {
      this.zoomBy(2.6, x, y);
    }
  }
  go(idx) {
    if (idx < 0 || idx >= this.count) return;
    if (this.kind === "pdf") {
      if (idx !== this.index) this.showPage(idx);
    } else if (this.kind === "text") {
      this.showTextPage(idx);
    }
  }
  showPage(idx) {
    this.index = idx;
    this.token++;
    const tok = this.token;
    this.updateCounter();
    this.savePos();
    const cached = this.cache.get(idx);
    if (cached) {
      this.setBitmap(cached, tok);
      this.prefetch(idx + 1);
      return;
    }
    if (!this.srcBitmap) this.setLoading(t("loading"));
    setTimeout(() => {
      try {
        if (this.closed || tok !== this.token || !this.renderer) return;
        const dm = this.act.call("getResources").call("getDisplayMetrics");
        const bmp = renderPdfPage(this.renderer, idx, Number(dm.getField("widthPixels")));
        runOnUI(() => {
          if (this.closed) return;
          this.cachePut(idx, bmp);
          if (tok === this.token) {
            this.setBitmap(bmp, tok);
            this.prefetch(idx + 1);
          }
        });
      } catch (e) {
        console.warn("DocViewer PDF render error:", e);
      }
    }, 10);
  }
  cachePut(idx, bmp) {
    this.cache.set(idx, bmp);
    this.cacheOrder = this.cacheOrder.filter((i) => i !== idx);
    this.cacheOrder.push(idx);
    while (this.cacheOrder.length > 3) {
      const old = this.cacheOrder.shift();
      if (old !== this.index) {
        this.cache.delete(old);
      } else {
        this.cacheOrder.push(old);
        break;
      }
    }
  }
  prefetch(idx) {
    if (this.kind !== "pdf" || idx < 0 || idx >= this.count || this.cache.has(idx)) return;
    setTimeout(() => {
      try {
        if (this.closed || !this.renderer) return;
        const dm = this.act.call("getResources").call("getDisplayMetrics");
        const bmp = renderPdfPage(this.renderer, idx, Number(dm.getField("widthPixels")));
        runOnUI(() => this.cachePut(idx, bmp));
      } catch {
      }
    }, 20);
  }
  jumpDialog() {
    if (this.count <= 1) return;
    this.inputDialog(`${t("jump_to_page")} (1–${this.count})`, String(this.index + 1), true, t("jump"), (v) => {
      const n = parseInt(v, 10);
      if (!isNaN(n)) {
        this.go(Math.max(1, Math.min(this.count, n)) - 1);
      }
    });
  }
  copyToClipboard(text) {
    try {
      inu.clipboard.write(text);
      this.toast(t("copied"));
    } catch (e) {
      this.toast(`${t("copy_fail")}: ${fmtErr(e)}`);
    }
  }
  fileUri() {
    const pkg = String(this.act.call("getPackageName"));
    return FileProvider.callStatic("getUriForFile", this.act, `${pkg}.provider`, new JFile(this.path));
  }
  share() {
    try {
      const it = new Intent(Intent.getStaticField("ACTION_SEND"));
      it.call("setType", this.mime || "*/*");
      it.call("putExtra", Intent.getStaticField("EXTRA_STREAM"), this.fileUri());
      it.call("addFlags", 1);
      this.act.call("startActivity", Intent.callStatic("createChooser", it, t("share_file")));
    } catch (e) {
      this.toast(`${t("share_fail")}: ${fmtErr(e)}`);
    }
  }
  openExternal() {
    try {
      const it = new Intent(Intent.getStaticField("ACTION_VIEW"));
      it.call("setDataAndType", this.fileUri(), this.mime || "*/*");
      it.call("addFlags", 1);
      this.act.call("startActivity", Intent.callStatic("createChooser", it, t("open_ext")));
    } catch (e) {
      this.toast(`${t("open_fail")}: ${fmtErr(e)}`);
    }
  }
  info() {
    const lines = [
      `${t("info_name")}: ${this.name}`,
      `${t("info_size")}: ${this.sizeTxt}`,
      `${t("info_format")}: ${this.label}`
    ];
    if ((this.kind === "pdf" || this.kind === "text") && this.count > 1) {
      lines.push(`${t("info_pages")}: ${this.count}`);
    }
    if (this.kind === "image" && this.bitmap) {
      lines.push(`${t("info_resolution")}: ${this.bw} × ${this.bh}`);
    }
    if (this.doc?.raw) {
      lines.push(`${t("info_encoding")}: ${this.enc ?? this.doc.enc ?? "utf-8"}`);
    }
    if (this.mime) lines.push(`${t("info_mime")}: ${this.mime}`);
    lines.push(`${t("info_path")}: ${this.path}`);
    const b = this.builder();
    b.call("setTitle", t("about_file"));
    b.call("setMessage", lines.join("\n"));
    b.call("setPositiveButton", t("ok"), null);
    b.call("show");
  }
  encodingDialog() {
    const [dlgClick, unreg] = createDlgClickListener((_, which) => {
      if (which >= 0 && which < ENCODINGS.length) {
        this.enc = ENCODINGS[which][1];
        this.startLoad(true);
      }
    });
    this.cleanupFns.push(unreg);
    const arr = stringArray(ENCODINGS.map(([label], i) => i === 0 ? String(t("enc_auto")) : label));
    const b = this.builder();
    b.call("setTitle", t("menu_encoding"));
    b.call("setItems", arr, dlgClick);
    b.call("show");
  }
  openArchive() {
    try {
      const names = listArchiveFiles(this.path);
      if (!names.length) {
        this.toast(String(t("empty_doc")));
        return;
      }
      const showBatch = (offset) => {
        const batch = names.slice(offset, offset + 200);
        const more = offset + batch.length < names.length;
        const labels = more ? [...batch, "… →"] : batch;
        const [listener, unregister] = createDlgClickListener((_, which) => {
          if (more && which === batch.length) {
            showBatch(offset + batch.length);
            return;
          }
          const name = batch[which];
          if (name) this.openArchiveEntry(name);
        });
        this.cleanupFns.push(unregister);
        const builder = this.builder();
        builder.call("setTitle", t("archive_open"));
        builder.call("setItems", stringArray(labels), listener);
        builder.call("show");
      };
      showBatch(0);
    } catch (error) {
      this.toast(fmtErr(error));
    }
  }
  openArchiveEntry(name) {
    let path = null;
    let child = null;
    let pdf = null;
    try {
      let format = detectFormat(name);
      if (!format) throw new Error(String(t("archive_unsupported")));
      const cache = String(this.act.call("getCacheDir").call("getAbsolutePath"));
      path = extractArchiveFile(this.path, name, cache);
      if (format === "sniff" || TEXTUAL.has(format)) {
        if (!looksLikeText(path)) throw new Error(String(t("archive_unsupported")));
        if (format === "sniff") format = "text";
      }
      if (format === "pdf") pdf = openPdf(path);
      child = new _DocViewer(this.act, path, name, format, fileExt(name), "", pdf?.renderer, pdf?.pfd, pdf?.count);
      const opened = child;
      const temporary = path;
      child.onClose = () => {
        this.children.delete(opened);
        try {
          new JFile(temporary).call("delete");
        } catch {
        }
      };
      this.children.add(child);
      child.show();
    } catch (error) {
      try {
        child?.close();
      } catch {
      }
      if (!child) {
        try {
          pdf?.renderer.call("close");
        } catch {
        }
        try {
          pdf?.pfd.call("close");
        } catch {
        }
      }
      try {
        if (path) new JFile(path).call("delete");
      } catch {
      }
      this.toast(fmtErr(error));
    }
  }
  openMenu() {
    const items = [];
    const actions = [];
    const add = (title, fn) => {
      items.push(title);
      actions.push(fn);
    };
    const onOff = (v) => v ? t("on") : t("off");
    if (this.fmt === "archive") add(t("archive_open"), () => this.openArchive());
    if (this.kind === "text" && this.doc) {
      add(t("menu_search"), () => this.searchDialog());
      if (this.hits.length > 0) add(t("menu_search_reset"), () => this.endSearch());
    }
    if ((this.kind === "pdf" || this.kind === "text") && this.count > 1) {
      add(t("menu_jump"), () => this.jumpDialog());
      add(t("menu_start"), () => this.go(0));
      add(t("menu_end"), () => this.go(this.count - 1));
    }
    if (this.kind === "pdf" || this.kind === "image") {
      add(`${t("menu_night")}: ${onOff(this.invert)}`, () => this.toggleInvert());
      add(t("menu_rotate"), () => this.rotate());
      add(`${t("menu_scale")}: ${this.fitWidth ? t("scale_screen") : t("scale_width")}`, () => this.toggleFit());
    }
    if (this.kind === "text" && this.doc) {
      const fontNames = [t("font_default"), t("font_serif"), t("font_mono")];
      add(`${t("menu_font")}: ${fontNames[this.font % fontNames.length]}`, () => {
        this.font = (this.font + 1) % fontNames.length;
        this.applyFont();
      });
      add(t("menu_font_larger"), () => {
        this.textSize = Math.min(34, this.textSize + 1);
        localStorage.setItem("text_size", String(this.textSize));
        this.tv?.call("setTextSize", Number(this.textSize));
      });
      add(t("menu_font_smaller"), () => {
        this.textSize = Math.max(8, this.textSize - 1);
        localStorage.setItem("text_size", String(this.textSize));
        this.tv?.call("setTextSize", Number(this.textSize));
      });
      add(`${t("menu_wrap")}: ${onOff(this.wrap)}`, () => {
        this.wrap = !this.wrap;
        this.attachText();
      });
      const themeNames = [t("theme_dark"), t("theme_light"), t("theme_sepia")];
      add(`${t("menu_theme")}: ${themeNames[this.theme % themeNames.length]}`, () => {
        this.theme = (this.theme + 1) % THEMES.length;
        localStorage.setItem("theme", String(this.theme));
        this.applyTheme();
        this.renderPage();
      });
      if (this.doc.raw) {
        add(`${t("menu_encoding")}: ${this.enc ?? this.doc.enc ?? t("enc_auto")}`, () => this.encodingDialog());
      }
      add(t("menu_copy_page"), () => this.copyToClipboard(this.pages[this.index] ?? ""));
      add(t("menu_copy_all"), () => this.copyToClipboard(this.pages.join(this.doc?.sep ?? "\n\n")));
    }
    if (this.kind === "web") {
      if (MD_EXT.has(this.ext)) {
        const themeNames = [t("theme_dark"), t("theme_light"), t("theme_sepia")];
        add(`${t("menu_theme")}: ${themeNames[this.theme % themeNames.length]}`, () => {
          this.theme = (this.theme + 1) % THEMES.length;
          localStorage.setItem("theme", String(this.theme));
          this.startWeb();
        });
      }
      add(t("menu_zoom_in"), () => this.zoomWeb(10));
      add(t("menu_zoom_out"), () => this.zoomWeb(-10));
    }
    add(t("share_file"), () => this.share());
    add(t("open_ext"), () => this.openExternal());
    add(t("about_file"), () => this.info());
    const [dlgClick, unreg] = createDlgClickListener((_, which) => {
      actions[which]?.();
    });
    this.cleanupFns.push(unreg);
    const arr = stringArray(items);
    const b = this.builder();
    b.call("setTitle", t("menu_title"));
    b.call("setItems", arr, dlgClick);
    b.call("show");
  }
};

// src/index.ts
initJvm();
var activeViewers = [];
function isSettingEnabled(key, def = true) {
  const val = localStorage.getItem(key);
  if (val === null) return def;
  return val !== "false";
}
function resolveFile(args) {
  if (!args || args.length === 0 || !args[0]) return null;
  const first = args[0];
  let path = null;
  let name = null;
  let mime = "";
  try {
    if (typeof first === "string") {
      path = first;
      if (args.length > 1 && typeof args[1] === "string") name = args[1];
      if (args.length > 2 && typeof args[2] === "string") mime = args[2];
    } else if (MessageObject.isInstance(first)) {
      const owner = first.getField("messageOwner");
      const ap = owner?.getField("attachPath");
      if (ap) {
        const apStr = String(ap);
        const apFile = new JFile(apStr);
        if (apFile.call("exists")) path = apStr;
      }
      if (!path) {
        const acc = Number(first.getField("currentAccount"));
        const f = FileLoader.callStatic("getInstance", acc).call("getPathToMessage", owner);
        if (f && f.call("exists")) path = String(f.call("getAbsolutePath"));
      }
      const doc = first.call("getDocument");
      if (doc) {
        mime = String(doc.getField("mime_type") ?? "");
        try {
          name = String(FileLoader.callStatic("getDocumentFileName", doc));
        } catch {
        }
      }
    } else if (JFile.isInstance(first)) {
      path = String(first.call("getAbsolutePath"));
      if (args.length > 1 && args[1]) name = String(args[1]);
      if (args.length > 2 && args[2]) mime = String(args[2]);
    } else if (TLObject.isInstance(first)) {
      const acc = Number(UserConfig.getStaticField("selectedAccount"));
      const f = FileLoader.callStatic("getInstance", acc).call("getPathToAttach", first, true);
      if (f && f.call("exists")) path = String(f.call("getAbsolutePath"));
      try {
        mime = String(first.getField("mime_type") ?? "");
        name = String(FileLoader.callStatic("getDocumentFileName", first));
      } catch {
      }
    }
  } catch (e) {
    console.warn("DocViewer resolveFile error:", e);
  }
  if (!path) return null;
  const jf = new JFile(path);
  if (!jf.call("exists") || !jf.call("isFile") || Number(jf.call("length")) === 0) {
    return null;
  }
  if (!name || name === "None" || name === "null") {
    name = String(jf.call("getName"));
  }
  return [path, name, mime];
}
function getActivity(args) {
  for (const a of args) {
    if (a && typeof a === "object") {
      try {
        if (Activity.isInstance(a)) return a;
      } catch {
      }
    }
  }
  return inu.android.getCurrentActivity();
}
function tryOpen(args) {
  const resolved = resolveFile(args);
  if (!resolved) return false;
  const [path, name, mime] = resolved;
  let fmt = detectFormat(name, mime);
  if (TEXTUAL.has(fmt ?? "") || fmt === "sniff") {
    if (!looksLikeText(path)) return false;
    if (fmt === "sniff") fmt = "text";
  }
  if (!fmt) return false;
  const settingKey = SETTING_OF[fmt];
  if (settingKey && !isSettingEnabled(settingKey, true)) {
    return false;
  }
  const act = getActivity(args);
  if (!act) return false;
  const ext = fileExt(name) || fileExt(path);
  let renderer = null;
  let pfd = null;
  let count = 1;
  if (fmt === "pdf") {
    try {
      const pdf = openPdf(path);
      renderer = pdf.renderer;
      pfd = pdf.pfd;
      count = pdf.count;
    } catch (e) {
      console.warn("DocViewer cannot open PDF, falling back to stock:", e);
      return false;
    }
  }
  let viewer = null;
  try {
    viewer = new DocViewer(act, path, name, fmt, ext, mime, renderer, pfd, count);
    const opened = viewer;
    viewer.onClose = () => {
      const index = activeViewers.indexOf(opened);
      if (index >= 0) activeViewers.splice(index, 1);
    };
    activeViewers.push(viewer);
    viewer.show();
    return true;
  } catch (e) {
    if (viewer) {
      try {
        viewer.close();
      } catch {
      }
      try {
        viewer.cleanup();
      } catch {
      }
    } else {
      try {
        renderer?.call("close");
      } catch {
      }
      try {
        pfd?.call("close");
      } catch {
      }
    }
    console.warn("DocViewer show error:", e);
    return false;
  }
}
inu.xposed.hookAllOverloads(AndroidUtilities, "openForView", {
  before: (ctx) => {
    if (tryOpen(ctx.args)) {
      ctx.setReturnValue(true);
    }
  }
});
inu.onUnload(() => {
  for (const v of [...activeViewers]) {
    try {
      v.close();
    } catch {
    }
  }
  activeViewers.length = 0;
});
function getLangIndex() {
  const v = localStorage.getItem("docviewer_lang");
  if (v === "uk") return 1;
  if (v === "en") return 2;
  if (v === "ru") return 3;
  return 0;
}
var settingsPage = inu.ui.settingsPage({
  title: "Doc Viewer",
  items: () => [
    inu.ui.header(t("header_language")),
    inu.ui.select({
      id: "docviewer_lang",
      text: t("header_language"),
      items: [t("lang_auto"), "Українська", "English", "Русский"],
      selected: getLangIndex(),
      onChange: (index) => {
        const val = index === 1 ? "uk" : index === 2 ? "en" : index === 3 ? "ru" : "auto";
        localStorage.setItem("docviewer_lang", val);
      }
    }),
    inu.ui.header(t("header_formats")),
    inu.ui.check({
      id: "pdf",
      text: t("setting_pdf"),
      checked: isSettingEnabled("pdf", true),
      onChange: (v) => {
        localStorage.setItem("pdf", String(v));
      }
    }),
    inu.ui.check({
      id: "docs",
      text: t("setting_docs"),
      checked: isSettingEnabled("docs", true),
      onChange: (v) => {
        localStorage.setItem("docs", String(v));
      }
    }),
    inu.ui.check({
      id: "books",
      text: t("setting_books"),
      checked: isSettingEnabled("books", true),
      onChange: (v) => {
        localStorage.setItem("books", String(v));
      }
    }),
    inu.ui.check({
      id: "text",
      text: t("setting_text"),
      checked: isSettingEnabled("text", true),
      onChange: (v) => {
        localStorage.setItem("text", String(v));
      }
    }),
    inu.ui.check({
      id: "web",
      text: t("setting_web"),
      checked: isSettingEnabled("web", true),
      onChange: (v) => {
        localStorage.setItem("web", String(v));
      }
    }),
    inu.ui.check({
      id: "image",
      text: t("setting_image"),
      checked: isSettingEnabled("image", true),
      onChange: (v) => {
        localStorage.setItem("image", String(v));
      }
    }),
    inu.ui.check({
      id: "archive",
      text: t("setting_archive"),
      checked: isSettingEnabled("archive", true),
      onChange: (v) => {
        localStorage.setItem("archive", String(v));
      }
    }),
    inu.ui.header(t("header_viewing")),
    inu.ui.check({
      id: "invert",
      text: t("setting_invert"),
      checked: isSettingEnabled("invert", false),
      onChange: (v) => {
        localStorage.setItem("invert", String(v));
      }
    }),
    inu.ui.check({
      id: "fitwidth",
      text: t("setting_fitwidth"),
      checked: isSettingEnabled("fitwidth", false),
      onChange: (v) => {
        localStorage.setItem("fitwidth", String(v));
      }
    }),
    inu.ui.check({
      id: "remember",
      text: t("setting_remember"),
      checked: isSettingEnabled("remember", true),
      onChange: (v) => {
        localStorage.setItem("remember", String(v));
      }
    }),
    inu.ui.check({
      id: "volume",
      text: t("setting_volume"),
      checked: isSettingEnabled("volume", true),
      onChange: (v) => {
        localStorage.setItem("volume", String(v));
      }
    }),
    inu.ui.check({
      id: "keepon",
      text: t("setting_keepon"),
      checked: isSettingEnabled("keepon", true),
      onChange: (v) => {
        localStorage.setItem("keepon", String(v));
      }
    }),
    inu.ui.check({
      id: "wrap",
      text: t("setting_wrap"),
      checked: isSettingEnabled("wrap", true),
      onChange: (v) => {
        localStorage.setItem("wrap", String(v));
      }
    }),
    inu.ui.check({
      id: "prettyjson",
      text: t("setting_prettyjson"),
      checked: isSettingEnabled("prettyjson", true),
      onChange: (v) => {
        localStorage.setItem("prettyjson", String(v));
      }
    }),
    inu.ui.check({
      id: "csv_table",
      text: t("setting_csv_table"),
      checked: isSettingEnabled("csv_table", true),
      onChange: (v) => {
        localStorage.setItem("csv_table", String(v));
      }
    }),
    inu.ui.separator(t("separator_desc"))
  ]
});
inu.registerSettings(settingsPage);
