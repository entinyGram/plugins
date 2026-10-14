import { type CatalogPlugin, type CatalogVersion, channelFile } from './catalog.js'

// A plugin channel is a catalog: the entinyGram bot posts every bundle as a document whose caption carries the
// manifest facts, ending with `meta: <id> · api 1 · jvm, xposed · 12.0 KB · needs entinygram.sdk >=0.1.0-alpha`.
// Posts without that line (older ones, chatter) are skipped, so a channel can mix plugins with anything else.

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

export function parsePost(text: string): Post | null {
  const lines = text.split('\n').map(line => line.trim())
  const metaLine = [...lines].reverse().find(line => /^meta:\s/.test(line))
  if (!metaLine) return null

  const tokens = metaLine.replace(/^meta:\s*/, '').split(' · ').map(token => token.trim()).filter(Boolean)
  const id = tokens.shift()
  if (!id) return null
  const grants: string[] = []
  let requires: string[] = []
  let size: string | undefined
  for (const token of tokens) {
    if (/^api\s/.test(token) || /^sha256\b/.test(token)) continue
    if (/^needs\s/.test(token)) requires = token.replace(/^needs\s+/, '').split(', ').map(r => r.trim()).filter(Boolean)
    else if (/^[\d.]+\s*[KMG]B$/i.test(token)) size = token
    else grants.push(...token.split(',').map(g => g.trim()).filter(Boolean))
  }

  const head = lines[0]?.match(/^\S+\s+(.+?)\s+[—-]\s+(\S+)$/)
  if (!head) return null

  const author = lines.find(line => /^author:\s/.test(line))?.replace(/^author:\s*@?/, '')
  const start = lines.findIndex(line => /^author:\s/.test(line)) + 1
  const body: string[] = []
  for (const line of lines.slice(Math.max(start, 1))) {
    if (/^(‼️|📦|meta:)/.test(line)) break
    body.push(line)
  }
  const notes = body.join('\n').trim()
  const description = notes.split('\n').find(line => line.trim())?.replace(/^[-•]\s*/, '') ?? ''
  return { id, name: head[1], version: head[2], author, description, notes, grants, requires, size }
}

function fileNameOf(message: inu.Message): string | null {
  const doc = message.document as unknown as { attributes?: { _: string, file_name?: string }[] } | null
  const name = doc?.attributes?.find(attribute => attribute._ === 'documentAttributeFilename')?.file_name
  return name ?? null
}

function isBundle(message: inu.Message): boolean {
  return (fileNameOf(message) ?? '').toLowerCase().endsWith('.inu.js')
}

function isoDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10)
}

/** Groups the channel's posts by plugin id. A long post goes out as text first and the bundle right after it. */
export function collect(channel: string, messages: inu.Message[]): CatalogPlugin[] {
  const byId = new Map<number, inu.Message>()
  for (const message of messages) byId.set(message.id, message)

  const plugins = new Map<string, CatalogPlugin>()
  for (const message of messages) {
    const post = parsePost(message.text)
    if (!post) continue
    let ref: BundleRef | null = null
    if (isBundle(message)) ref = { messageId: message.id }
    else {
      for (let next = message.id + 1; next <= message.id + 3 && !ref; next++) {
        const candidate = byId.get(next)
        if (candidate && isBundle(candidate)) ref = { messageId: candidate.id }
      }
    }
    if (!ref) continue

    const version: CatalogVersion = {
      version: post.version,
      date: isoDate(message.date),
      notes: post.notes,
      file: channelFile(channel, ref.messageId),
      requires: post.requires,
      grants: post.grants,
      size: post.size,
    }
    const entry = plugins.get(post.id)
    if (!entry) {
      plugins.set(post.id, { id: post.id, name: post.name, author: post.author, description: post.description, versions: [version] })
    } else if (!entry.versions.some(existing => existing.version === version.version)) {
      entry.versions.push(version)
    }
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
  const [message] = await account.getHistory(peer, { offsetId: messageId + 1, limit: 1 })
  if (!message || message.id !== messageId || !isBundle(message)) throw new Error('the post is gone')
  const { path } = await account.downloadMediaToFile(message)
  return path
}
