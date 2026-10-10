// ==InuPlugin==
// @name         2GIS
// @id           entinygram.2gis
// @author       entinyGram
// @version      1.0.0
// @description  2GIS map and location previews
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

// ../../sdk/entiny/src/maps.ts
var tiles = () => inu.jvm.cls("desu.inugram.helpers.maps.EntinyMapTiles");
function setTileSource(source) {
  tiles().callStatic("set", source.name, source.url, source.attribution, source.minZoom ?? 0, source.maxZoom ?? 18, source.tileSize ?? 256);
}
function clearTileSource() {
  tiles().callStatic("clear");
}

// src/i18n.ts
function appLang() {
  try {
    const LocaleController = inu.jvm.cls("org.telegram.messenger.LocaleController");
    const short = String(LocaleController.callStatic("getInstance").call("getCurrentLocaleInfo").getField("shortName")).toLowerCase();
    if (short.startsWith("uk")) return "uk";
    if (short.startsWith("ru")) return "ru";
  } catch {
  }
  try {
    const JLocale2 = inu.jvm.cls("java.util.Locale");
    const lang = String(JLocale2.callStatic("getDefault").call("getLanguage")).toLowerCase();
    if (lang.startsWith("uk")) return "uk";
    if (lang.startsWith("ru")) return "ru";
  } catch {
  }
  return "en";
}
var STRINGS = {
  key_title: {
    uk: "Ключ API 2GIS",
    ru: "API-ключ 2GIS",
    en: "2GIS API key"
  },
  key_desc: {
    uk: "Ключ Static API з Platform Manager 2GIS",
    ru: "Ключ Static API из Platform Manager 2GIS",
    en: "A Static API key from the 2GIS Platform Manager"
  },
  not_set: {
    uk: "Не вказано",
    ru: "Не задан",
    en: "Not set"
  },
  tiles_title: {
    uk: "Тайли карти",
    ru: "Тайлы карты",
    en: "Map tiles"
  },
  tiles_desc: {
    uk: "Малює карту в додатку тайлами 2GIS",
    ru: "Отрисовывает карту в приложении тайлами 2GIS",
    en: "Draws the map in the app with 2GIS tiles"
  },
  state_active: {
    uk: "активно",
    ru: "активно",
    en: "active"
  },
  state_waiting_key: {
    uk: "очікує ключ",
    ru: "ожидает ключ",
    en: "waiting for a key"
  },
  state_off: {
    uk: "вимкнено",
    ru: "выключено",
    en: "off"
  },
  state_failed: {
    uk: "помилка: {0}",
    ru: "ошибка: {0}",
    en: "failed: {0}"
  },
  maps_title: {
    uk: "Статичні карти",
    ru: "Статические карты",
    en: "Static maps"
  },
  maps_desc: {
    uk: "Використовується, коли додаток створює прев'ю з картографічного сервісу",
    ru: "Используется, когда приложение строит превью из картографического сервиса",
    en: "Used whenever the app builds a preview from a map service"
  },
  maps_choice_desc: {
    uk: "Прев'ю геопозиції зі Static API 2GIS",
    ru: "Превью геопозиции из 2GIS Static API",
    en: "Location previews from the 2GIS Static API"
  },
  hook_failed: {
    uk: "Перехоплення не підтримується на цьому пристрої",
    ru: "Перехват не поддерживается на этом устройстве",
    en: "This device does not allow the hooks the plugin needs"
  }
};
function t(key2) {
  const l = appLang();
  const entry = STRINGS[key2];
  if (!entry) return key2;
  return entry[l] ?? entry.en;
}
function tf(key2, ...args) {
  let str = t(key2);
  for (let i = 0; i < args.length; i++) {
    str = str.replace(new RegExp(`\\{${i}\\}`, "g"), String(args[i]));
  }
  return str;
}

// src/index.ts
var KEY = "apiKey";
var MAPS = "maps";
var TILES = "tiles";
var AtomicBoolean = inu.jvm.cls("java.util.concurrent.atomic.AtomicBoolean");
var AtomicReference = inu.jvm.cls("java.util.concurrent.atomic.AtomicReference");
var AndroidUtilities = inu.jvm.cls("org.telegram.messenger.AndroidUtilities");
var JMath = inu.jvm.cls("java.lang.Math");
var JString = inu.jvm.cls("java.lang.String");
var JLocale = inu.jvm.cls("java.util.Locale");
function apiKey() {
  return localStorage.getItem(KEY) ?? "";
}
var useMaps = new AtomicBoolean(localStorage.getItem(MAPS) === "1");
var key = new AtomicReference(encodeURIComponent(apiKey()));
var WITH_MARKER = "https://static.maps.2gis.com/2.0?s=%dx%d@%dx&c=%.6f,%.6f&z=%d&pt=%.6f,%.6f~k:p~c:rd&key=%s";
var PLAIN = "https://static.maps.2gis.com/2.0?s=%dx%d@%dx&c=%.6f,%.6f&z=%d&key=%s";
var tilesOn = localStorage.getItem(TILES) === "1";
var tilesState = "off";
function getTilesStateLabel() {
  if (tilesState === "active") return t("state_active");
  if (tilesState === "waiting for a key") return t("state_waiting_key");
  if (tilesState.startsWith("failed: ")) return tf("state_failed", tilesState.slice("failed: ".length));
  return t("state_off");
}
function applyTiles() {
  try {
    if (tilesOn && apiKey() !== "") {
      setTileSource({
        name: "2gis",
        url: `https://tile{n}.maps.2gis.com/v2/tiles/online_hd/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey())}`,
        attribution: "© 2GIS",
        maxZoom: 18
      });
      tilesState = "active";
    } else {
      clearTileSource();
      tilesState = tilesOn ? "waiting for a key" : "off";
    }
  } catch (error) {
    tilesState = `failed: ${error.message}`;
    console.warn("the map tiles are not available", error);
  }
}
applyTiles();
var hooked = true;
var hookError = "";
try {
  inu.xposed.hookMethod(AndroidUtilities.getDeclaredMethod("formapMapUrl(IDDIIZII)Ljava/lang/String;"), {
    before: inu.xposed.routine({
      v: 1,
      source: `
      (ctx: any) => {
            const token: any = key.get()
            if (!useMaps.get() || token.length() === 0) return
            const scale = JMath.round(JMath.min(2.0, JMath.ceil(AndroidUtilities.density)))
            const lat = ctx.args[1]
            const lon = ctx.args[2]
            const width = JMath.max(120, JMath.min(1280, ctx.args[3]))
            const height = JMath.max(90, JMath.min(1280, ctx.args[4]))
            const zoom = JMath.max(1, JMath.min(18, ctx.args[6]))
            if (ctx.args[5]) {
              ctx.setReturnValue(JString.format(JLocale.US, WITH_MARKER, [width, height, scale, lat, lon, zoom, lat, lon, token]))
            } else {
              ctx.setReturnValue(JString.format(JLocale.US, PLAIN, [width, height, scale, lat, lon, zoom, token]))
            }
          }`,
      captures: ["key", "useMaps", "JMath", "AndroidUtilities", "JString", "JLocale", "WITH_MARKER", "PLAIN"],
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
        ["call", 0, ["get"], []],
        ["call", 1, ["get"], []],
        ["not", 9],
        ["setSlot", 0, 10],
        ["jumpIfTruthy", 10, 16],
        ["call", 8, ["length"], []],
        ["eq", 13, [0]],
        ["setSlot", 0, 14],
        ["getSlot", 0],
        ["jumpIfFalsy", 16, 19],
        ["return"],
        ["get", 3, ["density"]],
        ["call", 2, ["ceil"], [19]],
        ["call", 2, ["min"], [[2], 20]],
        ["call", 2, ["round"], [21]],
        ["arg", [1]],
        ["arg", [2]],
        ["arg", [3]],
        ["call", 2, ["min"], [[1280], 25]],
        ["call", 2, ["max"], [[120], 26]],
        ["arg", [4]],
        ["call", 2, ["min"], [[1280], 28]],
        ["call", 2, ["max"], [[90], 29]],
        ["arg", [6]],
        ["call", 2, ["min"], [[18], 31]],
        ["call", 2, ["max"], [[1], 32]],
        ["arg", [5]],
        ["jumpIfFalsy", 34, 41],
        ["get", 5, ["US"]],
        ["array", [27, 30, 22, 23, 24, 33, 23, 24, 8]],
        ["call", 4, ["format"], [36, 6, 37]],
        ["setResult", 38],
        ["jump", 45],
        ["get", 5, ["US"]],
        ["array", [27, 30, 22, 23, 24, 33, 8]],
        ["call", 4, ["format"], [41, 7, 42]],
        ["setResult", 43]
      ],
      tries: []
    }, [key, useMaps, JMath, AndroidUtilities, JString, JLocale, WITH_MARKER, PLAIN])
  });
} catch (error) {
  hooked = false;
  hookError = String(error.message ?? error);
  console.warn("hooking is not available", error);
}
var page = inu.ui.settingsPage({
  title: "2GIS",
  items: () => [
    ...hookError ? [inu.ui.separator(hookError)] : [],
    inu.ui.button({
      id: "key",
      text: t("key_title"),
      subtitle: t("key_desc"),
      value: apiKey() === "" ? t("not_set") : "••••••••",
      onClick: async () => {
        const value = await inu.ui.prompt({ title: t("key_title"), value: apiKey(), selectAll: true });
        if (value === null) return;
        localStorage.setItem(KEY, value.trim());
        key.call("set", encodeURIComponent(value.trim()));
        applyTiles();
        page.invalidate();
      }
    }),
    inu.ui.check({
      id: "tiles",
      text: t("tiles_title"),
      subtitle: `${t("tiles_desc")} · ${getTilesStateLabel()}`,
      checked: tilesOn,
      onChange: (checked) => {
        tilesOn = checked;
        localStorage.setItem(TILES, checked ? "1" : "0");
        applyTiles();
      }
    }),
    inu.ui.check({
      id: "maps",
      text: t("maps_title"),
      subtitle: hooked ? t("maps_desc") : `${t("hook_failed")}: ${hookError}`,
      checked: useMaps.call("get"),
      onChange: (checked) => {
        useMaps.call("set", checked);
        localStorage.setItem(MAPS, checked ? "1" : "0");
      }
    })
  ]
});
inu.registerSettings(page);
embed({
  id: "entinygram.2gis",
  name: "2GIS",
  placements: { choice: ["behavior.map-provider", "behavior.map-preview-provider"] },
  rows: () => [],
  onEvent: () => {
  },
  choices: (slot) => slot === "behavior.map-provider" ? [{ id: "tiles", title: t("tiles_title"), subtitle: t("tiles_desc"), checked: tilesOn }] : [{ id: "maps", title: t("maps_title"), subtitle: t("maps_choice_desc"), checked: useMaps.call("get") }],
  onChoice: (id, picked) => {
    if (id === "tiles") {
      tilesOn = picked;
      localStorage.setItem(TILES, picked ? "1" : "0");
      applyTiles();
    } else {
      useMaps.call("set", picked);
      localStorage.setItem(MAPS, picked ? "1" : "0");
    }
    embedChanged();
  }
});
