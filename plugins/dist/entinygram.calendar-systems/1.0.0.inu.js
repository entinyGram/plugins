// ==InuPlugin==
// @name         Calendar systems
// @id           entinygram.calendar-systems
// @author       entinyGram
// @version      1.0.0
// @description  Show dates in the Hijri, Persian, Indian and other calendars
// @icon         inu://calendar
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// @requires     entinygram.sdk >=0.1.0-alpha
// ==/InuPlugin==


// ../../sdk/entiny/src/embed.ts
var REGISTRY_KEY = "entiny.embed";
var CHANGED_KEY = "__changed";
function embedRegistry() {
  const props = inu.jvm.cls("java.lang.System").callStatic("getProperties");
  let registry = props.call("get", REGISTRY_KEY);
  if (registry === null) {
    props.call("putIfAbsent", REGISTRY_KEY, new (inu.jvm.cls("java.util.concurrent.ConcurrentHashMap"))());
    registry = props.call("get", REGISTRY_KEY);
  }
  return registry;
}
function notifyChanged(registry) {
  const changed = registry.call("get", CHANGED_KEY);
  if (changed !== null) changed.call("run");
}
function embed(spec) {
  const BiFunction = inu.jvm.cls("java.util.function.BiFunction");
  const handle = (op, arg) => {
    switch (op) {
      case "meta":
        return JSON.stringify({ name: spec.name, placements: spec.placements });
      case "rows":
        return JSON.stringify(spec.rows(arg));
      case "event": {
        const { row, value } = JSON.parse(arg);
        spec.onEvent(row, value);
        return "";
      }
      case "open":
        spec.open?.();
        return "";
      case "choices":
        return JSON.stringify(spec.choices?.(arg) ?? []);
      case "choice": {
        const { id, picked } = JSON.parse(arg);
        spec.onChoice?.(id, picked);
        return "";
      }
      default:
        return "";
    }
  };
  const Handler = inu.jvm.defineClass({
    interfaces: [BiFunction],
    methods: {
      apply: {
        params: ["java.lang.Object", "java.lang.Object"],
        returns: "java.lang.Object",
        body: (_self, op, arg) => handle(op, arg)
      }
    }
  });
  const registry = embedRegistry();
  registry.call("put", spec.id, new Handler());
  notifyChanged(registry);
  return () => {
    registry.call("remove", spec.id);
    notifyChanged(registry);
  };
}
function embedChanged() {
  notifyChanged(embedRegistry());
}

// src/i18n.ts
function appLang() {
  try {
    const LocaleController2 = inu.jvm.cls("org.telegram.messenger.LocaleController");
    const short = String(LocaleController2.callStatic("getInstance").call("getCurrentLocaleInfo").getField("shortName")).toLowerCase();
    if (short.startsWith("uk")) return "uk";
    if (short.startsWith("ru")) return "ru";
  } catch {
  }
  try {
    const JLocale = inu.jvm.cls("java.util.Locale");
    const lang = String(JLocale.callStatic("getDefault").call("getLanguage")).toLowerCase();
    if (lang.startsWith("uk")) return "uk";
    if (lang.startsWith("ru")) return "ru";
  } catch {
  }
  return "en";
}
var STRINGS = {
  header_dates: {
    uk: "Дати",
    ru: "Даты",
    en: "Dates"
  },
  calendar_system: {
    uk: "Система календаря",
    ru: "Система календаря",
    en: "Calendar system"
  },
  today: {
    uk: "Сьогодні",
    ru: "Сегодня",
    en: "Today"
  },
  note_update: {
    uk: "Вже показані дати оновляться при повторному відкритті екрана",
    ru: "Уже показанные даты обновятся при повторном открытии экрана",
    en: "Already shown dates update when the screen is reopened"
  },
  note_unsupported: {
    uk: "Цей пристрій не підтримує перехоплення, необхідні для плагіна",
    ru: "Это устройство не поддерживает перехваты, необходимые для плагина",
    en: "This device does not allow the hooks the plugin needs"
  },
  cal_gregorian: {
    uk: "Григоріанський",
    ru: "Григорианский",
    en: "Gregorian"
  },
  cal_islamic: {
    uk: "Хіджра Камарі (місячний)",
    ru: "Хиджра Камари (лунный)",
    en: "Hijri Qamari (lunar)"
  },
  cal_islamic_civil: {
    uk: "Хіджра цивільний",
    ru: "Хиджра гражданский",
    en: "Hijri civil"
  },
  cal_islamic_umalqura: {
    uk: "Умм аль-Кура",
    ru: "Умм аль-Кура",
    en: "Umm al-Qura"
  },
  cal_persian: {
    uk: "Хіджра Шамсі (Джалалі)",
    ru: "Хиджра Шамси (Джалали)",
    en: "Hijri Shamsi (Jalali)"
  },
  cal_indian: {
    uk: "Індійський національний (Сака)",
    ru: "Индийский национальный (Сака)",
    en: "Indian national (Saka)"
  },
  cal_hebrew: {
    uk: "Єврейський",
    ru: "Еврейский",
    en: "Hebrew"
  },
  cal_buddhist: {
    uk: "Буддійський",
    ru: "Буддийский",
    en: "Buddhist"
  },
  cal_japanese: {
    uk: "Японський",
    ru: "Японский",
    en: "Japanese"
  },
  cal_roc: {
    uk: "Міньго",
    ru: "Миньго",
    en: "Minguo"
  },
  cal_coptic: {
    uk: "Коптський",
    ru: "Коптский",
    en: "Coptic"
  },
  cal_ethiopic: {
    uk: "Ефіопський",
    ru: "Эфиопский",
    en: "Ethiopic"
  }
};
function t(key) {
  const l = appLang();
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[l] ?? entry.en;
}
var CALENDAR_KEYS = {
  "": "cal_gregorian",
  "islamic": "cal_islamic",
  "islamic-civil": "cal_islamic_civil",
  "islamic-umalqura": "cal_islamic_umalqura",
  "persian": "cal_persian",
  "indian": "cal_indian",
  "hebrew": "cal_hebrew",
  "buddhist": "cal_buddhist",
  "japanese": "cal_japanese",
  "roc": "cal_roc",
  "coptic": "cal_coptic",
  "ethiopic": "cal_ethiopic"
};
function calendarTitle(id) {
  const key = CALENDAR_KEYS[id];
  return key ? t(key) : id;
}

// src/index.ts
var CALENDAR_IDS = [
  "",
  "islamic",
  "islamic-civil",
  "islamic-umalqura",
  "persian",
  "indian",
  "hebrew",
  "buddhist",
  "japanese",
  "roc",
  "coptic",
  "ethiopic"
];
var STORAGE_KEY = "calendar";
var AtomicReference = inu.jvm.cls("java.util.concurrent.atomic.AtomicReference");
var ConcurrentHashMap = inu.jvm.cls("java.util.concurrent.ConcurrentHashMap");
var SimpleDateFormat = inu.jvm.cls("android.icu.text.SimpleDateFormat");
var ULocale = inu.jvm.cls("android.icu.util.ULocale");
var JDate = inu.jvm.cls("java.util.Date");
var JThread = inu.jvm.cls("java.lang.Thread");
var LocaleController = inu.jvm.cls("org.telegram.messenger.LocaleController");
var FastDateFormat = inu.jvm.cls("org.telegram.messenger.time.FastDateFormat");
var selected = new AtomicReference(localStorage.getItem(STORAGE_KEY) ?? "");
var formats = new ConcurrentHashMap();
var hooked = true;
try {
  inu.xposed.hookMethod(FastDateFormat.getDeclaredMethod("format(J)Ljava/lang/String;"), {
    after: inu.xposed.routine({
      v: 1,
      source: `
      (ctx: any) => {\r
            const calendar = selected.get()\r
            if (calendar === '') return\r
            const self = ctx.thisObject\r
            const pattern = self.getPattern()\r
            if (pattern.indexOf('M') < 0 && pattern.indexOf('y') < 0) return\r
            const locale = self.getLocale()\r
            const key = JThread.currentThread().getId() + '|' + pattern + '|' + calendar + '|' + locale.toString()\r
            let format = formats.get(key)\r
            if (format === null) {\r
              format = new SimpleDateFormat(pattern, ULocale.forLocale(locale).setKeywordValue('calendar', calendar))\r
              formats.put(key, format)\r
            }\r
            ctx.setReturnValue(format.format(new JDate(ctx.args[0])))\r
          }`,
      captures: ["selected", "JThread", "formats", "SimpleDateFormat", "ULocale", "JDate"],
      slots: 2,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["capture", 2],
        ["capture", 3],
        ["capture", 4],
        ["capture", 5],
        ["call", 0, ["get"], []],
        ["eq", 6, [""]],
        ["jumpIfFalsy", 7, 10],
        ["return"],
        ["this"],
        ["call", 10, ["getPattern"], []],
        ["call", 11, ["indexOf"], [["M"]]],
        ["lt", 12, [0]],
        ["setSlot", 0, 13],
        ["jumpIfFalsy", 13, 19],
        ["call", 11, ["indexOf"], [["y"]]],
        ["lt", 16, [0]],
        ["setSlot", 0, 17],
        ["getSlot", 0],
        ["jumpIfFalsy", 19, 22],
        ["return"],
        ["call", 10, ["getLocale"], []],
        ["call", 1, ["currentThread"], []],
        ["call", 23, ["getId"], []],
        ["add", 24, ["|"]],
        ["add", 25, 11],
        ["add", 26, ["|"]],
        ["add", 27, 6],
        ["add", 28, ["|"]],
        ["call", 22, ["toString"], []],
        ["add", 29, 30],
        ["call", 2, ["get"], [31]],
        ["setSlot", 1, 32],
        ["getSlot", 1],
        ["eq", 34, [null]],
        ["jumpIfFalsy", 35, 43],
        ["call", 4, ["forLocale"], [22]],
        ["call", 37, ["setKeywordValue"], [["calendar"], 6]],
        ["new", 3, [11, 38]],
        ["setSlot", 1, 39],
        ["getSlot", 1],
        ["call", 2, ["put"], [31, 41]],
        ["getSlot", 1],
        ["arg", [0]],
        ["new", 5, [44]],
        ["call", 43, ["format"], [45]],
        ["setResult", 46]
      ],
      tries: []
    }, [selected, JThread, formats, SimpleDateFormat, ULocale, JDate])
  });
  inu.xposed.hookMethod(FastDateFormat.getDeclaredMethod("format(Ljava/util/Date;)Ljava/lang/String;"), {
    after: inu.xposed.routine({
      v: 1,
      source: `
      (ctx: any) => {\r
            const calendar = selected.get()\r
            if (calendar === '') return\r
            const self = ctx.thisObject\r
            const pattern = self.getPattern()\r
            if (pattern.indexOf('M') < 0 && pattern.indexOf('y') < 0) return\r
            const locale = self.getLocale()\r
            const key = JThread.currentThread().getId() + '|' + pattern + '|' + calendar + '|' + locale.toString()\r
            let format = formats.get(key)\r
            if (format === null) {\r
              format = new SimpleDateFormat(pattern, ULocale.forLocale(locale).setKeywordValue('calendar', calendar))\r
              formats.put(key, format)\r
            }\r
            ctx.setReturnValue(format.format(ctx.args[0]))\r
          }`,
      captures: ["selected", "JThread", "formats", "SimpleDateFormat", "ULocale"],
      slots: 2,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["capture", 2],
        ["capture", 3],
        ["capture", 4],
        ["call", 0, ["get"], []],
        ["eq", 5, [""]],
        ["jumpIfFalsy", 6, 9],
        ["return"],
        ["this"],
        ["call", 9, ["getPattern"], []],
        ["call", 10, ["indexOf"], [["M"]]],
        ["lt", 11, [0]],
        ["setSlot", 0, 12],
        ["jumpIfFalsy", 12, 18],
        ["call", 10, ["indexOf"], [["y"]]],
        ["lt", 15, [0]],
        ["setSlot", 0, 16],
        ["getSlot", 0],
        ["jumpIfFalsy", 18, 21],
        ["return"],
        ["call", 9, ["getLocale"], []],
        ["call", 1, ["currentThread"], []],
        ["call", 22, ["getId"], []],
        ["add", 23, ["|"]],
        ["add", 24, 10],
        ["add", 25, ["|"]],
        ["add", 26, 5],
        ["add", 27, ["|"]],
        ["call", 21, ["toString"], []],
        ["add", 28, 29],
        ["call", 2, ["get"], [30]],
        ["setSlot", 1, 31],
        ["getSlot", 1],
        ["eq", 33, [null]],
        ["jumpIfFalsy", 34, 42],
        ["call", 4, ["forLocale"], [21]],
        ["call", 36, ["setKeywordValue"], [["calendar"], 5]],
        ["new", 3, [10, 37]],
        ["setSlot", 1, 38],
        ["getSlot", 1],
        ["call", 2, ["put"], [30, 40]],
        ["getSlot", 1],
        ["arg", [0]],
        ["call", 42, ["format"], [43]],
        ["setResult", 44]
      ],
      tries: []
    }, [selected, JThread, formats, SimpleDateFormat, ULocale])
  });
  inu.xposed.hookMethod(LocaleController.getDeclaredMethod("formatYearMonthDay(JZ)Ljava/lang/String;"), {
    before: inu.xposed.routine({
      v: 1,
      source: `
      (ctx: any) => {\r
            const calendar = selected.get()\r
            if (calendar === '') return\r
            const locale = ULocale.forLocale(LocaleController.getInstance().getCurrentLocale()).setKeywordValue('calendar', calendar)\r
            const date = new JDate(ctx.args[0] * 1000)\r
            const year = new SimpleDateFormat('y', locale)\r
            const sameYear = year.format(date) === year.format(new JDate())\r
            const pattern = sameYear && !ctx.args[1] ? 'MMM d' : 'MMM d, y'\r
            ctx.setReturnValue(new SimpleDateFormat(pattern, locale).format(date))\r
          }`,
      captures: ["selected", "ULocale", "LocaleController", "JDate", "SimpleDateFormat"],
      slots: 1,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["capture", 2],
        ["capture", 3],
        ["capture", 4],
        ["call", 0, ["get"], []],
        ["eq", 5, [""]],
        ["jumpIfFalsy", 6, 9],
        ["return"],
        ["call", 2, ["getInstance"], []],
        ["call", 9, ["getCurrentLocale"], []],
        ["call", 1, ["forLocale"], [10]],
        ["call", 11, ["setKeywordValue"], [["calendar"], 5]],
        ["arg", [0]],
        ["mul", 13, [1e3]],
        ["new", 3, [14]],
        ["new", 4, [["y"], 12]],
        ["call", 16, ["format"], [15]],
        ["new", 3, []],
        ["call", 16, ["format"], [18]],
        ["eq", 17, 19],
        ["setSlot", 0, 20],
        ["jumpIfFalsy", 20, 26],
        ["arg", [1]],
        ["not", 23],
        ["setSlot", 0, 24],
        ["getSlot", 0],
        ["jumpIfFalsy", 26, 30],
        ["setSlot", 0, ["MMM d"]],
        ["jump", 31],
        ["setSlot", 0, ["MMM d, y"]],
        ["getSlot", 0],
        ["new", 4, [31, 12]],
        ["call", 32, ["format"], [15]],
        ["setResult", 33]
      ],
      tries: []
    }, [selected, ULocale, LocaleController, JDate, SimpleDateFormat])
  });
  inu.xposed.hookMethod(LocaleController.getDeclaredMethod("formatYearMont(JZ)Ljava/lang/String;"), {
    before: inu.xposed.routine({
      v: 1,
      source: `
      (ctx: any) => {\r
            const calendar = selected.get()\r
            if (calendar === '') return\r
            const locale = ULocale.forLocale(LocaleController.getInstance().getCurrentLocale()).setKeywordValue('calendar', calendar)\r
            const date = new JDate(ctx.args[0] * 1000)\r
            const year = new SimpleDateFormat('y', locale)\r
            const sameYear = year.format(date) === year.format(new JDate())\r
            const pattern = sameYear && !ctx.args[1] ? 'MMMM' : 'MMMM y'\r
            ctx.setReturnValue(new SimpleDateFormat(pattern, locale).format(date))\r
          }`,
      captures: ["selected", "ULocale", "LocaleController", "JDate", "SimpleDateFormat"],
      slots: 1,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["capture", 2],
        ["capture", 3],
        ["capture", 4],
        ["call", 0, ["get"], []],
        ["eq", 5, [""]],
        ["jumpIfFalsy", 6, 9],
        ["return"],
        ["call", 2, ["getInstance"], []],
        ["call", 9, ["getCurrentLocale"], []],
        ["call", 1, ["forLocale"], [10]],
        ["call", 11, ["setKeywordValue"], [["calendar"], 5]],
        ["arg", [0]],
        ["mul", 13, [1e3]],
        ["new", 3, [14]],
        ["new", 4, [["y"], 12]],
        ["call", 16, ["format"], [15]],
        ["new", 3, []],
        ["call", 16, ["format"], [18]],
        ["eq", 17, 19],
        ["setSlot", 0, 20],
        ["jumpIfFalsy", 20, 26],
        ["arg", [1]],
        ["not", 23],
        ["setSlot", 0, 24],
        ["getSlot", 0],
        ["jumpIfFalsy", 26, 30],
        ["setSlot", 0, ["MMMM"]],
        ["jump", 31],
        ["setSlot", 0, ["MMMM y"]],
        ["getSlot", 0],
        ["new", 4, [31, 12]],
        ["call", 32, ["format"], [15]],
        ["setResult", 33]
      ],
      tries: []
    }, [selected, ULocale, LocaleController, JDate, SimpleDateFormat])
  });
} catch (error) {
  hooked = false;
  console.warn("hooking is not available", error);
}
function current() {
  return selected.call("get");
}
function preview(calendar) {
  if (calendar === "") return "";
  try {
    const locale = ULocale.callStatic("forLocale", LocaleController.callStatic("getInstance").call("getCurrentLocale")).call("setKeywordValue", "calendar", calendar);
    return new SimpleDateFormat("d MMMM y", locale).call("format", new JDate());
  } catch (error) {
    console.warn("preview failed", error);
    return "";
  }
}
embed({
  id: "entinygram.calendar-systems",
  name: "Calendar systems",
  placements: { inline: [{ slot: "behavior.formatting", rows: ["calendar"] }] },
  rows: () => [{
    id: "calendar",
    type: "select",
    text: t("calendar_system"),
    subtitle: current() === "" ? void 0 : preview(current()),
    options: CALENDAR_IDS.map(calendarTitle),
    selected: Math.max(0, CALENDAR_IDS.indexOf(current()))
  }],
  onEvent: (_row, value) => {
    const id = CALENDAR_IDS[Number(value)] ?? "";
    selected.call("set", id);
    localStorage.setItem(STORAGE_KEY, id);
    embedChanged();
  }
});
inu.registerSettings(inu.ui.settingsPage({
  title: "Calendar systems",
  items: () => [
    inu.ui.header(t("header_dates")),
    inu.ui.select({
      id: "calendar",
      text: t("calendar_system"),
      items: CALENDAR_IDS.map(calendarTitle),
      selected: Math.max(0, CALENDAR_IDS.indexOf(current())),
      onChange: (index) => {
        const id = CALENDAR_IDS[index] ?? "";
        selected.call("set", id);
        localStorage.setItem(STORAGE_KEY, id);
      }
    }),
    ...current() === "" ? [] : [inu.ui.button({ id: "today", text: t("today"), value: preview(current()), onClick: () => {
    } })],
    inu.ui.separator(hooked ? t("note_update") : t("note_unsupported"))
  ]
}));
