import { SDK_VERSION } from '@entiny/sdk'
import { startEmbedEngine } from './embed/engine.js'

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

const ALL_FILTERS: { key: Filter, label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'installed', label: 'Installed' },
  { key: 'updates', label: 'Updates' },
]
const filters = () => ALL_FILTERS

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

let catalog: CatalogPlugin[] | null = null
let loading = false
let failure: string | null = null
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

async function load() {
  if (loading) return
  loading = true
  failure = null
  page.invalidate()
  const base = (bridge()?.callStatic('indexUrl') as string | undefined) ?? DEFAULT_INDEX_URL
  let problem = 'not found'
  for (const url of candidates(base)) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const root = await res.json() as { plugins: CatalogPlugin[] }
      const dir = url.slice(0, url.lastIndexOf('/') + 1)
      catalog = root.plugins.map(p => ({
        ...p,
        name: p.name || p.id,
        icon: p.icon && (/^https?:/.test(p.icon) ? p.icon : dir + p.icon),
        versions: p.versions.map(v => ({ ...v, file: /^https?:/.test(v.file) ? v.file : dir + v.file })),
      }))
      problem = ''
      break
    } catch (e) {
      problem = (e as Error).message
    }
  }
  failure = problem || null
  loading = false
  page.invalidate()
  void loadIcons()
}

async function loadIcons() {
  await Promise.all((catalog ?? []).map(async (plugin) => {
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

async function install(version: CatalogVersion, source: UIPageLike) {
  const native = bridge()
  if (!native) {
    // inugram only imports plugins from a file the user opens, so hand over the link and the expected checksum
    inu.clipboard.write(version.file)
    const answer = await inu.ui.dialog({
      title: 'Install from file',
      message: [
        'The download link is copied. Save the file, then open Settings → Plugins → Load from file and pick it.',
        version.sha256 ? `SHA-256: ${version.sha256}` : '',
      ].filter(Boolean).join('\n\n'),
      positive: 'Open link',
      negative: 'Close',
    })
    if (answer === 'positive') inu.openUrl(version.file)
    return
  }
  native.callStatic('install', version.file, version.sha256 ?? '')
  // the install sheet is the app's own; pick up its result once the user is done with it
  for (const delay of [3000, 8000, 20000]) setTimeout(() => { page.invalidate(); source.invalidate() }, delay)
}

type UIPageLike = { invalidate(): void }

// --- plugin page -------------------------------------------------------------------------------------------------

function openPlugin(plugin: CatalogPlugin) {
  const detail: inu.ui.UIPage = inu.ui.settingsPage({
    title: plugin.name,
    transient: true,
    items: () => {
      const installed = installedList()
      const { state, local } = stateOf(plugin, installed)
      const top = newest(plugin)
      const rows: inu.UIElement[] = []

      rows.push(inu.ui.header('About'))
      rows.push(inu.ui.separator(plugin.description || 'No description provided.'))
      if (plugin.author) rows.push(inu.ui.separator(`Created by ${plugin.author}`))

      rows.push(inu.ui.header('Installation'))
      if (top) {
        const missing = unmet(top, installed)
        const label = state === 'new' ? `Install v${top.version}` : state === 'update' ? `Update to v${top.version}` : 'Reinstall'
        rows.push(inu.ui.button({
          id: 'main',
          text: label,
          subtitle: missing.length ? `Needs ${missing.join(', ')}` : local ? `Installed: v${local.version}` : undefined,
          icon: inu.icons.common(state === 'installed' ? 'refresh' : 'download'),
          onClick: () => install(top, detail),
        }))
      }

      if (local) {
        rows.push(inu.ui.button({
          id: 'remove',
          text: 'Remove plugin',
          subtitle: `Installed version: v${local.version}`,
          icon: inu.icons.common('delete'),
          onClick: async () => {
            const answer = await inu.ui.dialog({
              title: `Remove ${plugin.name}?`,
              message: 'The plugin and its stored data will be removed from this device.',
              positive: 'Remove',
              negative: 'Cancel',
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
                title: 'Removal unavailable',
                message: 'This app build does not expose plugin removal to the marketplace yet. Remove it from Settings → Plugins.',
                positive: 'OK',
              })
            }
          },
        }))
      }

      rows.push(inu.ui.header('Version history'))
      for (const version of [...plugin.versions].sort((x, y) => compare(y.version, x.version))) {
        const here = local && compare(version.version, local.version) === 0
        const note = (version.notes ?? '').split('\n').find(l => l.trim())
        rows.push(inu.ui.button({
          id: `v:${version.version}`,
          text: `v${version.version}`,
          subtitle: [version.date, note].filter(Boolean).join('\n') || undefined,
          value: here ? 'Installed' : version === top ? 'Latest' : undefined,
          onClick: async () => {
            const missing = unmet(version, installed)
            const answer = await inu.ui.dialog({
              title: `${plugin.name} v${version.version}`,
              message: [version.notes?.trim(), missing.length ? `Needs ${missing.join(', ')}` : ''].filter(Boolean).join('\n\n') || 'Install this version?',
              positive: here ? 'Reinstall' : local && compare(version.version, local.version) < 0 ? 'Downgrade' : 'Install',
              negative: 'Cancel',
            })
            if (answer === 'positive') install(version, detail)
          },
        }))
      }
      rows.push(inu.ui.separator(`${plugin.versions.length} published version${plugin.versions.length === 1 ? '' : 's'}`))
      return rows
    },
  })
  inu.ui.openPage(detail)
}

// --- marketplace -------------------------------------------------------------------------------------------------

function row(plugin: CatalogPlugin, installed: Installed[]): inu.UIElement {
  const { state, local } = stateOf(plugin, installed)
  const top = newest(plugin)
  const value = state === 'update' ? `v${top?.version}` : state === 'installed' ? 'Installed' : top ? `v${top.version}` : undefined
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
    onClick: () => openPlugin(plugin),
  })
}

const page: inu.ui.UIPage = inu.ui.settingsPage({
  title: 'Marketplace',
  items: () => {
    const rows: inu.UIElement[] = []
    if (!catalog && !loading && !failure) void load()

    rows.push(inu.ui.button({
      id: 'search',
      text: 'Search',
      subtitle: query || 'Name, author or description',
      icon: inu.icons.common('search'),
      onClick: async () => {
        const value = await inu.ui.prompt({ title: 'Search plugins', hint: 'Name, author or description', value: query, selectAll: true })
        if (value !== null) {
          query = value.trim()
          page.invalidate()
        }
      },
    }))
    rows.push(inu.ui.select({
      id: 'filter',
      text: 'Show',
      icon: inu.icons.common('more'),
      items: filters().map(f => f.label),
      selected: Math.max(0, filters().findIndex(f => f.key === filter)),
      onChange: (index) => { filter = filters()[index].key },
    }))

    if (!catalog) {
      rows.push(inu.ui.separator(loading ? 'Loading plugins…' : `Could not load the catalog: ${failure ?? 'unknown error'}`))
      rows.push(inu.ui.button({
        id: 'retry', text: 'Try again', icon: inu.icons.common('refresh'), onClick: () => { void load() },
      }))
      return rows
    }

    const installed = installedList()
    const needle = query.toLowerCase()
    const shown = catalog
      .filter(p => !needle || [p.name, p.id, p.author, p.description].some(s => s?.toLowerCase().includes(needle)))
      .map(p => ({ plugin: p, ...stateOf(p, installed) }))
      .filter(x => filter === 'all' || (filter === 'installed' ? x.state !== 'new' : x.state === 'update'))
      .sort((a, b) => a.plugin.name.localeCompare(b.plugin.name))

    const sections: [string, typeof shown][] = [
      ['Updates available', shown.filter(x => x.state === 'update')],
      ['Installed', shown.filter(x => x.state === 'installed')],
      ['Available', shown.filter(x => x.state === 'new')],
    ]
    for (const [title, group] of sections) {
      if (!group.length) continue
      rows.push(inu.ui.header(title))
      for (const x of group) rows.push(row(x.plugin, installed))
    }
    if (!shown.length) rows.push(inu.ui.separator(query ? 'Nothing matches the search' : 'Nothing here yet'))

    rows.push(inu.ui.button({
      id: 'refresh', text: 'Refresh catalog', icon: inu.icons.common('refresh'), onClick: () => { void load() },
    }))
    rows.push(inu.ui.separator(`entinyGram SDK ${SDK_VERSION}, settings embedding ${embedState}${standalone() ? ', standalone mode (installing goes through a file)' : ''}. Plugins come from the entinyGram GitHub repository; every install asks for confirmation`))
    return rows
  },
})

inu.registerSettings(page)
