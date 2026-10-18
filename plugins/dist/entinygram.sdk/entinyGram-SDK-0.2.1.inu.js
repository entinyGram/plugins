// ==InuPlugin==
// @name         entinyGram SDK
// @id           entinygram.sdk
// @author       entinyGram
// @version      0.2.1
// @description  Needed by plugins that use the entinyGram SDK
// @grant        fetch(raw.githubusercontent.com)
// @grant        account.read(peers, messages, history)
// @grant        openUrl
// @grant        clipboard.write
// @grant        unsafe.fs
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// ==/InuPlugin==


// ../../sdk/entiny/src/index.ts
var SDK_VERSION = "0.2.1";

// src/catalog.ts
var CHANNEL_FILE_PREFIX = "tg:";
function channelFile(channel, messageId) {
  return `${CHANNEL_FILE_PREFIX}${channel}/${messageId}`;
}
function parseChannelFile(file) {
  const match = file.startsWith(CHANNEL_FILE_PREFIX) && file.slice(CHANNEL_FILE_PREFIX.length).match(/^([^/]+)\/(\d+)$/);
  return match ? { channel: match[1], messageId: Number(match[2]) } : null;
}
var RISKY = /^(jvm|xposed|invokeRaw|notificationCenter|disableApiFiltering)$/;
function riskyGrants(version) {
  return (version?.grants ?? []).filter((grant) => RISKY.test(grant.trim()));
}

// src/channel.ts
var HISTORY_LIMIT = 400;
var CACHE_PREFIX = "entiny.channel.";
function normalizeChannel(input) {
  const text2 = input.trim().replace(/^https?:\/\/(t|telegram)\.me\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  return /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(text2) ? text2 : null;
}
function factsFromLink(entities) {
  for (const entity of entities ?? []) {
    const hit = entity._ === "messageEntityTextUrl" ? entity.url?.match(/[?&]entiny=([^&#]+)/) : null;
    if (!hit) continue;
    try {
      const data = JSON.parse(decodeURIComponent(hit[1]));
      if (data.id) return { id: data.id, grants: data.g ?? [], requires: data.r ?? [], size: data.s };
    } catch {
    }
  }
  return null;
}
function factsFromLine(lines) {
  const metaLine = [...lines].reverse().find((line) => /^meta:\s/.test(line));
  if (!metaLine) return null;
  const tokens = metaLine.replace(/^meta:\s*/, "").split(" · ").map((token) => token.trim()).filter(Boolean);
  const id = tokens.shift();
  if (!id) return null;
  const facts = { id, grants: [], requires: [] };
  for (const token of tokens) {
    if (/^api\s/.test(token) || /^sha256\b/.test(token)) continue;
    if (/^needs\s/.test(token)) facts.requires = token.replace(/^needs\s+/, "").split(", ").map((r) => r.trim()).filter(Boolean);
    else if (/^[\d.]+\s*[KMG]B$/i.test(token)) facts.size = token;
    else facts.grants.push(...token.split(",").map((g) => g.trim()).filter(Boolean));
  }
  return facts;
}
var KNOWN_CANONICAL = {
  "2gis": { id: "entinygram.2gis", name: "2GIS" },
  "calendar-system": { id: "entinygram.calendar-systems", name: "Calendar systems" },
  "calendar-systems": { id: "entinygram.calendar-systems", name: "Calendar systems" },
  "call-avatar": { id: "entinygram.call-avatar", name: "Call avatar" },
  "doc-viewer": { id: "entinygram.doc-viewer", name: "Doc Viewer" },
  "entinygram-sdk": { id: "entinygram.sdk", name: "entinyGram SDK" },
  "sdk": { id: "entinygram.sdk", name: "entinyGram SDK" },
  "text-animation": { id: "entinygram.text-animation", name: "Text Animation" },
  "yandex": { id: "entinygram.yandex", name: "Yandex" },
  "display-resize": { id: "user.display-resize", name: "Display Resize" },
  "hide-folder-tags": { id: "user.hide-folder-tags", name: "Hide Folder Tags" },
  "local-message-edit": { id: "user.local-message-edit", name: "Local Message Edit" }
};
function slugify(text2) {
  return text2.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function compareVersions(a, b) {
  const [coreA, preA] = a.split(/-(.+)/);
  const [coreB, preB] = b.split(/-(.+)/);
  const pa = (coreA ?? "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = (coreB ?? "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  if (preA === preB) return 0;
  if (preA === void 0) return 1;
  if (preB === void 0) return -1;
  return preA < preB ? -1 : 1;
}
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function parsePost(text2, entities, fileName, docSize) {
  const lines = text2.replace(/\u200b/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  const first = lines[0] ?? "";
  let facts = factsFromLink(entities) ?? factsFromLine(lines);
  if (!facts) {
    for (const entity of entities ?? []) {
      if (entity.url) {
        const hit = entity.url.match(/plugins\/dist\/([a-zA-Z0-9._-]+)\//);
        if (hit) {
          facts = { id: hit[1], grants: [], requires: [] };
          break;
        }
      }
    }
  }
  let rawName = "";
  let version = "1.0.0";
  const head = lines[0]?.match(/^\S+\s+(.+?)\s+[—-]\s+(\S+)$/);
  if (head) {
    rawName = head[1].trim();
    version = head[2].trim();
  } else {
    const vMatch = first.match(/\bv\.?\s*(\d+(?:\.\d+)+[a-z0-9.-]*)/i) ?? first.match(/[—–-]\s*v?(\d+(?:\.\d+)+[a-z0-9.-]*)/i) ?? first.match(/\bv(\d+(?:\.\d+)*)\b/i) ?? fileName?.match(/[-_.]v?(\d+(?:\.\d+)*(?:-[a-z0-9.-]+)?)\.inu\.js$/i);
    if (vMatch) version = vMatch[1];
    rawName = first.replace(/^[\p{Extended_Pictographic}\s]+/u, "").replace(/\s*\/\/.*$/, "").replace(/\s+by\s+@?[A-Za-z0-9_.-]+.*$/i, "").replace(/\s+[—–-]\s+.*$/, "").replace(/\s+v\.?\s*\d+.*$/i, "").trim();
  }
  const fClean = (fileName ?? "").replace(/\.inu\.js$/i, "").replace(/^(?:entinygram|user)[-_\s]+/i, "").replace(/[-_. ]v?\d+(?:\.\d+)*(?:-[a-z0-9.-]+)?$/i, "");
  const fSlug = slugify(fClean) || slugify((fileName ?? "").replace(/\.inu\.js$/i, ""));
  if (!rawName || rawName.length > 60) {
    rawName = fClean.replace(/[-_.]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || (fileName ?? "").replace(/\.inu\.js$/i, "");
  }
  const nSlug = slugify(rawName);
  const known = KNOWN_CANONICAL[nSlug] || KNOWN_CANONICAL[nSlug.replace(/^entinygram-/, "")] || (fSlug ? KNOWN_CANONICAL[fSlug] || KNOWN_CANONICAL[fSlug.replace(/^entinygram-/, "")] : void 0);
  const id = facts?.id || (known ? known.id : nSlug || fSlug || "plugin");
  const name = known ? known.name : rawName || fClean.replace(/[-_.]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Plugin";
  const author = lines.find((line) => /^author:\s/i.test(line))?.replace(/^author:\s*@?/, "") ?? first.match(/\bby\s+@?([A-Za-z0-9_.-]+)/i)?.[1] ?? (id.startsWith("entinygram.") ? "entinyGram" : void 0);
  const start = lines.findIndex((line) => /^author:\s/i.test(line)) + 1;
  const body = [];
  for (const line of lines.slice(Math.max(start, 1))) {
    if (/^(‼️|📦|💡|meta:)/.test(line)) break;
    body.push(line);
  }
  const notes = body.join("\n").trim() || text2.trim();
  const description = (body.find((line) => line.trim()) ?? lines.slice(1).find((line) => line.trim() && !/^(author|meta|upd):/i.test(line)) ?? "").replace(/^[-•]\s*/, "");
  const size = facts?.size ?? (typeof docSize === "number" && docSize > 0 ? formatFileSize(docSize) : void 0);
  const grants = facts?.grants ?? [];
  const requires = facts?.requires ?? [];
  return { id, name, version, author, description, notes, grants, requires, size };
}
function fileNameOf(message) {
  const doc = message.document;
  if (!doc) return null;
  if (doc.file_name) return doc.file_name;
  const attrs = doc.attributes;
  if (!attrs) return null;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    if (attr?._ === "documentAttributeFilename" && attr.file_name) return attr.file_name;
  }
  return null;
}
function isBundle(message) {
  return (fileNameOf(message) ?? "").toLowerCase().endsWith(".inu.js");
}
function isoDate(seconds) {
  return new Date(seconds * 1e3).toISOString().slice(0, 10);
}
function collect(channel, messages) {
  const byId = /* @__PURE__ */ new Map();
  for (const message of messages) byId.set(message.id, message);
  const plugins = /* @__PURE__ */ new Map();
  const bySlug = /* @__PURE__ */ new Map();
  const claimedBundles = /* @__PURE__ */ new Set();
  for (const message of messages) {
    let bundleMsg = null;
    let text2 = "";
    let entities;
    if (isBundle(message)) {
      bundleMsg = message;
      text2 = message.textWithEntities?.text?.trim() ?? "";
      entities = message.textWithEntities?.entities;
      if (!text2) {
        for (let prev = message.id - 1; prev >= message.id - 3 && !text2; prev--) {
          const candidate = byId.get(prev);
          if (candidate && !isBundle(candidate)) {
            text2 = candidate.textWithEntities?.text?.trim() ?? "";
            entities = candidate.textWithEntities?.entities;
          }
        }
      }
    } else {
      for (let next = message.id + 1; next <= message.id + 3 && !bundleMsg; next++) {
        const candidate = byId.get(next);
        if (candidate && isBundle(candidate)) {
          bundleMsg = candidate;
          text2 = message.textWithEntities?.text?.trim() ?? "";
          entities = message.textWithEntities?.entities;
        }
      }
    }
    if (!bundleMsg || claimedBundles.has(bundleMsg.id)) continue;
    const fileName = fileNameOf(bundleMsg);
    if (!fileName) continue;
    claimedBundles.add(bundleMsg.id);
    const docSize = bundleMsg.document?.size;
    const post = parsePost(text2, entities, fileName, docSize);
    if (!post) continue;
    const version = {
      version: post.version,
      date: isoDate(bundleMsg.date || message.date),
      notes: post.notes,
      file: channelFile(channel, bundleMsg.id),
      requires: post.requires,
      grants: post.grants,
      size: post.size
    };
    const slug = slugify(post.name) || slugify(fileName.replace(/\.inu\.js$/i, ""));
    let entry = plugins.get(post.id) || bySlug.get(slug);
    if (!entry) {
      entry = {
        id: post.id,
        name: post.name,
        author: post.author,
        description: post.description,
        versions: [version]
      };
      plugins.set(post.id, entry);
      bySlug.set(slug, entry);
    } else {
      if (post.id !== entry.id && (post.id.includes(".") || post.id.startsWith("user."))) {
        plugins.delete(entry.id);
        entry.id = post.id;
        plugins.set(post.id, entry);
      }
      if (!entry.author && post.author) entry.author = post.author;
      if (!entry.description && post.description) entry.description = post.description;
      if (!entry.versions.some((existing) => existing.version === version.version)) {
        entry.versions.push(version);
      }
    }
  }
  for (const entry of plugins.values()) {
    entry.versions.sort((a, b) => compareVersions(b.version, a.version));
  }
  return [...plugins.values()];
}
function readCache(channel) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + channel);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeCache(channel, plugins) {
  try {
    localStorage.setItem(CACHE_PREFIX + channel, JSON.stringify(plugins));
  } catch {
  }
}
function cachedChannel(channel) {
  return readCache(channel);
}
function forgetChannel(channel) {
  try {
    localStorage.removeItem(CACHE_PREFIX + channel);
  } catch {
  }
}
async function loadChannel(channel, force) {
  const account = inu.account();
  const peer = await account.resolvePeer(channel);
  const messages = [];
  for await (const message of account.iterHistory(peer, { limit: HISTORY_LIMIT, batchSize: 100, force })) messages.push(message);
  const plugins = collect(channel, messages);
  writeCache(channel, plugins);
  return plugins;
}
async function downloadBundle(channel, messageId) {
  const account = inu.account();
  const peer = await account.resolvePeer(channel);
  let message = await account.getMessages(peer, messageId);
  if (!message || message.id !== messageId || !isBundle(message)) {
    const [hist] = await account.getHistory(peer, { offsetId: messageId + 1, limit: 1 });
    if (hist && hist.id === messageId && isBundle(hist)) message = hist;
  }
  if (!message || message.id !== messageId || !isBundle(message)) throw new Error("the post is gone");
  const { path } = await account.downloadMediaToFile(message);
  return path;
}

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
      const [name, text2] = row2.split(FIELD_SEP);
      const slots = byText.get(text2) ?? [];
      slots.push(kebab(name.replace(/^Inu/, "")));
      byText.set(text2, slots);
    }
    if (ended) break;
  }
  return byText;
}
function slotsFor(text2) {
  const locale = localeKey();
  if (cached === null || cached.locale !== locale) cached = { locale, byText: build() };
  return cached.byText.get(text2) ?? [];
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
  const text2 = `${pluginId}:${rowId}`;
  let h = 5381;
  for (let i = 0; i < text2.length; i++) h = (h << 5) + h + text2.charCodeAt(i) | 0;
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
    const handler2 = registry.call("get", id);
    if (handler2 === null) continue;
    try {
      const meta = JSON.parse(String(handler2.call("apply", "meta", "")));
      out.push({ id, name: meta.name, placements: meta.placements ?? {}, handler: handler2 });
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
  const slotsAt = (text2) => text2 ? slotsFor(text2).map((s) => `${page2}.${s}`) : [];
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
    const [type, id, text2] = line.split(FIELD_SEP2);
    return { type: Number(type), id: Number(id), text: text2 ?? "" };
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
  const text2 = item === null ? null : item.getField("text");
  if (text2 === null) return [];
  const className = String(dumper.call("dump", fragment, emptyItems)).split(ROW_SEP2)[0];
  const page2 = pageIdOf(className.split("@")[0].split(".").pop() ?? "");
  return slotsFor(String(text2)).map((s) => `${page2}.${s}`);
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
function embeddedEntries() {
  return registrations().map((reg) => ({
    id: reg.id,
    name: reg.name,
    screen: (reg.placements.screen ?? []).length > 0,
    open: () => {
      reg.handler.call("apply", "open", "");
    }
  }));
}

// src/i18n.ts
function appLang() {
  try {
    const LocaleController2 = inu.jvm.cls("org.telegram.messenger.LocaleController");
    const short = String(LocaleController2.callStatic("getInstance").call("getCurrentLocaleInfo").getField("shortName")).toLowerCase();
    if (short.startsWith("uk")) return "uk";
    if (short.startsWith("ru")) return "ru";
    if (short.startsWith("fa")) return "fa";
  } catch {
  }
  try {
    const JLocale = inu.jvm.cls("java.util.Locale");
    const lang = String(JLocale.callStatic("getDefault").call("getLanguage")).toLowerCase();
    if (lang.startsWith("uk")) return "uk";
    if (lang.startsWith("ru")) return "ru";
    if (lang.startsWith("fa")) return "fa";
  } catch {
  }
  return "en";
}
var STRINGS = {
  filter_all: {
    uk: "Усі",
    ru: "Все",
    en: "All",
    fa: "همه"
  },
  filter_installed: {
    uk: "Встановлені",
    ru: "Установленные",
    en: "Installed",
    fa: "نصب‌شده"
  },
  filter_updates: {
    uk: "Оновлення",
    ru: "Обновления",
    en: "Updates",
    fa: "به‌روزرسانی‌ها"
  },
  search_title: {
    uk: "Пошук",
    ru: "Поиск",
    en: "Search",
    fa: "جستجو"
  },
  search_hint: {
    uk: "Назва, автор або опис",
    ru: "Название, автор или описание",
    en: "Name, author or description",
    fa: "نام، نویسنده یا توضیحات"
  },
  search_prompt_title: {
    uk: "Пошук плагінів",
    ru: "Поиск плагинов",
    en: "Search plugins",
    fa: "جستجوی پلاگین‌ها"
  },
  filter_title: {
    uk: "Показувати",
    ru: "Показывать",
    en: "Show",
    fa: "نمایش"
  },
  loading_catalog: {
    uk: "Завантаження плагінів…",
    ru: "Загрузка плагинов…",
    en: "Loading plugins…",
    fa: "در حال بارگذاری پلاگین‌ها…"
  },
  catalog_fail: {
    uk: "Не вдалося завантажити каталог: {0}",
    ru: "Не удалось загрузить каталог: {0}",
    en: "Could not load the catalog: {0}",
    fa: "بارگذاری کاتالوگ ناموفق بود: {0}"
  },
  unknown_error: {
    uk: "невідома помилка",
    ru: "неизвестная ошибка",
    en: "unknown error",
    fa: "خطای ناشناخته"
  },
  try_again: {
    uk: "Спробувати знову",
    ru: "Попробовать снова",
    en: "Try again",
    fa: "تلاش دوباره"
  },
  refresh_catalog: {
    uk: "Оновити каталог",
    ru: "Обновить каталог",
    en: "Refresh catalog",
    fa: "به‌روزرسانی کاتالوگ"
  },
  refreshing: {
    uk: "Оновлення…",
    ru: "Обновление…",
    en: "Refreshing…",
    fa: "در حال به‌روزرسانی…"
  },
  refreshing_sub: {
    uk: "Завантажуємо каталоги всіх джерел",
    ru: "Загружаем каталоги всех источников",
    en: "Fetching every source",
    fa: "دریافت اطلاعات همه منابع"
  },
  catalog_updated: {
    uk: "Каталог оновлено",
    ru: "Каталог обновлён",
    en: "Catalog updated",
    fa: "کاتالوگ به‌روزرسانی شد"
  },
  refresh_fail_title: {
    uk: "Не вдалося оновити каталог",
    ru: "Не удалось обновить каталог",
    en: "Could not refresh the catalog",
    fa: "به‌روزرسانی کاتالوگ ناموفق بود"
  },
  updated_at: {
    uk: "Оновлено: {0}",
    ru: "Обновлено: {0}",
    en: "Updated: {0}",
    fa: "به‌روزرسانی شده: {0}"
  },
  never_updated: {
    uk: "ще не оновлювався",
    ru: "ещё не обновлялся",
    en: "not updated yet",
    fa: "هنوز به‌روزرسانی نشده"
  },
  sec_updates: {
    uk: "Доступні оновлення",
    ru: "Доступны обновления",
    en: "Updates available",
    fa: "به‌روزرسانی‌های موجود"
  },
  sec_installed: {
    uk: "Встановлені",
    ru: "Установленные",
    en: "Installed",
    fa: "نصب‌شده"
  },
  sec_available: {
    uk: "Доступні",
    ru: "Доступные",
    en: "Available",
    fa: "موجود"
  },
  empty_search: {
    uk: "Нічого не знайдено за запитом",
    ru: "Ничего не найдено по запросу",
    en: "Nothing matches the search",
    fa: "موردی مطابق جستجو یافت نشد"
  },
  empty_list: {
    uk: "Тут поки нічого немає",
    ru: "Здесь пока ничего нет",
    en: "Nothing here yet",
    fa: "هنوز چیزی در اینجا وجود ندارد"
  },
  status_installed: {
    uk: "Встановлено",
    ru: "Установлено",
    en: "Installed",
    fa: "نصب شده"
  },
  status_latest: {
    uk: "Остання",
    ru: "Последняя",
    en: "Latest",
    fa: "آخرین نسخه"
  },
  about: {
    uk: "Про плагін",
    ru: "О плагине",
    en: "About",
    fa: "درباره پلاگین"
  },
  no_desc: {
    uk: "Опис відсутній.",
    ru: "Описание отсутствует.",
    en: "No description provided.",
    fa: "توضیحی ارائه نشده است."
  },
  created_by: {
    uk: "Автор: {0}",
    ru: "Автор: {0}",
    en: "Created by {0}",
    fa: "ایجاد شده توسط {0}"
  },
  source_official: {
    uk: "entinyGram",
    ru: "entinyGram",
    en: "entinyGram",
    fa: "entinyGram"
  },
  source_user: {
    uk: "Користувацький репозиторій",
    ru: "Пользовательский репозиторий",
    en: "User repository",
    fa: "مخزن کاربران"
  },
  source_official_desc: {
    uk: "Офіційні плагіни entinyGram",
    ru: "Официальные плагины entinyGram",
    en: "Official entinyGram plugins",
    fa: "پلاگین‌های رسمی entinyGram"
  },
  source_user_desc: {
    uk: "Плагіни з користувацького репозиторію",
    ru: "Плагины из пользовательского репозитория",
    en: "Plugins from the user repository",
    fa: "پلاگین‌های مخزن کاربران"
  },
  source_official_msg: {
    uk: "Плагін опубліковано в офіційному каталозі entinyGram.",
    ru: "Плагин опубликован в официальном каталоге entinyGram.",
    en: "This plugin is published in the official entinyGram catalog.",
    fa: "این پلاگین در کاتالوگ رسمی entinyGram منتشر شده است."
  },
  source_user_msg: {
    uk: "Плагін опубліковано в користувацькому репозиторії спільноти.",
    ru: "Плагин опубликован в пользовательском репозитории сообщества.",
    en: "This plugin is published in the community user repository.",
    fa: "این پلاگین در مخزن کاربران جامعه منتشر شده است."
  },
  about_desc: {
    uk: "Опис",
    ru: "Описание",
    en: "Description",
    fa: "توضیحات"
  },
  about_author: {
    uk: "Автор",
    ru: "Автор",
    en: "Author",
    fa: "نویسنده"
  },
  about_source: {
    uk: "Джерело",
    ru: "Источник",
    en: "Source",
    fa: "منبع"
  },
  about_id: {
    uk: "ID плагіна",
    ru: "ID плагина",
    en: "Plugin ID",
    fa: "شناسه پلاگین"
  },
  about_requires: {
    uk: "Залежності",
    ru: "Зависимости",
    en: "Requires",
    fa: "پیش‌نیازها"
  },
  unknown_author: {
    uk: "Невідомий автор",
    ru: "Неизвестный автор",
    en: "Unknown author",
    fa: "نویسنده ناشناس"
  },
  published_date: {
    uk: "Опубліковано: {0}",
    ru: "Опубликовано: {0}",
    en: "Published {0}",
    fa: "منتشر شده: {0}"
  },
  id_copied: {
    uk: "ID плагіна скопійовано",
    ru: "ID плагина скопирован",
    en: "Plugin ID copied",
    fa: "شناسه پلاگین کپی شد"
  },
  installation: {
    uk: "Встановлення",
    ru: "Установка",
    en: "Installation",
    fa: "نصب"
  },
  btn_install: {
    uk: "Встановити v{0}",
    ru: "Установить v{0}",
    en: "Install v{0}",
    fa: "نصب v{0}"
  },
  btn_update: {
    uk: "Оновити до v{0}",
    ru: "Обновить до v{0}",
    en: "Update to v{0}",
    fa: "به‌روزرسانی به v{0}"
  },
  btn_reinstall: {
    uk: "Перевстановити",
    ru: "Переустановить",
    en: "Reinstall",
    fa: "نصب مجدد"
  },
  btn_downgrade: {
    uk: "Понизити версію",
    ru: "Понизить версию",
    en: "Downgrade",
    fa: "بازگشت به نسخه قبل"
  },
  needs_deps: {
    uk: "Потрібно: {0}",
    ru: "Требуется: {0}",
    en: "Needs {0}",
    fa: "نیاز به: {0}"
  },
  installed_ver: {
    uk: "Встановлено: v{0}",
    ru: "Установлено: v{0}",
    en: "Installed: v{0}",
    fa: "نصب‌شده: v{0}"
  },
  btn_remove: {
    uk: "Видалити плагін",
    ru: "Удалить плагин",
    en: "Remove plugin",
    fa: "حذف پلاگین"
  },
  installed_ver_sub: {
    uk: "Встановлена версія: v{0}",
    ru: "Установленная версия: v{0}",
    en: "Installed version: v{0}",
    fa: "نسخه نصب‌شده: v{0}"
  },
  remove_title: {
    uk: "Видалити {0}?",
    ru: "Удалить {0}?",
    en: "Remove {0}?",
    fa: "حذف {0}؟"
  },
  remove_msg: {
    uk: "Плагін та збережені ним дані буде видалено з цього пристрою.",
    ru: "Плагин и его сохранённые данные будут удалены с этого устройства.",
    en: "The plugin and its stored data will be removed from this device.",
    fa: "پلاگین و داده‌های ذخیره‌شده آن از این دستگاه حذف خواهند شد."
  },
  remove_confirm: {
    uk: "Видалити",
    ru: "Удалить",
    en: "Remove",
    fa: "حذف"
  },
  cancel: {
    uk: "Скасувати",
    ru: "Отмена",
    en: "Cancel",
    fa: "لغو"
  },
  remove_unavail_title: {
    uk: "Видалення недоступне",
    ru: "Удаление недоступно",
    en: "Removal unavailable",
    fa: "حذف در دسترس نیست"
  },
  remove_unavail_msg: {
    uk: "Ця збірка додатку ще не підтримує видалення через маркетплейс. Видаліть плагін через Налаштування → Плагіни.",
    ru: "Эта сборка приложения ещё не поддерживает удаление через маркетплейс. Удалите плагин через Настройки → Плагины.",
    en: "This app build does not expose plugin removal to the marketplace yet. Remove it from Settings → Plugins.",
    fa: "این نسخه برنامه هنوز از حذف از طریق فروشگاه پشتیبانی نمی‌کند. پلاگین را از بخش تنظیمات ← پلاگین‌ها حذف کنید."
  },
  ok: {
    uk: "OK",
    ru: "OK",
    en: "OK",
    fa: "تأیید"
  },
  history: {
    uk: "Історія версій",
    ru: "История версий",
    en: "Version history",
    fa: "تاریخچه نسخه‌ها"
  },
  confirm_install_ver: {
    uk: "Встановити цю версію?",
    ru: "Установить эту версию?",
    en: "Install this version?",
    fa: "این نسخه نصب شود؟"
  },
  published_versions: {
    uk: "{0} опублікованих версій",
    ru: "{0} опубликованных версий",
    en: "{0} published versions",
    fa: "{0} نسخه منتشر شده"
  },
  install_file_title: {
    uk: "Встановлення з файлу",
    ru: "Установка из файла",
    en: "Install from file",
    fa: "نصب از فایل"
  },
  install_file_msg: {
    uk: "Посилання на завантаження скопійовано. Збережіть файл, потім відкрийте Налаштування → Плагіни → Завантажити з файлу та оберіть його.",
    ru: "Ссылка на скачивание скопирована. Сохраните файл, затем откройте Настройки → Плагины → Загрузить из файла и выберите его.",
    en: "The download link is copied. Save the file, then open Settings → Plugins → Load from file and pick it.",
    fa: "لینک دانلود کپی شد. فایل را ذخیره کنید، سپس از تنظیمات ← پلاگین‌ها ← بارگذاری از فایل آن را انتخاب کنید."
  },
  open_link: {
    uk: "Відкрити посилання",
    ru: "Открыть ссылку",
    en: "Open link",
    fa: "باز کردن لینک"
  },
  close: {
    uk: "Закрити",
    ru: "Закрыть",
    en: "Close",
    fa: "بستن"
  },
  footer_info: {
    uk: "entinyGram SDK {0}, вбудовування налаштувань {1}{2}. Плагіни надходять з активних джерел; кожне встановлення запитує підтвердження",
    ru: "entinyGram SDK {0}, встраивание настроек {1}{2}. Плагины поступают из активных источников; каждая установка запрашивает подтверждение",
    en: "entinyGram SDK {0}, settings embedding {1}{2}. Plugins come from your active sources; every install asks for confirmation",
    fa: "SDK entinyGram نسخه {0}، جاسازی تنظیمات {1}{2}. پلاگین‌ها از منابع فعال شما می‌آیند؛ هر نصب نیاز به تأیید دارد"
  },
  standalone_mode: {
    uk: ", автономний режим (встановлення через файл)",
    ru: ", автономный режим (установка через файл)",
    en: ", standalone mode (installing goes through a file)",
    fa: "، حالت مستقل (نصب از طریق فایل صورت می‌گیرد)"
  },
  source_channel: {
    uk: "Спільнота (Telegram)",
    ru: "Сообщество (Telegram)",
    en: "Community (Telegram)",
    fa: "جامعه (تلگرام)"
  },
  source_channel_desc: {
    uk: "Плагіни з каналу {0}",
    ru: "Плагины из канала {0}",
    en: "Plugins from the {0} channel",
    fa: "پلاگین‌ها از کانال {0}"
  },
  source_channel_msg: {
    uk: "Плагін опубліковано в Telegram-каналі {0}. Його читає ваш клієнт напряму, без стороннього сервера.",
    ru: "Плагин опубликован в Telegram-канале {0}. Его читает ваш клиент напрямую, без стороннего сервера.",
    en: "This plugin is published in the {0} Telegram channel. Your client reads it directly, no third-party server involved.",
    fa: "این پلاگین در کانال تلگرام {0} منتشر شده است. کلاینت شما آن را مستقیماً و بدون سرور واسط می‌خواند."
  },
  sources_title: {
    uk: "Джерела",
    ru: "Источники",
    en: "Sources",
    fa: "منابع"
  },
  sources_sub: {
    uk: "Активно {0} з {1}",
    ru: "Активно {0} из {1}",
    en: "{0} of {1} active",
    fa: "{0} از {1} فعال است"
  },
  sources_footer: {
    uk: "Канал читається через ваш обліковий запис Telegram. Тримайте довгий тап на доданому каналі, щоб прибрати його",
    ru: "Канал читается через ваш аккаунт Telegram. Удерживайте добавленный канал, чтобы убрать его",
    en: "A channel is read through your own Telegram account. Long-press an added channel to remove it",
    fa: "کانال از طریق حساب تلگرام خودتان خوانده می‌شود. برای حذف یک کانال افزوده شده، روی آن لمس طولانی کنید"
  },
  source_add: {
    uk: "Додати канал",
    ru: "Добавить канал",
    en: "Add a channel",
    fa: "افزودن کانال"
  },
  source_add_sub: {
    uk: "@канал або посилання t.me",
    ru: "@канал или ссылка t.me",
    en: "@channel or a t.me link",
    fa: "کانال@ یا پیوند t.me"
  },
  source_add_title: {
    uk: "Канал із плагінами",
    ru: "Канал с плагинами",
    en: "Plugin channel",
    fa: "کانال پلاگین‌ها"
  },
  source_add_bad: {
    uk: "Це не схоже на публічний канал",
    ru: "Это не похоже на публичный канал",
    en: "That does not look like a public channel",
    fa: "این یک کانال عمومی معتبر به نظر نمی‌رسد"
  },
  source_add_warn_title: {
    uk: "Додати {0}?",
    ru: "Добавить {0}?",
    en: "Add {0}?",
    fa: "{0} افزوده شود؟"
  },
  source_add_warn_msg: {
    uk: "Канал не перевіряється entinyGram. Плагіни можуть містити небезпечний код. Додавайте лише канали, яким довіряєте.",
    ru: "Канал не проверяется entinyGram. Плагины могут содержать опасный код. Добавляйте только каналы, которым доверяете.",
    en: "entinyGram does not vet this channel. Its plugins may contain unsafe code. Only add channels you trust.",
    fa: "این کانال توسط entinyGram بررسی نشده است. پلاگین‌ها ممکن است حاوی کدهای ناامن باشند. فقط کانال‌های مورد اعتماد را اضافه کنید."
  },
  source_add_confirm: {
    uk: "Додати",
    ru: "Добавить",
    en: "Add",
    fa: "افزودن"
  },
  source_added: {
    uk: "Джерело додано",
    ru: "Источник добавлен",
    en: "Source added",
    fa: "منبع اضافه شد"
  },
  source_exists: {
    uk: "Це джерело вже є",
    ru: "Этот источник уже есть",
    en: "That source is already added",
    fa: "این منبع از قبل اضافه شده است"
  },
  source_empty: {
    uk: "У каналі немає плагінів (.inu.js)",
    ru: "В канале нет плагинов (.inu.js)",
    en: "No plugins (.inu.js) found in that channel",
    fa: "هیچ پلاگینی (.inu.js) در این کانال یافت نشد"
  },
  source_remove_title: {
    uk: "Прибрати {0}?",
    ru: "Убрать {0}?",
    en: "Remove {0}?",
    fa: "{0} حذف شود؟"
  },
  source_remove_msg: {
    uk: "Канал зникне зі списку джерел. Вже встановлені плагіни залишаться.",
    ru: "Канал исчезнет из списка источников. Уже установленные плагины останутся.",
    en: "The channel leaves your sources. Plugins you already installed stay.",
    fa: "کانال از لیست منابع شما حذف خواهد شد. پلاگین‌هایی که قبلاً نصب کرده‌اید باقی می‌مانند."
  },
  source_count: {
    uk: "{0} плагінів",
    ru: "{0} плагинов",
    en: "{0} plugins",
    fa: "{0} پلاگین"
  },
  source_off: {
    uk: "вимкнено",
    ru: "отключено",
    en: "off",
    fa: "غیرفعال"
  },
  source_failed: {
    uk: "помилка: {0}",
    ru: "ошибка: {0}",
    en: "failed: {0}",
    fa: "خطا: {0}"
  },
  source_loading: {
    uk: "завантаження…",
    ru: "загрузка…",
    en: "loading…",
    fa: "در حال بارگذاری…"
  },
  source_filter: {
    uk: "Джерело",
    ru: "Источник",
    en: "Source",
    fa: "منبع"
  },
  source_all: {
    uk: "Усі джерела",
    ru: "Все источники",
    en: "All sources",
    fa: "همه منابع"
  },
  perms: {
    uk: "Дозволи",
    ru: "Разрешения",
    en: "Permissions",
    fa: "دسترسی‌ها"
  },
  perms_footer: {
    uk: "⚠ позначає небезпечні дозволи: плагін отримує повний доступ до застосунку",
    ru: "⚠ отмечает опасные разрешения: плагин получает полный доступ к приложению",
    en: "⚠ marks unsafe permissions: the plugin gets full access to the app",
    fa: "علامت ⚠ دسترسی‌های ناامن را مشخص می‌کند: پلاگین دسترسی کامل به برنامه را دریافت می‌کند"
  },
  perm_jvm: {
    uk: "Повний доступ до коду застосунку",
    ru: "Полный доступ к коду приложения",
    en: "Full access to the app code",
    fa: "دسترسی کامل به کدهای برنامه"
  },
  perm_xposed: {
    uk: "Підміна методів застосунку",
    ru: "Подмена методов приложения",
    en: "Hooks app methods",
    fa: "تغییر و رهگیری توابع برنامه"
  },
  perm_fetch: {
    uk: "Доступ до мережі",
    ru: "Доступ к сети",
    en: "Network access",
    fa: "دسترسی به شبکه"
  },
  perm_fs: {
    uk: "Доступ до файлів",
    ru: "Доступ к файлам",
    en: "File access",
    fa: "دسترسی به فایل‌ها"
  },
  perm_account: {
    uk: "Читання даних акаунта",
    ru: "Чтение данных аккаунта",
    en: "Reads account data",
    fa: "خواندن اطلاعات حساب کاربری"
  },
  perm_other: {
    uk: "Додатковий дозвіл",
    ru: "Дополнительное разрешение",
    en: "Extra permission",
    fa: "دسترسی اضافی"
  },
  trust_title: {
    uk: "Встановити з {0}?",
    ru: "Установить из {0}?",
    en: "Install from {0}?",
    fa: "نصب از {0}؟"
  },
  trust_msg: {
    uk: "Це джерело не перевіряється entinyGram.\nЗапитані дозволи: {0}\n\nВстановлюйте, лише якщо довіряєте автору.",
    ru: "Этот источник не проверяется entinyGram.\nЗапрошенные разрешения: {0}\n\nУстанавливайте, только если доверяете автору.",
    en: "entinyGram does not vet this source.\nPermissions asked: {0}\n\nInstall only if you trust the author.",
    fa: "این منبع توسط entinyGram بازبینی نشده است.\nدسترسی‌های درخواست شده: {0}\n\nفقط در صورتی نصب کنید که به نویسنده اطمینان دارید."
  },
  trust_none: {
    uk: "не вказано",
    ru: "не указаны",
    en: "not listed",
    fa: "ذکر نشده"
  },
  download_failed: {
    uk: "Не вдалося завантажити: {0}",
    ru: "Не удалось скачать: {0}",
    en: "Download failed: {0}",
    fa: "دانلود ناموفق بود: {0}"
  },
  channel_install_old: {
    uk: "Ця збірка застосунку ще не вміє ставити плагіни з каналів. Оновіть entinyGram.",
    ru: "Эта сборка приложения ещё не умеет ставить плагины из каналов. Обновите entinyGram.",
    en: "This app build cannot install plugins from channels yet. Update entinyGram.",
    fa: "این نسخه از برنامه هنوز قابلیت نصب پلاگین از کانال‌ها را ندارد. لطفاً entinyGram را به‌روزرسانی کنید."
  },
  channel_install_standalone: {
    uk: "Встановлення з каналу працює лише в entinyGram.",
    ru: "Установка из канала работает только в entinyGram.",
    en: "Installing from a channel works only in entinyGram.",
    fa: "نصب از کانال فقط در entinyGram کار می‌کند."
  },
  size_label: {
    uk: "Розмір",
    ru: "Размер",
    en: "Size",
    fa: "اندازه"
  },
  open_post: {
    uk: "Пост у каналі",
    ru: "Пост в канале",
    en: "Channel post",
    fa: "پست در کانال"
  },
  tab_title: {
    uk: "Розділ",
    ru: "Раздел",
    en: "Section",
    fa: "بخش"
  },
  tab_home: {
    uk: "🏠 Головна",
    ru: "🏠 Главная",
    en: "🏠 Home",
    fa: "🏠 خانه"
  },
  tab_plugins: {
    uk: "🧩 Плагіни",
    ru: "🧩 Плагины",
    en: "🧩 Plugins",
    fa: "🧩 پلاگین‌ها"
  },
  tab_settings: {
    uk: "⚙️ Налаштування",
    ru: "⚙️ Настройки",
    en: "⚙️ Settings",
    fa: "⚙️ تنظیمات"
  },
  home_summary: {
    uk: "{0} плагінів у каталозі · {1} встановлено",
    ru: "{0} плагинов в каталоге · {1} установлено",
    en: "{0} plugins in the catalog · {1} installed",
    fa: "{0} پلاگین در کاتالوگ · {1} نصب شده"
  },
  home_summary_sub: {
    uk: "Торкніться, щоб відкрити каталог",
    ru: "Нажмите, чтобы открыть каталог",
    en: "Tap to open the catalog",
    fa: "برای باز کردن کاتالوگ ضربه بزنید"
  },
  home_updates: {
    uk: "Оновлення · {0}",
    ru: "Обновления · {0}",
    en: "Updates · {0}",
    fa: "به‌روزرسانی‌ها · {0}"
  },
  home_new: {
    uk: "Нове в каталозі",
    ru: "Новое в каталоге",
    en: "New in the catalog",
    fa: "جدید در کاتالوگ"
  },
  home_all_current: {
    uk: "Усе встановлене актуальне",
    ru: "Всё установленное актуально",
    en: "Everything you installed is up to date",
    fa: "همه پلاگین‌های نصب‌شده به‌روز هستند"
  },
  home_more: {
    uk: "Усі плагіни",
    ru: "Все плагины",
    en: "All plugins",
    fa: "همه پلاگین‌ها"
  },
  settings_entries: {
    uk: "Записи плагінів",
    ru: "Записи плагинов",
    en: "Plugin entries",
    fa: "ورودی‌های پلاگین"
  },
  settings_entries_footer: {
    uk: "Плагіни, що додають власні розділи в налаштування застосунку",
    ru: "Плагины, добавляющие собственные разделы в настройки приложения",
    en: "Plugins that add their own sections to the app settings",
    fa: "پلاگین‌هایی که بخش‌های خود را به تنظیمات برنامه اضافه می‌کنند"
  },
  entry_open: {
    uk: "Відкрити налаштування плагіна",
    ru: "Открыть настройки плагина",
    en: "Open the plugin settings",
    fa: "باز کردن تنظیمات پلاگین"
  },
  entry_inline: {
    uk: "Вбудовано в налаштування застосунку",
    ru: "Встроено в настройки приложения",
    en: "Built into the app settings",
    fa: "تعبیه‌شده در تنظیمات برنامه"
  },
  entry_none: {
    uk: "Жоден плагін ще не додає записів",
    ru: "Ни один плагин пока не добавляет записи",
    en: "No plugin adds entries yet",
    fa: "هنوز هیچ پلاگینی ورودی اضافه نکرده است"
  },
  settings_installed: {
    uk: "Встановлені плагіни",
    ru: "Установленные плагины",
    en: "Installed plugins",
    fa: "پلاگین‌های نصب‌شده"
  },
  status_off: {
    uk: "Вимкнено",
    ru: "Отключено",
    en: "Off",
    fa: "خاموش"
  },
  settings_about: {
    uk: "Про SDK",
    ru: "О SDK",
    en: "About the SDK",
    fa: "درباره SDK"
  },
  settings_about_sub: {
    uk: "Версія {0}, вбудовування {1}",
    ru: "Версия {0}, встраивание {1}",
    en: "Version {0}, embedding {1}",
    fa: "نسخه {0}، تعبیه‌سازی {1}"
  },
  settings_installed_sub: {
    uk: "Встановлено {0} · оновлень: {1}",
    ru: "Установлено {0} · обновлений: {1}",
    en: "{0} installed · {1} updates",
    fa: "{0} نصب‌شده · {1} به‌روزرسانی"
  },
  settings_entries_sub: {
    uk: "Плагінів із власними розділами: {0}",
    ru: "Плагинов с собственными разделами: {0}",
    en: "{0} plugins add their own sections",
    fa: "{0} پلاگین بخش‌های اختصاصی اضافه می‌کنند"
  },
  home_title: {
    uk: "Маркетплейс",
    ru: "Маркетплейс",
    en: "Marketplace",
    fa: "فروشگاه"
  },
  home_stats: {
    uk: "Встановлено {0} · оновлень {1} · у каталозі {2}",
    ru: "Установлено {0} · обновлений {1} · в каталоге {2}",
    en: "{0} installed · {1} updates · {2} in the catalog",
    fa: "{0} نصب‌شده · {1} به‌روزرسانی · {2} در کاتالوگ"
  },
  home_recent: {
    uk: "Нещодавно оновлені",
    ru: "Недавно обновлённые",
    en: "Recently updated",
    fa: "اخیراً به‌روزرسانی شده"
  },
  show_all: {
    uk: "Показати всі ({0})",
    ru: "Показать все ({0})",
    en: "Show all ({0})",
    fa: "نمایش همه ({0})"
  },
  about_channel: {
    uk: "Канал із плагінами",
    ru: "Канал с плагинами",
    en: "Channel with plugins",
    fa: "کانال پلاگین‌ها"
  },
  catalog_count: {
    uk: "{0} плагінів у {1} джерелах",
    ru: "{0} плагинов в {1} источниках",
    en: "{0} plugins in {1} sources",
    fa: "{0} پلاگین در {1} منبع"
  }
};
function t(key) {
  const l = appLang();
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[l] ?? entry.en;
}
function tf(key, ...args) {
  let str = t(key);
  for (let i = 0; i < args.length; i++) {
    str = str.replace(new RegExp(`\\{${i}\\}`, "g"), String(args[i]));
  }
  return str;
}

// src/icons/home.svg
var home_default = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z"/></svg>\n';

// src/icons/plugins.svg
var plugins_default = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.7 2.7 0 0 1 0 5.4H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.7 2.7 0 0 1 5.4 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/></svg>\n';

// src/icons/settings.svg
var settings_default = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.07.63-.07.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.22.37.29.61.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.49 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>\n';

// src/navbar.ts
var BAR_TAG = "entiny.navbar";
var TAB_TAG = "entiny.tab:";
var LINE_TAG = "entiny.navbar.line";
var FADE_DELAY_MS = 90;
var FADE_MS = 180;
var BAR_DP = 56;
var ICON_DP = 24;
var ATTACH_RETRY_MS = 40;
var ATTACH_TRIES = 25;
var ready = false;
var pending = false;
var tries = 0;
var painted = -1;
var listRef = null;
var barHeight = 0;
var spec = null;
var mainHandler2;
function navbarReady() {
  return ready;
}
function handler() {
  if (!mainHandler2) {
    const Handler = inu.jvm.cls("android.os.Handler");
    const Looper = inu.jvm.cls("android.os.Looper");
    mainHandler2 = new Handler(Looper.callStatic("getMainLooper"));
  }
  return mainHandler2;
}
function text(value) {
  return typeof value === "string" ? value : value === null ? "" : String(value.call("toString"));
}
function color(key) {
  const Theme = inu.jvm.cls("org.telegram.ui.ActionBar.Theme");
  return Theme.callStatic("getColor(I)I", Theme.getStaticField(key));
}
function isList(view) {
  try {
    view.call("getAdapter");
    view.call("getLayoutManager");
    return true;
  } catch {
    return false;
  }
}
function findList(view, depth = 0) {
  if (isList(view)) return view;
  if (depth > 3) return null;
  let count = 0;
  try {
    count = view.call("getChildCount");
  } catch {
    return null;
  }
  for (let i = 0; i < count; i++) {
    const found = findList(view.call("getChildAt", i), depth + 1);
    if (found) return found;
  }
  return null;
}
function softSwap(tab2) {
  const list = findList(tab2.call("getParent").call("getParent"));
  if (!list) return;
  list.call("scrollToPosition", 0);
  handler().call("postDelayed", inu.jvm.runnable(() => {
    try {
      list.call("scrollToPosition", 0);
    } catch {
    }
  }), FADE_DELAY_MS);
  list.call("setAlpha", 0);
  list.call("animate").call("alpha", 1).call("setDuration", FADE_MS).call("setStartDelay", FADE_DELAY_MS).call("start");
}
function reserveSpace(list, height) {
  try {
    const params = list.call("getLayoutParams");
    if (Number(params.getField("bottomMargin")) === height) return;
    params.setField("bottomMargin", height);
    list.call("setLayoutParams", params);
  } catch (e) {
    console.log("navbar: could not reserve space", e);
  }
}
function paint(bar, current) {
  painted = current.selected();
  const active = color("key_windowBackgroundWhiteBlueText4");
  const idle = color("key_windowBackgroundWhiteGrayText2");
  const selected = current.selected();
  const count = bar.call("getChildCount");
  for (let i = 0; i < count; i++) {
    const tab2 = bar.call("getChildAt", i);
    if (text(tab2.call("getTag")) === BAR_TAG) continue;
    const index = Number(text(tab2.call("getTag")).slice(TAB_TAG.length));
    const tint = index === selected ? active : idle;
    const icon = tab2.call("getChildAt", 0);
    try {
      icon.call("setColorFilter", tint);
    } catch {
      icon.call("setTextColor", tint);
    }
    tab2.call("getChildAt", 1).call("setTextColor", tint);
    tab2.call("setAlpha", index === selected ? 1 : 0.85);
  }
}
function pictogram(context, tab2, px) {
  try {
    const size = px(ICON_DP);
    const bitmap = inu.jvm.cls("org.telegram.messenger.SvgHelper").callStatic("getBitmap", tab2.svg.replace(/currentColor/g, "#ffffff"), size, size, true);
    if (bitmap) {
      const view = new (inu.jvm.cls("android.widget.ImageView"))(context);
      view.call("setImageBitmap", bitmap);
      return view;
    }
  } catch (e) {
    console.log("navbar: svg icon failed", e);
  }
  const fallback = new (inu.jvm.cls("android.widget.TextView"))(context);
  fallback.call("setText", tab2.emoji);
  fallback.call("setTextSize", 2, 18);
  fallback.call("setGravity", 17);
  return fallback;
}
function build3(context, current, px, navigationInset) {
  const LinearLayout = inu.jvm.cls("android.widget.LinearLayout");
  const TextView = inu.jvm.cls("android.widget.TextView");
  const LinearParams = inu.jvm.cls("android.widget.LinearLayout$LayoutParams");
  const OnClick = inu.jvm.cls("android.view.View$OnClickListener");
  const Listener = inu.jvm.defineClass({
    interfaces: [OnClick],
    methods: {
      onClick: (_self, view) => {
        const tag = text(view.call("getTag"));
        if (!tag.startsWith(TAB_TAG)) return;
        const index = Number(tag.slice(TAB_TAG.length));
        if (index === current.selected()) return;
        try {
          softSwap(view);
        } catch (e) {
          console.log("navbar: soft swap skipped", e);
        }
        current.onSelect(index);
        try {
          paint(view.call("getParent"), current);
        } catch {
        }
      }
    }
  });
  const listener = new Listener();
  const bar = new LinearLayout(context);
  bar.call("setOrientation", 0);
  bar.call("setTag", BAR_TAG);
  bar.call("setBackgroundColor", color("key_windowBackgroundWhite"));
  bar.call("setPadding", 0, 0, 0, navigationInset);
  current.tabs().forEach((tabSpec, index) => {
    const tab2 = new LinearLayout(context);
    tab2.call("setOrientation", 1);
    tab2.call("setGravity", 17);
    tab2.call("setTag", TAB_TAG + index);
    tab2.call("setOnClickListener", listener);
    const icon = pictogram(context, tabSpec, px);
    const label = new TextView(context);
    label.call("setText", tabSpec.label);
    label.call("setTextSize", 2, 11);
    label.call("setGravity", 17);
    label.call("setSingleLine", true);
    tab2.call("addView", icon, new LinearParams(px(ICON_DP), px(ICON_DP)));
    tab2.call("addView", label, new LinearParams(-2, -2));
    bar.call("addView", tab2, new LinearParams(0, -1, 1));
  });
  return bar;
}
function attach() {
  const current = spec;
  if (!current) return true;
  const LaunchActivity = inu.jvm.cls("org.telegram.ui.LaunchActivity");
  const fragment = LaunchActivity.callStatic("getSafeLastFragment");
  if (!fragment) return false;
  if (text(fragment.call("getTitle")) !== current.title) return false;
  const root = fragment.call("getFragmentView");
  if (!root) return false;
  const existing = root.call("findViewWithTag", BAR_TAG);
  if (existing) {
    if (listRef) reserveSpace(listRef, barHeight);
    if (painted !== current.selected()) paint(existing, current);
    return true;
  }
  const context = root.call("getContext");
  const density = context.call("getResources").call("getDisplayMetrics").getField("density");
  const px = (dp) => Math.round(dp * density);
  let navigationInset = 0;
  try {
    navigationInset = Number(inu.jvm.cls("org.telegram.messenger.AndroidUtilities").getStaticField("navigationBarHeight")) || 0;
  } catch {
  }
  const bar = build3(context, current, px, navigationInset);
  const FrameParams = inu.jvm.cls("android.widget.FrameLayout$LayoutParams");
  root.call("addView", bar, new FrameParams(-1, px(BAR_DP) + navigationInset, 80));
  const line = new (inu.jvm.cls("android.view.View"))(context);
  line.call("setBackgroundColor", color("key_divider"));
  line.call("setTag", LINE_TAG);
  const lineParams = new FrameParams(-1, 1, 80);
  lineParams.call("setMargins", 0, 0, 0, px(BAR_DP) + navigationInset);
  root.call("addView", line, lineParams);
  const list = findList(root);
  barHeight = px(BAR_DP) + navigationInset;
  listRef = list;
  if (list) {
    try {
      list.call("setItemAnimator", null);
    } catch {
    }
    reserveSpace(list, barHeight);
  }
  paint(bar, current);
  if (!ready) {
    ready = true;
    current.onReady();
  }
  return true;
}
function schedule(delay) {
  pending = true;
  try {
    handler().call("postDelayed", inu.jvm.runnable(() => {
      pending = false;
      let done = true;
      try {
        done = attach();
      } catch (e) {
        console.log("navbar: not attached", e);
      }
      if (!done && ++tries < ATTACH_TRIES) schedule(ATTACH_RETRY_MS);
    }), delay);
  } catch (e) {
    pending = false;
    console.log("navbar: unavailable", e);
  }
}
function ensureNavbar(next) {
  spec = next;
  if (pending) return;
  tries = 0;
  schedule(ready ? 0 : ATTACH_RETRY_MS);
}

// src/sources.ts
var STORE = "entiny.sources";
var DEFAULT_CHANNEL = "entinyGramPlugins";
var readRaw;
var readSaved = { added: [], off: [] };
function read() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw === readRaw) return readSaved;
    const saved = JSON.parse(raw ?? "{}");
    readRaw = raw;
    readSaved = { added: Array.isArray(saved.added) ? saved.added : [], off: Array.isArray(saved.off) ? saved.off : [] };
  } catch {
    readRaw = void 0;
    readSaved = { added: [], off: [] };
  }
  return readSaved;
}
function write(saved) {
  try {
    localStorage.setItem(STORE, JSON.stringify(saved));
  } catch {
  }
  readRaw = void 0;
}
var channelKey = (channel) => `channel:${channel.toLowerCase()}`;
function listSources() {
  const saved = read();
  const all = [
    { key: "official", kind: "official", builtin: true, enabled: true },
    { key: "user", kind: "user", builtin: true, enabled: true },
    { key: channelKey(DEFAULT_CHANNEL), kind: "channel", channel: DEFAULT_CHANNEL, builtin: true, enabled: true },
    ...saved.added.map((channel) => ({ key: channelKey(channel), kind: "channel", channel, builtin: false, enabled: true }))
  ];
  return all.map((source) => ({ ...source, enabled: !saved.off.includes(source.key) }));
}
function setEnabled(key, enabled) {
  const saved = read();
  saved.off = enabled ? saved.off.filter((k) => k !== key) : [.../* @__PURE__ */ new Set([...saved.off, key])];
  write(saved);
}
function addChannel(channel) {
  const saved = read();
  if (listSources().some((source) => source.key === channelKey(channel))) return false;
  saved.added.push(channel);
  write(saved);
  return true;
}
function removeChannel(channel) {
  const saved = read();
  saved.added = saved.added.filter((c) => c.toLowerCase() !== channel.toLowerCase());
  saved.off = saved.off.filter((k) => k !== channelKey(channel));
  write(saved);
}

// src/index.ts
var filters = () => [
  { key: "all", label: t("filter_all") },
  { key: "installed", label: t("filter_installed") },
  { key: "updates", label: t("filter_updates") }
];
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
function sourceUrl(key) {
  const base = bridge()?.callStatic("indexUrl") ?? DEFAULT_INDEX_URL;
  if (key === "user") return base.replace(/index\.json$/, "user-plugins/index.json");
  return base;
}
function sourceOf(key) {
  return listSources().find((source) => source.key === key);
}
function sourceLabel(key) {
  if (key === "official") return t("source_official");
  if (key === "user") return t("source_user");
  const channel = sourceOf(key)?.channel;
  return channel ? `@${channel}` : key;
}
function sourceIcon(source) {
  return inu.icons.common(source.kind === "official" ? "star" : source.kind === "user" ? "user" : "channel");
}
function activeKeys() {
  return listSources().filter((source) => source.enabled).map((source) => source.key);
}
var catalogs = /* @__PURE__ */ new Map();
var loading = false;
var refreshing = false;
var lastUpdated = 0;
var failures = /* @__PURE__ */ new Map();
var query = "";
var filter = "all";
var sourceFilter = "all";
var frame = null;
var installedCache = null;
var subPage = null;
function refreshAll() {
  page.invalidate();
  try {
    subPage?.invalidate();
  } catch {
  }
}
var INSTALLED_TTL_MS = 1500;
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
function readInstalled() {
  const native = bridge();
  if (!native) return scanInstalled();
  try {
    return JSON.parse(native.callStatic("installed"));
  } catch (e) {
    console.log("installed list failed", e);
    return [];
  }
}
function installedList() {
  if (frame) return frame.installed;
  const now = Date.now();
  if (installedCache && now - installedCache.at < INSTALLED_TTL_MS) return installedCache.list;
  const list = readInstalled();
  installedCache = { at: now, list };
  return list;
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
async function loadCatalog(key, suffix = "") {
  const url = sourceUrl(key) + suffix;
  let problem = "not found";
  for (const candidate of candidates(url)) {
    try {
      const res = await fetch(candidate);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const root = await res.json();
      const dir = candidate.slice(0, candidate.lastIndexOf("/") + 1);
      catalogs.set(key, root.plugins.map((p) => ({
        ...p,
        name: p.name || p.id,
        icon: p.icon && (/^https?:/.test(p.icon) ? p.icon : dir + p.icon),
        versions: p.versions.map((v) => ({ ...v, file: /^https?:/.test(v.file) ? v.file : dir + v.file }))
      })));
      failures.delete(key);
      return;
    } catch (e) {
      problem = e.message;
    }
  }
  failures.set(key, problem);
}
async function loadFromChannel(key, force) {
  const channel = sourceOf(key)?.channel;
  if (!channel) return;
  const cached2 = cachedChannel(channel);
  if (cached2 && !catalogs.get(key)) {
    catalogs.set(key, cached2);
    refreshAll();
  }
  try {
    catalogs.set(key, await loadChannel(channel, force));
    failures.delete(key);
  } catch (e) {
    failures.set(key, e.message || String(e));
  }
}
async function load(manual = false) {
  if (loading) return;
  loading = true;
  refreshing = manual;
  failures.clear();
  refreshAll();
  const suffix = manual ? `?t=${Date.now()}` : "";
  const keys = activeKeys();
  for (const key of [...catalogs.keys()]) if (!keys.includes(key)) catalogs.delete(key);
  await Promise.all(keys.map((key) => key === "official" || key === "user" ? loadCatalog(key, suffix) : loadFromChannel(key, manual)));
  loading = false;
  refreshing = false;
  const failed = [...failures.entries()];
  if (failed.length === 0) {
    lastUpdated = Date.now();
    if (manual) {
      try {
        inu.ui.toast(t("catalog_updated"));
      } catch {
      }
    }
  } else if (manual) {
    try {
      await inu.ui.dialog({
        title: t("refresh_fail_title"),
        message: failed.map(([key, error]) => `${sourceLabel(key)}: ${error}`).join("\n"),
        positive: t("ok")
      });
    } catch {
    }
    return;
  }
  refreshAll();
  void loadIcons();
}
async function loadIcons() {
  await Promise.all([...catalogs.values()].flatMap((group) => group ?? []).map(async (plugin) => {
    if (!plugin.icon || icons.has(plugin.id)) return;
    try {
      const res = await fetch(plugin.icon);
      if (res.ok) icons.set(plugin.id, inu.icons.svg(await res.text()));
    } catch (e) {
      console.log(`icon of ${plugin.id} failed`, e);
    }
  }));
  refreshAll();
}
function releaseUrl(plugin, version, key) {
  if (newest(plugin)?.version !== version.version) return version.file;
  const base = key === "official" && !/^entinygram/i.test(plugin.name) ? `entinyGram ${plugin.name}` : plugin.name;
  const file = `${base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "")}-${version.version}.inu.js`;
  return `https://github.com/entinyGram/plugins/releases/latest/download/${file}`;
}
async function installFromChannel(plugin, version, source, key) {
  const native = bridge();
  if (!native) {
    inu.ui.toast(t("channel_install_standalone"));
    return;
  }
  const ref = parseChannelFile(version.file);
  if (!ref) return;
  if (!sourceOf(key)?.builtin) {
    const risky = riskyGrants(version);
    const answer = await inu.ui.dialog({
      title: tf("trust_title", sourceLabel(key)),
      message: tf("trust_msg", (version.grants?.length ? version.grants : [t("trust_none")]).join(", ")) + (risky.length ? `

⚠ ${risky.join(", ")}` : ""),
      positive: tf("btn_install", version.version),
      negative: t("cancel")
    });
    if (answer !== "positive") return;
  }
  let path;
  try {
    path = await downloadBundle(ref.channel, ref.messageId);
  } catch (e) {
    inu.ui.toast(tf("download_failed", e.message || String(e)));
    return;
  }
  try {
    native.callStatic("installFile", path);
  } catch {
    inu.ui.toast(t("channel_install_old"));
    return;
  }
  for (const delay of [3e3, 8e3, 2e4]) setTimeout(() => {
    page.invalidate();
    source.invalidate();
  }, delay);
}
async function install(plugin, version, source, key) {
  if (parseChannelFile(version.file)) return installFromChannel(plugin, version, source, key);
  const native = bridge();
  if (!native) {
    const link = releaseUrl(plugin, version, key);
    inu.clipboard.write(link);
    const answer = await inu.ui.dialog({
      title: t("install_file_title"),
      message: [
        t("install_file_msg"),
        version.sha256 ? `SHA-256: ${version.sha256}` : ""
      ].filter(Boolean).join("\n\n"),
      positive: t("open_link"),
      negative: t("close")
    });
    if (answer === "positive") inu.openUrl(link);
    return;
  }
  native.callStatic("install", version.file, version.sha256 ?? "");
  for (const delay of [3e3, 8e3, 2e4]) setTimeout(() => {
    page.invalidate();
    source.invalidate();
  }, delay);
}
function aboutRows(plugin, source) {
  const rows = [];
  const top = newest(plugin);
  rows.push(inu.ui.header(t("about")));
  rows.push(inu.ui.button({
    id: "hero",
    text: plugin.name,
    subtitle: [sourceLabel(source), plugin.author].filter(Boolean).join(" · "),
    icon: icons.get(plugin.id) ?? inu.icons.common(source === "official" ? "star" : source === "user" ? "user" : "channel"),
    value: top ? `v${top.version}` : void 0,
    onClick: async () => {
      await inu.ui.dialog({
        title: plugin.name,
        message: [
          plugin.id,
          tf("published_versions", plugin.versions.length),
          top ? `${t("status_latest")}: v${top.version}${top.date ? ` (${top.date})` : ""}` : ""
        ].filter(Boolean).join("\n"),
        positive: t("close")
      });
    }
  }));
  rows.push(inu.ui.button({
    id: "desc",
    text: t("about_desc"),
    subtitle: plugin.description || t("no_desc"),
    icon: inu.icons.common("info"),
    onClick: async () => {
      await inu.ui.dialog({
        title: `${plugin.name} — ${t("about_desc")}`,
        message: plugin.description || t("no_desc"),
        positive: t("close")
      });
    }
  }));
  if (plugin.author) {
    rows.push(inu.ui.button({
      id: "author",
      text: t("about_author"),
      subtitle: plugin.author,
      icon: inu.icons.common("user"),
      onClick: async () => {
        await inu.ui.dialog({ title: t("about_author"), message: plugin.author, positive: t("close") });
      }
    }));
  }
  rows.push(inu.ui.button({
    id: "source",
    text: t("about_source"),
    subtitle: source === "official" ? t("source_official_desc") : source === "user" ? t("source_user_desc") : tf("source_channel_desc", sourceLabel(source)),
    icon: sourceOf(source) ? sourceIcon(sourceOf(source)) : inu.icons.common("user"),
    onClick: async () => {
      await inu.ui.dialog({
        title: t("about_source"),
        message: source === "official" ? t("source_official_msg") : source === "user" ? t("source_user_msg") : tf("source_channel_msg", sourceLabel(source)),
        positive: t("close")
      });
    }
  }));
  rows.push(inu.ui.button({
    id: "id",
    text: t("about_id"),
    subtitle: plugin.id,
    icon: inu.icons.common("link"),
    onClick: () => {
      try {
        inu.clipboard.write(plugin.id);
        inu.ui.toast(t("id_copied"));
      } catch {
      }
    }
  }));
  if (top?.requires?.length) {
    rows.push(inu.ui.button({
      id: "deps",
      text: t("about_requires"),
      subtitle: top.requires.join(", "),
      icon: inu.icons.common("lock"),
      onClick: () => {
      }
    }));
  }
  if (top?.size) {
    rows.push(inu.ui.button({
      id: "size",
      text: t("size_label"),
      subtitle: top.size,
      icon: inu.icons.common("archive"),
      onClick: () => {
      }
    }));
  }
  return rows;
}
function permissionText(grant) {
  const name = grant.trim().replace(/\(.*$/, "");
  if (name === "jvm") return t("perm_jvm");
  if (name === "xposed") return t("perm_xposed");
  if (name === "fetch") return t("perm_fetch");
  if (name === "fs") return t("perm_fs");
  if (/^(peers|messages|dialogs|history|self|draft|read)$/.test(name)) return t("perm_account");
  return t("perm_other");
}
function permissionRows(version) {
  const grants = version?.grants ?? [];
  if (!grants.length) return [];
  const risky = new Set(riskyGrants(version));
  const rows = [inu.ui.header(t("perms"))];
  for (const grant of grants) {
    rows.push(inu.ui.button({
      id: `g:${grant}`,
      text: `${risky.has(grant.trim()) ? "⚠ " : ""}${grant}`,
      subtitle: permissionText(grant),
      icon: inu.icons.common(risky.has(grant.trim()) ? "eye" : "lock"),
      danger: risky.has(grant.trim()),
      onClick: () => {
      }
    }));
  }
  if (risky.size) rows.push(inu.ui.separator(t("perms_footer")));
  return rows;
}
function openPlugin(plugin, source) {
  const detail = inu.ui.settingsPage({
    title: plugin.name,
    transient: true,
    items: () => {
      const installed = installedList();
      const { state, local } = stateOf(plugin, installed);
      const top = newest(plugin);
      const rows = [];
      rows.push(...aboutRows(plugin, source));
      rows.push(...permissionRows(top));
      rows.push(inu.ui.header(t("installation")));
      if (top) {
        const missing = unmet(top, installed);
        const label = state === "new" ? tf("btn_install", top.version) : state === "update" ? tf("btn_update", top.version) : t("btn_reinstall");
        rows.push(inu.ui.button({
          id: "main",
          text: label,
          subtitle: missing.length ? tf("needs_deps", missing.join(", ")) : local ? tf("installed_ver", local.version) : top.date ? tf("published_date", top.date) : void 0,
          icon: inu.icons.common(state === "installed" ? "refresh" : "download"),
          onClick: () => install(plugin, top, detail, source)
        }));
      }
      if (local) {
        rows.push(inu.ui.button({
          id: "remove",
          text: t("btn_remove"),
          subtitle: tf("installed_ver_sub", local.version),
          icon: inu.icons.common("delete"),
          onClick: async () => {
            const answer = await inu.ui.dialog({
              title: tf("remove_title", plugin.name),
              message: t("remove_msg"),
              positive: t("remove_confirm"),
              negative: t("cancel")
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
                title: t("remove_unavail_title"),
                message: t("remove_unavail_msg"),
                positive: t("ok")
              });
            }
          }
        }));
      }
      rows.push(inu.ui.header(t("history")));
      for (const version of [...plugin.versions].sort((x, y) => compare(y.version, x.version))) {
        const here = local && compare(version.version, local.version) === 0;
        const note = (version.notes ?? "").split("\n").find((l) => l.trim());
        rows.push(inu.ui.button({
          id: `v:${version.version}`,
          text: `v${version.version}`,
          subtitle: [version.date, note].filter(Boolean).join("\n") || void 0,
          icon: inu.icons.common(here ? "check" : "bookmark"),
          value: here ? t("status_installed") : version === top ? t("status_latest") : void 0,
          onClick: async () => {
            const missing = unmet(version, installed);
            const answer = await inu.ui.dialog({
              title: `${plugin.name} v${version.version}`,
              message: [version.notes?.trim(), missing.length ? tf("needs_deps", missing.join(", ")) : ""].filter(Boolean).join("\n\n") || t("confirm_install_ver"),
              positive: here ? t("btn_reinstall") : local && compare(version.version, local.version) < 0 ? t("btn_downgrade") : tf("btn_install", version.version),
              negative: t("cancel")
            });
            if (answer === "positive") install(plugin, version, detail, source);
          }
        }));
      }
      rows.push(inu.ui.separator(tf("published_versions", plugin.versions.length)));
      return rows;
    }
  });
  inu.ui.openPage(detail);
}
var TABS = ["home", "plugins", "settings"];
var tab = "home";
var tabLabel = (key) => t(`tab_${key}`);
var TAB_SVG = { home: home_default, plugins: plugins_default, settings: settings_default };
function row(plugin, source, installed) {
  const { state, local } = stateOf(plugin, installed);
  const top = newest(plugin);
  const mark = riskyGrants(top).length ? "⚠ " : "";
  const value = state === "update" ? `${mark}v${top?.version}` : state === "installed" ? t("status_installed") : top ? `${mark}v${top.version}` : void 0;
  const icon = state === "update" ? "refresh" : state === "installed" ? "check" : "download";
  const subtitle = state === "update" && local ? `v${local.version} → v${top?.version}` : [plugin.author, plugin.description].filter(Boolean).join(" · ");
  return inu.ui.button({
    id: `p:${plugin.id}`,
    text: plugin.name,
    subtitle: subtitle || void 0,
    value,
    icon: icons.get(plugin.id) ?? inu.icons.common(icon),
    onClick: () => openPlugin(plugin, source)
  });
}
function merged(installed) {
  if (frame?.merged) return frame.merged;
  const seen = /* @__PURE__ */ new Set();
  const result = activeKeys().filter((key) => catalogs.get(key)).flatMap((key) => (catalogs.get(key) ?? []).filter((plugin) => {
    if (seen.has(plugin.id)) return false;
    seen.add(plugin.id);
    return true;
  }).map((plugin) => ({ key, plugin, ...stateOf(plugin, installed) })));
  if (frame) frame.merged = result;
  return result;
}
function refreshRow(unique, loadedSources) {
  const clock = lastUpdated ? tf("updated_at", `${new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`) : t("never_updated");
  return inu.ui.button({
    id: "refresh",
    text: refreshing ? t("refreshing") : t("refresh_catalog"),
    subtitle: refreshing ? t("refreshing_sub") : `${clock} · ${tf("catalog_count", unique, loadedSources)}`,
    icon: refreshing ? inu.icons.animation("loading") : inu.icons.common("refresh"),
    onClick: () => {
      void load(true);
    }
  });
}
function emptyState() {
  if (activeKeys().some((key) => catalogs.get(key))) return null;
  const problems = [...failures.entries()].map(([key, error]) => `${sourceLabel(key)}: ${error}`);
  return [
    inu.ui.separator(loading ? t("loading_catalog") : problems.length ? tf("catalog_fail", problems.join(" · ")) : t("unknown_error")),
    inu.ui.button({ id: "retry", text: t("try_again"), icon: inu.icons.common("refresh"), onClick: () => {
      void load();
    } }),
    inu.ui.button({ id: "to-settings", text: tabLabel("settings"), subtitle: t("sources_title"), icon: inu.icons.common("settings"), onClick: () => {
      tab = "settings";
    } })
  ];
}
async function addSource() {
  const input = await inu.ui.prompt({ title: t("source_add_title"), hint: t("source_add_sub") });
  if (input === null) return;
  const channel = normalizeChannel(input);
  if (!channel) {
    inu.ui.toast(t("source_add_bad"));
    return;
  }
  if (listSources().some((source) => source.key === channelKey(channel))) {
    inu.ui.toast(t("source_exists"));
    return;
  }
  const answer = await inu.ui.dialog({
    title: tf("source_add_warn_title", `@${channel}`),
    message: t("source_add_warn_msg"),
    positive: t("source_add_confirm"),
    negative: t("cancel")
  });
  if (answer !== "positive") return;
  let found;
  try {
    found = await loadChannel(channel, true);
  } catch (e) {
    inu.ui.toast(tf("source_failed", e.message || String(e)));
    return;
  }
  if (!found.length) {
    forgetChannel(channel);
    inu.ui.toast(t("source_empty"));
    return;
  }
  addChannel(channel);
  catalogs.set(channelKey(channel), found);
  inu.ui.toast(t("source_added"));
  refreshAll();
}
async function removeSource(source) {
  if (!source.channel) return;
  const answer = await inu.ui.dialog({
    title: tf("source_remove_title", sourceLabel(source.key)),
    message: t("source_remove_msg"),
    positive: t("remove_confirm"),
    negative: t("cancel")
  });
  if (answer !== "positive") return;
  removeChannel(source.channel);
  forgetChannel(source.channel);
  catalogs.delete(source.key);
  failures.delete(source.key);
  if (sourceFilter === source.key) sourceFilter = "all";
  refreshAll();
}
function sourceRows() {
  const rows = [];
  for (const source of listSources()) {
    const list = catalogs.get(source.key);
    const error = failures.get(source.key);
    const status = !source.enabled ? t("source_off") : error ? tf("source_failed", error) : list ? tf("source_count", list.length) : loading ? t("source_loading") : "";
    const about = source.kind === "official" ? t("source_official_desc") : source.kind === "user" ? t("source_user_desc") : tf("source_channel_desc", sourceLabel(source.key));
    rows.push(inu.ui.check({
      id: `s:${source.key}`,
      text: sourceLabel(source.key),
      subtitle: [about, status].filter(Boolean).join("\n"),
      icon: sourceIcon(source),
      checked: source.enabled,
      onChange: (on) => {
        setEnabled(source.key, on);
        void load();
      },
      onSecondaryClick: source.builtin ? void 0 : () => {
        void removeSource(source);
      }
    }));
  }
  rows.push(inu.ui.button({
    id: "add",
    text: t("source_add"),
    subtitle: t("source_add_sub"),
    icon: inu.icons.common("plus"),
    onClick: () => {
      void addSource();
    }
  }));
  rows.push(inu.ui.separator(t("sources_footer")));
  return rows;
}
function homeRows() {
  const blocked = emptyState();
  if (blocked) return blocked;
  const installed = installedList();
  const all = merged(installed);
  const rows = [];
  const byDate = (a, b) => (newest(b.plugin)?.date ?? "").localeCompare(newest(a.plugin)?.date ?? "");
  const updates = all.filter((x) => x.state === "update").sort((a, b) => a.plugin.name.localeCompare(b.plugin.name));
  rows.push(inu.ui.header("entinyGram"));
  rows.push(inu.ui.button({
    id: "hero",
    text: t("home_title"),
    subtitle: tf("home_stats", installed.length, updates.length, all.length),
    icon: inu.icons.common("star"),
    onClick: () => {
      tab = "plugins";
    }
  }));
  if (updates.length) {
    rows.push(inu.ui.header(tf("home_updates", updates.length)));
    for (const x of updates) rows.push(row(x.plugin, x.key, installed));
  } else if (installed.length) {
    rows.push(inu.ui.separator(t("home_all_current")));
  }
  const fresh = all.filter((x) => x.state === "new").sort(byDate).slice(0, 5);
  if (fresh.length) {
    rows.push(inu.ui.header(t("home_new")));
    for (const x of fresh) rows.push(row(x.plugin, x.key, installed));
  }
  const recent = all.filter((x) => x.state !== "update" && !fresh.includes(x)).sort(byDate).slice(0, 4);
  if (recent.length) {
    rows.push(inu.ui.header(t("home_recent")));
    for (const x of recent) rows.push(row(x.plugin, x.key, installed));
  }
  rows.push(inu.ui.button({
    id: "more",
    text: t("home_more"),
    icon: inu.icons.common("forward"),
    onClick: () => {
      tab = "plugins";
    }
  }));
  rows.push(refreshRow(all.length, activeKeys().filter((key) => catalogs.get(key)).length));
  return rows;
}
var PREVIEW_ROWS = 5;
function openList(title, pick) {
  const sub = inu.ui.settingsPage({
    title,
    transient: true,
    onClose: () => {
      if (subPage === sub) subPage = null;
    },
    items: () => {
      const installed = installedList();
      const list = pick(merged(installed)).sort((a, b) => a.plugin.name.localeCompare(b.plugin.name));
      return list.length ? list.map((x) => row(x.plugin, x.key, installed)) : [inu.ui.separator(t("empty_list"))];
    }
  });
  subPage = sub;
  inu.ui.openPage(sub);
}
function moreRow(id, count, title, pick) {
  return inu.ui.button({
    id: `more:${id}`,
    text: tf("show_all", count),
    icon: inu.icons.common("forward"),
    onClick: () => openList(title, pick)
  });
}
function pluginsRows() {
  const rows = [];
  const keys = activeKeys();
  rows.push(inu.ui.button({
    id: "search",
    text: t("search_title"),
    subtitle: query || t("search_hint"),
    icon: inu.icons.common("search"),
    onClick: async () => {
      const value = await inu.ui.prompt({ title: t("search_prompt_title"), hint: t("search_hint"), value: query, selectAll: true });
      if (value !== null) {
        query = value.trim();
        page.invalidate();
      }
    }
  }));
  rows.push(inu.ui.select({
    id: "filter",
    text: t("filter_title"),
    icon: inu.icons.common("more"),
    items: filters().map((f) => f.label),
    selected: Math.max(0, filters().findIndex((f) => f.key === filter)),
    onChange: (index) => {
      filter = filters()[index].key;
    }
  }));
  const blocked = emptyState();
  if (blocked) return [...rows, ...blocked];
  const installed = installedList();
  const needle = query.toLowerCase();
  const unique = merged(installed);
  const shown = unique.filter((x) => sourceFilter === "all" || x.key === sourceFilter).filter((x) => !needle || [x.plugin.name, x.plugin.id, x.plugin.author, x.plugin.description, sourceLabel(x.key)].some((s) => s?.toLowerCase().includes(needle))).filter((x) => filter === "all" || (filter === "installed" ? x.state !== "new" : x.state === "update"));
  const byName = (a, b) => a.plugin.name.localeCompare(b.plugin.name);
  const mine = shown.filter((x) => x.state !== "new").sort((a, b) => (a.state === "update" ? 0 : 1) - (b.state === "update" ? 0 : 1) || byName(a, b));
  if (mine.length) {
    rows.push(inu.ui.header(`${t("sec_installed")} · ${mine.length}`));
    for (const x of mine.slice(0, PREVIEW_ROWS)) rows.push(row(x.plugin, x.key, installed));
    if (mine.length > PREVIEW_ROWS) rows.push(moreRow("installed", mine.length, t("sec_installed"), (all) => all.filter((x) => x.state !== "new")));
  }
  for (const key of keys) {
    const group = shown.filter((x) => x.key === key && x.state === "new").sort(byName);
    const error = failures.get(key);
    if (!group.length && !(error && (sourceFilter === "all" || sourceFilter === key))) continue;
    rows.push(inu.ui.header(group.length ? `${sourceLabel(key)} · ${group.length}` : sourceLabel(key)));
    if (error) {
      rows.push(inu.ui.button({
        id: `err:${key}`,
        text: tf("source_failed", error),
        icon: inu.icons.common("info"),
        danger: true,
        onClick: () => {
          tab = "settings";
        }
      }));
    }
    for (const x of group.slice(0, PREVIEW_ROWS)) rows.push(row(x.plugin, x.key, installed));
    if (group.length > PREVIEW_ROWS) rows.push(moreRow(key, group.length, sourceLabel(key), (all) => all.filter((x) => x.key === key && x.state === "new")));
  }
  if (!shown.length) rows.push(inu.ui.separator(query ? t("empty_search") : t("empty_list")));
  rows.push(refreshRow(unique.length, keys.filter((key) => catalogs.get(key)).length));
  return rows;
}
var entriesCache = null;
var ENTRIES_TTL_MS = 5e3;
function entriesList() {
  if (entriesCache && Date.now() - entriesCache.at <= ENTRIES_TTL_MS) return entriesCache.list;
  try {
    const list = embeddedEntries();
    entriesCache = { at: Date.now(), list };
    return list;
  } catch (e) {
    console.log("reading plugin entries failed", e);
    return entriesCache?.list ?? [];
  }
}
function entryRows() {
  const entries = entriesList();
  const rows = [];
  for (const entry of entries) {
    rows.push(inu.ui.button({
      id: `e:${entry.id}`,
      text: entry.name,
      subtitle: entry.screen ? t("entry_open") : t("entry_inline"),
      icon: inu.icons.common(entry.screen ? "settings" : "link"),
      onClick: () => {
        if (entry.screen) entry.open();
      }
    }));
  }
  rows.push(inu.ui.separator(entries.length ? t("settings_entries_footer") : t("entry_none")));
  return rows;
}
function installedRows() {
  const installed = installedList();
  if (!installed.length) return [inu.ui.separator(t("empty_list"))];
  const known = /* @__PURE__ */ new Map();
  for (const x of merged(installed)) known.set(x.plugin.id, { plugin: x.plugin, key: x.key });
  const rows = [];
  for (const plugin of [...installed].sort((a, b) => a.id.localeCompare(b.id))) {
    const hit = known.get(plugin.id);
    rows.push(inu.ui.button({
      id: `i:${plugin.id}`,
      text: hit?.plugin.name ?? plugin.id,
      subtitle: `v${plugin.version}${hit ? "" : ` · ${plugin.id}`}`,
      value: plugin.enabled ? void 0 : t("status_off"),
      icon: icons.get(plugin.id) ?? inu.icons.common(plugin.enabled ? "check" : "eyeOff"),
      onClick: () => {
        if (hit) openPlugin(hit.plugin, hit.key);
      }
    }));
  }
  return rows;
}
async function openPluginsChannel() {
  try {
    const peer = await inu.account().resolvePeer(DEFAULT_CHANNEL);
    if (peer._ === "inputPeerChannel" && typeof peer.channel_id === "number") {
      inu.ui.openPage({ type: "chat", dialogId: -peer.channel_id });
      return;
    }
  } catch (e) {
    console.log("opening the channel in the app failed", e);
  }
  inu.openUrl(`https://t.me/${DEFAULT_CHANNEL}`);
}
function openSection(section) {
  const sub = inu.ui.settingsPage({
    title: section === "installed" ? t("settings_installed") : section === "sources" ? t("sources_title") : t("settings_entries"),
    transient: true,
    onClose: () => {
      if (subPage === sub) subPage = null;
    },
    items: () => section === "installed" ? installedRows() : section === "sources" ? sourceRows() : entryRows()
  });
  subPage = sub;
  inu.ui.openPage(sub);
}
function settingsRows() {
  const installed = installedList();
  const updates = merged(installed).filter((x) => x.state === "update").length;
  const sources = listSources();
  return [
    inu.ui.button({
      id: "sec-installed",
      text: t("settings_installed"),
      subtitle: tf("settings_installed_sub", installed.length, updates),
      value: String(installed.length),
      icon: inu.icons.common("download"),
      onClick: () => openSection("installed")
    }),
    inu.ui.button({
      id: "sec-sources",
      text: t("sources_title"),
      subtitle: tf("sources_sub", sources.filter((source) => source.enabled).length, sources.length),
      icon: inu.icons.common("channel"),
      onClick: () => openSection("sources")
    }),
    inu.ui.button({
      id: "sec-entries",
      text: t("settings_entries"),
      subtitle: tf("settings_entries_sub", entriesList().length),
      icon: inu.icons.common("settings"),
      onClick: () => openSection("entries")
    }),
    inu.ui.header(t("settings_about")),
    inu.ui.button({
      id: "about-sdk",
      text: "entinyGram SDK",
      subtitle: tf("settings_about_sub", SDK_VERSION, embedState),
      icon: inu.icons.common("info"),
      onClick: () => {
      }
    }),
    inu.ui.button({
      id: "about-channel",
      text: t("about_channel"),
      subtitle: `@${DEFAULT_CHANNEL}`,
      icon: inu.icons.common("channel"),
      onClick: () => {
        void openPluginsChannel();
      }
    }),
    inu.ui.separator(tf("footer_info", SDK_VERSION, embedState, standalone() ? t("standalone_mode") : ""))
  ];
}
var page = inu.ui.settingsPage({
  title: "Marketplace",
  items: () => {
    const started = Date.now();
    if (activeKeys().every((key) => !catalogs.get(key)) && failures.size === 0 && !loading) void load();
    frame = null;
    frame = { installed: installedList(), merged: null };
    ensureNavbar({
      title: "Marketplace",
      tabs: () => TABS.map((key) => {
        const label = tabLabel(key);
        const cut = label.indexOf(" ");
        return { svg: TAB_SVG[key], emoji: label.slice(0, cut), label: label.slice(cut + 1) };
      }),
      selected: () => TABS.indexOf(tab),
      onSelect: (index) => {
        if (TABS[index] === tab) return;
        tab = TABS[index];
        page.invalidate();
      },
      onReady: () => page.invalidate()
    });
    const rows = navbarReady() ? [] : [inu.ui.select({
      id: "tab",
      text: t("tab_title"),
      icon: inu.icons.common("bookmark"),
      items: TABS.map(tabLabel),
      selected: TABS.indexOf(tab),
      onChange: (index) => {
        tab = TABS[index];
      }
    })];
    try {
      rows.push(...tab === "home" ? homeRows() : tab === "plugins" ? pluginsRows() : settingsRows());
    } finally {
      frame = null;
    }
    console.log(`render ${tab}: ${Date.now() - started} ms, ${rows.length} rows`);
    return rows;
  }
});
inu.registerSettings(page);
