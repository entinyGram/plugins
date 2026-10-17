// Where the marketplace reads plugins from. The GitHub catalog and the plugins channel ship with the SDK; the user can
// add more channels. A channel needs no host grant: it is read through the user's own Telegram session.

export type SourceKind = 'official' | 'channel'

export interface Source {
  key: string
  kind: SourceKind
  channel?: string
  /** shipped with the SDK: it can be switched off but not removed */
  builtin: boolean
  enabled: boolean
}

const STORE = 'entiny.sources'
export const DEFAULT_CHANNEL = 'entinyGramPlugins'

interface Saved {
  added: string[]
  off: string[]
}

let readRaw: string | null | undefined
let readSaved: Saved = { added: [], off: [] }

function read(): Saved {
  try {
    const raw = localStorage.getItem(STORE)
    if (raw === readRaw) return readSaved
    const saved = JSON.parse(raw ?? '{}') as Partial<Saved>
    readRaw = raw
    readSaved = { added: Array.isArray(saved.added) ? saved.added : [], off: Array.isArray(saved.off) ? saved.off : [] }
  } catch {
    readRaw = undefined
    readSaved = { added: [], off: [] }
  }
  return readSaved
}

function write(saved: Saved) {
  try {
    localStorage.setItem(STORE, JSON.stringify(saved))
  } catch {}
  readRaw = undefined
}

export const channelKey = (channel: string) => `channel:${channel.toLowerCase()}`

export function listSources(): Source[] {
  const saved = read()
  const all: Source[] = [
    { key: 'official', kind: 'official', builtin: true, enabled: true },
    { key: channelKey(DEFAULT_CHANNEL), kind: 'channel', channel: DEFAULT_CHANNEL, builtin: true, enabled: true },
    ...saved.added.map((channel): Source => ({ key: channelKey(channel), kind: 'channel', channel, builtin: false, enabled: true })),
  ]
  return all.map(source => ({ ...source, enabled: !saved.off.includes(source.key) }))
}

export function setEnabled(key: string, enabled: boolean) {
  const saved = read()
  saved.off = enabled ? saved.off.filter(k => k !== key) : [...new Set([...saved.off, key])]
  write(saved)
}

export function addChannel(channel: string): boolean {
  const saved = read()
  if (listSources().some(source => source.key === channelKey(channel))) return false
  saved.added.push(channel)
  write(saved)
  return true
}

export function removeChannel(channel: string) {
  const saved = read()
  saved.added = saved.added.filter(c => c.toLowerCase() !== channel.toLowerCase())
  saved.off = saved.off.filter(k => k !== channelKey(channel))
  write(saved)
}
