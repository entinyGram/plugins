// ==InuPlugin==
// @name         entinyGram SDK
// @id           entinygram.sdk
// @author       entinyGram
// @version      0.1.1-beta
// @description  Needed by plugins that use the entinyGram SDK
// @grant        fetch(raw.githubusercontent.com)
// @grant        openUrl
// @grant        clipboard.write
// @grant        unsafe.fs
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// ==/InuPlugin==


// ../../sdk/entiny/src/index.ts
var SDK_VERSION = "0.1.1-beta";

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
var embedKeys = { changed: CHANGED_KEY };

// src/embed/strings.ts
var END = "";
var FIELD_SEP = "";
var ROW_SEP = "";
var StringBuilder = inu.jvm.cls("java.lang.StringBuilder");
var ApplicationLoader = inu.jvm.cls("org.telegram.messenger.ApplicationLoader");
var LocaleController = inu.jvm.cls("org.telegram.messenger.LocaleController");
var CHUNK = 500;
var Indexer = inu.jvm.defineClass({
  methods: {
    build: {
      params: ["android.content.res.Resources", "int", "int", "int"],
      returns: "java.lang.String",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (res: any, base: any, from: any, to: any) {
                const sb = new StringBuilder()
                let misses = 0
                for (let i = from; i < to; i++) {
                  const id = base + i
                  let name = null
                  try {
                    name = res.getResourceEntryName(id)
                    misses = 0
                  } catch (e) {
                    // ids can have gaps; a long run of them means the type is over
                    misses++
                    if (misses >= 64) {
                      sb.append(END)
                      break
                    }
                    continue
                  }
                  if (name.startsWith('Inu') && !name.endsWith('Info')) {
                    try {
                      sb.append(name).append(FIELD_SEP).append(res.getString(id)).append(ROW_SEP)
                    } catch (e) {
                      // not a plain string
                    }
                  }
                }
                return sb.toString()
              }`,
        captures: ["StringBuilder", "END", "FIELD_SEP", "ROW_SEP"],
        slots: 4,
        code: [
          ["capture", 0],
          ["capture", 1],
          ["capture", 2],
          ["capture", 3],
          ["new", 0, []],
          ["setSlot", 0, [0]],
          ["arg", [2]],
          ["setSlot", 1, 6],
          ["getSlot", 1],
          ["arg", [3]],
          ["lt", 8, 9],
          ["jumpIfFalsy", 10, 53],
          ["arg", [1]],
          ["getSlot", 1],
          ["add", 12, 13],
          ["setSlot", 2, [null]],
          ["arg", [0]],
          ["call", 16, ["getResourceEntryName"], [14]],
          ["setSlot", 2, 17],
          ["setSlot", 0, [0]],
          ["jump", 31],
          ["catch"],
          ["getSlot", 0],
          ["add", 22, [1]],
          ["setSlot", 0, 23],
          ["getSlot", 0],
          ["ge", 25, [64]],
          ["jumpIfFalsy", 26, 30],
          ["call", 4, ["append"], [1]],
          ["jump", 53],
          ["jump", 49],
          ["getSlot", 2],
          ["call", 31, ["startsWith"], [["Inu"]]],
          ["setSlot", 3, 32],
          ["jumpIfFalsy", 32, 39],
          ["getSlot", 2],
          ["call", 35, ["endsWith"], [["Info"]]],
          ["not", 36],
          ["setSlot", 3, 37],
          ["getSlot", 3],
          ["jumpIfFalsy", 39, 49],
          ["getSlot", 2],
          ["call", 4, ["append"], [41]],
          ["call", 42, ["append"], [2]],
          ["call", 16, ["getString"], [14]],
          ["call", 43, ["append"], [44]],
          ["call", 45, ["append"], [3]],
          ["jump", 49],
          ["catch"],
          ["getSlot", 1],
          ["add", 49, [1]],
          ["setSlot", 1, 50],
          ["loop", 8],
          ["call", 4, ["toString"], []],
          ["return", 53]
        ],
        tries: [[16, 20, 21], [41, 47, 48]]
      }, [StringBuilder, END, FIELD_SEP, ROW_SEP])
    }
  }
});
var kebabCache = /* @__PURE__ */ new Map();
function kebab(name) {
  const cachedVal = kebabCache.get(name);
  if (cachedVal !== void 0) return cachedVal;
  let out = "";
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    const upper = code >= 65 && code <= 90;
    const prevCode = i > 0 ? name.charCodeAt(i - 1) : 0;
    const prevUpper = prevCode >= 65 && prevCode <= 90;
    if (upper && i > 0 && !prevUpper) out += "-";
    out += name[i].toLowerCase();
  }
  kebabCache.set(name, out);
  return out;
}
var cached = null;
function localeKey() {
  return String(LocaleController.callStatic("getInstance").call("getCurrentLocaleInfo").getField("shortName"));
}
function build() {
  const context = ApplicationLoader.getStaticField("applicationContext");
  const resources = context.call("getResources");
  const probe = resources.call("getIdentifier", "InuSettings", "string", context.call("getPackageName"));
  const base = probe - (probe & 65535);
  const indexer = new Indexer();
  const byText = /* @__PURE__ */ new Map();
  for (let from = 0; from < 65536; from += CHUNK) {
    const part = String(indexer.call("build", resources, base, from, from + CHUNK));
    const ended = part.includes(END);
    for (const row2 of part.replace(END, "").split(ROW_SEP)) {
      if (!row2) continue;
      const [name, text] = row2.split(FIELD_SEP);
      const slots = byText.get(text) ?? [];
      slots.push(kebab(name.replace(/^Inu/, "")));
      byText.set(text, slots);
    }
    if (ended) break;
  }
  return byText;
}
function slotsFor(text) {
  const locale = localeKey();
  if (cached === null || cached.locale !== locale) cached = { locale, byText: build() };
  return cached.byText.get(text) ?? [];
}
function warmUp() {
  slotsFor("");
}

// src/embed/engine.ts
var FIELD_SEP2 = "";
var ROW_SEP2 = "";
var MAX_ROWS = 4;
var VIEW_TYPE_HEADER = 0;
var VIEW_TYPE_SHADOW = 7;
var VIEW_TYPE_CUSTOM_SHADOW = -4;
var UItem = inu.jvm.cls("org.telegram.ui.Components.UItem");
var UniversalFragment = inu.jvm.cls("org.telegram.ui.Components.UniversalFragment");
var ArrayCls = inu.jvm.cls("java.lang.reflect.Array");
var StringBuilder2 = inu.jvm.cls("java.lang.StringBuilder");
var ButtonCell = inu.jvm.cls("desu.inugram.ui.settings.ButtonCellFactory").getStaticField("Companion");
var CheckCell = inu.jvm.cls("desu.inugram.ui.settings.CheckCellFactory").getStaticField("Companion");
var ICON_CUSTOMIZE = inu.jvm.cls("org.telegram.messenger.R$drawable").getStaticField("msg_customize");
var Dumper = inu.jvm.defineClass({
  methods: {
    dump: {
      params: ["java.lang.Object", "java.util.ArrayList"],
      returns: "java.lang.String",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (fragment: any, items: any) {
                const sb = new StringBuilder()
                // Object.toString is \`package.Class@hash\`; a Class value inside a routine is a class reference, not an object
                sb.append(fragment.toString()).append(ROW_SEP)
                for (const it of items) {
                  // a number is ambiguous for StringBuilder.append inside a routine; a string is not
                  sb.append('' + it.viewType).append(FIELD_SEP).append('' + it.id).append(FIELD_SEP)
                  const text = it.text
                  if (text !== null) sb.append(text.toString())
                  sb.append(ROW_SEP)
                }
                return sb.toString()
              }`,
        captures: ["StringBuilder", "ROW_SEP", "FIELD_SEP"],
        slots: 0,
        code: [
          ["capture", 0],
          ["capture", 1],
          ["capture", 2],
          ["new", 0, []],
          ["arg", [0]],
          ["call", 4, ["toString"], []],
          ["call", 3, ["append"], [5]],
          ["call", 6, ["append"], [1]],
          ["arg", [1]],
          ["iterate", 8],
          ["advance", 9, 26],
          ["get", 10, ["viewType"]],
          ["add", [""], 11],
          ["call", 3, ["append"], [12]],
          ["call", 13, ["append"], [2]],
          ["get", 10, ["id"]],
          ["add", [""], 15],
          ["call", 14, ["append"], [16]],
          ["call", 17, ["append"], [2]],
          ["get", 10, ["text"]],
          ["ne", 19, [null]],
          ["jumpIfFalsy", 20, 24],
          ["call", 19, ["toString"], []],
          ["call", 3, ["append"], [22]],
          ["call", 3, ["append"], [1]],
          ["loop", 10],
          ["call", 3, ["toString"], []],
          ["return", 26]
        ],
        tries: []
      }, [StringBuilder2, ROW_SEP2, FIELD_SEP2])
    }
  }
});
var dumper = new Dumper();
var owned = /* @__PURE__ */ new Map();
var ownedIds = new (inu.jvm.cls("java.util.concurrent.ConcurrentHashMap"))();
function idOf(pluginId, rowId) {
  const text = `${pluginId}:${rowId}`;
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h << 5) + h + text.charCodeAt(i) | 0;
  return 1073741824 | h & 1073741823;
}
function pageIdOf(simpleName) {
  const name = simpleName.replace(/Activity$/, "").replace(/Settings$/, "");
  return name === "Inu" ? "root" : kebab(name);
}
function registrations() {
  const registry = embedRegistry();
  const keys = registry.call("keySet").call("toArray");
  const count = ArrayCls.callStatic("getLength", keys);
  const out = [];
  for (let i = 0; i < count; i++) {
    const id = String(ArrayCls.callStatic("get", keys, i));
    if (id.startsWith("__")) continue;
    const handler = registry.call("get", id);
    if (handler === null) continue;
    try {
      const meta = JSON.parse(String(handler.call("apply", "meta", "")));
      out.push({ id, name: meta.name, placements: meta.placements ?? {}, handler });
    } catch (e) {
      registry.call("remove", id);
    }
  }
  return out;
}
function choicesAt(slot) {
  const out = [];
  for (const reg of registrations()) {
    if (!(reg.placements.choice ?? []).includes(slot)) continue;
    try {
      const list = JSON.parse(String(reg.handler.call("apply", "choices", slot)));
      for (const choice of list.slice(0, 2)) out.push({ reg, choice });
    } catch (e) {
      console.warn(`embed: ${reg.id} gave no choices for ${slot}`, e);
    }
  }
  return out;
}
var choiceCache = /* @__PURE__ */ new Map();
function refreshChoices(page2, regs) {
  const slots = /* @__PURE__ */ new Set();
  for (const reg of regs) for (const slot of reg.placements.choice ?? []) if (slot.startsWith(`${page2}.`)) slots.add(slot);
  for (const slot of slots) choiceCache.set(slot, choicesAt(slot));
}
function wantedSlots(regs, page2) {
  const wants = /* @__PURE__ */ new Map();
  const add = (slot, insert) => {
    if (!slot.startsWith(`${page2}.`)) return;
    const list = wants.get(slot) ?? [];
    list.push(insert);
    wants.set(slot, list);
  };
  for (const reg of regs) {
    for (const slot of reg.placements.screen ?? []) add(slot, { reg, slot, kind: "screen" });
    for (const place of reg.placements.inline ?? []) {
      const slot = typeof place === "string" ? place : place.slot;
      add(slot, { reg, slot, kind: "inline", only: typeof place === "string" ? void 0 : place.rows });
    }
  }
  return wants;
}
function build2(insert) {
  const { reg } = insert;
  if (insert.kind === "screen") {
    const id = idOf(reg.id, `screen:${insert.slot}`);
    owned.set(id, { reg, rowId: "", kind: "screen" });
    ownedIds.call("put", "" + id, "1");
    return [UItem.callStatic("asButton", id, ICON_CUSTOMIZE, reg.name)];
  }
  let rows = [];
  try {
    rows = JSON.parse(String(reg.handler.call("apply", "rows", insert.slot)));
  } catch (e) {
    console.warn(`embed: ${reg.id} gave no rows for ${insert.slot}`, e);
  }
  if (insert.only) rows = rows.filter((row2) => insert.only.includes(row2.id));
  return rows.slice(0, MAX_ROWS).map((row2) => {
    const id = idOf(reg.id, row2.id);
    owned.set(id, { reg, rowId: row2.id, row: row2, kind: "inline" });
    ownedIds.call("put", "" + id, "1");
    const subtitle = row2.subtitle ?? null;
    if (row2.type === "check") return CheckCell.call("of", id, row2.text, subtitle, null, !!row2.checked, null);
    const value = row2.type === "select" ? row2.options?.[row2.selected ?? 0] : row2.value;
    return ButtonCell.call("of", id, row2.text, value ?? null, subtitle, null, !!row2.danger, null);
  });
}
function plan(page2, entries, wants) {
  const ops = [];
  const get = (slot) => wants.get(slot) ?? [];
  const rowsOf = (inserts) => {
    const seen = /* @__PURE__ */ new Set();
    return inserts.filter((i) => {
      const key = `${i.reg.id}|${i.kind}|${i.slot}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).flatMap(build2);
  };
  const slotsAt = (text) => text ? slotsFor(text).map((s) => `${page2}.${s}`) : [];
  let section = [];
  entries.forEach((entry, i) => {
    const slots = slotsAt(entry.text);
    const isHeader = entry.type === VIEW_TYPE_HEADER;
    const isShadow = entry.type === VIEW_TYPE_SHADOW || entry.type === VIEW_TYPE_CUSTOM_SHADOW;
    const before = rowsOf(slots.flatMap((s) => get(`${s}.before`)));
    if (before.length) ops.push({ index: i, remove: 0, add: before });
    const replace = rowsOf(slots.flatMap((s) => get(`${s}.replace`)));
    if (replace.length) {
      ops.push({ index: i, remove: 1, add: replace });
      return;
    }
    if (isHeader) {
      section = slots;
      const start = rowsOf(section.flatMap((s) => get(`${s}.start`)));
      if (start.length) ops.push({ index: i + 1, remove: 0, add: start });
    } else if (isShadow && section.length) {
      const end = rowsOf(section.flatMap((s) => [...get(s), ...get(`${s}.end`)]));
      if (end.length) ops.push({ index: i, remove: 0, add: end });
      section = [];
    }
    if (!isHeader && !isShadow) {
      const after = rowsOf(slots.flatMap((s) => [...get(`${s}.after`), ...get(s)]));
      if (after.length) ops.push({ index: i + 1, remove: 0, add: after });
    }
  });
  if (section.length) {
    const end = rowsOf(section.flatMap((s) => [...get(s), ...get(`${s}.end`)]));
    if (end.length) ops.push({ index: entries.length, remove: 0, add: end });
  }
  const tail = rowsOf(get(`${page2}.end`));
  if (tail.length) {
    ops.push({
      index: entries.length,
      remove: 0,
      add: [UItem.callStatic("asShadow(Ljava/lang/CharSequence;)Lorg/telegram/ui/Components/UItem;", null), ...tail, UItem.callStatic("asShadow(Ljava/lang/CharSequence;)Lorg/telegram/ui/Components/UItem;", null)]
    });
  }
  return ops;
}
function fill(fragment, items) {
  const regs = registrations();
  if (regs.length === 0) return;
  const lines = String(dumper.call("dump", fragment, items)).split(ROW_SEP2);
  const page2 = pageIdOf(lines[0].split("@")[0].split(".").pop() ?? "");
  refreshChoices(page2, regs);
  const wants = wantedSlots(regs, page2);
  if (wants.size === 0 && !regs.some((reg) => (reg.placements.choice ?? []).some((slot) => slot.startsWith(`${page2}.`)))) return;
  const entries = lines.slice(1).filter((line) => line !== "").map((line) => {
    const [type, id, text] = line.split(FIELD_SEP2);
    return { type: Number(type), id: Number(id), text: text ?? "" };
  });
  if (entries.some((entry) => owned.has(entry.id))) return;
  entries.forEach((entry, i) => {
    for (const slot of entry.text ? slotsFor(entry.text).map((s) => `${page2}.${s}`) : []) {
      const active = (choiceCache.get(slot) ?? []).find((c) => c.choice.checked);
      if (active) items.call("get(I)Ljava/lang/Object;", i).setField("textValue", active.choice.title);
    }
  });
  const ops = plan(page2, entries, wants).sort((a, b) => b.index - a.index);
  for (const op of ops) {
    if (op.remove) items.call("remove(I)Ljava/lang/Object;", op.index);
    op.add.forEach((row2, n) => items.call("add(ILjava/lang/Object;)V", op.index + n, row2));
  }
}
var Launch = inu.jvm.cls("org.telegram.ui.LaunchActivity");
var mainHandler = new (inu.jvm.cls("android.os.Handler"))(inu.jvm.cls("android.os.Looper").callStatic("getMainLooper"));
var redraw = inu.jvm.routine({
  v: 1,
  source: `
  () => {
    const fragment = Launch.getSafeLastFragment()
    if (fragment !== null && fragment instanceof UniversalFragment) fragment.listView.adapter.update(true)
  }`,
  captures: ["Launch", "UniversalFragment"],
  slots: 1,
  code: [
    ["capture", 0],
    ["capture", 1],
    ["call", 0, ["getSafeLastFragment"], []],
    ["ne", 2, [null]],
    ["setSlot", 0, 3],
    ["jumpIfFalsy", 3, 8],
    ["instanceOf", 2, 1],
    ["setSlot", 0, 6],
    ["getSlot", 0],
    ["jumpIfFalsy", 8, 13],
    ["get", 2, ["listView"]],
    ["get", 10, ["adapter"]],
    ["call", 11, ["update"], [[true]]]
  ],
  tries: []
}, [Launch, UniversalFragment]);
function refresh() {
  mainHandler.call("post", redraw);
}
function fire(own, value) {
  own.reg.handler.call("apply", "event", JSON.stringify({ row: own.rowId, value }));
}
function tap(own) {
  if (own.kind === "screen") {
    own.reg.handler.call("apply", "open", "");
    return;
  }
  const row2 = own.row;
  if (row2.type === "check") {
    fire(own, String(!row2.checked));
    refresh();
  } else if (row2.type === "button") {
    fire(own, "");
    refresh();
  } else {
    setTimeout(async () => {
      const chosen = await inu.ui.chooser({ items: row2.options ?? [], selected: row2.selected ?? 0 });
      if (chosen === null) return;
      fire(own, String(chosen));
      refresh();
    }, 0);
  }
}
var Function1 = inu.jvm.cls("kotlin.jvm.functions.Function1");
var KotlinUnit = inu.jvm.cls("kotlin.Unit").getStaticField("INSTANCE");
var JArrayList = inu.jvm.cls("java.util.ArrayList");
var RadioItemOptions = inu.jvm.cls("desu.inugram.ui.settings.RadioItemOptions");
function announce(own, picked) {
  own.reg.handler.call("apply", "choice", JSON.stringify({ id: own.choice.id, picked }));
}
var pickState = new JArrayList();
for (let n = 0; n < 4; n++) pickState.call("add", null);
pickState.call("set", 3, KotlinUnit);
var pickQueue = new (inu.jvm.cls("java.util.concurrent.ConcurrentLinkedQueue"))();
var drainPicks = inu.jvm.runnable(() => {
  for (let line = pickQueue.call("poll"); line !== null; line = pickQueue.call("poll")) {
    try {
      const [slot, at, size] = String(line).split("|");
      const mine = choiceCache.get(slot) ?? [];
      const index = Number(at);
      const count = Number(size);
      if (index < count) {
        for (const own of mine) if (own.choice.checked) announce(own, false);
      } else {
        mine.forEach((own, i) => {
          if (i === index - count) announce(own, true);
          else if (own.choice.checked) announce(own, false);
        });
      }
    } catch (e) {
      console.warn("embed: a picker choice failed", e);
    }
  }
});
var Pick = inu.jvm.defineClass({
  interfaces: [Function1],
  methods: {
    invoke: {
      params: ["java.lang.Object"],
      returns: "java.lang.Object",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (index: any) {
                const size = pickState.get(1)
                if (index < size) pickState.get(0).invoke(index)
                pickQueue.add(\`\${pickState.get(2)}|\${index}|\${size}\`)
                mainHandler.post(drainPicks)
                return pickState.get(3)
              }`,
        captures: ["pickState", "pickQueue", "mainHandler", "drainPicks"],
        slots: 0,
        code: [
          ["capture", 0],
          ["capture", 1],
          ["capture", 2],
          ["capture", 3],
          ["call", 0, ["get"], [[1]]],
          ["arg", [0]],
          ["lt", 5, 4],
          ["jumpIfFalsy", 6, 10],
          ["call", 0, ["get"], [[0]]],
          ["call", 8, ["invoke"], [5]],
          ["call", 0, ["get"], [[2]]],
          ["add", [""], 10],
          ["add", 11, ["|"]],
          ["add", 12, 5],
          ["add", 13, ["|"]],
          ["add", 14, 4],
          ["call", 1, ["add"], [15]],
          ["call", 2, ["post"], [3]],
          ["call", 0, ["get"], [[3]]],
          ["return", 18]
        ],
        tries: []
      }, [pickState, pickQueue, mainHandler, drainPicks])
    }
  }
});
var RecyclerView = inu.jvm.cls("androidx.recyclerview.widget.RecyclerView");
var getChildAdapterPosition = RecyclerView.getDeclaredMethod("getChildAdapterPosition(Landroid/view/View;)I");
function pickerSlots(fragment, anchor) {
  const listView = fragment.getField("listView");
  const position = getChildAdapterPosition.invoke(listView, anchor);
  if (position < 0) return [];
  const item = listView.getField("adapter").call("getItem", position);
  const text = item === null ? null : item.getField("text");
  if (text === null) return [];
  const className = String(dumper.call("dump", fragment, emptyItems)).split(ROW_SEP2)[0];
  const page2 = pageIdOf(className.split("@")[0].split(".").pop() ?? "");
  return slotsFor(String(text)).map((s) => `${page2}.${s}`);
}
var JSystem = inu.jvm.cls("java.lang.System");
var sharedItems = new JArrayList();
var sharedPick = new Pick();
var emptyItems = new JArrayList();
function hookPickers() {
  const hook = (descriptor, slotIndex) => {
    let show;
    try {
      show = RadioItemOptions.getDeclaredMethod(descriptor);
    } catch (e) {
      return;
    }
    inu.xposed.hookMethod(show, {
      before: (ctx) => {
        try {
          if (choiceCache.size === 0) return;
          const fragment = ctx.args[0];
          if (!UniversalFragment.isInstance(fragment)) return;
          const className = String(dumper.call("dump", fragment, emptyItems)).split(ROW_SEP2)[0];
          const page2 = pageIdOf(className.split("@")[0].split(".").pop() ?? "");
          if (page2 === "plugin-settings") return;
          let hasChoices = false;
          for (const k of choiceCache.keys()) {
            if (k.startsWith(`${page2}.`)) {
              hasChoices = true;
              break;
            }
          }
          if (!hasChoices) return;
          const anchor = ctx.args[1];
          const original = ctx.args[2];
          const onSelect = ctx.args[slotIndex + 1];
          if (JSystem.callStatic("identityHashCode", original) === JSystem.callStatic("identityHashCode", sharedItems)) return;
          const slots = pickerSlots(fragment, anchor);
          for (const slot of slots) {
            const mine = choiceCache.get(slot) ?? [];
            if (mine.length === 0) continue;
            const size = original.call("size");
            sharedItems.call("clear");
            sharedItems.call("addAll", original);
            for (const own of mine) sharedItems.call("add", `${own.choice.title}  (${own.reg.name})`);
            const checked = mine.findIndex((own) => own.choice.checked);
            pickState.call("set", 0, onSelect);
            pickState.call("set", 1, size);
            pickState.call("set", 2, slot);
            ctx.args[2] = sharedItems;
            if (checked >= 0) ctx.args[3] = size + checked;
            ctx.args[slotIndex + 1] = sharedPick;
            return;
          }
        } catch (e) {
          console.warn("embed: a picker could not be extended", e);
        }
      }
    });
  };
  hook("show(Lorg/telegram/ui/ActionBar/BaseFragment;Landroid/view/View;Ljava/util/List;ILkotlin/jvm/functions/Function1;)V", 3);
  hook("show(Lorg/telegram/ui/ActionBar/BaseFragment;Landroid/view/View;Ljava/util/List;ILjava/lang/String;Lkotlin/jvm/functions/Function1;)V", 4);
}
var Callback2 = inu.jvm.cls("org.telegram.messenger.Utilities$Callback2");
var ClickListener = inu.jvm.cls("org.telegram.ui.Components.RecyclerListView$OnItemClickListenerExtended");
var FillWrapper = inu.jvm.defineClass({
  interfaces: [Callback2],
  fields: { orig: "java.lang.Object", fragment: "java.lang.Object" },
  methods: {
    run: {
      params: ["java.lang.Object", "java.lang.Object"],
      returns: "void",
      body: (self, items, adapter) => {
        self.getField("orig").call("run", items, adapter);
        try {
          fill(self.getField("fragment"), items);
        } catch (e) {
          console.warn("embed: filling a screen failed", e);
        }
      }
    }
  }
});
var tapState = new (inu.jvm.cls("java.util.concurrent.ConcurrentHashMap"))();
var tapQueue = new (inu.jvm.cls("java.util.concurrent.ConcurrentLinkedQueue"))();
var drainTaps = inu.jvm.runnable(() => {
  for (let id = tapQueue.call("poll"); id !== null; id = tapQueue.call("poll")) {
    try {
      const own = owned.get(Number(id));
      if (own !== void 0) tap(own);
    } catch (e) {
      console.warn("embed: a tap failed", e);
    }
  }
});
var TapWrapper = inu.jvm.defineClass({
  interfaces: [ClickListener],
  methods: {
    hasDoubleTap: {
      params: ["android.view.View", "int"],
      returns: "boolean",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (view: any, position: any) {
                return tapState.get('' + JSystem.identityHashCode(this)).get(0).hasDoubleTap(view, position)
              }`,
        captures: ["tapState", "JSystem"],
        slots: 0,
        code: [
          ["capture", 0],
          ["capture", 1],
          ["this"],
          ["call", 1, ["identityHashCode"], [2]],
          ["add", [""], 3],
          ["call", 0, ["get"], [4]],
          ["call", 5, ["get"], [[0]]],
          ["arg", [0]],
          ["arg", [1]],
          ["call", 6, ["hasDoubleTap"], [7, 8]],
          ["return", 9]
        ],
        tries: []
      }, [tapState, JSystem])
    },
    onDoubleTap: {
      params: ["android.view.View", "int", "float", "float"],
      returns: "void",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (view: any, position: any, x: any, y: any) {
                tapState.get('' + JSystem.identityHashCode(this)).get(0).onDoubleTap(view, position, x, y)
              }`,
        captures: ["tapState", "JSystem"],
        slots: 0,
        code: [
          ["capture", 0],
          ["capture", 1],
          ["this"],
          ["call", 1, ["identityHashCode"], [2]],
          ["add", [""], 3],
          ["call", 0, ["get"], [4]],
          ["call", 5, ["get"], [[0]]],
          ["arg", [0]],
          ["arg", [1]],
          ["arg", [2]],
          ["arg", [3]],
          ["call", 6, ["onDoubleTap"], [7, 8, 9, 10]]
        ],
        tries: []
      }, [tapState, JSystem])
    },
    onItemClick: {
      params: ["android.view.View", "int", "float", "float"],
      returns: "void",
      body: inu.jvm.routine({
        v: 1,
        source: `
        function (view: any, position: any, x: any, y: any) {
                const state = tapState.get('' + JSystem.identityHashCode(this))
                const item = state.get(1).getItem(position)
                if (item !== null && ownedIds.containsKey('' + item.id)) {
                  tapQueue.add('' + item.id)
                  mainHandler.post(drainTaps)
                } else {
                  state.get(0).onItemClick(view, position, x, y)
                }
              }`,
        captures: ["tapState", "JSystem", "ownedIds", "tapQueue", "mainHandler", "drainTaps"],
        slots: 1,
        code: [
          ["capture", 0],
          ["capture", 1],
          ["capture", 2],
          ["capture", 3],
          ["capture", 4],
          ["capture", 5],
          ["this"],
          ["call", 1, ["identityHashCode"], [6]],
          ["add", [""], 7],
          ["call", 0, ["get"], [8]],
          ["call", 9, ["get"], [[1]]],
          ["arg", [1]],
          ["call", 10, ["getItem"], [11]],
          ["ne", 12, [null]],
          ["setSlot", 0, 13],
          ["jumpIfFalsy", 13, 20],
          ["get", 12, ["id"]],
          ["add", [""], 16],
          ["call", 2, ["containsKey"], [17]],
          ["setSlot", 0, 18],
          ["getSlot", 0],
          ["jumpIfFalsy", 20, 27],
          ["get", 12, ["id"]],
          ["add", [""], 22],
          ["call", 3, ["add"], [23]],
          ["call", 4, ["post"], [5]],
          ["jump", 32],
          ["call", 9, ["get"], [[0]]],
          ["arg", [0]],
          ["arg", [2]],
          ["arg", [3]],
          ["call", 27, ["onItemClick"], [28, 11, 29, 30]]
        ],
        tries: []
      }, [tapState, JSystem, ownedIds, tapQueue, mainHandler, drainTaps])
    }
  }
});
function hookScreens() {
  inu.xposed.hookAllOverloads(UniversalFragment, "createView", {
    after: (ctx) => {
      try {
        const fragment = ctx.thisObject;
        const view = fragment.getField("listView");
        if (view === null) return;
        const adapter = view.getField("adapter");
        const current = adapter.getField("fillItems");
        if (FillWrapper.isInstance(current)) return;
        const wrapper = new FillWrapper();
        wrapper.setField("orig", current);
        wrapper.setField("fragment", fragment);
        adapter.setField("fillItems", wrapper);
        const clicks = view.getField("onItemClickListenerExtended");
        if (clicks !== null) {
          const tapper = new TapWrapper();
          const state = new JArrayList();
          state.call("add", clicks);
          state.call("add", adapter);
          tapState.call("put", "" + JSystem.callStatic("identityHashCode", tapper), state);
          view.call("setOnItemClickListener(Lorg/telegram/ui/Components/RecyclerListView$OnItemClickListenerExtended;)V", tapper);
        }
      } catch (e) {
        console.warn("embed: could not wrap a screen", e);
      }
    }
  });
}
function startEmbedEngine() {
  const errors = [];
  for (const hook of [hookScreens, hookPickers]) {
    try {
      hook();
    } catch (e) {
      errors.push(String(e.message ?? e));
    }
  }
  if (errors.length === 2) return { hooked: false, reason: errors.join("; ") };
  const Changed = inu.jvm.defineClass({
    methods: {
      run: {
        params: [],
        returns: "void",
        body: inu.jvm.routine({
          v: 1,
          source: `
          function () {
                    mainHandler.post(redraw)
                  }`,
          captures: ["mainHandler", "redraw"],
          slots: 0,
          code: [
            ["capture", 0],
            ["capture", 1],
            ["call", 0, ["post"], [1]]
          ],
          tries: []
        }, [mainHandler, redraw])
      }
    }
  });
  const changed = new Changed();
  embedRegistry().call("put", embedKeys.changed, changed);
  setTimeout(() => {
    try {
      warmUp();
      refresh();
    } catch (e) {
      console.warn("embed: could not read the settings strings", e);
    }
  }, 0);
  return { hooked: true };
}

// src/index.ts
var ALL_FILTERS = [
  { key: "all", label: "All" },
  { key: "installed", label: "Installed" },
  { key: "updates", label: "Updates" }
];
var filters = () => ALL_FILTERS;
var embedState = "off";
try {
  const engine = startEmbedEngine();
  embedState = engine.hooked ? "on" : `off (${engine.reason})`;
} catch (e) {
  embedState = `off (${e.message})`;
}
var BRIDGE_CLASS = "desu.inugram.helpers.entiny.EntinyMarketBridge";
var DEFAULT_INDEX_URL = "https://raw.githubusercontent.com/entinyGram/plugins/main/index.json";
var bridgeRef;
function bridge() {
  if (bridgeRef === void 0) {
    try {
      bridgeRef = inu.jvm.cls(BRIDGE_CLASS);
    } catch {
      bridgeRef = null;
    }
  }
  return bridgeRef;
}
var standalone = () => bridge() === null;
var catalog = null;
var loading = false;
var failure = null;
var query = "";
var filter = "all";
var icons = /* @__PURE__ */ new Map();
function compare(a, b) {
  const [coreA, preA] = a.split(/-(.+)/);
  const [coreB, preB] = b.split(/-(.+)/);
  const pa = coreA.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = coreB.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  if (preA === preB) return 0;
  if (preA === void 0) return 1;
  if (preB === void 0) return -1;
  return preA < preB ? -1 : 1;
}
function newest(plugin) {
  return [...plugin.versions].sort((x, y) => compare(y.version, x.version))[0];
}
function scanInstalled() {
  const found = /* @__PURE__ */ new Map();
  const decoder = new TextDecoder();
  const visit = (dir, depth) => {
    for (const name of inu.fs.readdir(dir)) {
      const full = `${dir}/${name}`;
      const info = inu.fs.stat(full);
      if (info.isDirectory) {
        if (depth < 3) visit(full, depth + 1);
        continue;
      }
      if (!/\.js$/.test(name) || info.size > 4e6) continue;
      const head = decoder.decode(inu.fs.read(full).subarray(0, 4096));
      const block = head.split("==InuPlugin==")[1]?.split("==/InuPlugin==")[0];
      const id = block?.match(/@id\s+(\S+)/)?.[1];
      const version = block?.match(/@version\s+(\S+)/)?.[1];
      if (id && version) found.set(id, { id, version, enabled: true });
    }
  };
  try {
    visit(inu.android.getPluginsDir(), 0);
  } catch (e) {
    console.log("scanning installed plugins failed", e);
  }
  return [...found.values()];
}
function installedList() {
  const native = bridge();
  if (!native) return scanInstalled();
  try {
    return JSON.parse(native.callStatic("installed"));
  } catch (e) {
    console.log("installed list failed", e);
    return [];
  }
}
function stateOf(plugin, installed) {
  const local = installed.find((p) => p.id === plugin.id);
  if (!local) return { state: "new" };
  const top = newest(plugin);
  return { state: top && compare(top.version, local.version) > 0 ? "update" : "installed", local };
}
function unmet(version, installed) {
  return (version.requires ?? []).filter((req) => !installed.some((p) => req.startsWith(p.id)));
}
function candidates(url) {
  const list = [url];
  if (url.includes("/main/")) list.push(url.replace("/main/", "/dev/"));
  return list;
}
async function load() {
  if (loading) return;
  loading = true;
  failure = null;
  page.invalidate();
  const base = bridge()?.callStatic("indexUrl") ?? DEFAULT_INDEX_URL;
  let problem = "not found";
  for (const url of candidates(base)) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const root = await res.json();
      const dir = url.slice(0, url.lastIndexOf("/") + 1);
      catalog = root.plugins.map((p) => ({
        ...p,
        name: p.name || p.id,
        icon: p.icon && (/^https?:/.test(p.icon) ? p.icon : dir + p.icon),
        versions: p.versions.map((v) => ({ ...v, file: /^https?:/.test(v.file) ? v.file : dir + v.file }))
      }));
      problem = "";
      break;
    } catch (e) {
      problem = e.message;
    }
  }
  failure = problem || null;
  loading = false;
  page.invalidate();
  void loadIcons();
}
async function loadIcons() {
  await Promise.all((catalog ?? []).map(async (plugin) => {
    if (!plugin.icon || icons.has(plugin.id)) return;
    try {
      const res = await fetch(plugin.icon);
      if (res.ok) icons.set(plugin.id, inu.icons.svg(await res.text()));
    } catch (e) {
      console.log(`icon of ${plugin.id} failed`, e);
    }
  }));
  page.invalidate();
}
async function install(version, source) {
  const native = bridge();
  if (!native) {
    inu.clipboard.write(version.file);
    const answer = await inu.ui.dialog({
      title: "Install from file",
      message: [
        "The download link is copied. Save the file, then open Settings → Plugins → Load from file and pick it.",
        version.sha256 ? `SHA-256: ${version.sha256}` : ""
      ].filter(Boolean).join("\n\n"),
      positive: "Open link",
      negative: "Close"
    });
    if (answer === "positive") inu.openUrl(version.file);
    return;
  }
  native.callStatic("install", version.file, version.sha256 ?? "");
  for (const delay of [3e3, 8e3, 2e4]) setTimeout(() => {
    page.invalidate();
    source.invalidate();
  }, delay);
}
function openPlugin(plugin) {
  const detail = inu.ui.settingsPage({
    title: plugin.name,
    transient: true,
    items: () => {
      const installed = installedList();
      const { state, local } = stateOf(plugin, installed);
      const top = newest(plugin);
      const rows = [];
      rows.push(inu.ui.header("About"));
      rows.push(inu.ui.separator(plugin.description || "No description provided."));
      if (plugin.author) rows.push(inu.ui.separator(`Created by ${plugin.author}`));
      rows.push(inu.ui.header("Installation"));
      if (top) {
        const missing = unmet(top, installed);
        const label = state === "new" ? `Install v${top.version}` : state === "update" ? `Update to v${top.version}` : "Reinstall";
        rows.push(inu.ui.button({
          id: "main",
          text: label,
          subtitle: missing.length ? `Needs ${missing.join(", ")}` : local ? `Installed: v${local.version}` : void 0,
          icon: inu.icons.common(state === "installed" ? "refresh" : "download"),
          onClick: () => install(top, detail)
        }));
      }
      if (local) {
        rows.push(inu.ui.button({
          id: "remove",
          text: "Remove plugin",
          subtitle: `Installed version: v${local.version}`,
          icon: inu.icons.common("delete"),
          onClick: async () => {
            const answer = await inu.ui.dialog({
              title: `Remove ${plugin.name}?`,
              message: "The plugin and its stored data will be removed from this device.",
              positive: "Remove",
              negative: "Cancel"
            });
            if (answer !== "positive") return;
            try {
              const native = bridge();
              if (!native) throw new Error("standalone");
              native.callStatic("remove", plugin.id);
              setTimeout(() => {
                page.invalidate();
                detail.invalidate();
              }, 1e3);
            } catch (error) {
              console.warn("plugin removal is unavailable in the app bridge", error);
              await inu.ui.dialog({
                title: "Removal unavailable",
                message: "This app build does not expose plugin removal to the marketplace yet. Remove it from Settings → Plugins.",
                positive: "OK"
              });
            }
          }
        }));
      }
      rows.push(inu.ui.header("Version history"));
      for (const version of [...plugin.versions].sort((x, y) => compare(y.version, x.version))) {
        const here = local && compare(version.version, local.version) === 0;
        const note = (version.notes ?? "").split("\n").find((l) => l.trim());
        rows.push(inu.ui.button({
          id: `v:${version.version}`,
          text: `v${version.version}`,
          subtitle: [version.date, note].filter(Boolean).join("\n") || void 0,
          value: here ? "Installed" : version === top ? "Latest" : void 0,
          onClick: async () => {
            const missing = unmet(version, installed);
            const answer = await inu.ui.dialog({
              title: `${plugin.name} v${version.version}`,
              message: [version.notes?.trim(), missing.length ? `Needs ${missing.join(", ")}` : ""].filter(Boolean).join("\n\n") || "Install this version?",
              positive: here ? "Reinstall" : local && compare(version.version, local.version) < 0 ? "Downgrade" : "Install",
              negative: "Cancel"
            });
            if (answer === "positive") install(version, detail);
          }
        }));
      }
      rows.push(inu.ui.separator(`${plugin.versions.length} published version${plugin.versions.length === 1 ? "" : "s"}`));
      return rows;
    }
  });
  inu.ui.openPage(detail);
}
function row(plugin, installed) {
  const { state, local } = stateOf(plugin, installed);
  const top = newest(plugin);
  const value = state === "update" ? `v${top?.version}` : state === "installed" ? "Installed" : top ? `v${top.version}` : void 0;
  const icon = state === "update" ? "refresh" : state === "installed" ? "check" : "download";
  const subtitle = state === "update" && local ? `v${local.version} → v${top?.version}` : [plugin.author, plugin.description].filter(Boolean).join(" · ");
  return inu.ui.button({
    id: `p:${plugin.id}`,
    text: plugin.name,
    subtitle: subtitle || void 0,
    value,
    icon: icons.get(plugin.id) ?? inu.icons.common(icon),
    onClick: () => openPlugin(plugin)
  });
}
var page = inu.ui.settingsPage({
  title: "Marketplace",
  items: () => {
    const rows = [];
    if (!catalog && !loading && !failure) void load();
    rows.push(inu.ui.button({
      id: "search",
      text: "Search",
      subtitle: query || "Name, author or description",
      icon: inu.icons.common("search"),
      onClick: async () => {
        const value = await inu.ui.prompt({ title: "Search plugins", hint: "Name, author or description", value: query, selectAll: true });
        if (value !== null) {
          query = value.trim();
          page.invalidate();
        }
      }
    }));
    rows.push(inu.ui.select({
      id: "filter",
      text: "Show",
      icon: inu.icons.common("more"),
      items: filters().map((f) => f.label),
      selected: Math.max(0, filters().findIndex((f) => f.key === filter)),
      onChange: (index) => {
        filter = filters()[index].key;
      }
    }));
    if (!catalog) {
      rows.push(inu.ui.separator(loading ? "Loading plugins…" : `Could not load the catalog: ${failure ?? "unknown error"}`));
      rows.push(inu.ui.button({
        id: "retry",
        text: "Try again",
        icon: inu.icons.common("refresh"),
        onClick: () => {
          void load();
        }
      }));
      return rows;
    }
    const installed = installedList();
    const needle = query.toLowerCase();
    const shown = catalog.filter((p) => !needle || [p.name, p.id, p.author, p.description].some((s) => s?.toLowerCase().includes(needle))).map((p) => ({ plugin: p, ...stateOf(p, installed) })).filter((x) => filter === "all" || (filter === "installed" ? x.state !== "new" : x.state === "update")).sort((a, b) => a.plugin.name.localeCompare(b.plugin.name));
    const sections = [
      ["Updates available", shown.filter((x) => x.state === "update")],
      ["Installed", shown.filter((x) => x.state === "installed")],
      ["Available", shown.filter((x) => x.state === "new")]
    ];
    for (const [title, group] of sections) {
      if (!group.length) continue;
      rows.push(inu.ui.header(title));
      for (const x of group) rows.push(row(x.plugin, installed));
    }
    if (!shown.length) rows.push(inu.ui.separator(query ? "Nothing matches the search" : "Nothing here yet"));
    rows.push(inu.ui.button({
      id: "refresh",
      text: "Refresh catalog",
      icon: inu.icons.common("refresh"),
      onClick: () => {
        void load();
      }
    }));
    rows.push(inu.ui.separator(`entinyGram SDK ${SDK_VERSION}, settings embedding ${embedState}${standalone() ? ", standalone mode (installing goes through a file)" : ""}. Plugins come from the entinyGram GitHub repository; every install asks for confirmation`));
    return rows;
  }
});
inu.registerSettings(page);
