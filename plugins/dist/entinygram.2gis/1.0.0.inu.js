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
      text: "2GIS API key",
      subtitle: "A Static API key from the 2GIS Platform Manager",
      value: apiKey() === "" ? "Not set" : "••••••••",
      onClick: async () => {
        const value = await inu.ui.prompt({ title: "2GIS API key", value: apiKey(), selectAll: true });
        if (value === null) return;
        localStorage.setItem(KEY, value.trim());
        key.call("set", encodeURIComponent(value.trim()));
        applyTiles();
        page.invalidate();
      }
    }),
    inu.ui.check({
      id: "tiles",
      text: "Map tiles",
      subtitle: `Draws the map in the app with 2GIS tiles · ${tilesState}`,
      checked: tilesOn,
      onChange: (checked) => {
        tilesOn = checked;
        localStorage.setItem(TILES, checked ? "1" : "0");
        applyTiles();
      }
    }),
    inu.ui.check({
      id: "maps",
      text: "Static maps",
      subtitle: hooked ? "Used whenever the app builds a preview from a map service" : `The preview hook failed: ${hookError}`,
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
  choices: (slot) => slot === "behavior.map-provider" ? [{ id: "tiles", title: "Map tiles", subtitle: "Draws the map in the app with 2GIS tiles", checked: tilesOn }] : [{ id: "maps", title: "Static maps", subtitle: "Location previews from the 2GIS Static API", checked: useMaps.call("get") }],
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
