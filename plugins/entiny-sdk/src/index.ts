import { SDK_VERSION } from '@entiny/sdk'
import { startEmbedEngine } from './embed/engine.js'
import { t, tf } from './i18n.js'

interface CatalogVersion {
  version: string
  date?: string
  notes?: string
  file: string
  sha256?: string
  requires?: string[]
}

interface CatalogPlugin {
  id: string
  name: string
  author?: string
  description?: string
  icon?: string
  versions: CatalogVersion[]
}

interface Installed {
  id: string
  version: string
  enabled: boolean
}

type Filter = 'all' | 'installed' | 'updates'

// The marketplace shows two groups: the official entinyGram catalog and the separate user repository with
// community plugins. Both live in the same GitHub repo; the user index is the one next to the official one.
type SourceKey = 'official' | 'user'

const SOURCE_KEYS: SourceKey[] = ['official', 'user']

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

function sourceLabel(key: SourceKey): string {
  return key === 'official' ? t('source_official') : t('source_user')
}

const catalogs = new Map<SourceKey, CatalogPlugin[] | null>([
  ['official', null],
  ['user', null],
])
let loading = false
let refreshing = false
/** epoch ms of the last catalog load that returned at least one index */
let lastUpdated = 0
const failures = new Map<SourceKey, string>()
let query = ''
let filter: Filter = 'all'
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

function installedList(): Installed[] {
  const native = bridge()
  if (!native) return scanInstalled()
  try {
    return JSON.parse(native.callStatic('installed') as string) as Installed[]
  } catch (e) {
    console.log('installed list failed', e)
    return []
  }
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

async function load(manual = false) {
  if (loading) return
  loading = true
  refreshing = manual
  failures.clear()
  page.invalidate()
  // a manual refresh bypasses any cache the fetch layer keeps: the query makes the URL fresh
  const suffix = manual ? `?t=${Date.now()}` : ''
  await Promise.all(SOURCE_KEYS.map(key => loadCatalog(key, suffix)))
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
  page.invalidate()
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
  page.invalidate()
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

async function install(plugin: CatalogPlugin, version: CatalogVersion, source: UIPageLike, key: SourceKey) {
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
    icon: icons.get(plugin.id) ?? inu.icons.common(source === 'official' ? 'star' : 'user'),
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
    subtitle: source === 'official' ? t('source_official_desc') : t('source_user_desc'),
    icon: inu.icons.common(source === 'official' ? 'star' : 'user'),
    onClick: async () => {
      await inu.ui.dialog({
        title: t('about_source'),
        message: source === 'official' ? t('source_official_msg') : t('source_user_msg'),
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

function row(plugin: CatalogPlugin, source: SourceKey, installed: Installed[]): inu.UIElement {
  const { state, local } = stateOf(plugin, installed)
  const top = newest(plugin)
  const value = state === 'update' ? `v${top?.version}` : state === 'installed' ? t('status_installed') : top ? `v${top.version}` : undefined
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

const page: inu.ui.UIPage = inu.ui.settingsPage({
  title: 'Marketplace',
  items: () => {
    const rows: inu.UIElement[] = []
    if ([...catalogs.values()].every(group => group === null) && failures.size === 0 && !loading) void load()

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

    const loaded = SOURCE_KEYS.filter(key => catalogs.get(key) !== null)
    if (loaded.length === 0) {
      const problems = [...failures.entries()].map(([key, error]) => `${sourceLabel(key)}: ${error}`)
      rows.push(inu.ui.separator(loading ? t('loading_catalog') : problems.length ? tf('catalog_fail', problems.join(' · ')) : t('unknown_error')))
      rows.push(inu.ui.button({
        id: 'retry', text: t('try_again'), icon: inu.icons.common('refresh'), onClick: () => { void load() },
      }))
      return rows
    }

    const installed = installedList()
    const needle = query.toLowerCase()
    const shown = loaded
      .flatMap(key => (catalogs.get(key) ?? []).map(plugin => ({ key, plugin, ...stateOf(plugin, installed) })))
      .filter(x => !needle || [x.plugin.name, x.plugin.id, x.plugin.author, x.plugin.description, sourceLabel(x.key)].some(s => s?.toLowerCase().includes(needle)))
      .filter(x => filter === 'all' || (filter === 'installed' ? x.state !== 'new' : x.state === 'update'))

    for (const key of loaded) {
      const group = shown.filter(x => x.key === key).sort((a, b) => a.plugin.name.localeCompare(b.plugin.name))
      if (!group.length) continue
      rows.push(inu.ui.header(sourceLabel(key)))
      const subsections: [string, typeof group][] = [
        [t('sec_updates'), group.filter(x => x.state === 'update')],
        [t('sec_installed'), group.filter(x => x.state === 'installed')],
        [t('sec_available'), group.filter(x => x.state === 'new')],
      ]
      const visible = subsections.filter(([, list]) => list.length > 0)
      // one state group needs no sub-header: the section header names the state already
      if (visible.length === 1) {
        for (const x of visible[0][1]) rows.push(row(x.plugin, x.key, installed))
      } else {
        for (const [title, list] of visible) {
          rows.push(inu.ui.header(title))
          for (const x of list) rows.push(row(x.plugin, x.key, installed))
        }
      }
    }
    if (!shown.length) rows.push(inu.ui.separator(query ? t('empty_search') : t('empty_list')))

    const clock = lastUpdated
      ? tf('updated_at', `${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`)
      : t('never_updated')
    rows.push(inu.ui.button({
      id: 'refresh',
      text: refreshing ? t('refreshing') : t('refresh_catalog'),
      subtitle: refreshing ? t('refreshing_sub') : clock,
      icon: refreshing ? inu.icons.animation('loading') : inu.icons.common('refresh'),
      onClick: () => { void load(true) },
    }))
    rows.push(inu.ui.separator(tf('footer_info', SDK_VERSION, embedState, standalone() ? t('standalone_mode') : '')))
    return rows
  },
})

inu.registerSettings(page)