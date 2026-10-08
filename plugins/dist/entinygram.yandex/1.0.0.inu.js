// ==InuPlugin==
// @name         Yandex
// @id           entinygram.yandex
// @author       entinyGram
// @version      1.0.0
// @description  Yandex Cloud Translate and Yandex static maps
// @grant        fetch(translate.api.cloud.yandex.net)
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
var KEY = "apiKey";
var MAPS = "maps";
var ENDPOINT = "https://translate.api.cloud.yandex.net/translate/v2/translate";
function apiKey() {
  return localStorage.getItem(KEY) ?? "";
}
function normalize(code) {
  const lower = code.toLowerCase();
  if (["zh-cn", "zh-hans", "zh-hant", "zh-tw"].includes(lower)) return "zh";
  return lower === "iw" ? "he" : lower;
}
inu.registerTranslationProvider({
  id: "yandex",
  name: "Yandex Translate",
  async translate({ texts, to, signal }) {
    const key = apiKey();
    if (key === "") throw new Error("Set the Yandex API key in the translation provider settings");
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Api-Key ${key}` },
      body: JSON.stringify({ targetLanguageCode: normalize(to), texts }),
      signal
    });
    if (!response.ok) throw new Error(`Yandex Translate answered ${response.status}`);
    const data = await response.json();
    const translations = data.translations ?? [];
    if (translations.length !== texts.length) throw new Error("Yandex Translate returned an empty result");
    return translations.map((item) => item.text ?? "");
  }
});
var AtomicBoolean = inu.jvm.cls("java.util.concurrent.atomic.AtomicBoolean");
var AndroidUtilities = inu.jvm.cls("org.telegram.messenger.AndroidUtilities");
var LocaleController = inu.jvm.cls("org.telegram.messenger.LocaleController");
var JMath = inu.jvm.cls("java.lang.Math");
var JString = inu.jvm.cls("java.lang.String");
var JLocale = inu.jvm.cls("java.util.Locale");
var useMaps = new AtomicBoolean(localStorage.getItem(MAPS) === "1");
var LANGS = ["ru_RU", "tr_TR"];
var WITH_MARKER = "https://static-maps.yandex.ru/1.x/?ll=%.6f,%.6f&z=%d&size=%d,%d&l=map&scale=%d&pt=%.6f,%.6f,vkbkm&lang=%s";
var PLAIN = "https://static-maps.yandex.ru/1.x/?ll=%.6f,%.6f&z=%d&size=%d,%d&l=map&scale=%d&lang=%s";
var hooked = true;
try {
  inu.xposed.hookMethod(AndroidUtilities.getDeclaredMethod("formapMapUrl(IDDIIZII)Ljava/lang/String;"), {
    before: inu.xposed.routine({
      v: 1,
      source: `
      (ctx: any) => {\r
            if (!useMaps.get()) return\r
            const scale = JMath.round(JMath.min(2.0, JMath.ceil(AndroidUtilities.density)))\r
            const short = LocaleController.getInstance().getCurrentLocaleInfo().shortName\r
            let lang = 'en_US'\r
            for (const candidate of LANGS) {\r
              const lowered: any = candidate.toLowerCase()\r
              if (lowered.contains(short)) lang = candidate\r
            }\r
            const lat = ctx.args[1]\r
            const lon = ctx.args[2]\r
            const width = ctx.args[3] * scale\r
            const height = ctx.args[4] * scale\r
            if (ctx.args[5]) {\r
              ctx.setReturnValue(JString.format(JLocale.US, WITH_MARKER, [lon, lat, ctx.args[6], width, height, scale, lon, lat, lang]))\r
            } else {\r
              ctx.setReturnValue(JString.format(JLocale.US, PLAIN, [lon, lat, ctx.args[6], width, height, scale, lang]))\r
            }\r
          }`,
      captures: ["useMaps", "JMath", "AndroidUtilities", "LocaleController", "LANGS", "JString", "JLocale", "WITH_MARKER", "PLAIN"],
      slots: 1,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["capture", 2],
        ["capture", 3],
        ["capture", 4],
        ["capture", 5],
        ["capture", 6],
        ["capture", 7],
        ["capture", 8],
        ["call", 0, ["get"], []],
        ["not", 9],
        ["jumpIfFalsy", 10, 13],
        ["return"],
        ["get", 2, ["density"]],
        ["call", 1, ["ceil"], [13]],
        ["call", 1, ["min"], [[2], 14]],
        ["call", 1, ["round"], [15]],
        ["call", 3, ["getInstance"], []],
        ["call", 17, ["getCurrentLocaleInfo"], []],
        ["get", 18, ["shortName"]],
        ["setSlot", 0, ["en_US"]],
        ["iterate", 4],
        ["advance", 21, 28],
        ["call", 22, ["toLowerCase"], []],
        ["call", 23, ["contains"], [19]],
        ["jumpIfFalsy", 24, 27],
        ["setSlot", 0, 22],
        ["loop", 22],
        ["arg", [1]],
        ["arg", [2]],
        ["arg", [3]],
        ["mul", 30, 16],
        ["arg", [4]],
        ["mul", 32, 16],
        ["arg", [5]],
        ["jumpIfFalsy", 34, 43],
        ["get", 6, ["US"]],
        ["arg", [6]],
        ["getSlot", 0],
        ["array", [29, 28, 37, 31, 33, 16, 29, 28, 38]],
        ["call", 5, ["format"], [36, 7, 39]],
        ["setResult", 40],
        ["jump", 49],
        ["get", 6, ["US"]],
        ["arg", [6]],
        ["getSlot", 0],
        ["array", [29, 28, 44, 31, 33, 16, 45]],
        ["call", 5, ["format"], [43, 8, 46]],
        ["setResult", 47]
      ],
      tries: []
    }, [useMaps, JMath, AndroidUtilities, LocaleController, LANGS, JString, JLocale, WITH_MARKER, PLAIN])
  });
} catch (error) {
  hooked = false;
  console.warn("hooking is not available", error);
}
var page = inu.ui.settingsPage({
  title: "Yandex",
  items: () => [
    inu.ui.button({
      id: "key",
      text: "Yandex API key",
      value: apiKey() === "" ? "Not set" : "••••••••",
      onClick: async () => {
        const value = await inu.ui.prompt({ title: "Yandex API key", value: apiKey(), selectAll: true });
        if (value === null) return;
        localStorage.setItem(KEY, value.trim());
        page.invalidate();
      }
    }),
    inu.ui.check({
      id: "maps",
      text: "Yandex",
      subtitle: hooked ? "Used whenever the app builds a preview from a map service" : "This device does not allow the hooks the plugin needs",
      checked: useMaps.call("get"),
      onChange: (checked) => {
        useMaps.call("set", checked);
        localStorage.setItem(MAPS, checked ? "1" : "0");
      }
    })
  ]
});
inu.registerSettings(page);
var InuConfig = inu.jvm.cls("desu.inugram.InuConfig");
function yandexChosen() {
  return String(InuConfig.getStaticField("TRANSLATION_PROVIDER").call("getValue")).endsWith(":yandex");
}
embed({
  id: "entinygram.yandex",
  name: "Yandex",
  placements: { inline: [{ slot: "translate-provider.end", rows: ["key"] }], choice: ["behavior.map-preview-provider"] },
  rows: (slot) => slot === "translate-provider.end" && yandexChosen() ? [{ id: "key", type: "button", text: "Yandex API key", value: apiKey() === "" ? "Not set" : "••••••••" }] : [],
  onEvent: (row) => {
    if (row !== "key") return;
    setTimeout(async () => {
      const value = await inu.ui.prompt({ title: "Yandex API key", value: apiKey(), selectAll: true });
      if (value === null) return;
      localStorage.setItem(KEY, value.trim());
      embedChanged();
    }, 0);
  },
  choices: () => [{ id: "maps", title: "Yandex", subtitle: "Location previews from Yandex static maps", checked: useMaps.call("get") }],
  onChoice: (_id, picked) => {
    useMaps.call("set", picked);
    localStorage.setItem(MAPS, picked ? "1" : "0");
    embedChanged();
  }
});
