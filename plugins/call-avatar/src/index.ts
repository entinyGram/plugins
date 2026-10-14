// Keep the native avatar/layout intact: only add a non-interactive photo layer.
const VoIP: any = inu.jvm.cls('org.telegram.ui.VoIPFragment')
const VoIPService: any = inu.jvm.cls('org.telegram.messenger.voip.VoIPService')
const BackupImageView: any = inu.jvm.cls('org.telegram.ui.Components.BackupImageView')
const FrameLayout: any = inu.jvm.cls('android.widget.FrameLayout')
const LayoutParams: any = inu.jvm.cls('android.widget.FrameLayout$LayoutParams')
const View: any = inu.jvm.cls('android.view.View')
const ImageLocation: any = inu.jvm.cls('org.telegram.messenger.ImageLocation')
const Looper: any = inu.jvm.cls('android.os.Looper')
const Handler: any = inu.jvm.cls('android.os.Handler')
const CountDownLatch: any = inu.jvm.cls('java.util.concurrent.CountDownLatch')
const TimeUnit: any = inu.jvm.cls('java.util.concurrent.TimeUnit')
const AndroidUtilities: any = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const BackgroundProvider: any = inu.jvm.cls('org.telegram.ui.Components.voip.VoIPBackgroundProvider')
const Paint: any = inu.jvm.cls('android.graphics.Paint')
const AtomicReference: any = inu.jvm.cls('java.util.concurrent.atomic.AtomicReference')
const styledProvider: any = new AtomicReference()
const buttonPaint: any = new Paint(1)
const revealPaint: any = new Paint(1)
buttonPaint.call('setColor', 0x59000000) // 35% black, no native blue shader.
revealPaint.call('setColor', 0) // Do not reintroduce blue during reveal animations.
const handler = new Handler(Looper.callStatic('getMainLooper'))
const off: (() => void)[] = []
let supported = false
let active: { fragment: any, layer: any, mini: any, status: any, topMargin: number } | null = null

function enabled(): boolean {
  return localStorage.getItem('call-avatar.enabled') !== 'false'
}

const modes = ['always', 'before', 'after']
function modeIndex(): number {
  return Math.max(0, modes.indexOf(localStorage.getItem('call-avatar.mode') ?? 'always'))
}

function refresh(): void {
  onUI(() => {
    detach(true)
    const fragment = VoIP.callStatic('getInstance')
    if (supported && fragment !== null) sync(fragment)
  })
}

// Only public Android/Java APIs. Wait through the JVM bridge (which releases
// the JS engine) so unload does not destroy the pending UI callback early.
function onUI(fn: () => void): void {
  const current = Looper.callStatic('myLooper')
  if (current !== null && current.call('equals', Looper.callStatic('getMainLooper'))) {
    fn()
    return
  }
  const done = new CountDownLatch(1)
  let cancelled = false
  let failure: unknown
  const task = inu.jvm.runnable(() => {
    try { if (!cancelled) fn() } catch (error) { failure = error }
    finally { done.call('countDown') }
  })
  if (!handler.call('post', task)) throw new Error('call-avatar: UI handler rejected task')
  if (!done.call('await(JLjava/util/concurrent/TimeUnit;)Z', 1, TimeUnit.getStaticField('SECONDS'))) {
    cancelled = true
    handler.call('removeCallbacks', task)
    throw new Error('call-avatar: UI task timed out; reopen the call screen')
  }
  if (failure !== undefined) throw failure
}

function detach(restore: boolean): void {
  if (!active) return
  const old = active
  active = null
  styledProvider.call('set', null)
  old.fragment.getField('backgroundProvider').call('invalidateViews')
  const parent = old.layer.call('getParent')
  if (parent !== null) parent.call('removeView', old.layer)
  const params = old.status.call('getLayoutParams')
  params.setField('topMargin', old.topMargin)
  old.status.call('setLayoutParams', params)
  if (restore) {
    old.fragment.call('showCallingUserAvatarMini(ZZ)V', false, false)
    old.fragment.call('updateViewState()V')
  }
}

function sync(fragment: any): void {
  const user = fragment.getField('callingUser')
  const noVideo = !fragment.getField('currentUserIsVideo') && !fragment.getField('callingUserIsVideo')
  // Native history stays true through reconnects and the end-of-call screen.
  const answered = fragment.getField('wasEstablished')
    || fragment.getField('currentState') === VoIPService.getStaticField('STATE_ESTABLISHED')
  const mode = modes[modeIndex()]
  const showInState = mode === 'always' || (mode === 'before' ? !answered : answered)
  const location = user === null ? null : ImageLocation.callStatic(
    'getForUserOrChat', fragment.getField('currentAccount'), user,
    ImageLocation.getStaticField('TYPE_BIG'),
  )
  if (!enabled() || !showInState || !noVideo || location === null || fragment.getField('isFinished')) {
    detach(!fragment.getField('isFinished'))
    return
  }
  const mini = fragment.getField('callingUserPhotoViewMini')
  if (mini === null) return
  if (active && !active.fragment.call('equals', fragment)) detach(true)
  if (!active) {
    const parent = mini.call('getParent')
    if (parent === null) return
    const context = mini.call('getContext')
    const layer = new FrameLayout(context)
    const image = new BackupImageView(context)
    image.call('setRoundRadius', 0)
    image.call('getImageReceiver').call('setAspectFit', false)
    image.call('setImage(Lorg/telegram/messenger/ImageLocation;Ljava/lang/String;Landroid/graphics/drawable/Drawable;Ljava/lang/Object;)V', location, null, null, user)
    layer.call('addView', image, new LayoutParams(-1, -1))
    // A translucent scrim keeps the native white labels/buttons readable.
    const scrim = new View(context)
    scrim.call('setBackgroundColor', 0x66000000)
    layer.call('addView', scrim, new LayoutParams(-1, -1))
    layer.call('setImportantForAccessibility', 4)
    layer.call('setClickable', false)
    const cover = fragment.getField('voIpCoverView')
    const index = parent.call('indexOfChild', cover)
    // Above the animated cover, below video surfaces and all call controls.
    parent.call('addView', layer, Math.max(0, index + 1), new LayoutParams(-1, -1))
    const status = fragment.getField('statusLayout')
    active = { fragment, layer, mini, status, topMargin: status.call('getLayoutParams').getField('topMargin') }
    const provider = fragment.getField('backgroundProvider')
    styledProvider.call('set', provider)
    provider.call('invalidateViews')
  }
  mini.call('animate').call('setListener', null).call('cancel')
  mini.call('setVisibility', 4) // INVISIBLE preserves native spacing and tag.
  positionText(fragment)
}

function positionText(fragment: any): void {
  if (!active || !active.fragment.call('equals', fragment)) return
  const insets = fragment.getField('lastInsets')
  const insetTop = insets === null ? 0 : insets.call('getSystemWindowInsetTop')
  const params = active.status.call('getLayoutParams')
  active.topMargin = AndroidUtilities.callStatic('dp', 135) + insetTop
  // Keep the expanded encryption-key explanation's native spacing.
  const expanded = fragment.getField('emojiExpanded')
  params.setField('topMargin', expanded ? active.topMargin : AndroidUtilities.callStatic('dp', 72) + insetTop)
  active.status.call('setLayoutParams', params)
  if (!expanded) {
    active.status.call('animate').call('setListener', null).call('cancel')
    active.status.call('setTranslationY', 0)
    active.status.call('setAlpha', 1)
    fragment.setField('statusLayoutAnimateToOffset', 0)
  }
}

try {
  // Drawing stays on the Java thread: no JS engine handoff per button/frame.
  // Only this call's provider is styled; white selected states and red hangup stay native.
  off.push(inu.xposed.hookMethod(BackgroundProvider.getDeclaredMethod('getLightPaint()Landroid/graphics/Paint;'), {
    after: inu.xposed.routine((ctx) => {
      if (ctx.thisObject === styledProvider.get()) ctx.setReturnValue(buttonPaint)
    }),
  }))
  off.push(inu.xposed.hookMethod(BackgroundProvider.getDeclaredMethod('getRevealPaint()Landroid/graphics/Paint;'), {
    after: inu.xposed.routine((ctx) => {
      if (ctx.thisObject === styledProvider.get()) ctx.setReturnValue(revealPaint)
    }),
  }))
  for (const method of ['updateViewState()V', 'setInsets(Landroid/view/WindowInsets;)V']) {
    off.push(inu.xposed.hookMethod(VoIP.getDeclaredMethod(method), {
      after(ctx) {
        if (method === 'updateViewState()V') sync(ctx.thisObject)
        else positionText(ctx.thisObject)
      },
    }))
  }
  off.push(inu.xposed.hookMethod(VoIP.getDeclaredMethod('showCallingUserAvatarMini(ZZ)V'), {
    after(ctx) {
      try { sync(ctx.thisObject) } catch (error) {
        console.warn('call-avatar: could not update photo', error)
        detach(true)
      }
    },
  }))
  off.push(inu.xposed.hookMethod(VoIP.getDeclaredMethod('destroy()V'), {
    before(ctx) {
      if (active && active.fragment.call('equals', ctx.thisObject)) detach(false)
    },
  }))
  supported = true
  onUI(() => {
    const fragment = VoIP.callStatic('getInstance')
    if (fragment !== null) sync(fragment)
  })
} catch (error) {
  supported = false
  for (const unhook of off.splice(0)) unhook()
  try { onUI(() => detach(true)) } catch (cleanupError) {
    console.warn('call-avatar: cleanup failed', cleanupError)
  }
  console.warn('call-avatar: this client does not support the required call hooks', error)
}

inu.onUnload(() => {
  for (const unhook of off.splice(0)) unhook()
  onUI(() => detach(true))
})

inu.registerSettings(inu.ui.settingsPage({
  title: 'Call avatar',
  items: () => [
    inu.ui.check({
      id: 'enabled',
      text: 'Фото на весь екран під час дзвінка',
      checked: enabled(),
      onChange(value) {
        localStorage.setItem('call-avatar.enabled', String(value))
        refresh()
      },
    }),
    inu.ui.select({
      id: 'mode',
      text: 'Коли показувати фото',
      items: ['Завжди', 'До відповіді', 'Після відповіді'],
      selected: modeIndex(),
      onChange(index) {
        localStorage.setItem('call-avatar.mode', modes[index] ?? 'always')
        refresh()
      },
    }),
    inu.ui.separator(supported
      ? 'Для голосових дзвінків. Без фото залишається штатний аватар; під час відео фон вимикається.'
      : 'Ця версія клієнта не підтримує потрібні хуки дзвінків.'),
  ],
}))