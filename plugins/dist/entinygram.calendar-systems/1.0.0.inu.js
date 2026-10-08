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

// src/index.ts
var CALENDARS = [
  ["", "Gregorian"],
  ["islamic", "Hijri Qamari (lunar)"],
  ["islamic-civil", "Hijri civil"],
  ["islamic-umalqura", "Umm al-Qura"],
  ["persian", "Hijri Shamsi (Jalali)"],
  ["indian", "Indian national (Saka)"],
  ["hebrew", "Hebrew"],
  ["buddhist", "Buddhist"],
  ["japanese", "Japanese"],
  ["roc", "Minguo"],
  ["coptic", "Coptic"],
  ["ethiopic", "Ethiopic"]
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
    text: "Calendar system",
    subtitle: current() === "" ? void 0 : preview(current()),
    options: CALENDARS.map(([, title]) => title),
    selected: Math.max(0, CALENDARS.findIndex(([id]) => id === current()))
  }],
  onEvent: (_row, value) => {
    const id = CALENDARS[Number(value)][0];
    selected.call("set", id);
    localStorage.setItem(STORAGE_KEY, id);
    embedChanged();
  }
});
inu.registerSettings(inu.ui.settingsPage({
  title: "Calendar systems",
  items: () => [
    inu.ui.header("Dates"),
    inu.ui.select({
      id: "calendar",
      text: "Calendar system",
      items: CALENDARS.map(([, title]) => title),
      selected: Math.max(0, CALENDARS.findIndex(([id]) => id === current())),
      onChange: (index) => {
        const id = CALENDARS[index][0];
        selected.call("set", id);
        localStorage.setItem(STORAGE_KEY, id);
      }
    }),
    ...current() === "" ? [] : [inu.ui.button({ id: "today", text: "Today", value: preview(current()), onClick: () => {
    } })],
    inu.ui.separator(hooked ? "Already shown dates update when the screen is reopened" : "This device does not allow the hooks the plugin needs")
  ]
}));
