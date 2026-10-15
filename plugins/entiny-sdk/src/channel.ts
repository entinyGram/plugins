import { type CatalogPlugin, type CatalogVersion, channelFile } from './catalog.js'

// A plugin channel is a catalog: the entinyGram bot posts every bundle as a document whose caption carries the
// manifest facts. They ride in an invisible link at the start of the caption (`?entiny=<json>`: id, api, grants, size,
// requirements); earlier posts ended with a visible `meta: <id> · api 1 · jvm, xposed · 12.0 KB · needs ...` line instead.
// Posts with neither (older ones, chatter) are skipped, so a channel can mix plugins with anything else.

interface Post {
  id: string
  name: string
  version: string
  author?: string
  description: string
  notes: string
  grants: string[]
  requires: string[]
  size?: string
}

interface BundleRef {
  messageId: number
}

const HISTORY_LIMIT = 400
const CACHE_PREFIX = 'entiny.channel.'

export function normalizeChannel(input: string): string | null {
  const text = input.trim().replace(/^https?:\/\/(t|telegram)\.me\//i, '').replace(/^@/, '').split(/[/?#]/)[0]
  return /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(text) ? text : null
}

interface Facts {
  id: string
  grants: string[]
  requires: string[]
  size?: string
}

/** the facts of the invisible link: the first link of the post whose address carries `entiny=<json>` */
function factsFromLink(entities: { _: string, url?: string }[] | undefined): Facts | null {
  for (const entity of entities ?? []) {
    const hit = entity._ === 'messageEntityTextUrl' ? entity.url?.match(/[?&]entiny=([^&#]+)/) : null
    if (!hit) continue
    try {
      const data = JSON.parse(decodeURIComponent(hit[1])) as { id?: string, g?: string[], r?: string[], s?: string }
      if (data.id) return { id: data.id, grants: data.g ?? [], requires: data.r ?? [], size: data.s }
    } catch {}
  }
  return null
}

/** the facts of a visible `meta:` line, the way earlier posts carried them */
function factsFromLine(lines: string[]): Facts | null {
  const metaLine = [...lines].reverse().find(line => /^meta:\s/.test(line))
  if (!metaLine) return null
  const tokens = metaLine.replace(/^meta:\s*/, '').split(' · ').map(token => token.trim()).filter(Boolean)
  const id = tokens.shift()
  if (!id) return null
  const facts: Facts = { id, grants: [], requires: [] }
  for (const token of tokens) {
    if (/^api\s/.test(token) || /^sha256\b/.test(token)) continue
    if (/^needs\s/.test(token)) facts.requires = token.replace(/^needs\s+/, '').split(', ').map(r => r.trim()).filter(Boolean)
    else if (/^[\d.]+\s*[KMG]B$/i.test(token)) facts.size = token
    else facts.grants.push(...token.split(',').map(g => g.trim()).filter(Boolean))
  }
  return facts
}

const KNOWN_CANONICAL: Record<string, { id: string, name: string }> = {
  '2gis': { id: 'entinygram.2gis', name: '2GIS' },
  'calendar-system': { id: 'entinygram.calendar-systems', name: 'Calendar systems' },
  'calendar-systems': { id: 'entinygram.calendar-systems', name: 'Calendar systems' },
  'call-avatar': { id: 'entinygram.call-avatar', name: 'Call avatar' },
  'doc-viewer': { id: 'entinygram.doc-viewer', name: 'Doc Viewer' },
  'entinygram-sdk': { id: 'entinygram.sdk', name: 'entinyGram SDK' },
  'sdk': { id: 'entinygram.sdk', name: 'entinyGram SDK' },
  'text-animation': { id: 'entinygram.text-animation', name: 'Text Animation' },
  'yandex': { id: 'entinygram.yandex', name: 'Yandex' },
  'display-resize': { id: 'user.display-resize', name: 'Display Resize' },
  'hide-folder-tags': { id: 'user.hide-folder-tags', name: 'Hide Folder Tags' },
  'local-message-edit': { id: 'user.local-message-edit', name: 'Local Message Edit' },
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function compareVersions(a: string, b: string): number {
  const [coreA, preA] = a.split(/-(.+)/)
  const [coreB, preB] = b.split(/-(.+)/)
  const pa = (coreA ?? '').split('.').map(n => parseInt(n, 10) || 0)
  const pb = (coreB ?? '').split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  if (preA === preB) return 0
  if (preA === undefined) return 1
  if (preB === undefined) return -1
  return preA < preB ? -1 : 1
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function parsePost(
  text: string,
  entities?: { _: string, url?: string }[],
  fileName?: string,
  docSize?: number,
): Post | null {
  const lines = text.replace(/\u200b/g, '').split('\n').map(line => line.trim()).filter(Boolean)
  const first = lines[0] ?? ''

  let facts = factsFromLink(entities) ?? factsFromLine(lines)
  if (!facts) {
    for (const entity of entities ?? []) {
      if (entity.url) {
        const hit = entity.url.match(/plugins\/dist\/([a-zA-Z0-9._-]+)\//)
        if (hit) {
          facts = { id: hit[1], grants: [], requires: [] }
          break
        }
      }
    }
  }

  let rawName = ''
  let version = '1.0.0'
  const head = lines[0]?.match(/^\S+\s+(.+?)\s+[—-]\s+(\S+)$/)
  if (head) {
    rawName = head[1].trim()
    version = head[2].trim()
  } else {
    const vMatch = first.match(/\bv\.?\s*(\d+(?:\.\d+)+[a-z0-9.-]*)/i)
      ?? first.match(/[—–-]\s*v?(\d+(?:\.\d+)+[a-z0-9.-]*)/i)
      ?? first.match(/\bv(\d+(?:\.\d+)*)\b/i)
      ?? fileName?.match(/[-_.]v?(\d+(?:\.\d+)*(?:-[a-z0-9.-]+)?)\.inu\.js$/i)
    if (vMatch) version = vMatch[1]

    rawName = first
      .replace(/^[\p{Extended_Pictographic}\s]+/u, '')
      .replace(/\s*\/\/.*$/, '')
      .replace(/\s+by\s+@?[A-Za-z0-9_.-]+.*$/i, '')
      .replace(/\s+[—–-]\s+.*$/, '')
      .replace(/\s+v\.?\s*\d+.*$/i, '')
      .trim()
  }

  const fClean = (fileName ?? '')
    .replace(/\.inu\.js$/i, '')
    .replace(/^(?:entinygram|user)[-_\s]+/i, '')
    .replace(/[-_. ]v?\d+(?:\.\d+)*(?:-[a-z0-9.-]+)?$/i, '')
  const fSlug = slugify(fClean) || slugify((fileName ?? '').replace(/\.inu\.js$/i, ''))

  if (!rawName || rawName.length > 60) {
    rawName = fClean.replace(/[-_.]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || (fileName ?? '').replace(/\.inu\.js$/i, '')
  }

  const nSlug = slugify(rawName)
  const known = KNOWN_CANONICAL[nSlug]
    || KNOWN_CANONICAL[nSlug.replace(/^entinygram-/, '')]
    || (fSlug ? KNOWN_CANONICAL[fSlug] || KNOWN_CANONICAL[fSlug.replace(/^entinygram-/, '')] : undefined)

  const id = facts?.id || (known ? known.id : (nSlug || fSlug || 'plugin'))
  const name = known ? known.name : (rawName || fClean.replace(/[-_.]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Plugin')

  const author = lines.find(line => /^author:\s/i.test(line))?.replace(/^author:\s*@?/, '')
    ?? first.match(/\bby\s+@?([A-Za-z0-9_.-]+)/i)?.[1]
    ?? (id.startsWith('entinygram.') ? 'entinyGram' : undefined)

  const start = lines.findIndex(line => /^author:\s/i.test(line)) + 1
  const body: string[] = []
  for (const line of lines.slice(Math.max(start, 1))) {
    if (/^(‼️|📦|💡|meta:)/.test(line)) break
    body.push(line)
  }
  const notes = body.join('\n').trim() || text.trim()
  const description = (body.find(line => line.trim()) ?? lines.slice(1).find(line => line.trim() && !/^(author|meta|upd):/i.test(line)) ?? '')
    .replace(/^[-•]\s*/, '')

  const size = facts?.size ?? (typeof docSize === 'number' && docSize > 0 ? formatFileSize(docSize) : undefined)
  const grants = facts?.grants ?? []
  const requires = facts?.requires ?? []

  return { id, name, version, author, description, notes, grants, requires, size }
}

export function parseGenericPost(fileName: string, text: string, docSize?: number): Post {
  return parsePost(text, undefined, fileName, docSize)!
}

function fileNameOf(message: inu.Message): string | null {
  const doc = message.document as unknown as { file_name?: string, attributes?: ArrayLike<{ _: string, file_name?: string }> } | null
  if (!doc) return null
  if (doc.file_name) return doc.file_name
  const attrs = doc.attributes
  if (!attrs) return null
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i]
    if (attr?._ === 'documentAttributeFilename' && attr.file_name) return attr.file_name
  }
  return null
}

function isBundle(message: inu.Message): boolean {
  return (fileNameOf(message) ?? '').toLowerCase().endsWith('.inu.js')
}

function isoDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10)
}

/** Groups the channel's posts by plugin id. Supports both structured entiny posts and plain .inu.js bundles. */
export function collect(channel: string, messages: inu.Message[]): CatalogPlugin[] {
  const byId = new Map<number, inu.Message>()
  for (const message of messages) byId.set(message.id, message)

  const plugins = new Map<string, CatalogPlugin>()
  const bySlug = new Map<string, CatalogPlugin>()
  const claimedBundles = new Set<number>()

  for (const message of messages) {
    let bundleMsg: inu.Message | null = null
    let text = ''
    let entities: { _: string, url?: string }[] | undefined

    if (isBundle(message)) {
      bundleMsg = message
      text = message.textWithEntities?.text?.trim() ?? ''
      entities = message.textWithEntities?.entities as { _: string, url?: string }[] | undefined
      if (!text) {
        for (let prev = message.id - 1; prev >= message.id - 3 && !text; prev--) {
          const candidate = byId.get(prev)
          if (candidate && !isBundle(candidate)) {
            text = candidate.textWithEntities?.text?.trim() ?? ''
            entities = candidate.textWithEntities?.entities as { _: string, url?: string }[] | undefined
          }
        }
      }
    } else {
      for (let next = message.id + 1; next <= message.id + 3 && !bundleMsg; next++) {
        const candidate = byId.get(next)
        if (candidate && isBundle(candidate)) {
          bundleMsg = candidate
          text = message.textWithEntities?.text?.trim() ?? ''
          entities = message.textWithEntities?.entities as { _: string, url?: string }[] | undefined
        }
      }
    }

    if (!bundleMsg || claimedBundles.has(bundleMsg.id)) continue

    const fileName = fileNameOf(bundleMsg)
    if (!fileName) continue
    claimedBundles.add(bundleMsg.id)

    const docSize = (bundleMsg.document as unknown as { size?: number } | null)?.size
    const post = parsePost(text, entities, fileName, docSize)
    if (!post) continue

    const version: CatalogVersion = {
      version: post.version,
      date: isoDate(bundleMsg.date || message.date),
      notes: post.notes,
      file: channelFile(channel, bundleMsg.id),
      requires: post.requires,
      grants: post.grants,
      size: post.size,
    }

    const slug = slugify(post.name) || slugify(fileName.replace(/\.inu\.js$/i, ''))
    let entry = plugins.get(post.id) || bySlug.get(slug)

    if (!entry) {
      entry = {
        id: post.id,
        name: post.name,
        author: post.author,
        description: post.description,
        versions: [version],
      }
      plugins.set(post.id, entry)
      bySlug.set(slug, entry)
    } else {
      if (post.id !== entry.id && (post.id.includes('.') || post.id.startsWith('user.'))) {
        plugins.delete(entry.id)
        entry.id = post.id
        plugins.set(post.id, entry)
      }
      if (!entry.author && post.author) entry.author = post.author
      if (!entry.description && post.description) entry.description = post.description
      if (!entry.versions.some(existing => existing.version === version.version)) {
        entry.versions.push(version)
      }
    }
  }

  for (const entry of plugins.values()) {
    entry.versions.sort((a, b) => compareVersions(b.version, a.version))
  }

  return [...plugins.values()]
}

function readCache(channel: string): CatalogPlugin[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + channel)
    return raw ? (JSON.parse(raw) as CatalogPlugin[]) : null
  } catch {
    return null
  }
}

function writeCache(channel: string, plugins: CatalogPlugin[]) {
  try {
    localStorage.setItem(CACHE_PREFIX + channel, JSON.stringify(plugins))
  } catch {
    // the cache is a courtesy: a full or blocked storage only costs a slower first paint
  }
}

export function cachedChannel(channel: string): CatalogPlugin[] | null {
  return readCache(channel)
}

export function forgetChannel(channel: string) {
  try {
    localStorage.removeItem(CACHE_PREFIX + channel)
  } catch {}
}

export async function loadChannel(channel: string, force: boolean): Promise<CatalogPlugin[]> {
  const account = inu.account()
  const peer = await account.resolvePeer(channel)
  const messages: inu.Message[] = []
  for await (const message of account.iterHistory(peer, { limit: HISTORY_LIMIT, batchSize: 100, force })) messages.push(message)
  const plugins = collect(channel, messages)
  writeCache(channel, plugins)
  return plugins
}

/** Downloads a bundle posted in a channel and returns the local file the app can import */
export async function downloadBundle(channel: string, messageId: number): Promise<string> {
  const account = inu.account()
  const peer = await account.resolvePeer(channel)
  let message = await account.getMessages(peer, messageId)
  if (!message || message.id !== messageId || !isBundle(message)) {
    const [hist] = await account.getHistory(peer, { offsetId: messageId + 1, limit: 1 })
    if (hist && hist.id === messageId && isBundle(hist)) message = hist
  }
  if (!message || message.id !== messageId || !isBundle(message)) throw new Error('the post is gone')
  const { path } = await account.downloadMediaToFile(message)
  return path
}
