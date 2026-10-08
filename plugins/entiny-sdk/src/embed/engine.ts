// The embed engine: puts other plugins' rows into the app's settings screens.
//
// Every settings screen is a UniversalFragment whose list keeps a fill callback and a click listener in plain fields.
// The engine hooks `createView` and wraps both, so the app carries no code of its own for this and needs no patch.
// Plugins describe what they want through `@entiny/sdk/embed`.

import { embedKeys, embedRegistry } from '@entiny/sdk/embed'
import type { EmbedChoice, EmbedPlacements, EmbedRow } from '@entiny/sdk/embed'
import { kebab, slotsFor, warmUp } from './strings.js'

const FIELD_SEP = '\u0001\u0001'
const ROW_SEP = '\u0002\u0002'
// at most this many rows of one plugin in one slot, so a plugin cannot bury a screen
const MAX_ROWS = 4

const VIEW_TYPE_HEADER = 0
const VIEW_TYPE_SHADOW = 7
const VIEW_TYPE_CUSTOM_SHADOW = -4

const UItem: any = inu.jvm.cls('org.telegram.ui.Components.UItem')
const UniversalFragment: any = inu.jvm.cls('org.telegram.ui.Components.UniversalFragment')
const ArrayCls: any = inu.jvm.cls('java.lang.reflect.Array')
const StringBuilder: any = inu.jvm.cls('java.lang.StringBuilder')
const ButtonCell: any = inu.jvm.cls('desu.inugram.ui.settings.ButtonCellFactory').getStaticField('Companion')
const CheckCell: any = inu.jvm.cls('desu.inugram.ui.settings.CheckCellFactory').getStaticField('Companion')
const ICON_CUSTOMIZE: number = inu.jvm.cls('org.telegram.messenger.R$drawable').getStaticField('msg_customize')

// the page name and, per item, its view type and text, in one pass through Java
const Dumper: any = inu.jvm.defineClass({
  methods: {
    dump: {
      params: ['java.lang.Object', 'java.util.ArrayList'],
      returns: 'java.lang.String',
      body: inu.jvm.routine(function (fragment: any, items: any) {
        const sb = new StringBuilder()
        // Object.toString is `package.Class@hash`; a Class value inside a routine is a class reference, not an object
        sb.append(fragment.toString()).append(ROW_SEP)
        for (const it of items) {
          // a number is ambiguous for StringBuilder.append inside a routine; a string is not
          sb.append('' + it.viewType).append(FIELD_SEP).append('' + it.id).append(FIELD_SEP)
          const text = it.text
          if (text !== null) sb.append(text.toString())
          sb.append(ROW_SEP)
        }
        return sb.toString()
      }),
    },
  },
})
const dumper: any = new Dumper()

interface Registration {
  id: string
  name: string
  placements: EmbedPlacements
  handler: any
}

interface Insert {
  reg: Registration
  /** the slot as the plugin named it, passed back to it for the rows */
  slot: string
  kind: 'screen' | 'inline'
  only?: string[]
}

interface Owned {
  reg: Registration
  rowId: string
  row?: EmbedRow
  kind: 'screen' | 'inline'
}

// what a tap on one of our rows should do, by row id
const owned = new Map<number, Owned>()

// the same ids as a Java set, so the click wrapper can tell our rows apart without entering the engine
const ownedIds: any = new (inu.jvm.cls('java.util.concurrent.ConcurrentHashMap'))()

function idOf(pluginId: string, rowId: string): number {
  const text = `${pluginId}:${rowId}`
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return 0x40000000 | (h & 0x3fffffff)
}

function pageIdOf(simpleName: string): string {
  const name = simpleName.replace(/Activity$/, '').replace(/Settings$/, '')
  return name === 'Inu' ? 'root' : kebab(name)
}

function registrations(): Registration[] {
  const registry: any = embedRegistry()
  const keys: any = registry.call('keySet').call('toArray')
  const count: number = ArrayCls.callStatic('getLength', keys)
  const out: Registration[] = []
  for (let i = 0; i < count; i++) {
    const id = String(ArrayCls.callStatic('get', keys, i))
    if (id.startsWith('__')) continue
    const handler: any = registry.call('get', id)
    if (handler === null) continue
    try {
      const meta = JSON.parse(String(handler.call('apply', 'meta', ''))) as { name: string, placements: EmbedPlacements }
      out.push({ id, name: meta.name, placements: meta.placements ?? {}, handler })
    } catch (e) {
      // an unloaded plugin leaves its handler in the map; forget it
      registry.call('remove', id)
    }
  }
  return out
}

interface ChoiceAt {
  reg: Registration
  choice: EmbedChoice
}

/** the options plugins add to the picker of this slot, two per plugin at most */
function choicesAt(slot: string): ChoiceAt[] {
  const out: ChoiceAt[] = []
  for (const reg of registrations()) {
    if (!(reg.placements.choice ?? []).includes(slot)) continue
    try {
      const list = JSON.parse(String(reg.handler.call('apply', 'choices', slot))) as EmbedChoice[]
      for (const choice of list.slice(0, 2)) out.push({ reg, choice })
    } catch (e) {
      console.warn(`embed: ${reg.id} gave no choices for ${slot}`, e)
    }
  }
  return out
}

// The options of the pickers, refreshed whenever a screen is built. A picker opens from a hook, and a hook cannot call
// into other plugins (that ends its view of the call's arguments), so it reads what the last build found.
const choiceCache = new Map<string, ChoiceAt[]>()

function refreshChoices(page: string, regs: Registration[]): void {
  const slots = new Set<string>()
  for (const reg of regs) for (const slot of reg.placements.choice ?? []) if (slot.startsWith(`${page}.`)) slots.add(slot)
  for (const slot of slots) choiceCache.set(slot, choicesAt(slot))
}

function wantedSlots(regs: Registration[], page: string): Map<string, Insert[]> {
  const wants = new Map<string, Insert[]>()
  const add = (slot: string, insert: Insert) => {
    if (!slot.startsWith(`${page}.`)) return
    const list = wants.get(slot) ?? []
    list.push(insert)
    wants.set(slot, list)
  }
  for (const reg of regs) {
    for (const slot of reg.placements.screen ?? []) add(slot, { reg, slot, kind: 'screen' })
    for (const place of reg.placements.inline ?? []) {
      const slot = typeof place === 'string' ? place : place.slot
      add(slot, { reg, slot, kind: 'inline', only: typeof place === 'string' ? undefined : place.rows })
    }
  }
  return wants
}

function build(insert: Insert): any[] {
  const { reg } = insert
  if (insert.kind === 'screen') {
    const id = idOf(reg.id, `screen:${insert.slot}`)
    owned.set(id, { reg, rowId: '', kind: 'screen' })
    ownedIds.call('put', '' + id, '1')
    return [UItem.callStatic('asButton', id, ICON_CUSTOMIZE, reg.name)]
  }
  let rows: EmbedRow[] = []
  try {
    rows = JSON.parse(String(reg.handler.call('apply', 'rows', insert.slot))) as EmbedRow[]
  } catch (e) {
    console.warn(`embed: ${reg.id} gave no rows for ${insert.slot}`, e)
  }
  if (insert.only) rows = rows.filter(row => insert.only!.includes(row.id))
  return rows.slice(0, MAX_ROWS).map((row) => {
    const id = idOf(reg.id, row.id)
    owned.set(id, { reg, rowId: row.id, row, kind: 'inline' })
    ownedIds.call('put', '' + id, '1')
    const subtitle = row.subtitle ?? null
    if (row.type === 'check') return CheckCell.call('of', id, row.text, subtitle, null, !!row.checked, null)
    const value = row.type === 'select' ? row.options?.[row.selected ?? 0] : row.value
    return ButtonCell.call('of', id, row.text, value ?? null, subtitle, null, !!row.danger, null)
  })
}

interface Op {
  index: number
  remove: number
  add: any[]
}

function plan(page: string, entries: Array<{ type: number, id: number, text: string }>, wants: Map<string, Insert[]>): Op[] {
  const ops: Op[] = []
  const get = (slot: string): Insert[] => wants.get(slot) ?? []
  const rowsOf = (inserts: Insert[]): any[] => {
    const seen = new Set<string>()
    return inserts.filter((i) => {
      const key = `${i.reg.id}|${i.kind}|${i.slot}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).flatMap(build)
  }
  const slotsAt = (text: string): string[] => (text ? slotsFor(text).map(s => `${page}.${s}`) : [])

  let section: string[] = []
  entries.forEach((entry, i) => {
    const slots = slotsAt(entry.text)
    const isHeader = entry.type === VIEW_TYPE_HEADER
    const isShadow = entry.type === VIEW_TYPE_SHADOW || entry.type === VIEW_TYPE_CUSTOM_SHADOW

    const before = rowsOf(slots.flatMap(s => get(`${s}.before`)))
    if (before.length) ops.push({ index: i, remove: 0, add: before })

    const replace = rowsOf(slots.flatMap(s => get(`${s}.replace`)))
    if (replace.length) {
      ops.push({ index: i, remove: 1, add: replace })
      return
    }

    if (isHeader) {
      section = slots
      const start = rowsOf(section.flatMap(s => get(`${s}.start`)))
      if (start.length) ops.push({ index: i + 1, remove: 0, add: start })
    } else if (isShadow && section.length) {
      const end = rowsOf(section.flatMap(s => [...get(s), ...get(`${s}.end`)]))
      if (end.length) ops.push({ index: i, remove: 0, add: end })
      section = []
    }

    if (!isHeader && !isShadow) {
      const after = rowsOf(slots.flatMap(s => [...get(`${s}.after`), ...get(s)]))
      if (after.length) ops.push({ index: i + 1, remove: 0, add: after })
    }
  })

  if (section.length) {
    const end = rowsOf(section.flatMap(s => [...get(s), ...get(`${s}.end`)]))
    if (end.length) ops.push({ index: entries.length, remove: 0, add: end })
  }
  const tail = rowsOf(get(`${page}.end`))
  if (tail.length) {
    ops.push({
      index: entries.length,
      remove: 0,
      add: [UItem.callStatic('asShadow(Ljava/lang/CharSequence;)Lorg/telegram/ui/Components/UItem;', null), ...tail, UItem.callStatic('asShadow(Ljava/lang/CharSequence;)Lorg/telegram/ui/Components/UItem;', null)],
    })
  }
  return ops
}

function fill(fragment: any, items: any): void {
  const regs = registrations()
  if (regs.length === 0) return
  const lines = String(dumper.call('dump', fragment, items)).split(ROW_SEP)
  const page = pageIdOf(lines[0].split('@')[0].split('.').pop() ?? '')
  refreshChoices(page, regs)
  const wants = wantedSlots(regs, page)
  if (wants.size === 0 && !regs.some(reg => (reg.placements.choice ?? []).some(slot => slot.startsWith(`${page}.`)))) return
  const entries = lines.slice(1).filter(line => line !== '').map((line) => {
    const [type, id, text] = line.split(FIELD_SEP)
    return { type: Number(type), id: Number(id), text: text ?? '' }
  })
  // the screen's own override and the base class both run this hook; the second one finds our rows already there
  if (entries.some(entry => owned.has(entry.id))) return
  // a row that opens a picker shows the plugin's option when that one is the chosen one
  entries.forEach((entry, i) => {
    for (const slot of entry.text ? slotsFor(entry.text).map(s => `${page}.${s}`) : []) {
      const active = (choiceCache.get(slot) ?? []).find(c => c.choice.checked)
      if (active) items.call('get(I)Ljava/lang/Object;', i).setField('textValue', active.choice.title)
    }
  })
  // from the end, so the earlier positions stay valid
  const ops = plan(page, entries, wants).sort((a, b) => b.index - a.index)
  for (const op of ops) {
    if (op.remove) items.call('remove(I)Ljava/lang/Object;', op.index)
    op.add.forEach((row, n) => items.call('add(ILjava/lang/Object;)V', op.index + n, row))
  }
}

// Redrawing a screen runs our own fill hook again. That cannot happen inside the hook that asked for it (the engine
// refuses a plugin re-entering itself on one thread), so the redraw is posted to the main thread as a routine, which
// runs in Java without the engine.
const Launch: any = inu.jvm.cls('org.telegram.ui.LaunchActivity')
const mainHandler: any = new (inu.jvm.cls('android.os.Handler'))(inu.jvm.cls('android.os.Looper').callStatic('getMainLooper'))
const redraw: any = inu.jvm.routine(() => {
  const fragment = Launch.getSafeLastFragment()
  if (fragment !== null && fragment instanceof UniversalFragment) fragment.listView.adapter.update(true)
})

function refresh(): void {
  mainHandler.call('post', redraw)
}

function fire(own: Owned, value: string): void {
  own.reg.handler.call('apply', 'event', JSON.stringify({ row: own.rowId, value }))
}

function tap(own: Owned): void {
  if (own.kind === 'screen') {
    own.reg.handler.call('apply', 'open', '')
    return
  }
  const row = own.row!
  if (row.type === 'check') {
    fire(own, String(!row.checked))
    refresh()
  } else if (row.type === 'button') {
    fire(own, '')
    refresh()
  } else {
    // a dialog needs the plugin thread, which a hook is not on
    setTimeout(async () => {
      const chosen = await inu.ui.chooser({ items: row.options ?? [], selected: row.selected ?? 0 })
      if (chosen === null) return
      fire(own, String(chosen))
      refresh()
    }, 0)
  }
}

// --- pickers ----------------------------------------------------------------------------------------------------
// A settings row that opens a list of options goes through RadioItemOptions.show(fragment, anchor, items, selected,
// onSelect). The hook adds the plugins' options to the list and wraps onSelect, so that picking an option of a plugin
// unpicks the others and picking an app option unpicks the plugins'.

const Function1: any = inu.jvm.cls('kotlin.jvm.functions.Function1')
const KotlinUnit: any = inu.jvm.cls('kotlin.Unit').getStaticField('INSTANCE')
const JArrayList: any = inu.jvm.cls('java.util.ArrayList')
const RadioItemOptions: any = inu.jvm.cls('desu.inugram.ui.settings.RadioItemOptions')

function announce(own: ChoiceAt, picked: boolean): void {
  own.reg.handler.call('apply', 'choice', JSON.stringify({ id: own.choice.id, picked }))
}

// A pick is answered from a click in Java. The click handler must not enter this plugin's engine: the app's own handler
// can end up in the plugin again (a redraw), and the engine refuses that and the exception crashes the app. So the
// handler is a routine that runs the app's handler straight away and leaves what the plugins should hear in a queue,
// drained a moment later on the main thread, outside any callback.
const pickState: any = new JArrayList() // 0 = the app's handler, 1 = number of app options, 2 = slot, 3 = Unit
for (let n = 0; n < 4; n++) pickState.call('add', null)
pickState.call('set', 3, KotlinUnit)
const pickQueue: any = new (inu.jvm.cls('java.util.concurrent.ConcurrentLinkedQueue'))()

const drainPicks: any = inu.jvm.runnable(() => {
  for (let line = pickQueue.call('poll'); line !== null; line = pickQueue.call('poll')) {
    try {
      const [slot, at, size] = String(line).split('|')
      const mine = choiceCache.get(slot) ?? []
      const index = Number(at)
      const count = Number(size)
      if (index < count) {
        for (const own of mine) if (own.choice.checked) announce(own, false)
      } else {
        mine.forEach((own, i) => {
          if (i === index - count) announce(own, true)
          else if (own.choice.checked) announce(own, false)
        })
      }
    } catch (e) {
      console.warn('embed: a picker choice failed', e)
    }
  }
})

const Pick: any = inu.jvm.defineClass({
  interfaces: [Function1],
  methods: {
    invoke: {
      params: ['java.lang.Object'],
      returns: 'java.lang.Object',
      body: inu.jvm.routine(function (index: any) {
        const size = pickState.get(1)
        if (index < size) pickState.get(0).invoke(index)
        pickQueue.add(`${pickState.get(2)}|${index}|${size}`)
        mainHandler.post(drainPicks)
        return pickState.get(3)
      }),
    },
  },
})

// the row that opened the picker: the recycler knows which adapter position a view has
const RecyclerView: any = inu.jvm.cls('androidx.recyclerview.widget.RecyclerView')
const getChildAdapterPosition: any = RecyclerView.getDeclaredMethod('getChildAdapterPosition(Landroid/view/View;)I')

function pickerSlots(fragment: any, anchor: any): string[] {
  const listView: any = fragment.getField('listView')
  const position: number = getChildAdapterPosition.invoke(listView, anchor)
  if (position < 0) return []
  const item: any = listView.getField('adapter').call('getItem', position)
  const text: any = item === null ? null : item.getField('text')
  if (text === null) return []
  const className = String(dumper.call('dump', fragment, emptyItems)).split(ROW_SEP)[0]
  const page = pageIdOf(className.split('@')[0].split('.').pop() ?? '')
  return slotsFor(String(text)).map(s => `${page}.${s}`)
}

// An argument the hook replaces has to be an object that outlives the hook: whatever is created inside it is
// released before the engine reads the arguments back. So one list and one click handler are kept and refilled;
// a picker is open one at a time.
const JSystem: any = inu.jvm.cls('java.lang.System')
const sharedItems: any = new JArrayList()
const sharedPick: any = new Pick()
const emptyItems: any = new JArrayList()

function hookPickers(): void {
  const hook = (descriptor: string, slotIndex: number) => {
    let show: any
    try {
      show = RadioItemOptions.getDeclaredMethod(descriptor)
    } catch (e) {
      // a build of the app that has only the other overload
      return
    }
    inu.xposed.hookMethod(show, {
      before: (ctx: any) => {
      try {
        if (choiceCache.size === 0) return
        const fragment: any = ctx.args[0]
        if (!UniversalFragment.isInstance(fragment)) return
        const className = String(dumper.call('dump', fragment, emptyItems)).split(ROW_SEP)[0]
        const page = pageIdOf(className.split('@')[0].split('.').pop() ?? '')
        if (page === 'plugin-settings') return
        let hasChoices = false
        for (const k of choiceCache.keys()) {
          if (k.startsWith(`${page}.`)) { hasChoices = true; break }
        }
        if (!hasChoices) return

        // the context hands out arguments lazily, and a call into another plugin (the choices) ends that, so read first
        const anchor: any = ctx.args[1]
        const original: any = ctx.args[2]
        const onSelect: any = ctx.args[slotIndex + 1]
        if (JSystem.callStatic('identityHashCode', original) === JSystem.callStatic('identityHashCode', sharedItems)) return
        const slots = pickerSlots(fragment, anchor)
        for (const slot of slots) {
          const mine = choiceCache.get(slot) ?? []
          if (mine.length === 0) continue
          const size: number = original.call('size')
          sharedItems.call('clear')
          sharedItems.call('addAll', original)
          for (const own of mine) sharedItems.call('add', `${own.choice.title}  (${own.reg.name})`)
          const checked = mine.findIndex(own => own.choice.checked)
          pickState.call('set', 0, onSelect)
          pickState.call('set', 1, size)
          pickState.call('set', 2, slot)
          ctx.args[2] = sharedItems
          if (checked >= 0) ctx.args[3] = size + checked
          ctx.args[slotIndex + 1] = sharedPick
          return
        }
      } catch (e) {
        console.warn('embed: a picker could not be extended', e)
      }
      },
    })
  }
  // the shorter overload calls the longer one; whichever the app's code reaches first is the one that runs
  hook('show(Lorg/telegram/ui/ActionBar/BaseFragment;Landroid/view/View;Ljava/util/List;ILkotlin/jvm/functions/Function1;)V', 3)
  hook('show(Lorg/telegram/ui/ActionBar/BaseFragment;Landroid/view/View;Ljava/util/List;ILjava/lang/String;Lkotlin/jvm/functions/Function1;)V', 4)
}

export interface EmbedEngine {
  /** false when this device cannot hook methods */
  hooked: boolean
  reason?: string
}

// --- screens ----------------------------------------------------------------------------------------------------
// Every settings screen builds its list in a UniversalRecyclerView, which keeps the screen's `fillItems` callback in
// its adapter and its click listener on itself. Both are plain fields of stock classes, so right after the view is
// constructed the engine puts a wrapper around each: the fill wrapper runs the screen's own fill and then adds
// the plugins' rows, the click wrapper takes a tap on one of those rows and hands everything else on.

const Callback2: any = inu.jvm.cls('org.telegram.messenger.Utilities$Callback2')
const ClickListener: any = inu.jvm.cls('org.telegram.ui.Components.RecyclerListView$OnItemClickListenerExtended')

const FillWrapper: any = inu.jvm.defineClass({
  interfaces: [Callback2],
  fields: { orig: 'java.lang.Object', fragment: 'java.lang.Object' },
  methods: {
    run: {
      params: ['java.lang.Object', 'java.lang.Object'],
      returns: 'void',
      body: (self: any, items: any, adapter: any) => {
        self.getField('orig').call('run', items, adapter)
        try {
          fill(self.getField('fragment'), items)
        } catch (e) {
          console.warn('embed: filling a screen failed', e)
        }
      },
    },
  },
})

// A tap runs the app's own click handler, which opens pickers that this plugin hooks. The engine does not run a hook
// inside one of its own callbacks, so the wrapper must not be one: it is a routine, it hands every tap that is not on
// one of our rows straight to the app's listener, and a tap on ours is queued for the main thread.
const tapState: any = new (inu.jvm.cls('java.util.concurrent.ConcurrentHashMap'))()
const tapQueue: any = new (inu.jvm.cls('java.util.concurrent.ConcurrentLinkedQueue'))()

const drainTaps: any = inu.jvm.runnable(() => {
  for (let id = tapQueue.call('poll'); id !== null; id = tapQueue.call('poll')) {
    try {
      const own = owned.get(Number(id))
      if (own !== undefined) tap(own)
    } catch (e) {
      console.warn('embed: a tap failed', e)
    }
  }
})

const TapWrapper: any = inu.jvm.defineClass({
  interfaces: [ClickListener],
  methods: {
    hasDoubleTap: {
      params: ['android.view.View', 'int'],
      returns: 'boolean',
      body: inu.jvm.routine(function (view: any, position: any) {
        return tapState.get('' + JSystem.identityHashCode(this)).get(0).hasDoubleTap(view, position)
      }),
    },
    onDoubleTap: {
      params: ['android.view.View', 'int', 'float', 'float'],
      returns: 'void',
      body: inu.jvm.routine(function (view: any, position: any, x: any, y: any) {
        tapState.get('' + JSystem.identityHashCode(this)).get(0).onDoubleTap(view, position, x, y)
      }),
    },
    onItemClick: {
      params: ['android.view.View', 'int', 'float', 'float'],
      returns: 'void',
      body: inu.jvm.routine(function (view: any, position: any, x: any, y: any) {
        const state = tapState.get('' + JSystem.identityHashCode(this))
        const item = state.get(1).getItem(position)
        if (item !== null && ownedIds.containsKey('' + item.id)) {
          tapQueue.add('' + item.id)
          mainHandler.post(drainTaps)
        } else {
          state.get(0).onItemClick(view, position, x, y)
        }
      }),
    },
  },
})

function hookScreens(): void {
  // createView is where a screen builds its list; every screen calls the base one, so one hook covers them all
  inu.xposed.hookAllOverloads(UniversalFragment, 'createView', {
    after: (ctx: any) => {
      try {
        const fragment: any = ctx.thisObject
        const view: any = fragment.getField('listView')
        if (view === null) return
        const adapter: any = view.getField('adapter')
        const current: any = adapter.getField('fillItems')
        if (FillWrapper.isInstance(current)) return
        const wrapper: any = new FillWrapper()
        wrapper.setField('orig', current)
        wrapper.setField('fragment', fragment)
        adapter.setField('fillItems', wrapper)
        const clicks: any = view.getField('onItemClickListenerExtended')
        if (clicks !== null) {
          const tapper: any = new TapWrapper()
          const state: any = new JArrayList()
          state.call('add', clicks)
          state.call('add', adapter)
          tapState.call('put', '' + JSystem.callStatic('identityHashCode', tapper), state)
          view.call('setOnItemClickListener(Lorg/telegram/ui/Components/RecyclerListView$OnItemClickListenerExtended;)V', tapper)
        }
      } catch (e) {
        console.warn('embed: could not wrap a screen', e)
      }
    },
  })
}

export function startEmbedEngine(): EmbedEngine {
  const errors: string[] = []
  for (const hook of [hookScreens, hookPickers]) {
    try {
      hook()
    } catch (e) {
      errors.push(String((e as Error).message ?? e))
    }
  }
  if (errors.length === 2) return { hooked: false, reason: errors.join('; ') }

  // plugins call this after they register or change what they show; open screens redraw
  // other plugins call this from any thread, so it only posts the redraw
  // a defined class with a routine body: plugins may call it, and it never enters the engine
  const Changed: any = inu.jvm.defineClass({
    methods: {
      run: {
        params: [],
        returns: 'void',
        body: inu.jvm.routine(function () {
          mainHandler.post(redraw)
        }),
      },
    },
  })
  const changed: any = new Changed()
  embedRegistry().call('put', embedKeys.changed, changed)
  setTimeout(() => {
    try {
      warmUp()
      refresh()
    } catch (e) {
      console.warn('embed: could not read the settings strings', e)
    }
  }, 0)
  return { hooked: true }
}
