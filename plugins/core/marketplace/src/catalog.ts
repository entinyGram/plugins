export interface CatalogVersion {
  version: string
  date?: string
  notes?: string
  file: string
  sha256?: string
  requires?: string[]
  grants?: string[]
  size?: string
}

export interface CatalogPlugin {
  id: string
  name: string
  author?: string
  description?: string
  icon?: string
  versions: CatalogVersion[]
}

const CHANNEL_FILE_PREFIX = 'tg:'

/** `tg:<channel>/<message id>`: a bundle that lives in a Telegram channel instead of behind a URL */
export function channelFile(channel: string, messageId: number): string {
  return `${CHANNEL_FILE_PREFIX}${channel}/${messageId}`
}

export function parseChannelFile(file: string): { channel: string, messageId: number } | null {
  const match = file.startsWith(CHANNEL_FILE_PREFIX) && file.slice(CHANNEL_FILE_PREFIX.length).match(/^([^/]+)\/(\d+)$/)
  return match ? { channel: match[1], messageId: Number(match[2]) } : null
}

// a channel post names a grant by its last word (`unsafe.jvm` is `jvm`), so the risky ones are matched that way
const RISKY = /^(jvm|xposed|invokeRaw|notificationCenter|disableApiFiltering)$/

export function riskyGrants(version: CatalogVersion | undefined): string[] {
  return (version?.grants ?? []).filter(grant => RISKY.test(grant.trim()))
}
