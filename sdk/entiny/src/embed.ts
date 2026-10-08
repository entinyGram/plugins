// The contract between feature plugins and the entinyGram SDK plugin, which does the embedding.
//
// Plugins cannot talk to each other directly, so they meet in a Java map kept in the process's system
// properties: a feature plugin puts one handler object into it, the SDK plugin reads the map whenever a
// settings screen is built. Without the SDK plugin (plain Inugram) nothing reads the map and nothing is embedded.

export interface EmbedRow {
  id: string
  type: 'check' | 'button' | 'select'
  text: string
  subtitle?: string
  /** shown on the trailing side of a button */
  value?: string
  checked?: boolean
  /** a select: the options and the chosen index */
  options?: string[]
  selected?: number
  danger?: boolean
}

export interface EmbedChoice {
  id: string
  title: string
  subtitle?: string
  checked: boolean
}

export interface EmbedPlacements {
  /** rows that open the plugin's page, placed at these slots */
  screen?: string[]
  /** the rows the plugin returns for a slot, drawn into that section or beside that item */
  inline?: Array<string | { slot: string, rows?: string[] }>
  /** pickers (radio lists and menus) that get the plugin's options added, named like a slot of the picker's button */
  choice?: string[]
}

export interface EmbedSpec {
  /** the plugin id */
  id: string
  name: string
  placements: EmbedPlacements
  /** the rows to draw for a slot; called each time the screen is built */
  rows: (slot: string) => EmbedRow[]
  /** a row was tapped: a check passes `'true'`/`'false'`, a select the chosen index, a button `''` */
  onEvent: (rowId: string, value: string) => void
  /** open the plugin's own page, for `screen` rows */
  open?: () => void
  /** the options to add to a picker; picking one of them unpicks the others, the app's own included */
  choices?: (slot: string) => EmbedChoice[]
  /** an option of yours was picked (`true`) or another one was picked instead (`false`) */
  onChoice?: (choiceId: string, picked: boolean) => void
}

const REGISTRY_KEY = 'entiny.embed'
const CHANGED_KEY = '__changed'

/** the shared map, created by whichever side comes first */
export function embedRegistry(): any {
  const props: any = inu.jvm.cls('java.lang.System').callStatic('getProperties')
  let registry: any = props.call('get', REGISTRY_KEY)
  if (registry === null) {
    props.call('putIfAbsent', REGISTRY_KEY, new (inu.jvm.cls('java.util.concurrent.ConcurrentHashMap'))())
    registry = props.call('get', REGISTRY_KEY)
  }
  return registry
}

export const embedKeys = { changed: CHANGED_KEY }

function notifyChanged(registry: any): void {
  const changed: any = registry.call('get', CHANGED_KEY)
  if (changed !== null) changed.call('run')
}

/** registers the plugin with the SDK plugin; returns a function that withdraws it */
export function embed(spec: EmbedSpec): () => void {
  const BiFunction: any = inu.jvm.cls('java.util.function.BiFunction')
  const handle = (op: string, arg: string): string => {
    switch (op) {
      case 'meta':
        return JSON.stringify({ name: spec.name, placements: spec.placements })
      case 'rows':
        return JSON.stringify(spec.rows(arg))
      case 'event': {
        const { row, value } = JSON.parse(arg) as { row: string, value: string }
        spec.onEvent(row, value)
        return ''
      }
      case 'open':
        spec.open?.()
        return ''
      case 'choices':
        return JSON.stringify(spec.choices?.(arg) ?? [])
      case 'choice': {
        const { id, picked } = JSON.parse(arg) as { id: string, picked: boolean }
        spec.onChoice?.(id, picked)
        return ''
      }
      default:
        return ''
    }
  }
  const Handler: any = inu.jvm.defineClass({
    interfaces: [BiFunction],
    methods: {
      apply: {
        params: ['java.lang.Object', 'java.lang.Object'],
        returns: 'java.lang.Object',
        body: (_self: any, op: string, arg: string) => handle(op, arg),
      },
    },
  })
  const registry = embedRegistry()
  registry.call('put', spec.id, new Handler())
  notifyChanged(registry)
  return () => {
    registry.call('remove', spec.id)
    notifyChanged(registry)
  }
}

/** tell the SDK plugin that the rows changed, so an open screen redraws */
export function embedChanged(): void {
  notifyChanged(embedRegistry())
}
