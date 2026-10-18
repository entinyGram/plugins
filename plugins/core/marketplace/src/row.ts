// Rows of the marketplace, drawn as real Android views so a version can sit in front of the title as a colored pill.
//
// The declarative rows carry a title, a subtitle, an icon and a trailing value, but not a span: the engine builds row
// text from a plain string plus message entities, and a pill is a span. The app does let a plugin put a view of its
// own into a page as a row (`inu.android.nativeView`, backed by `inu.jvm`), so the rows that show a version are built
// here instead. Everything around them - the card background, its radii, the 2dp gaps, the side insets and the press
// highlight - is drawn by the list for every child it has, so these rows draw no background of their own and stay in
// step with the app's own cells.
//
// The numbers are the app's `TextCell` ones: a 56dp row, a 24dp icon mask tinted by the row and laid out in a 22dp
// box 18dp from the start edge, the text column at 58dp, the value 17dp from the end edge. Sizes are in dp, because
// `TextCell` draws through `SimpleTextView`, which scales by density and not by the user's font size.
//
// Views are built while the page renders, on the plugin thread, and are handed to the list afterwards, so they are
// never touched once they are on screen: a later render builds fresh ones instead.

type Jvm = ReturnType<typeof inu.jvm.cls>
export type CommonIcon = Parameters<typeof inu.icons.common>[0]
type Action = () => unknown

export interface RowIcon {
  /** svg source; the app draws it as a white mask and the row tints it */
  svg?: string
  /** one of the engine's common icons, resolved through the app's own drawable names */
  common?: CommonIcon
}

export interface RowSpec {
  title: string
  /** second line, in the app's grey */
  subtitle?: string
  /** trailing state, e.g. `Оновлення` */
  value?: string
  /** version pill drawn before the title, e.g. `v0.3.0` */
  pill?: string
  icon?: RowIcon
  /** the developer card: an accent icon on a taller row with a bold title */
  hero?: boolean
  onClick?: Action
}

// --- the app's numbers -------------------------------------------------------------------------------------------

const ROW_DP = 56
const HERO_PAD_DP = 13
const ICON_DP = 24
const ICON_BOX_DP = 22
const ICON_LEFT_DP = 18
const NO_ICON_LEFT_DP = 23
const TEXT_LEFT_DP = 58
const VALUE_RIGHT_DP = 17
const PILL_GAP_DP = 8
const SUBTITLE_GAP_DP = 4

const TEXT_LEFT = 3
const TEXT_RIGHT = 5
const CENTER_VERTICAL = 16
const UNIT_PX = 0
const WRAP = -2
const WEIGHT = 1

/** the drawable behind each common icon the marketplace falls back to, as the app's `PluginIcons.COMMON_ICONS` has it */
const COMMON_DRAWABLE: Partial<Record<CommonIcon, string>> = {
  channel: 'msg_channel',
  check: 'ic_ab_done',
  download: 'msg_download',
  eyeOff: 'msg_archive_hide',
  refresh: 'msg_retry',
  star: 'msg_fave',
  user: 'msg_contacts',
}

const VIEW_TAG = 'entiny.row'
const MASK_STROKE = /currentColor/g
const HELD_MAX = 160

// `nativeView` names a view by an `inu.jvm` handle, and letting the JS object go releases that handle, so the views of
// the recent renders are held here. The cap drops the oldest, which every list has long since rebound away from.
const held: { view: any, id: number }[] = []
// Each row stores the index of its own handler in its view id, so a single generated listener serves them all: a
// generated class is never unloaded and the engine caps a plugin at 128 of them.
const actions: (Action | undefined)[] = []
let clicker: any = null

function click(): any {
  if (!clicker) {
    clicker = new (inu.jvm.defineClass({
      interfaces: [inu.jvm.cls('android.view.View$OnClickListener')],
      methods: {
        onClick: (_self: any, view: any) => {
          // the click arrives on the app's own thread and enters the plugin from there; a throw would only kill the
          // row, so it is logged instead
          try {
            actions[view.call('getId') - 1]?.()
          } catch (e) {
            console.log('row click failed', e)
          }
        },
      },
    }))()
  }
  return clicker
}

// --- the app's pieces --------------------------------------------------------------------------------------------

function dp(context: any, value: number): number {
  const density: number = context.call('getResources').call('getDisplayMetrics').getField('density')
  return Math.round(value * density)
}

function theme(key: string): number {
  const Theme: Jvm = inu.jvm.cls('org.telegram.ui.ActionBar.Theme')
  return Theme.callStatic('getColor(I)I', Theme.getStaticField(key)) as number
}

function isRtl(): boolean {
  try {
    return !!inu.jvm.cls('org.telegram.messenger.LocaleController').getStaticField('isRTL')
  } catch (e) {
    return false
  }
}

/** a solid rounded rectangle; [alpha] thins the color the way the app's own pill span does */
function shape(color: number, radius: number, alpha = 255): any {
  const drawable = new (inu.jvm.cls('android.graphics.drawable.GradientDrawable'))()
  drawable.call('setShape', 0)
  drawable.call('setColor', (alpha << 24) | (color & 0xffffff))
  drawable.call('setCornerRadius', radius)
  return drawable
}

/** the app renders emoji through its own spans, and the engine's row formatter does the same for the rows it builds */
function emoji(text: string): any {
  try {
    return inu.jvm.cls('org.telegram.messenger.Emoji').callStatic('replaceEmoji', text, null, false) ?? text
  } catch (e) {
    return text
  }
}

function label(context: any, text: string, sizeDp: number, colorKey: string, gravity: number, bold = false, plain = false): any {
  const view = new (inu.jvm.cls('android.widget.TextView'))(context)
  view.call('setText', plain ? text : emoji(text))
  view.call('setTextSize', UNIT_PX, dp(context, sizeDp))
  view.call('setTextColor', theme(colorKey))
  view.call('setSingleLine', true)
  view.call('setEllipsize', inu.jvm.cls('android.text.TextUtils$TruncateAt').getStaticField('END'))
  view.call('setIncludeFontPadding', false)
  view.call('setGravity', gravity)
  if (bold) view.call('setTypeface', inu.jvm.cls('android.graphics.Typeface').getStaticField('DEFAULT_BOLD'))
  return view
}

/** the version pill: the app's own badge look - a tinted rounded background with the label in the tint color */
function pill(context: any, label: string, tint: number): any {
  const view = new (inu.jvm.cls('android.widget.TextView'))(context)
  view.call('setText', label)
  view.call('setTextSize', UNIT_PX, dp(context, 11))
  view.call('setTextColor', tint)
  view.call('setTypeface', inu.jvm.cls('android.graphics.Typeface').getStaticField('DEFAULT_BOLD'))
  view.call('setSingleLine', true)
  view.call('setIncludeFontPadding', false)
  view.call('setBackground', shape(tint, dp(context, 5), 40))
  view.call('setPadding', dp(context, 6), dp(context, 2), dp(context, 6), dp(context, 2))
  return view
}

/** `null` when the svg or the drawable cannot be read, which only costs the row its leading glyph */
function iconView(context: any, icon: RowIcon | undefined, tint: number): any | null {
  if (!icon) return null
  try {
    const drawable = icon.svg
      ? new (inu.jvm.cls('android.graphics.drawable.BitmapDrawable'))(
        context.call('getResources'),
        inu.jvm.cls('org.telegram.messenger.SvgHelper')
          .callStatic('getBitmap', icon.svg.replace(MASK_STROKE, '#ffffff'), dp(context, ICON_DP), dp(context, ICON_DP), true),
      )
      : commonIcon(context, icon.common)
    if (!drawable) return null
    const view = new (inu.jvm.cls('android.widget.ImageView'))(context)
    view.call('setScaleType', inu.jvm.cls('android.widget.ImageView$ScaleType').getStaticField('FIT_CENTER'))
    view.call('setImageDrawable', drawable)
    view.call('setColorFilter', new (inu.jvm.cls('android.graphics.PorterDuffColorFilter'))(
      tint,
      inu.jvm.cls('android.graphics.PorterDuff$Mode').getStaticField('SRC_IN'),
    ))
    return view
  } catch (e) {
    console.log('row icon skipped', e)
    return null
  }
}

function commonIcon(context: any, name: CommonIcon | undefined): any | null {
  const resource = name ? COMMON_DRAWABLE[name] : undefined
  if (!resource) return null
  const resources = context.call('getResources')
  const id = resources.call('getIdentifier', resource, 'drawable', context.call('getPackageName'))
  return id ? resources.call('getDrawable', id, context.call('getTheme')) : null
}

function build(context: any, spec: RowSpec): any {
  const hero = !!spec.hero
  const pad = hero ? HERO_PAD_DP : 0
  const rtl = isRtl()
  const align = rtl ? TEXT_RIGHT : TEXT_LEFT
  const icon = iconView(
    context,
    spec.icon,
    theme(hero ? 'key_windowBackgroundWhiteBlueHeader' : 'key_windowBackgroundWhiteGrayIcon'),
  )

  const row = new (inu.jvm.cls('android.widget.LinearLayout'))(context)
  row.call('setOrientation', 0)
  row.call('setGravity', CENTER_VERTICAL)
  row.call('setMinimumHeight', dp(context, ROW_DP + 2 * pad))
  row.call('setTag', VIEW_TAG)
  row.call('setPaddingRelative', dp(context, icon ? ICON_LEFT_DP : NO_ICON_LEFT_DP), dp(context, pad), dp(context, VALUE_RIGHT_DP), dp(context, pad))

  const column = new (inu.jvm.cls('android.widget.LinearLayout'))(context)
  column.call('setOrientation', 1)

  const line = new (inu.jvm.cls('android.widget.LinearLayout'))(context)
  line.call('setOrientation', 0)
  line.call('setGravity', CENTER_VERTICAL)
  if (spec.pill) {
    const badge = pill(context, spec.pill, theme('key_windowBackgroundWhiteBlueHeader'))
    const badgeParams: any = new (inu.jvm.cls('android.widget.LinearLayout$LayoutParams'))(WRAP, WRAP)
    badgeParams.call('setMarginEnd', dp(context, PILL_GAP_DP))
    line.call('addView', badge, badgeParams)
  }
  line.call('addView', label(context, spec.title, 16, 'key_windowBackgroundWhiteBlackText', align, hero), new (inu.jvm.cls('android.widget.LinearLayout$LayoutParams'))(WRAP, WRAP))
  column.call('addView', line, new (inu.jvm.cls('android.widget.LinearLayout$LayoutParams'))(WRAP, WRAP))

  if (spec.subtitle) {
    const params: any = new (inu.jvm.cls('android.widget.LinearLayout$LayoutParams'))(WRAP, WRAP)
    params.call('setMargins', 0, dp(context, SUBTITLE_GAP_DP), 0, 0)
    column.call('addView', label(context, spec.subtitle, 13, 'key_windowBackgroundWhiteGrayText', align), params)
  }

  if (icon) {
    const params: any = new (inu.jvm.cls('android.widget.LinearLayout$LayoutParams'))(dp(context, ICON_BOX_DP), dp(context, ICON_BOX_DP))
    params.call('setMarginEnd', dp(context, TEXT_LEFT_DP - ICON_LEFT_DP - ICON_BOX_DP))
    row.call('addView', icon, params)
  }
  row.call('addView', column, new (inu.jvm.cls('android.widget.LinearLayout$LayoutParams'))(0, WRAP, WEIGHT))

  if (spec.value) {
    const params: any = new (inu.jvm.cls('android.widget.LinearLayout$LayoutParams'))(WRAP, WRAP)
    params.call('setMarginStart', dp(context, PILL_GAP_DP))
    row.call('addView', label(context, spec.value, 16, 'key_windowBackgroundWhiteValueText', align | CENTER_VERTICAL), params)
  }
  return row
}

function keep(view: any, id: number): void {
  held.push({ view, id })
  if (held.length > HELD_MAX) {
    const gone = held.shift()
    if (gone?.id) actions[gone.id - 1] = undefined
  }
}

/** The row as one element of a page, or `null` when the app cannot host a raw view (the caller then uses a button). */
export function nativeRow(spec: RowSpec): inu.UIElement | null {
  try {
    const activity = inu.android.getCurrentActivity()
    if (!activity) return null
    const view = build(activity, spec)
    let id = 0
    if (spec.onClick) {
      actions.push(spec.onClick)
      id = actions.length
      view.call('setId', id)
      view.call('setOnClickListener', click())
    }
    keep(view, id)
    return inu.android.nativeView(view)
  } catch (e) {
    console.log('native row unavailable, keeping the plain row', e)
    return null
  }
}
