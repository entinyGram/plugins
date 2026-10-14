import { SDK_VERSION } from '@entiny/sdk'
import { type CatalogPlugin, type CatalogVersion, parseChannelFile, riskyGrants } from './catalog.js'
import { cachedChannel, downloadBundle, forgetChannel, loadChannel, normalizeChannel } from './channel.js'
import { type EmbeddedEntry, embeddedEntries, startEmbedEngine } from './embed/engine.js'
import { type StringKey, t, tf } from './i18n.js'
import homeSvg from './icons/home.svg'
import pluginsSvg from './icons/plugins.svg'
import settingsSvg from './icons/settings.svg'
import { ensureNavbar, navbarReady } from './navbar.js'
import { DEFAULT_CHANNEL, type Source, addChannel, channelKey, listSources, removeChannel, setEnabled } from './sources.js'

interface Installed {
  id: string
  version: string
  enabled: boolean
}

type Filter = 'all' | 'installed' | 'updates'

// The marketplace merges every enabled source: the official and the user GitHub catalogs plus Telegram channels.
type SourceKey = string

const filters = (): { key: Filter, label: string }[] => [
  { key: 'all', label: t('filter_all') },
  { key: 'installed', label: t('filter_installed') },
  { key: 'updates', label: t('filter_updates') },
]

let embedState = 'off'
try {
  const engine = startEmbedEngine()
  embedState = engine.hooked ? 'on' : `off (${engine.reason})`
} catch (e) {
  embedState = `off (${(e as Error).message})`
}

// The market bridge exists only in entinyGram. In plain inugram its class is missing, so the SDK runs standalone:
// it still browses the catalog and embeds settings, but cannot list or install plugins itself.
const BRIDGE_CLASS = 'desu.inugram.helpers.entiny.EntinyMarketBridge'
const DEFAULT_INDEX_URL = 'https://raw.githubusercontent.com/entinyGram/plugins/main/index.json'

type Bridge = ReturnType<typeof inu.jvm.cls>
let bridgeRef: Bridge | null | undefined
function bridge(): Bridge | null {
  if (bridgeRef === undefined) {
    try {
      bridgeRef = inu.jvm.cls(BRIDGE_CLASS)
    } catch {
      bridgeRef = null
    }
  }
  return bridgeRef
}
const standalone = () => bridge() === null

function sourceUrl(key: SourceKey): string {
  const base = (bridge()?.callStatic('indexUrl') as string | undefined) ?? DEFAULT_INDEX_URL
  if (key === 'user') return base.replace(/index\.json$/, 'user-plugins/index.json')
  return base
}

function sourceOf(key: SourceKey): Source | undefined {
  return listSources().find(source => source.key === key)
}

function sourceLabel(key: SourceKey): string {
  if (key === 'official') return t('source_official')
  if (key === 'user') return t('source_user')
  const channel = sourceOf(key)?.channel
  return channel ? `@${channel}` : key
}

function sourceIcon(source: Source): inu.UIIcon {
  return inu.icons.common(source.kind === 'official' ? 'star' : source.kind === 'user' ? 'user' : 'channel')
}

function activeKeys(): SourceKey[] {
  return listSources().filter(source => source.enabled).map(source => source.key)
}

const catalogs = new Map<SourceKey, CatalogPlugin[] | null>()
let loading = false
let refreshing = false
/** epoch ms of the last catalog load that returned at least one index */
let lastUpdated = 0
const failures = new Map<SourceKey, string>()
let query = ''
let filter: Filter = 'all'
let sourceFilter = 'all'

// What one render shares between its tabs: the installed list and the merged catalog are built once per pass.
let frame: { installed: Installed[], merged: Entry[] | null } | null = null
let installedCache: { at: number, list: Installed[] } | null = null
let subPage: { invalidate(): void } | null = null

/** the main page and the section page opened from its Settings tab render together */
function refreshAll() {
  page.invalidate()
  try {
    subPage?.invalidate()
  } catch {}
}
const INSTALLED_TTL_MS = 1500
const icons = new Map<string, inu.UIIcon>()

// --- versions ----------------------------------------------------------------------------------------------------

function compare(a: string, b: string): number {
  const [coreA, preA] = a.split(/-(.+)/)
  const [coreB, preB] = b.split(/-(.+)/)
  const pa = coreA.split('.').map(n => parseInt(n, 10) || 0)
  const pb = coreB.split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  if (preA === preB) return 0
  if (preA === undefined) return 1
  if (preB === undefined) return -1
  return preA < preB ? -1 : 1
}

function newest(plugin: CatalogPlugin): CatalogVersion | undefined {
  return [...plugin.versions].sort((x, y) => compare(y.version, x.version))[0]
}

// Without the bridge the installed set is read from the app's plugin directory: every .inu.js there carries its
// id and version in the ==InuPlugin== header. The engine does not expose which of them are switched off.
function scanInstalled(): Installed[] {
  const found = new Map<string, Installed>()
  const decoder = new TextDecoder()
  const visit = (dir: string, depth: number) => {
    for (const name of inu.fs.readdir(dir)) {
      const full = `${dir}/${name}`
      const info = inu.fs.stat(full)
      if (info.isDirectory) {
        if (depth < 3) visit(full, depth + 1)
        continue
      }
      if (!/\.js$/.test(name) || info.size > 4_000_000) continue
      const head = decoder.decode(inu.fs.read(full).subarray(0, 4096))
      const block = head.split('==InuPlugin==')[1]?.split('==/InuPlugin==')[0]
      const id = block?.match(/@id\s+(\S+)/)?.[1]
      const version = block?.match(/@version\s+(\S+)/)?.[1]
      if (id && version) found.set(id, { id, version, enabled: true })
    }
  }
  try {
    visit(inu.android.getPluginsDir(), 0)
  } catch (e) {
    console.log('scanning installed plugins failed', e)
  }
  return [...found.values()]
}

function readInstalled(): Installed[] {
  const native = bridge()
  if (!native) return scanInstalled()
  try {
    return JSON.parse(native.callStatic('installed') as string) as Installed[]
  } catch (e) {
    console.log('installed list failed', e)
    return []
  }
}

function installedList(): Installed[] {
  if (frame) return frame.installed
  const now = Date.now()
  if (installedCache && now - installedCache.at < INSTALLED_TTL_MS) return installedCache.list
  const list = readInstalled()
  installedCache = { at: now, list }
  return list
}

type State = 'new' | 'update' | 'installed'

function stateOf(plugin: CatalogPlugin, installed: Installed[]): { state: State, local?: Installed } {
  const local = installed.find(p => p.id === plugin.id)
  if (!local) return { state: 'new' }
  const top = newest(plugin)
  return { state: top && compare(top.version, local.version) > 0 ? 'update' : 'installed', local }
}

function unmet(version: CatalogVersion, installed: Installed[]): string[] {
  return (version.requires ?? []).filter(req => !installed.some(p => req.startsWith(p.id)))
}

// --- loading -----------------------------------------------------------------------------------------------------

function candidates(url: string): string[] {
  const list = [url]
  if (url.includes('/main/')) list.push(url.replace('/main/', '/dev/'))
  return list
}

async function loadCatalog(key: SourceKey, suffix = ''): Promise<void> {
  const url = sourceUrl(key) + suffix
  let problem = 'not found'
  for (const candidate of candidates(url)) {
    try {
      const res = await fetch(candidate)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const root = await res.json() as { plugins: CatalogPlugin[] }
      const dir = candidate.slice(0, candidate.lastIndexOf('/') + 1)
      catalogs.set(key, root.plugins.map(p => ({
        ...p,
        name: p.name || p.id,
        icon: p.icon && (/^https?:/.test(p.icon) ? p.icon : dir + p.icon),
        versions: p.versions.map(v => ({ ...v, file: /^https?:/.test(v.file) ? v.file : dir + v.file })),
      })))
      failures.delete(key)
      return
    } catch (e) {
      problem = (e as Error).message
    }
  }
  failures.set(key, problem)
}

async function loadFromChannel(key: SourceKey, force: boolean): Promise<void> {
  const channel = sourceOf(key)?.channel
  if (!channel) return
  const cached = cachedChannel(channel)
  if (cached && !catalogs.get(key)) {
    catalogs.set(key, cached)
    refreshAll()
  }
  try {
    catalogs.set(key, await loadChannel(channel, force))
    failures.delete(key)
  } catch (e) {
    failures.set(key, (e as Error).message || String(e))
  }
}

async function load(manual = false) {
  if (loading) return
  loading = true
  refreshing = manual
  failures.clear()
  refreshAll()
  // a manual refresh bypasses any cache the fetch layer keeps: the query makes the URL fresh
  const suffix = manual ? `?t=${Date.now()}` : ''
  const keys = activeKeys()
  for (const key of [...catalogs.keys()]) if (!keys.includes(key)) catalogs.delete(key)
  await Promise.all(keys.map(key => key === 'official' || key === 'user' ? loadCatalog(key, suffix) : loadFromChannel(key, manual)))
  loading = false
  refreshing = false
  const failed = [...failures.entries()]
  if (failed.length === 0) {
    lastUpdated = Date.now()
    if (manual) {
      try { inu.ui.toast(t('catalog_updated')) } catch {}
    }
  } else if (manual) {
    try {
      await inu.ui.dialog({
        title: t('refresh_fail_title'),
        message: failed.map(([key, error]) => `${sourceLabel(key)}: ${error}`).join('\n'),
        positive: t('ok'),
      })
    } catch {}
    return
  }
  refreshAll()
  void loadIcons()
}

async function loadIcons() {
  await Promise.all([...catalogs.values()].flatMap(group => (group ?? [])).map(async (plugin) => {
    if (!plugin.icon || icons.has(plugin.id)) return
    try {
      const res = await fetch(plugin.icon)
      if (res.ok) icons.set(plugin.id, inu.icons.svg(await res.text()))
    } catch (e) {
      console.log(`icon of ${plugin.id} failed`, e)
    }
  }))
  refreshAll()
}

// Release assets are served as downloads under the same <Name>-<version>.inu.js name the build workflow gives them,
// so in inugram (no entinyGram bridge) the newest version is fetched from the latest release instead of a raw file the
// browser would just display. Official packages keep the `entinyGram ` prefix, user plugins keep their own name.
function releaseUrl(plugin: CatalogPlugin, version: CatalogVersion, key: SourceKey): string {
  if (newest(plugin)?.version !== version.version) return version.file
  const base = key === 'official' && !/^entinygram/i.test(plugin.name) ? `entinyGram ${plugin.name}` : plugin.name
  const file = `${base.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')}-${version.version}.inu.js`
  return `https://github.com/entinyGram/plugins/releases/latest/download/${file}`
}

async function installFromChannel(plugin: CatalogPlugin, version: CatalogVersion, source: UIPageLike, key: SourceKey): Promise<void> {
  const native = bridge()
  if (!native) {
    inu.ui.toast(t('channel_install_standalone'))
    return
  }
  const ref = parseChannelFile(version.file)
  if (!ref) return
  if (!sourceOf(key)?.builtin) {
    const risky = riskyGrants(version)
    const answer = await inu.ui.dialog({
      title: tf('trust_title', sourceLabel(key)),
      message: tf('trust_msg', (version.grants?.length ? version.grants : [t('trust_none')]).join(', ')) + (risky.length ? `

⚠ ${risky.join(', ')}` : ''),
      positive: tf('btn_install', version.version),
      negative: t('cancel'),
    })
    if (answer !== 'positive') return
  }
  let path: string
  try {
    path = await downloadBundle(ref.channel, ref.messageId)
  } catch (e) {
    inu.ui.toast(tf('download_failed', (e as Error).message || String(e)))
    return
  }
  try {
    native.callStatic('installFile', path)
  } catch {
    inu.ui.toast(t('channel_install_old'))
    return
  }
  for (const delay of [3000, 8000, 20000]) setTimeout(() => { page.invalidate(); source.invalidate() }, delay)
}

async function install(plugin: CatalogPlugin, version: CatalogVersion, source: UIPageLike, key: SourceKey) {
  if (parseChannelFile(version.file)) return installFromChannel(plugin, version, source, key)
  const native = bridge()
  if (!native) {
    // inugram only imports plugins from a file the user opens, so hand over the link and the expected checksum
    const link = releaseUrl(plugin, version, key)
    inu.clipboard.write(link)
    const answer = await inu.ui.dialog({
      title: t('install_file_title'),
      message: [
        t('install_file_msg'),
        version.sha256 ? `SHA-256: ${version.sha256}` : '',
      ].filter(Boolean).join('\n\n'),
      positive: t('open_link'),
      negative: t('close'),
    })
    if (answer === 'positive') inu.openUrl(link)
    return
  }
  native.callStatic('install', version.file, version.sha256 ?? '')
  // the install sheet is the app's own; pick up its result once the user is done with it
  for (const delay of [3000, 8000, 20000]) setTimeout(() => { page.invalidate(); source.invalidate() }, delay)
}

type UIPageLike = { invalidate(): void }

// --- plugin page -------------------------------------------------------------------------------------------------

// The "about" card: description, author, where the plugin comes from, its id and the SDK it needs, each row with an
// icon. Tap a row to see the full text.
function aboutRows(plugin: CatalogPlugin, source: SourceKey): inu.UIElement[] {
  const rows: inu.UIElement[] = []
  const top = newest(plugin)

  rows.push(inu.ui.header(t('about')))
  rows.push(inu.ui.button({
    id: 'hero',
    text: plugin.name,
    subtitle: [sourceLabel(source), plugin.author].filter(Boolean).join(' · '),
    icon: icons.get(plugin.id) ?? inu.icons.common(source === 'official' ? 'star' : source === 'user' ? 'user' : 'channel'),
    value: top ? `v${top.version}` : undefined,
    onClick: async () => {
      await inu.ui.dialog({
        title: plugin.name,
        message: [
          plugin.id,
          tf('published_versions', plugin.versions.length),
          top ? `${t('status_latest')}: v${top.version}${top.date ? ` (${top.date})` : ''}` : '',
        ].filter(Boolean).join('\n'),
        positive: t('close'),
      })
    },
  }))

  rows.push(inu.ui.button({
    id: 'desc',
    text: t('about_desc'),
    subtitle: plugin.description || t('no_desc'),
    icon: inu.icons.common('info'),
    onClick: async () => {
      await inu.ui.dialog({
        title: `${plugin.name} — ${t('about_desc')}`,
        message: plugin.description || t('no_desc'),
        positive: t('close'),
      })
    },
  }))

  if (plugin.author) {
    rows.push(inu.ui.button({
      id: 'author',
      text: t('about_author'),
      subtitle: plugin.author,
      icon: inu.icons.common('user'),
      onClick: async () => {
        await inu.ui.dialog({ title: t('about_author'), message: plugin.author, positive: t('close') })
      },
    }))
  }

  rows.push(inu.ui.button({
    id: 'source',
    text: t('about_source'),
    subtitle: source === 'official' ? t('source_official_desc') : source === 'user' ? t('source_user_desc') : tf('source_channel_desc', sourceLabel(source)),
    icon: sourceOf(source) ? sourceIcon(sourceOf(source)!) : inu.icons.common('user'),
    onClick: async () => {
      await inu.ui.dialog({
        title: t('about_source'),
        message: source === 'official' ? t('source_official_msg') : source === 'user' ? t('source_user_msg') : tf('source_channel_msg', sourceLabel(source)),
        positive: t('close'),
      })
    },
  }))

  rows.push(inu.ui.button({
    id: 'id',
    text: t('about_id'),
    subtitle: plugin.id,
    icon: inu.icons.common('link'),
    onClick: () => {
      try {
        inu.clipboard.write(plugin.id)
        inu.ui.toast(t('id_copied'))
      } catch {
        // clipboard.write is not granted in this build
      }
    },
  }))

  if (top?.requires?.length) {
    rows.push(inu.ui.button({
      id: 'deps',
      text: t('about_requires'),
      subtitle: top.requires.join(', '),
      icon: inu.icons.common('lock'),
      onClick: () => {
        // informational row
      },
    }))
  }

  if (top?.size) {
    rows.push(inu.ui.button({
      id: 'size',
      text: t('size_label'),
      subtitle: top.size,
      icon: inu.icons.common('archive'),
      onClick: () => {
        // informational row
      },
    }))
  }

  return rows
}

function permissionText(grant: string): string {
  const name = grant.trim().replace(/\(.*$/, '')
  if (name === 'jvm') return t('perm_jvm')
  if (name === 'xposed') return t('perm_xposed')
  if (name === 'fetch') return t('perm_fetch')
  if (name === 'fs') return t('perm_fs')
  if (/^(peers|messages|dialogs|history|self|draft|read)$/.test(name)) return t('perm_account')
  return t('perm_other')
}

// A channel post lists the grants the bundle asks for; the GitHub catalogs do not, so only those plugins get this card.
function permissionRows(version: CatalogVersion | undefined): inu.UIElement[] {
  const grants = version?.grants ?? []
  if (!grants.length) return []
  const risky = new Set(riskyGrants(version))
  const rows: inu.UIElement[] = [inu.ui.header(t('perms'))]
  for (const grant of grants) {
    rows.push(inu.ui.button({
      id: `g:${grant}`,
      text: `${risky.has(grant.trim()) ? '⚠ ' : ''}${grant}`,
      subtitle: permissionText(grant),
      icon: inu.icons.common(risky.has(grant.trim()) ? 'eye' : 'lock'),
      danger: risky.has(grant.trim()),
      onClick: () => {
        // informational row
      },
    }))
  }
  if (risky.size) rows.push(inu.ui.separator(t('perms_footer')))
  return rows
}

function openPlugin(plugin: CatalogPlugin, source: SourceKey) {
  const detail: inu.ui.UIPage = inu.ui.settingsPage({
    title: plugin.name,
    transient: true,
    items: () => {
      const installed = installedList()
      const { state, local } = stateOf(plugin, installed)
      const top = newest(plugin)
      const rows: inu.UIElement[] = []

      rows.push(...aboutRows(plugin, source))
      rows.push(...permissionRows(top))

      rows.push(inu.ui.header(t('installation')))
      if (top) {
        const missing = unmet(top, installed)
        const label = state === 'new' ? tf('btn_install', top.version) : state === 'update' ? tf('btn_update', top.version) : t('btn_reinstall')
        rows.push(inu.ui.button({
          id: 'main',
          text: label,
          subtitle: missing.length ? tf('needs_deps', missing.join(', ')) : local ? tf('installed_ver', local.version) : top.date ? tf('published_date', top.date) : undefined,
          icon: inu.icons.common(state === 'installed' ? 'refresh' : 'download'),
          onClick: () => install(plugin, top, detail, source),
        }))
      }

      if (local) {
        rows.push(inu.ui.button({
          id: 'remove',
          text: t('btn_remove'),
          subtitle: tf('installed_ver_sub', local.version),
          icon: inu.icons.common('delete'),
          onClick: async () => {
            const answer = await inu.ui.dialog({
              title: tf('remove_title', plugin.name),
              message: t('remove_msg'),
              positive: t('remove_confirm'),
              negative: t('cancel'),
            })
            if (answer !== 'positive') return
            try {
              const native = bridge()
              if (!native) throw new Error('standalone')
              native.callStatic('remove', plugin.id)
              setTimeout(() => { page.invalidate(); detail.invalidate() }, 1000)
            } catch (error) {
              console.warn('plugin removal is unavailable in the app bridge', error)
              await inu.ui.dialog({
                title: t('remove_unavail_title'),
                message: t('remove_unavail_msg'),
                positive: t('ok'),
              })
            }
          },
        }))
      }

      rows.push(inu.ui.header(t('history')))
      for (const version of [...plugin.versions].sort((x, y) => compare(y.version, x.version))) {
        const here = local && compare(version.version, local.version) === 0
        const note = (version.notes ?? '').split('\n').find(l => l.trim())
        rows.push(inu.ui.button({
          id: `v:${version.version}`,
          text: `v${version.version}`,
          subtitle: [version.date, note].filter(Boolean).join('\n') || undefined,
          icon: inu.icons.common(here ? 'check' : 'bookmark'),
          value: here ? t('status_installed') : version === top ? t('status_latest') : undefined,
          onClick: async () => {
            const missing = unmet(version, installed)
            const answer = await inu.ui.dialog({
              title: `${plugin.name} v${version.version}`,
              message: [version.notes?.trim(), missing.length ? tf('needs_deps', missing.join(', ')) : ''].filter(Boolean).join('\n\n') || t('confirm_install_ver'),
              positive: here ? t('btn_reinstall') : local && compare(version.version, local.version) < 0 ? t('btn_downgrade') : tf('btn_install', version.version),
              negative: t('cancel'),
            })
            if (answer === 'positive') install(plugin, version, detail, source)
          },
        }))
      }
      rows.push(inu.ui.separator(tf('published_versions', plugin.versions.length)))
      return rows
    },
  })
  inu.ui.openPage(detail)
}

// --- marketplace -------------------------------------------------------------------------------------------------

type Tab = 'home' | 'plugins' | 'settings'
const TABS: Tab[] = ['home', 'plugins', 'settings']
let tab: Tab = 'home'

const tabLabel = (key: Tab) => t(`tab_${key}` as StringKey)
const TAB_SVG: Record<Tab, string> = { home: homeSvg, plugins: pluginsSvg, settings: settingsSvg }

function row(plugin: CatalogPlugin, source: SourceKey, installed: Installed[]): inu.UIElement {
  const { state, local } = stateOf(plugin, installed)
  const top = newest(plugin)
  const mark = riskyGrants(top).length ? '⚠ ' : ''
  const value = state === 'update' ? `${mark}v${top?.version}` : state === 'installed' ? t('status_installed') : top ? `${mark}v${top.version}` : undefined
  const icon = state === 'update' ? 'refresh' : state === 'installed' ? 'check' : 'download'
  const subtitle = state === 'update' && local
    ? `v${local.version} → v${top?.version}`
    : [plugin.author, plugin.description].filter(Boolean).join(' · ')
  return inu.ui.button({
    id: `p:${plugin.id}`,
    text: plugin.name,
    subtitle: subtitle || undefined,
    value,
    icon: icons.get(plugin.id) ?? inu.icons.common(icon),
    onClick: () => openPlugin(plugin, source),
  })
}

interface Entry {
  key: SourceKey
  plugin: CatalogPlugin
  state: State
  local?: Installed
}

/** Every loaded plugin once: the same plugin in two sources is listed from the source that comes first. */
function merged(installed: Installed[]): Entry[] {
  if (frame?.merged) return frame.merged
  const seen = new Set<string>()
  const result = activeKeys().filter(key => catalogs.get(key)).flatMap(key => (catalogs.get(key) ?? [])
    .filter((plugin) => {
      if (seen.has(plugin.id)) return false
      seen.add(plugin.id)
      return true
    })
    .map(plugin => ({ key, plugin, ...stateOf(plugin, installed) })))
  if (frame) frame.merged = result
  return result
}

function refreshRow(unique: number, loadedSources: number): inu.UIElement {
  const clock = lastUpdated
    ? tf('updated_at', `${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`)
    : t('never_updated')
  return inu.ui.button({
    id: 'refresh',
    text: refreshing ? t('refreshing') : t('refresh_catalog'),
    subtitle: refreshing ? t('refreshing_sub') : `${clock} · ${tf('catalog_count', unique, loadedSources)}`,
    icon: refreshing ? inu.icons.animation('loading') : inu.icons.common('refresh'),
    onClick: () => { void load(true) },
  })
}

/** What the catalog tabs show while nothing is loaded yet, or every source failed. */
function emptyState(): inu.UIElement[] | null {
  if (activeKeys().some(key => catalogs.get(key))) return null
  const problems = [...failures.entries()].map(([key, error]) => `${sourceLabel(key)}: ${error}`)
  return [
    inu.ui.separator(loading ? t('loading_catalog') : problems.length ? tf('catalog_fail', problems.join(' · ')) : t('unknown_error')),
    inu.ui.button({ id: 'retry', text: t('try_again'), icon: inu.icons.common('refresh'), onClick: () => { void load() } }),
    inu.ui.button({ id: 'to-settings', text: tabLabel('settings'), subtitle: t('sources_title'), icon: inu.icons.common('settings'), onClick: () => { tab = 'settings' } }),
  ]
}

// --- sources -----------------------------------------------------------------------------------------------------

async function addSource() {
  const input = await inu.ui.prompt({ title: t('source_add_title'), hint: t('source_add_sub') })
  if (input === null) return
  const channel = normalizeChannel(input)
  if (!channel) {
    inu.ui.toast(t('source_add_bad'))
    return
  }
  if (listSources().some(source => source.key === channelKey(channel))) {
    inu.ui.toast(t('source_exists'))
    return
  }
  const answer = await inu.ui.dialog({
    title: tf('source_add_warn_title', `@${channel}`),
    message: t('source_add_warn_msg'),
    positive: t('source_add_confirm'),
    negative: t('cancel'),
  })
  if (answer !== 'positive') return
  let found: CatalogPlugin[]
  try {
    found = await loadChannel(channel, true)
  } catch (e) {
    inu.ui.toast(tf('source_failed', (e as Error).message || String(e)))
    return
  }
  if (!found.length) {
    forgetChannel(channel)
    inu.ui.toast(t('source_empty'))
    return
  }
  addChannel(channel)
  catalogs.set(channelKey(channel), found)
  inu.ui.toast(t('source_added'))
  refreshAll()
}

async function removeSource(source: Source) {
  if (!source.channel) return
  const answer = await inu.ui.dialog({
    title: tf('source_remove_title', sourceLabel(source.key)),
    message: t('source_remove_msg'),
    positive: t('remove_confirm'),
    negative: t('cancel'),
  })
  if (answer !== 'positive') return
  removeChannel(source.channel)
  forgetChannel(source.channel)
  catalogs.delete(source.key)
  failures.delete(source.key)
  if (sourceFilter === source.key) sourceFilter = 'all'
  refreshAll()
}

function sourceRows(): inu.UIElement[] {
  const rows: inu.UIElement[] = []
  for (const source of listSources()) {
    const list = catalogs.get(source.key)
    const error = failures.get(source.key)
    const status = !source.enabled ? t('source_off') : error ? tf('source_failed', error) : list ? tf('source_count', list.length) : loading ? t('source_loading') : ''
    const about = source.kind === 'official' ? t('source_official_desc') : source.kind === 'user' ? t('source_user_desc') : tf('source_channel_desc', sourceLabel(source.key))
    rows.push(inu.ui.check({
      id: `s:${source.key}`,
      text: sourceLabel(source.key),
      subtitle: [about, status].filter(Boolean).join('\n'),
      icon: sourceIcon(source),
      checked: source.enabled,
      onChange: (on) => {
        setEnabled(source.key, on)
        void load()
      },
      onSecondaryClick: source.builtin ? undefined : () => { void removeSource(source) },
    }))
  }
  rows.push(inu.ui.button({
    id: 'add',
    text: t('source_add'),
    subtitle: t('source_add_sub'),
    icon: inu.icons.common('plus'),
    onClick: () => { void addSource() },
  }))
  rows.push(inu.ui.separator(t('sources_footer')))
  return rows
}

// --- tabs --------------------------------------------------------------------------------------------------------

function homeRows(): inu.UIElement[] {
  const blocked = emptyState()
  if (blocked) return blocked
  const installed = installedList()
  const all = merged(installed)
  const rows: inu.UIElement[] = []
  const byDate = (a: Entry, b: Entry) => (newest(b.plugin)?.date ?? '').localeCompare(newest(a.plugin)?.date ?? '')

  const updates = all.filter(x => x.state === 'update').sort((a, b) => a.plugin.name.localeCompare(b.plugin.name))
  rows.push(inu.ui.header('entinyGram'))
  rows.push(inu.ui.button({
    id: 'hero',
    text: t('home_title'),
    subtitle: tf('home_stats', installed.length, updates.length, all.length),
    icon: inu.icons.common('star'),
    onClick: () => { tab = 'plugins' },
  }))

  if (updates.length) {
    rows.push(inu.ui.header(tf('home_updates', updates.length)))
    for (const x of updates) rows.push(row(x.plugin, x.key, installed))
  } else if (installed.length) {
    rows.push(inu.ui.separator(t('home_all_current')))
  }

  const fresh = all.filter(x => x.state === 'new').sort(byDate).slice(0, 5)
  if (fresh.length) {
    rows.push(inu.ui.header(t('home_new')))
    for (const x of fresh) rows.push(row(x.plugin, x.key, installed))
  }

  const recent = all.filter(x => x.state !== 'update' && !fresh.includes(x)).sort(byDate).slice(0, 4)
  if (recent.length) {
    rows.push(inu.ui.header(t('home_recent')))
    for (const x of recent) rows.push(row(x.plugin, x.key, installed))
  }
  rows.push(inu.ui.button({
    id: 'more',
    text: t('home_more'),
    icon: inu.icons.common('forward'),
    onClick: () => { tab = 'plugins' },
  }))

  rows.push(refreshRow(all.length, activeKeys().filter(key => catalogs.get(key)).length))
  return rows
}

const PREVIEW_ROWS = 5

/** the whole list of a section on a screen of its own, built fresh from the catalog each time it renders */
function openList(title: string, pick: (all: Entry[]) => Entry[]) {
  const sub: inu.ui.UIPage = inu.ui.settingsPage({
    title,
    transient: true,
    onClose: () => { if (subPage === sub) subPage = null },
    items: () => {
      const installed = installedList()
      const list = pick(merged(installed)).sort((a, b) => a.plugin.name.localeCompare(b.plugin.name))
      return list.length ? list.map(x => row(x.plugin, x.key, installed)) : [inu.ui.separator(t('empty_list'))]
    },
  })
  subPage = sub
  inu.ui.openPage(sub)
}

function moreRow(id: string, count: number, title: string, pick: (all: Entry[]) => Entry[]): inu.UIElement {
  return inu.ui.button({
    id: `more:${id}`,
    text: tf('show_all', count),
    icon: inu.icons.common('forward'),
    onClick: () => openList(title, pick),
  })
}

function pluginsRows(): inu.UIElement[] {
  const rows: inu.UIElement[] = []
  const keys = activeKeys()

  rows.push(inu.ui.button({
    id: 'search',
    text: t('search_title'),
    subtitle: query || t('search_hint'),
    icon: inu.icons.common('search'),
    onClick: async () => {
      const value = await inu.ui.prompt({ title: t('search_prompt_title'), hint: t('search_hint'), value: query, selectAll: true })
      if (value !== null) {
        query = value.trim()
        page.invalidate()
      }
    },
  }))
  rows.push(inu.ui.select({
    id: 'filter',
    text: t('filter_title'),
    icon: inu.icons.common('more'),
    items: filters().map(f => f.label),
    selected: Math.max(0, filters().findIndex(f => f.key === filter)),
    onChange: (index) => { filter = filters()[index].key },
  }))

  const blocked = emptyState()
  if (blocked) return [...rows, ...blocked]

  const installed = installedList()
  const needle = query.toLowerCase()
  const unique = merged(installed)
  const shown = unique
    .filter(x => sourceFilter === 'all' || x.key === sourceFilter)
    .filter(x => !needle || [x.plugin.name, x.plugin.id, x.plugin.author, x.plugin.description, sourceLabel(x.key)].some(s => s?.toLowerCase().includes(needle)))
    .filter(x => filter === 'all' || (filter === 'installed' ? x.state !== 'new' : x.state === 'update'))

  // Installed plugins are one section whatever source they came from, updates first. Every source then gets a section of
  // its own with what is not installed yet. A long section shows its first few rows and opens the rest on its own screen.
  const byName = (a: Entry, b: Entry) => a.plugin.name.localeCompare(b.plugin.name)
  const mine = shown.filter(x => x.state !== 'new').sort((a, b) => (a.state === 'update' ? 0 : 1) - (b.state === 'update' ? 0 : 1) || byName(a, b))
  if (mine.length) {
    rows.push(inu.ui.header(`${t('sec_installed')} · ${mine.length}`))
    for (const x of mine.slice(0, PREVIEW_ROWS)) rows.push(row(x.plugin, x.key, installed))
    if (mine.length > PREVIEW_ROWS) rows.push(moreRow('installed', mine.length, t('sec_installed'), all => all.filter(x => x.state !== 'new')))
  }

  for (const key of keys) {
    const group = shown.filter(x => x.key === key && x.state === 'new').sort(byName)
    const error = failures.get(key)
    if (!group.length && !(error && (sourceFilter === 'all' || sourceFilter === key))) continue
    rows.push(inu.ui.header(group.length ? `${sourceLabel(key)} · ${group.length}` : sourceLabel(key)))
    if (error) {
      rows.push(inu.ui.button({
        id: `err:${key}`,
        text: tf('source_failed', error),
        icon: inu.icons.common('info'),
        danger: true,
        onClick: () => { tab = 'settings' },
      }))
    }
    for (const x of group.slice(0, PREVIEW_ROWS)) rows.push(row(x.plugin, x.key, installed))
    if (group.length > PREVIEW_ROWS) rows.push(moreRow(key, group.length, sourceLabel(key), all => all.filter(x => x.key === key && x.state === 'new')))
  }
  if (!shown.length) rows.push(inu.ui.separator(query ? t('empty_search') : t('empty_list')))

  rows.push(refreshRow(unique.length, keys.filter(key => catalogs.get(key)).length))
  return rows
}

let entriesCache: { at: number, list: EmbeddedEntry[] } | null = null
const ENTRIES_TTL_MS = 5000

function entriesList(): EmbeddedEntry[] {
  if (entriesCache && Date.now() - entriesCache.at <= ENTRIES_TTL_MS) return entriesCache.list
  try {
    const list = embeddedEntries()
    entriesCache = { at: Date.now(), list }
    return list
  } catch (e) {
    console.log('reading plugin entries failed', e)
    return entriesCache?.list ?? []
  }
}

function entryRows(): inu.UIElement[] {
  const entries = entriesList()
  const rows: inu.UIElement[] = []
  for (const entry of entries) {
    rows.push(inu.ui.button({
      id: `e:${entry.id}`,
      text: entry.name,
      subtitle: entry.screen ? t('entry_open') : t('entry_inline'),
      icon: inu.icons.common(entry.screen ? 'settings' : 'link'),
      onClick: () => {
        if (entry.screen) entry.open()
      },
    }))
  }
  rows.push(inu.ui.separator(entries.length ? t('settings_entries_footer') : t('entry_none')))
  return rows
}

function installedRows(): inu.UIElement[] {
  const installed = installedList()
  if (!installed.length) return [inu.ui.separator(t('empty_list'))]
  const known = new Map<string, { plugin: CatalogPlugin, key: SourceKey }>()
  for (const x of merged(installed)) known.set(x.plugin.id, { plugin: x.plugin, key: x.key })
  const rows: inu.UIElement[] = []
  for (const plugin of [...installed].sort((a, b) => a.id.localeCompare(b.id))) {
    const hit = known.get(plugin.id)
    rows.push(inu.ui.button({
      id: `i:${plugin.id}`,
      text: hit?.plugin.name ?? plugin.id,
      subtitle: `v${plugin.version}${hit ? '' : ` · ${plugin.id}`}`,
      value: plugin.enabled ? undefined : t('status_off'),
      icon: icons.get(plugin.id) ?? inu.icons.common(plugin.enabled ? 'check' : 'eyeOff'),
      onClick: () => { if (hit) openPlugin(hit.plugin, hit.key) },
    }))
  }
  return rows
}

// Opens the plugins channel inside the app; if the channel cannot be resolved the link goes to whatever handles t.me.
async function openPluginsChannel() {
  try {
    const peer = await inu.account().resolvePeer(DEFAULT_CHANNEL) as unknown as { _: string, channel_id?: number }
    if (peer._ === 'inputPeerChannel' && typeof peer.channel_id === 'number') {
      inu.ui.openPage({ type: 'chat', dialogId: -peer.channel_id })
      return
    }
  } catch (e) {
    console.log('opening the channel in the app failed', e)
  }
  inu.openUrl(`https://t.me/${DEFAULT_CHANNEL}`)
}

type Section = 'installed' | 'sources' | 'entries'

function openSection(section: Section) {
  const sub: inu.ui.UIPage = inu.ui.settingsPage({
    title: section === 'installed' ? t('settings_installed') : section === 'sources' ? t('sources_title') : t('settings_entries'),
    transient: true,
    onClose: () => { if (subPage === sub) subPage = null },
    items: () => section === 'installed' ? installedRows() : section === 'sources' ? sourceRows() : entryRows(),
  })
  subPage = sub
  inu.ui.openPage(sub)
}

function settingsRows(): inu.UIElement[] {
  const installed = installedList()
  const updates = merged(installed).filter(x => x.state === 'update').length
  const sources = listSources()
  return [
    inu.ui.button({
      id: 'sec-installed',
      text: t('settings_installed'),
      subtitle: tf('settings_installed_sub', installed.length, updates),
      value: String(installed.length),
      icon: inu.icons.common('download'),
      onClick: () => openSection('installed'),
    }),
    inu.ui.button({
      id: 'sec-sources',
      text: t('sources_title'),
      subtitle: tf('sources_sub', sources.filter(source => source.enabled).length, sources.length),
      icon: inu.icons.common('channel'),
      onClick: () => openSection('sources'),
    }),
    inu.ui.button({
      id: 'sec-entries',
      text: t('settings_entries'),
      subtitle: tf('settings_entries_sub', entriesList().length),
      icon: inu.icons.common('settings'),
      onClick: () => openSection('entries'),
    }),
    inu.ui.header(t('settings_about')),
    inu.ui.button({
      id: 'about-sdk',
      text: 'entinyGram SDK',
      subtitle: tf('settings_about_sub', SDK_VERSION, embedState),
      icon: inu.icons.common('info'),
      onClick: () => {
        // informational row
      },
    }),
    inu.ui.button({
      id: 'about-channel',
      text: t('about_channel'),
      subtitle: `@${DEFAULT_CHANNEL}`,
      icon: inu.icons.common('channel'),
      onClick: () => { void openPluginsChannel() },
    }),
    inu.ui.separator(tf('footer_info', SDK_VERSION, embedState, standalone() ? t('standalone_mode') : '')),
  ]
}

// --- the page ----------------------------------------------------------------------------------------------------

const page: inu.ui.UIPage = inu.ui.settingsPage({
  title: 'Marketplace',
  items: () => {
    const started = Date.now()
    if (activeKeys().every(key => !catalogs.get(key)) && failures.size === 0 && !loading) void load()
    frame = null
    frame = { installed: installedList(), merged: null }

    ensureNavbar({
      title: 'Marketplace',
      tabs: () => TABS.map((key) => {
        const label = tabLabel(key)
        const cut = label.indexOf(' ')
        return { svg: TAB_SVG[key], emoji: label.slice(0, cut), label: label.slice(cut + 1) }
      }),
      selected: () => TABS.indexOf(tab),
      onSelect: (index) => {
        if (TABS[index] === tab) return
        tab = TABS[index]
        page.invalidate()
      },
      onReady: () => page.invalidate(),
    })

    // the bottom bar replaces this row once it is on screen; without it (an app that cannot host the bar) the row stays
    const rows: inu.UIElement[] = navbarReady()
      ? []
      : [inu.ui.select({
          id: 'tab',
          text: t('tab_title'),
          icon: inu.icons.common('bookmark'),
          items: TABS.map(tabLabel),
          selected: TABS.indexOf(tab),
          onChange: (index) => { tab = TABS[index] },
        })]
    try {
      rows.push(...(tab === 'home' ? homeRows() : tab === 'plugins' ? pluginsRows() : settingsRows()))
    } finally {
      frame = null
    }
    console.log(`render ${tab}: ${Date.now() - started} ms, ${rows.length} rows`)
    return rows
  },
})

inu.registerSettings(page)
