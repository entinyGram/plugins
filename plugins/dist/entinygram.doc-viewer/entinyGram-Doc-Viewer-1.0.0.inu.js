// ==InuPlugin==
// @name         Doc Viewer
// @id           entinygram.doc-viewer
// @author       Daxo-Developer && @Daxo_OS (original), entinyGram (Inugram port)
// @version      1.0.0
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
registerExts("archive", "zip jar aar tar tgz tbz2 txz");
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
  "application/x-tar": "archive",
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
  const ml = (mime ?? "").toLowerCase();
  if (low.endsWith(".tar.gz") || low.endsWith(".tar.bz2") || low.endsWith(".tar.xz")) {
    return "archive";
  }
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
function readFileBytes(path, maxBytes = MAX_TEXT_BYTES) {
  const file = new JFile(path);
  const length = Number(file.call("length"));
  const toRead = Math.min(length, maxBytes);
  const cut = length > maxBytes;
  const fis = new FileInputStream(file);
  const baos = new ByteArrayOutputStream();
  const JArray = inu.jvm.cls("java.lang.reflect.Array");
  const ByteType = inu.jvm.cls("java.lang.Byte").getStaticField("TYPE");
  const bufSize = 65536;
  const buffer = JArray.callStatic("newInstance", ByteType, bufSize);
  let total = 0;
  try {
    while (total < toRead) {
      const want = Math.min(bufSize, toRead - total);
      const read = Number(fis.call("read([BII)I", buffer, 0, want));
      if (read <= 0) break;
      baos.call("write([BII)V", buffer, 0, read);
      total += read;
    }
  } finally {
    try {
      fis.call("close");
    } catch {
    }
  }
  const bytes = baos.call("toByteArray");
  return { bytes, cut };
}
function looksLikeText(path) {
  try {
    const file = new JFile(path);
    if (!file.call("exists") || Number(file.call("length")) === 0) return false;
    const fis = new FileInputStream(file);
    const JArray = inu.jvm.cls("java.lang.reflect.Array");
    const ByteType = inu.jvm.cls("java.lang.Byte").getStaticField("TYPE");
    const buffer = JArray.callStatic("newInstance", ByteType, 8192);
    const read = Number(fis.call("read([B)I", buffer));
    fis.call("close");
    if (read <= 0) return false;
    const baos = new ByteArrayOutputStream();
    baos.call("write([BII)V", buffer, 0, read);
    const head = baos.call("toByteArray");
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
function decodeText(raw, enc) {
  let text = "";
  let used = enc ?? "utf-8";
  if (enc) {
    try {
      text = String(new JString(raw, enc));
    } catch {
      text = String(new JString(raw, "utf-8"));
      used = "utf-8";
    }
  } else {
    if (raw.length >= 3 && raw[0] === 239 && raw[1] === 187 && raw[2] === 191) {
      text = String(new JString(raw.subarray(3), "utf-8"));
      used = "utf-8";
    } else if (raw.length >= 2 && (raw[0] === 255 && raw[1] === 254 || raw[0] === 254 && raw[1] === 255)) {
      text = String(new JString(raw, "utf-16"));
      used = "utf-16";
    } else {
      try {
        const decoded = new TextDecoder("utf-8").decode(raw);
        text = decoded;
        used = "utf-8";
      } catch {
        try {
          text = String(new JString(raw, "windows-1251"));
          used = "windows-1251";
        } catch {
          text = String(new JString(raw, "utf-8"));
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
  const capped = clean.map((r) => r.map((c) => c.length <= CELL_MAX ? c : `${c.slice(0, CELL_MAX - 1)}…`));
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
  const firstLines = text.split("\n", 20).filter((l) => l.trim().length > 0);
  const head = firstLines[0] ?? "";
  let delim = "	";
  if (ext === "tsv" || ext === "tab") {
    delim = "	";
  } else {
    const candidates = [",", ";", "	", "|"];
    let best = ",";
    let bestCount = 0;
    for (const c of candidates) {
      const count = (head.match(new RegExp(`\\${c}`, "g")) || []).length;
      if (count > bestCount) {
        bestCount = count;
        best = c;
      }
    }
    if (bestCount === 0) return null;
    delim = best;
  }
  const rows = [];
  let cut = false;
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim() && rows.length === 0) continue;
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delim && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    rows.push(cells.slice(0, MAX_COLS));
    if (rows.length >= MAX_ROWS) {
      cut = true;
      break;
    }
  }
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
  const renderer = new PdfRenderer(pfd);
  const count = Number(renderer.call("getPageCount"));
  if (count < 1) {
    renderer.call("close");
    pfd.call("close");
    throw new Error(String(t("err_empty_pdf")));
  }
  return { renderer, pfd, count };
}
function renderPdfPage(renderer, index, displayWidth) {
  const page = renderer.call("openPage", index);
  try {
    const pw = Number(page.call("getWidth"));
    const ph = Number(page.call("getHeight"));
    let sc = Math.min(displayWidth * 2 / pw, 3200 / Math.max(pw, ph));
    sc = Math.max(sc, 0.5);
    const w = Math.max(1, Math.round(pw * sc));
    const h = Math.max(1, Math.round(ph * sc));
    const bmp = Bitmap.callStatic("createBitmap", w, h, BitmapConfig.getStaticField("ARGB_8888"));
    fillWhite(bmp);
    page.call("render", bmp, null, null, PdfPage.getStaticField("RENDER_MODE_FOR_DISPLAY"));
    return bmp;
  } finally {
    page.call("close");
  }
}

// src/parsers/office.ts
function zreadBytes(zip, name) {
  const entry = zip.call("getEntry", name);
  if (!entry) throw new Error(tf("err_zip_entry", name));
  const is = zip.call("getInputStream", entry);
  const baos = new ByteArrayOutputStream();
  const JArray = inu.jvm.cls("java.lang.reflect.Array");
  const ByteType = inu.jvm.cls("java.lang.Byte").getStaticField("TYPE");
  const buffer = JArray.callStatic("newInstance", ByteType, 65536);
  try {
    let read = 0;
    while ((read = Number(is.call("read([B)I", buffer))) > 0) {
      baos.call("write([BII)V", buffer, 0, read);
    }
  } finally {
    try {
      is.call("close");
    } catch {
    }
  }
  return baos.call("toByteArray");
}
function zreadString(zip, name, charset = "utf-8") {
  const bytes = zreadBytes(zip, name);
  return String(new JString(bytes, charset));
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
  const tagRe = /<(w:p|w:tbl)\b[\s\S]*?<\/\1>/g;
  let match;
  while ((match = tagRe.exec(xml)) !== null) {
    const chunk = match[0];
    if (match[1] === "w:p") {
      const isHeading = /w:pStyle\s+w:val="Heading(\d)"/i.exec(chunk);
      const isList = /<w:numPr>/i.test(chunk);
      const texts = [];
      const textRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
      let tm;
      while ((tm = textRe.exec(chunk)) !== null) {
        texts.push(tm[1]);
      }
      const rawText = texts.join("").trim();
      if (rawText) {
        if (isHeading) {
          blocks.push(`${"#".repeat(Math.min(4, Number(isHeading[1])))} ${rawText}`);
        } else if (isList) {
          blocks.push(`• ${rawText}`);
        } else {
          blocks.push(rawText);
        }
      }
    } else if (match[1] === "w:tbl") {
      const rows = [];
      const trRe = /<w:tr\b[\s\S]*?<\/w:tr>/g;
      let trMatch;
      while ((trMatch = trRe.exec(chunk)) !== null) {
        const cells = [];
        const tcRe = /<w:tc\b[\s\S]*?<\/w:tc>/g;
        let tcMatch;
        while ((tcMatch = tcRe.exec(trMatch[0])) !== null) {
          const tcTexts = [];
          const textRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
          let tm;
          while ((tm = textRe.exec(tcMatch[0])) !== null) {
            tcTexts.push(tm[1]);
          }
          cells.push(tcTexts.join(" ").trim());
        }
        rows.push(cells);
      }
      const tblStr = formatRows(trimRows(rows), false);
      if (tblStr.trim()) {
        blocks.push(tblStr);
      }
    }
  }
  const full = blocks.join("\n\n") || String(t("empty_doc"));
  return new Doc(paginate(full), 0, true, "");
}
function xlsxDoc(path) {
  const zip = new ZipFile(new JFile(path));
  const pages = [];
  try {
    const shared = [];
    try {
      const sXml = zreadString(zip, "xl/sharedStrings.xml");
      const siRe = /<si\b[\s\S]*?<\/si>/g;
      let siMatch;
      while ((siMatch = siRe.exec(sXml)) !== null) {
        const tParts = [];
        const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
        let tm;
        while ((tm = tRe.exec(siMatch[0])) !== null) {
          tParts.push(tm[1]);
        }
        shared.push(tParts.join(""));
      }
    } catch {
    }
    const sheetEntries = [];
    try {
      const wbXml = zreadString(zip, "xl/workbook.xml");
      const sheetRe = /<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g;
      let sm;
      const rels = /* @__PURE__ */ new Map();
      try {
        const relXml = zreadString(zip, "xl/_rels/workbook.xml.rels");
        const relRe = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
        let rm;
        while ((rm = relRe.exec(relXml)) !== null) {
          rels.set(rm[1], rm[2].startsWith("/") ? rm[2].slice(1) : `xl/${rm[2]}`);
        }
      } catch {
      }
      while ((sm = sheetRe.exec(wbXml)) !== null) {
        const target = rels.get(sm[2]);
        if (target) {
          sheetEntries.push({ name: sm[1], path: target });
        }
      }
    } catch {
    }
    if (sheetEntries.length === 0) {
      sheetEntries.push({ name: String(t("sheet_default")), path: "xl/worksheets/sheet1.xml" });
    }
    for (const sheet of sheetEntries) {
      let sheetXml = "";
      try {
        sheetXml = zreadString(zip, sheet.path);
      } catch {
        continue;
      }
      const rows = [];
      const rowRe = /<row\b[\s\S]*?<\/row>/g;
      let rm;
      while ((rm = rowRe.exec(sheetXml)) !== null) {
        const cells = [];
        const cRe = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
        let cm;
        while ((cm = cRe.exec(rm[0])) !== null) {
          const attrs = cm[1];
          const body = cm[2];
          const isShared = /t="s"/i.test(attrs);
          const isInline = /t="inlineStr"/i.test(attrs);
          const vMatch = /<v>([\s\S]*?)<\/v>/.exec(body);
          let val = "";
          if (isShared && vMatch) {
            const idx = Number(vMatch[1]);
            val = shared[idx] ?? "";
          } else if (isInline) {
            const tMatch = /<t>([\s\S]*?)<\/t>/.exec(body);
            val = tMatch ? tMatch[1] : "";
          } else if (vMatch) {
            val = vMatch[1];
          }
          cells.push(val);
        }
        rows.push(cells.slice(0, MAX_COLS));
        if (rows.length >= MAX_ROWS) break;
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
    for (let i = 1; i <= 200; i++) {
      let slideXml = "";
      try {
        slideXml = zreadString(zip, `ppt/slides/slide${i}.xml`);
      } catch {
        break;
      }
      const paras = [];
      const pRe = /<a:p\b[\s\S]*?<\/a:p>/g;
      let pm;
      while ((pm = pRe.exec(slideXml)) !== null) {
        const texts = [];
        const tRe = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g;
        let tm;
        while ((tm = tRe.exec(pm[0])) !== null) {
          texts.push(tm[1]);
        }
        const s = texts.join("").trim();
        if (s) paras.push(s);
      }
      pages.push(`── ${tf("slide_n", i)} ──

${paras.join("\n\n") || String(t("no_text"))}`);
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
  const pRe = /<(text:p|text:h)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let pm;
  while ((pm = pRe.exec(xml)) !== null) {
    const isH = pm[1] === "text:h";
    const text = pm[2].replace(/<[^>]+>/g, "").trim();
    if (text) {
      blocks.push(isH ? `# ${text}` : text);
    }
  }
  const full = blocks.join("\n\n") || String(t("empty_doc"));
  return new Doc(paginate(full), 0, true, "");
}
function rtfDoc(path) {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES);
  const src = String(new JString(bytes, "latin1"));
  let text = src.replace(/\\par[d]?\b/g, "\n").replace(/\\tab\b/g, "	").replace(/\\u(-?\d+)\??/g, (_, code) => {
    const c = Number(code);
    return String.fromCharCode(c < 0 ? c + 65536 : c);
  }).replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  }).replace(/{\\[^{}]+}/g, "").replace(/\\[a-zA-Z]+(-?\d+)? ?/g, "").replace(/[{}]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  return new Doc(paginate(text || String(t("empty_doc"))), 0, true, "");
}
function emlDoc(path) {
  const { bytes } = readFileBytes(path, MAX_TEXT_BYTES);
  const raw = String(new JString(bytes, "utf-8"));
  const parts = raw.split(/\r?\n\r?\n/, 2);
  const headers = parts[0] ?? "";
  const body = parts[1] ?? "";
  const headLines = [];
  const getHeader = (name, label) => {
    const m = new RegExp(`^${name}:\\s*(.+)$`, "im").exec(headers);
    if (m) headLines.push(`${label}: ${m[1].trim()}`);
  };
  getHeader("From", String(t("email_from")));
  getHeader("To", String(t("email_to")));
  getHeader("Cc", String(t("email_cc")));
  getHeader("Subject", String(t("email_subject")));
  getHeader("Date", String(t("email_date")));
  const plainBody = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const out = `${headLines.join("\n")}

${plainBody}`;
  return new Doc(paginate(out), 0, true, "");
}
function epubDoc(path) {
  const zip = new ZipFile(new JFile(path));
  const pages = [];
  try {
    const containerXml = zreadString(zip, "META-INF/container.xml");
    const opfMatch = /full-path="([^"]+)"/i.exec(containerXml);
    if (!opfMatch) throw new Error(String(t("err_epub_manifest")));
    const opfPath = opfMatch[1];
    const opfBase = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
    const opfXml = zreadString(zip, opfPath);
    const manifest = /* @__PURE__ */ new Map();
    const itemRe = /<item\b[^>]*id="([^"]+)"[^>]*href="([^"]+)"/g;
    let im;
    while ((im = itemRe.exec(opfXml)) !== null) {
      manifest.set(im[1], im[2]);
    }
    const spine = [];
    const refRe = /<itemref\b[^>]*idref="([^"]+)"/g;
    let rm;
    while ((rm = refRe.exec(opfXml)) !== null) {
      spine.push(rm[1]);
    }
    for (const idref of spine) {
      const href = manifest.get(idref);
      if (!href) continue;
      const chapterPath = `${opfBase}${href.split("#")[0]}`;
      let chapterHtml = "";
      try {
        chapterHtml = zreadString(zip, chapterPath);
      } catch {
        continue;
      }
      const text = chapterHtml.replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) {
        pages.push(...paginate(text));
      }
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
  const xml = String(new JString(bytes, "utf-8"));
  const titleMatch = /<book-title>([\s\S]*?)<\/book-title>/i.exec(xml);
  const authorMatch = /<author>([\s\S]*?)<\/author>/i.exec(xml);
  let authorStr = "";
  if (authorMatch) {
    authorStr = authorMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const titleStr = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
  const blocks = [];
  if (authorStr || titleStr) {
    blocks.push([authorStr, titleStr].filter(Boolean).join("\n"));
  }
  const pRe = /<(p|v|subtitle)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let pm;
  while ((pm = pRe.exec(xml)) !== null) {
    const s = pm[2].replace(/<[^>]+>/g, "").trim();
    if (s) blocks.push(s);
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
  const d = new Date(timeMs);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function archiveDoc(path) {
  const zip = new ZipFile(new JFile(path));
  const entries = [];
  let totalCount = 0;
  try {
    const enumEntries = zip.call("entries");
    while (enumEntries.call("hasMoreElements")) {
      totalCount++;
      const entry = enumEntries.call("nextElement");
      if (entries.length < MAX_ENTRIES) {
        const name = String(entry.call("getName"));
        const size = Number(entry.call("getSize"));
        const time = Number(entry.call("getTime"));
        const isEncrypted = Boolean(entry.call("getMethod") === 0 && entry.call("getCrc") === 0 && size > 0);
        entries.push({
          name,
          size: size >= 0 ? size : 0,
          date: formatDate(time),
          isEncrypted
        });
      }
    }
  } finally {
    try {
      zip.call("close");
    } catch {
    }
  }
  let folders = 0;
  let totalSize = 0;
  for (const e of entries) {
    if (e.name.endsWith("/")) {
      folders++;
    }
    totalSize += e.size;
  }
  const summary = String(t("archive_summary")).replace("{0}", String(totalCount)).replace("{1}", String(folders)).replace("{2}", humanSize(totalSize));
  const lines = [summary, ""];
  for (const e of entries) {
    const sizeStr = e.name.endsWith("/") ? "" : humanSize(e.size);
    const lockStr = e.isEncrypted ? String(t("archive_password")) : "";
    lines.push(`${sizeStr.padStart(9)}  ${e.date}  ${lockStr}${e.name}`);
  }
  if (totalCount > entries.length) {
    lines.push(`
${String(t("archive_more")).replace("{0}", String(entries.length))}`);
  }
  return new Doc(paginate(lines.join("\n")), 2, false, "");
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
  return `<a href="${url}">${url}</a>${tail}`;
}
function mdInline(s) {
  let text = escapeHtml(s);
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\0${codes.length - 1}\0`;
  });
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "<em>[$1]</em>");
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, mdLink);
  text = text.replace(/(?<![">=])(https?:\/\/[^\s<]+)/g, mdAutolink);
  text = text.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => `<strong>${a || b}</strong>`);
  text = text.replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "<em>$1</em>");
  text = text.replace(/(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])/g, "<em>$1</em>");
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
  text = text.replace(/\0(\d+)\0/g, (_, idx) => `<code>${codes[Number(idx)]}</code>`);
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
function mdBlocks(lines) {
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
      out.push(`<blockquote>${mdBlocks(quote)}</blockquote>`);
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
function exifRotation(path) {
  try {
    const exif = new ExifInterface(path);
    const orientation = Number(exif.call("getAttributeInt", "Orientation", 1));
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
  } catch {
    return 0;
  }
}
function decodeImage(path) {
  const o = new BFOptions();
  o.setField("inJustDecodeBounds", true);
  BitmapFactory.callStatic("decodeFile", path, o);
  const outWidth = Number(o.getField("outWidth"));
  const outHeight = Number(o.getField("outHeight"));
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
  const rot = exifRotation(path);
  return { bmp, rot };
}

// src/viewer.ts
var DocViewer = class {
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
    this.dlg?.call("dismiss");
  }
  cleanup() {
    if (this.closed) return;
    this.closed = true;
    this.savePos();
    for (const fn of this.cleanupFns) {
      try {
        fn();
      } catch {
      }
    }
    this.cleanupFns.length = 0;
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
      this.renderer = null;
      this.pfd?.call("close");
      this.pfd = null;
    } catch {
    }
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
    if (this.closed || tok !== this.token) return;
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
      const JArray = inu.jvm.cls("java.lang.reflect.Array");
      const FloatType = inu.jvm.cls("java.lang.Float").getStaticField("TYPE");
      const m = JArray.callStatic("newInstance", FloatType, 20);
      const values = [
        -1,
        0,
        0,
        0,
        255,
        0,
        -1,
        0,
        0,
        255,
        0,
        0,
        -1,
        0,
        255,
        0,
        0,
        0,
        1,
        0
      ];
      for (let i = 0; i < 20; i++) {
        JArray.callStatic("setFloat", m, i, Number(values[i]));
      }
      this.iv.call("setColorFilter", new ColorMatrixColorFilter(new ColorMatrix(m)));
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
    const JArray = inu.jvm.cls("java.lang.reflect.Array");
    const FloatType = inu.jvm.cls("java.lang.Float").getStaticField("TYPE");
    if (!this.vals) this.vals = JArray.callStatic("newInstance", FloatType, 9);
    this.matrix.call("getValues", this.vals);
    return Number(JArray.callStatic("getFloat", this.vals, 0));
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
    const JArray = inu.jvm.cls("java.lang.reflect.Array");
    const StringCls = inu.jvm.cls("java.lang.String");
    const arr = JArray.callStatic("newInstance", StringCls, ENCODINGS.length);
    for (let i = 0; i < ENCODINGS.length; i++) {
      const label = i === 0 ? t("enc_auto") : ENCODINGS[i][0];
      JArray.callStatic("set", arr, i, label);
    }
    const b = this.builder();
    b.call("setTitle", t("menu_encoding"));
    b.call("setItems", arr, dlgClick);
    b.call("show");
  }
  openMenu() {
    const items = [];
    const actions = [];
    const add = (title, fn) => {
      items.push(title);
      actions.push(fn);
    };
    const onOff = (v) => v ? t("on") : t("off");
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
    const JArray = inu.jvm.cls("java.lang.reflect.Array");
    const StringCls = inu.jvm.cls("java.lang.String");
    const arr = JArray.callStatic("newInstance", StringCls, items.length);
    for (let i = 0; i < items.length; i++) {
      JArray.callStatic("set", arr, i, items[i]);
    }
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
  try {
    const viewer = new DocViewer(act, path, name, fmt, ext, mime, renderer, pfd, count);
    activeViewers.push(viewer);
    viewer.show();
    return true;
  } catch (e) {
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
