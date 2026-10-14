import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

for (const onMainThread of [true, false]) {
test(`photo lifecycle and unload (main thread: ${onMainThread})`, () => {
  const hooks = new Map<string, any>()
  const storage = new Map<string, string>()
  let unload: () => void = () => {}
  let page: any
  class Handle {
    fields: Record<string, any> = {}
    children: Handle[] = []
    parent: Handle | null = null
    get() { return this.fields.value ?? null }
    call(name: string, ...args: any[]): any {
      if (name === 'runWithScissors') throw new Error('Hidden Android API must not be used')
      if (name === 'post') { args[0](); return true }
      if (name === 'countDown') { this.fields.done = true; return }
      if (name === 'await(JLjava/util/concurrent/TimeUnit;)Z') return this.fields.done === true
      if (name === 'equals') return this === args[0]
      if (name === 'set') this.fields.value = args[0]
      if (name === 'setColor') this.fields.color = args[0]
      if (name === 'getContext') return this
      if (name === 'getParent') return this.parent
      if (name === 'getLayoutParams') return this.fields.params
      if (name === 'setLayoutParams') this.fields.params = args[0]
      if (name === 'setTranslationY') this.fields.translationY = args[0]
      if (name === 'getImageReceiver' || name === 'animate' || name === 'setListener') return this
      if (name === 'indexOfChild') return this.children.indexOf(args[0])
      if (name === 'addView') {
        const child = args[0] as Handle
        child.parent = this
        this.children.splice(args.length === 3 ? args[1] : this.children.length, 0, child)
      }
      if (name === 'removeView') {
        this.children.splice(this.children.indexOf(args[0]), 1)
        args[0].parent = null
      }
      if (name === 'setVisibility') this.fields.visibility = args[0]
      if (name === 'showCallingUserAvatarMini(ZZ)V') {
        mini.fields.visibility = fragment.fields.currentUserIsVideo || fragment.fields.callingUserIsVideo ? 8 : 0
      }
    }
    getField(name: string) { return this.fields[name] }
    setField(name: string, value: any) { this.fields[name] = value }
  }
  const main = new Handle()
  const parent = new Handle()
  const cover = new Handle()
  const mini = new Handle()
  const fragment = new Handle()
  const user = new Handle()
  const status = new Handle()
  const params = new Handle()
  const provider = new Handle()
  params.fields.topMargin = 135
  status.fields.params = params
  fragment.fields = {
    callingUser: user, currentAccount: 0, currentUserIsVideo: false,
    callingUserIsVideo: false, isFinished: false,
    callingUserPhotoViewMini: mini, voIpCoverView: cover,
    statusLayout: status, lastInsets: null, emojiExpanded: false,
    currentState: 0, wasEstablished: false,
    backgroundProvider: provider,
  }
  parent.call('addView', cover)
  parent.call('addView', mini)
  let hasPhoto = true
  const cls = (name: string): any => {
    const C: any = function () { return new Handle() }
    C.getDeclaredMethod = (method: string) => method
    C.getStaticField = () => 1
    C.callStatic = (method: string, ...args: any[]) => {
      if (method === 'dp') return args[0]
      if (name.endsWith('Looper')) return method === 'myLooper' && !onMainThread ? null : main
      if (method === 'getInstance') return fragment
      if (method === 'getForUserOrChat') return hasPhoto ? user : null
      throw new Error(`Unexpected static call: ${name}.${method}`)
    }
    return C
  }
  const inu = {
    jvm: { cls, runnable: (fn: any) => fn },
    xposed: { routine: (fn: any) => fn, hookMethod(method: string, hook: any) {
      hooks.set(method, hook)
      return () => hooks.delete(method)
    } },
    onUnload(fn: any) { unload = fn },
    registerSettings(value: any) { page = value },
    ui: { settingsPage: (v: any) => v, check: (v: any) => v, select: (v: any) => v, separator: (v: any) => v },
  }
  const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
  runInNewContext(new Bun.Transpiler({ loader: 'ts' }).transformSync(source), {
    inu, console, localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  })
  const update = () => {
    fragment.call('showCallingUserAvatarMini(ZZ)V', false, false)
    hooks.get('showCallingUserAvatarMini(ZZ)V').after({ thisObject: fragment })
  }
  const nativePaint = new Handle()
  const paintFor = (owner = provider, reveal = false) => {
    let value = nativePaint
    hooks.get(reveal ? 'getRevealPaint()Landroid/graphics/Paint;' : 'getLightPaint()Landroid/graphics/Paint;').after({
      thisObject: owner, setReturnValue(v: any) { value = v },
    })
    return value
  }
  expect(paintFor().fields.color).toBe(0x59000000)
  expect(paintFor(provider, true).fields.color).toBe(0)
  expect(paintFor(new Handle())).toBe(nativePaint)
  expect(parent.children.length).toBe(3)
  expect(parent.children[1]).not.toBe(mini)
  expect(mini.fields.visibility).toBe(4)
  expect(params.fields.topMargin).toBe(72)
  status.fields.translationY = 147
  hooks.get('updateViewState()V').after({ thisObject: fragment })
  expect(status.fields.translationY).toBe(0)
  update()
  expect(parent.children.length).toBe(3) // No duplicate backgrounds.
  fragment.fields.currentUserIsVideo = true
  update()
  expect(parent.children.length).toBe(2)
  expect(mini.fields.visibility).toBe(8)
  expect(paintFor()).toBe(nativePaint)
  expect(params.fields.topMargin).toBe(135)
  fragment.fields.currentUserIsVideo = false
  update()
  expect(parent.children.length).toBe(3)
  page.items()[0].onChange(false)
  expect(paintFor()).toBe(nativePaint)
  expect(parent.children.length).toBe(2)
  expect(mini.fields.visibility).toBe(0)
  page.items()[0].onChange(true)
  expect(paintFor().fields.color).toBe(0x59000000)
  expect(parent.children.length).toBe(3)
  hasPhoto = false
  update()
  expect(paintFor()).toBe(nativePaint)
  expect(parent.children.length).toBe(2)
  expect(mini.fields.visibility).toBe(0)
  hasPhoto = true
  update()
  expect(page.items()[1].selected).toBe(0)
  page.items()[1].onChange(1) // Before answer.
  expect(parent.children.length).toBe(3)
  fragment.fields.currentState = 1 // Mock STATE_ESTABLISHED.
  update()
  expect(parent.children.length).toBe(2)
  expect(mini.fields.visibility).toBe(0)
  expect(params.fields.topMargin).toBe(135)
  fragment.fields.wasEstablished = true
  expect(paintFor()).toBe(nativePaint)
  fragment.fields.currentState = 5 // Reconnecting after answer.
  update()
  expect(parent.children.length).toBe(2)
  page.items()[1].onChange(2) // After answer, including reconnects.
  expect(paintFor().fields.color).toBe(0x59000000)
  expect(parent.children.length).toBe(3)
  fragment.fields.wasEstablished = false
  fragment.fields.currentState = 0 // A fresh unanswered call.
  update()
  expect(parent.children.length).toBe(2)
  fragment.fields.currentState = 1
  update()
  expect(parent.children.length).toBe(3)
  fragment.fields.currentUserIsVideo = true
  update()
  expect(parent.children.length).toBe(2)
  fragment.fields.currentUserIsVideo = false
  page.items()[1].onChange(0)
  expect(parent.children.length).toBe(3)
  hooks.get('destroy()V').before({ thisObject: fragment })
  expect(parent.children.length).toBe(2)
  update()
  unload()
  expect(parent.children.length).toBe(2)
  expect(mini.fields.visibility).toBe(0)
  expect(hooks.size).toBe(0)
  expect(params.fields.topMargin).toBe(135)
})
}