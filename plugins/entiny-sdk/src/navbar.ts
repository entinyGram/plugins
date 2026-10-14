// A real bottom bar for the marketplace page. Plugin pages are lists of rows with no tab control, so the bar is a native
// view put on top of the page's own screen through `inu.jvm`. Everything is guarded: if the app's classes differ (plain
// Inugram, a newer build) the bar simply does not appear and the page keeps its section switcher row.

export interface NavbarTab {
  /** svg markup; drawn as a white mask and tinted */
  svg: string
  /** shown instead when the svg cannot be drawn */
  emoji: string
  label: string
}

export interface NavbarSpec {
  /** the title the page shows once rendered: how the bar finds its own screen among the others */
  title: string
  tabs: () => NavbarTab[]
  selected: () => number
  onSelect: (index: number) => void
  /** the bar is on screen for the first time */
  onReady: () => void
}

const BAR_TAG = 'entiny.navbar'
const TAB_TAG = 'entiny.tab:'
const LINE_TAG = 'entiny.navbar.line'
// the old content is hidden at once and the new one fades in once it has landed, so nothing is seen being swapped
const FADE_DELAY_MS = 90
const FADE_MS = 180
const BAR_DP = 56
const ICON_DP = 24
// the screen is created a few frames after the page renders: look for it often at first, then give up
const ATTACH_RETRY_MS = 40
const ATTACH_TRIES = 25

let ready = false
let pending = false
let tries = 0
let painted = -1
let listRef: any = null
let barHeight = 0
let spec: NavbarSpec | null = null

type Jvm = ReturnType<typeof inu.jvm.cls>
let mainHandler: any

export function navbarReady(): boolean {
  return ready
}

function handler(): any {
  if (!mainHandler) {
    const Handler: Jvm = inu.jvm.cls('android.os.Handler')
    const Looper: Jvm = inu.jvm.cls('android.os.Looper')
    mainHandler = new Handler(Looper.callStatic('getMainLooper'))
  }
  return mainHandler
}

function text(value: any): string {
  return typeof value === 'string' ? value : value === null ? '' : String(value.call('toString'))
}

function color(key: string): number {
  const Theme: Jvm = inu.jvm.cls('org.telegram.ui.ActionBar.Theme')
  return Theme.callStatic('getColor(I)I', Theme.getStaticField(key))
}

// Object.toString is `package.Class@hash`; getClass() comes back as a class handle, which cannot be asked for its name
function className(view: any): string {
  return text(view.call('toString')).split('@')[0].split('{')[0]
}

// the list is an anonymous subclass in some builds, so it is recognized by what it can do rather than by name
function isList(view: any): boolean {
  try {
    view.call('getAdapter')
    view.call('getLayoutManager')
    return true
  } catch {
    return false
  }
}

function findList(view: any, depth = 0): any | null {
  if (isList(view)) return view
  if (depth > 3) return null
  let count = 0
  try {
    count = view.call('getChildCount')
  } catch {
    return null
  }
  for (let i = 0; i < count; i++) {
    const found = findList(view.call('getChildAt', i), depth + 1)
    if (found) return found
  }
  return null
}

// A tab switch replaces the whole list. The list's own diff animation of that is the costly part of the frame and its
// half-moved rows and cross-faded texts read as jitter, so it is off for the page and a fade stands in for it.
function softSwap(tab: any) {
  const list = findList(tab.call('getParent').call('getParent'))
  if (!list) return
  list.call('scrollToPosition', 0)
  handler().call('postDelayed', inu.jvm.runnable(() => {
    try {
      list.call('scrollToPosition', 0)
    } catch {}
  }), FADE_DELAY_MS)
  list.call('setAlpha', 0.0)
  list.call('animate').call('alpha', 1.0).call('setDuration', FADE_MS).call('setStartDelay', FADE_DELAY_MS).call('start')
}

// The bar is drawn over the page, so the list is shortened by the bar's height: its last row stops above the bar and the
// list still scrolls all the way. A margin on the list itself holds where the list's padding did not.
function reserveSpace(list: any, height: number) {
  try {
    const params: any = list.call('getLayoutParams')
    if (Number(params.getField('bottomMargin')) === height) return
    params.setField('bottomMargin', height)
    list.call('setLayoutParams', params)
  } catch (e) {
    console.log('navbar: could not reserve space', e)
  }
}

function paint(bar: any, current: NavbarSpec) {
  painted = current.selected()
  const active = color('key_windowBackgroundWhiteBlueText4')
  const idle = color('key_windowBackgroundWhiteGrayText2')
  const selected = current.selected()
  const count: number = bar.call('getChildCount')
  for (let i = 0; i < count; i++) {
    const tab = bar.call('getChildAt', i)
    if (text(tab.call('getTag')) === BAR_TAG) continue
    const index = Number(text(tab.call('getTag')).slice(TAB_TAG.length))
    const tint = index === selected ? active : idle
    const icon = tab.call('getChildAt', 0)
    try {
      icon.call('setColorFilter', tint)
    } catch {
      icon.call('setTextColor', tint)
    }
    tab.call('getChildAt', 1).call('setTextColor', tint)
    tab.call('setAlpha', index === selected ? 1.0 : 0.85)
  }
}

// The svg is drawn by the app's own SvgHelper as a white mask, so a tint recolors it; `currentColor` (the usual stroke
// of icon packs) is turned white for the same reason. An svg the helper cannot read falls back to the emoji.
function pictogram(context: any, tab: NavbarTab, px: (dp: number) => number): any {
  try {
    const size = px(ICON_DP)
    const bitmap: any = inu.jvm.cls('org.telegram.messenger.SvgHelper')
      .callStatic('getBitmap', tab.svg.replace(/currentColor/g, '#ffffff'), size, size, true)
    if (bitmap) {
      const view = new (inu.jvm.cls('android.widget.ImageView'))(context)
      view.call('setImageBitmap', bitmap)
      return view
    }
  } catch (e) {
    console.log('navbar: svg icon failed', e)
  }
  const fallback = new (inu.jvm.cls('android.widget.TextView'))(context)
  fallback.call('setText', tab.emoji)
  fallback.call('setTextSize', 2, 18)
  fallback.call('setGravity', 17)
  return fallback
}

function build(context: any, current: NavbarSpec, px: (dp: number) => number, navigationInset: number): any {
  const LinearLayout: Jvm = inu.jvm.cls('android.widget.LinearLayout')
  const TextView: Jvm = inu.jvm.cls('android.widget.TextView')
  const LinearParams: Jvm = inu.jvm.cls('android.widget.LinearLayout$LayoutParams')
  const OnClick: Jvm = inu.jvm.cls('android.view.View$OnClickListener')

  const Listener: Jvm = inu.jvm.defineClass({
    interfaces: [OnClick],
    methods: {
      onClick: (_self: any, view: any) => {
        const tag = text(view.call('getTag'))
        if (!tag.startsWith(TAB_TAG)) return
        const index = Number(tag.slice(TAB_TAG.length))
        if (index === current.selected()) return
        try {
          softSwap(view)
        } catch (e) {
          console.log('navbar: soft swap skipped', e)
        }
        current.onSelect(index)
        try {
          paint(view.call('getParent'), current)
        } catch {}
      },
    },
  })
  const listener = new Listener()

  const bar = new LinearLayout(context)
  bar.call('setOrientation', 0)
  bar.call('setTag', BAR_TAG)
  bar.call('setBackgroundColor', color('key_windowBackgroundWhite'))
  bar.call('setPadding', 0, 0, 0, navigationInset)

  current.tabs().forEach((tabSpec, index) => {
    const tab = new LinearLayout(context)
    tab.call('setOrientation', 1)
    tab.call('setGravity', 17)
    tab.call('setTag', TAB_TAG + index)
    tab.call('setOnClickListener', listener)

    const icon = pictogram(context, tabSpec, px)
    const label = new TextView(context)
    label.call('setText', tabSpec.label)
    label.call('setTextSize', 2, 11)
    label.call('setGravity', 17)
    label.call('setSingleLine', true)
    tab.call('addView', icon, new LinearParams(px(ICON_DP), px(ICON_DP)))
    tab.call('addView', label, new LinearParams(-2, -2))
    bar.call('addView', tab, new LinearParams(0, -1, 1.0))
  })
  return bar
}

/** true once the bar is on the page, false while its screen is not the visible one yet */
function attach(): boolean {
  const current = spec
  if (!current) return true
  const LaunchActivity: Jvm = inu.jvm.cls('org.telegram.ui.LaunchActivity')
  const fragment: any = LaunchActivity.callStatic('getSafeLastFragment')
  if (!fragment) return false
  if (text(fragment.call('getTitle')) !== current.title) return false
  const root: any = fragment.call('getFragmentView')
  if (!root) return false

  const existing: any = root.call('findViewWithTag', BAR_TAG)
  if (existing) {
    if (listRef) reserveSpace(listRef, barHeight)
    if (painted !== current.selected()) paint(existing, current)
    return true
  }

  const context: any = root.call('getContext')
  const density: number = context.call('getResources').call('getDisplayMetrics').getField('density')
  const px = (dp: number) => Math.round(dp * density)
  let navigationInset = 0
  try {
    navigationInset = Number(inu.jvm.cls('org.telegram.messenger.AndroidUtilities').getStaticField('navigationBarHeight')) || 0
  } catch {}

  const bar = build(context, current, px, navigationInset)
  const FrameParams: Jvm = inu.jvm.cls('android.widget.FrameLayout$LayoutParams')
  root.call('addView', bar, new FrameParams(-1, px(BAR_DP) + navigationInset, 80))
  // a hairline instead of a shadow: a shadow under a full-width bar is redrawn with every frame of the list behind it
  const line: any = new (inu.jvm.cls('android.view.View'))(context)
  line.call('setBackgroundColor', color('key_divider'))
  line.call('setTag', LINE_TAG)
  const lineParams: any = new FrameParams(-1, 1, 80)
  lineParams.call('setMargins', 0, 0, 0, px(BAR_DP) + navigationInset)
  root.call('addView', line, lineParams)
  const list = findList(root)
  barHeight = px(BAR_DP) + navigationInset
  listRef = list
  if (list) {
    try {
      list.call('setItemAnimator', null)
    } catch {}
    reserveSpace(list, barHeight)
  }
  paint(bar, current)
  if (!ready) {
    ready = true
    current.onReady()
  }
  return true
}

function schedule(delay: number) {
  pending = true
  try {
    handler().call('postDelayed', inu.jvm.runnable(() => {
      pending = false
      let done = true
      try {
        done = attach()
      } catch (e) {
        console.log('navbar: not attached', e)
      }
      if (!done && ++tries < ATTACH_TRIES) schedule(ATTACH_RETRY_MS)
    }), delay)
  } catch (e) {
    pending = false
    console.log('navbar: unavailable', e)
  }
}

/** Called whenever the page renders. With the bar up it is one quick repaint; on first open it polls until the screen exists. */
export function ensureNavbar(next: NavbarSpec) {
  spec = next
  if (pending) return
  tries = 0
  schedule(ready ? 0 : ATTACH_RETRY_MS)
}
