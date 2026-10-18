import { t } from './i18n.js'

let jvmLoaded = false

export let View: JavaClass
export let MotionEvent: JavaClass
export let Gravity: JavaClass
export let Dialog: JavaClass
export let FrameLayout: JavaClass
export let LinearLayout: JavaClass
export let FLP: JavaClass
export let LLP: JavaClass
export let TextView: JavaClass
export let EditText: JavaClass
export let ImageView: JavaClass
export let ScaleType: JavaClass
export let ScrollView: JavaClass
export let HScrollView: JavaClass
export let Toast: JavaClass
export let WebView: JavaClass
export let InputType: JavaClass
export let SpannableString: JavaClass
export let BgSpan: JavaClass
export let GradientDrawable: JavaClass
export let ColorDrawable: JavaClass
export let Matrix: JavaClass
export let RectF: JavaClass
export let Bitmap: JavaClass
export let BitmapConfig: JavaClass
export let BitmapFactory: JavaClass
export let BFOptions: JavaClass
export let ColorMatrix: JavaClass
export let ColorMatrixColorFilter: JavaClass
export let Typeface: JavaClass
export let TruncateAt: JavaClass
export let PdfRenderer: JavaClass
export let PdfPage: JavaClass
export let ExifInterface: JavaClass
export let ParcelFileDescriptor: JavaClass
export let JFile: JavaClass
export let JString: JavaClass
export let Intent: JavaClass
export let ClipData: JavaClass
export let ClipboardManager: JavaClass
export let ScaleGestureDetector: JavaClass
export let GestureDetector: JavaClass
export let RStyle: JavaClass
export let AlertBuilder: JavaClass
export let AndroidUtilities: JavaClass
export let FileLoader: JavaClass
export let UserConfig: JavaClass
export let FileProvider: JavaClass
export let FileInputStream: JavaClass
export let ByteArrayOutputStream: JavaClass
export let ZipFile: JavaClass
export let Looper: JavaClass
export let Handler: JavaClass
export let Activity: JavaClass
export let MessageObject: JavaClass
export let TLObject: JavaClass

let uiHandler: JavaObject | null = null

// Callbacks registry
let callbackSeq = 1
const callbacks = new Map<number, (...args: any[]) => any>()

export function registerCallback(fn: (...args: any[]) => any): number {
  const id = callbackSeq++
  callbacks.set(id, fn)
  return id
}

export function unregisterCallback(id: number) {
  callbacks.delete(id)
}

let ClickListenerCls: DefinedClass
let DlgClickListenerCls: DefinedClass
let DismissListenerCls: DefinedClass
let KeyListenerCls: DefinedClass
let TouchListenerCls: DefinedClass
let LayoutListenerCls: DefinedClass
let ScaleListenerCls: DefinedClass
let GestureListenerCls: DefinedClass

export function initJvm() {
  if (jvmLoaded) return
  jvmLoaded = true

  View = inu.jvm.cls('android.view.View')
  MotionEvent = inu.jvm.cls('android.view.MotionEvent')
  Gravity = inu.jvm.cls('android.view.Gravity')
  Dialog = inu.jvm.cls('android.app.Dialog')
  FrameLayout = inu.jvm.cls('android.widget.FrameLayout')
  LinearLayout = inu.jvm.cls('android.widget.LinearLayout')
  FLP = inu.jvm.cls('android.widget.FrameLayout$LayoutParams')
  LLP = inu.jvm.cls('android.widget.LinearLayout$LayoutParams')
  TextView = inu.jvm.cls('android.widget.TextView')
  EditText = inu.jvm.cls('android.widget.EditText')
  ImageView = inu.jvm.cls('android.widget.ImageView')
  ScaleType = inu.jvm.cls('android.widget.ImageView$ScaleType')
  ScrollView = inu.jvm.cls('android.widget.ScrollView')
  HScrollView = inu.jvm.cls('android.widget.HorizontalScrollView')
  Toast = inu.jvm.cls('android.widget.Toast')
  WebView = inu.jvm.cls('android.webkit.WebView')
  InputType = inu.jvm.cls('android.text.InputType')
  SpannableString = inu.jvm.cls('android.text.SpannableString')
  BgSpan = inu.jvm.cls('android.text.style.BackgroundColorSpan')
  GradientDrawable = inu.jvm.cls('android.graphics.drawable.GradientDrawable')
  ColorDrawable = inu.jvm.cls('android.graphics.drawable.ColorDrawable')
  Matrix = inu.jvm.cls('android.graphics.Matrix')
  RectF = inu.jvm.cls('android.graphics.RectF')
  Bitmap = inu.jvm.cls('android.graphics.Bitmap')
  BitmapConfig = inu.jvm.cls('android.graphics.Bitmap$Config')
  BitmapFactory = inu.jvm.cls('android.graphics.BitmapFactory')
  BFOptions = inu.jvm.cls('android.graphics.BitmapFactory$Options')
  ColorMatrix = inu.jvm.cls('android.graphics.ColorMatrix')
  ColorMatrixColorFilter = inu.jvm.cls('android.graphics.ColorMatrixColorFilter')
  Typeface = inu.jvm.cls('android.graphics.Typeface')
  TruncateAt = inu.jvm.cls('android.text.TextUtils$TruncateAt')
  PdfRenderer = inu.jvm.cls('android.graphics.pdf.PdfRenderer')
  PdfPage = inu.jvm.cls('android.graphics.pdf.PdfRenderer$Page')
  ExifInterface = inu.jvm.cls('android.media.ExifInterface')
  ParcelFileDescriptor = inu.jvm.cls('android.os.ParcelFileDescriptor')
  JFile = inu.jvm.cls('java.io.File')
  JString = inu.jvm.cls('java.lang.String')
  Intent = inu.jvm.cls('android.content.Intent')
  ClipData = inu.jvm.cls('android.content.ClipData')
  ClipboardManager = inu.jvm.cls('android.content.ClipboardManager')
  ScaleGestureDetector = inu.jvm.cls('android.view.ScaleGestureDetector')
  GestureDetector = inu.jvm.cls('android.view.GestureDetector')
  RStyle = inu.jvm.cls('android.R$style')
  AlertBuilder = inu.jvm.cls('android.app.AlertDialog$Builder')
  AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
  FileLoader = inu.jvm.cls('org.telegram.messenger.FileLoader')
  UserConfig = inu.jvm.cls('org.telegram.messenger.UserConfig')
  FileProvider = inu.jvm.cls('androidx.core.content.FileProvider')
  FileInputStream = inu.jvm.cls('java.io.FileInputStream')
  ByteArrayOutputStream = inu.jvm.cls('java.io.ByteArrayOutputStream')
  ZipFile = inu.jvm.cls('java.util.zip.ZipFile')
  Looper = inu.jvm.cls('android.os.Looper')
  Handler = inu.jvm.cls('android.os.Handler')
  Activity = inu.jvm.cls('android.app.Activity')
  MessageObject = inu.jvm.cls('org.telegram.messenger.MessageObject')
  TLObject = inu.jvm.cls('org.telegram.tgnet.TLObject')

  uiHandler = new Handler(Looper.callStatic('getMainLooper'))

  ClickListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls('android.view.View$OnClickListener')],
    fields: { cbId: 'int' },
    methods: {
      onClick: (self, v) => {
        const id = self.getField('cbId')
        callbacks.get(id)?.(v)
      },
    },
  })

  DlgClickListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls('android.content.DialogInterface$OnClickListener')],
    fields: { cbId: 'int' },
    methods: {
      onClick: (self, dialog, which) => {
        const id = self.getField('cbId')
        callbacks.get(id)?.(dialog, which)
      },
    },
  })

  DismissListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls('android.content.DialogInterface$OnDismissListener')],
    fields: { cbId: 'int' },
    methods: {
      onDismiss: (self, dialog) => {
        const id = self.getField('cbId')
        callbacks.get(id)?.(dialog)
      },
    },
  })

  KeyListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls('android.content.DialogInterface$OnKeyListener')],
    fields: { cbId: 'int' },
    methods: {
      onKey: {
        params: ['android.content.DialogInterface', 'int', 'android.view.KeyEvent'],
        returns: 'boolean',
        body: (self, dialog, keyCode, event) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.(keyCode, event))
        },
      },
    },
  })

  TouchListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls('android.view.View$OnTouchListener')],
    fields: { cbId: 'int' },
    methods: {
      onTouch: {
        params: ['android.view.View', 'android.view.MotionEvent'],
        returns: 'boolean',
        body: (self, view, event) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.(event))
        },
      },
    },
  })

  LayoutListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls('android.view.View$OnLayoutChangeListener')],
    fields: { cbId: 'int' },
    methods: {
      onLayoutChange: (self, v, l, t, r, b, ol, ot, or, ob) => {
        const id = self.getField('cbId')
        callbacks.get(id)?.(l, t, r, b, ol, ot, or, ob)
      },
    },
  })

  ScaleListenerCls = inu.jvm.defineClass({
    interfaces: [inu.jvm.cls('android.view.ScaleGestureDetector$OnScaleGestureListener')],
    fields: { cbId: 'int' },
    methods: {
      onScale: {
        params: ['android.view.ScaleGestureDetector'],
        returns: 'boolean',
        body: (self, detector) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('scale', detector))
        },
      },
      onScaleBegin: {
        params: ['android.view.ScaleGestureDetector'],
        returns: 'boolean',
        body: (self, detector) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('scaleBegin', detector) ?? true)
        },
      },
      onScaleEnd: {
        params: ['android.view.ScaleGestureDetector'],
        returns: 'void',
        body: (self, detector) => {
          const id = self.getField('cbId')
          callbacks.get(id)?.('scaleEnd', detector)
        },
      },
    },
  })

  GestureListenerCls = inu.jvm.defineClass({
    interfaces: [
      inu.jvm.cls('android.view.GestureDetector$OnGestureListener'),
      inu.jvm.cls('android.view.GestureDetector$OnDoubleTapListener'),
    ],
    fields: { cbId: 'int' },
    methods: {
      onDown: {
        params: ['android.view.MotionEvent'],
        returns: 'boolean',
        body: (self, e) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('down', e) ?? true)
        },
      },
      onShowPress: (self, e) => {
        const id = self.getField('cbId')
        callbacks.get(id)?.('showPress', e)
      },
      onSingleTapUp: {
        params: ['android.view.MotionEvent'],
        returns: 'boolean',
        body: (self, e) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('singleTapUp', e))
        },
      },
      onScroll: {
        params: ['android.view.MotionEvent', 'android.view.MotionEvent', 'float', 'float'],
        returns: 'boolean',
        body: (self, e1, e2, dx, dy) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('scroll', e1, e2, dx, dy))
        },
      },
      onLongPress: (self, e) => {
        const id = self.getField('cbId')
        callbacks.get(id)?.('longPress', e)
      },
      onFling: {
        params: ['android.view.MotionEvent', 'android.view.MotionEvent', 'float', 'float'],
        returns: 'boolean',
        body: (self, e1, e2, vx, vy) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('fling', e1, e2, vx, vy))
        },
      },
      onSingleTapConfirmed: {
        params: ['android.view.MotionEvent'],
        returns: 'boolean',
        body: (self, e) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('singleTapConfirmed', e) ?? true)
        },
      },
      onDoubleTap: {
        params: ['android.view.MotionEvent'],
        returns: 'boolean',
        body: (self, e) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('doubleTap', e) ?? true)
        },
      },
      onDoubleTapEvent: {
        params: ['android.view.MotionEvent'],
        returns: 'boolean',
        body: (self, e) => {
          const id = self.getField('cbId')
          return Boolean(callbacks.get(id)?.('doubleTapEvent', e))
        },
      },
    },
  })
}

export function createClickListener(fn: (v: any) => void): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new ClickListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function createDlgClickListener(fn: (dialog: any, which: number) => void): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new DlgClickListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function createDismissListener(fn: (dialog: any) => void): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new DismissListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function createKeyListener(fn: (keyCode: number, event: any) => boolean): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new KeyListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function createTouchListener(fn: (event: any) => boolean): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new TouchListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function createLayoutListener(fn: (...args: any[]) => void): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new LayoutListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function createScaleListener(fn: (event: string, detector: any) => boolean | void): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new ScaleListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function createGestureListener(fn: (event: string, ...args: any[]) => boolean | void): [JavaObject, () => void] {
  const id = registerCallback(fn)
  const listener = new GestureListenerCls()
  listener.setField('cbId', id)
  return [listener, () => unregisterCallback(id)]
}

export function runOnUI(fn: () => void) {
  if (uiHandler) {
    uiHandler.call('post', inu.jvm.runnable(fn))
  }
}

export function dp(density: number, val: number): number {
  return Math.round(val * density) | 0
}

export function rounded(color: number, radius: number): JavaObject {
  const gd = new GradientDrawable()
  gd.call('setColor', color | 0)
  gd.call('setCornerRadius', Number(radius))
  return gd
}

export function fillWhite(bmp: JavaObject) {
  try {
    bmp.call('eraseColor(I)V', -1)
    return
  } catch (e) {
    console.warn('DocViewer eraseColor failed, using canvas:', e)
  }
  try {
    const Canvas = inu.jvm.cls('android.graphics.Canvas')
    const c = new Canvas(bmp)
    c.call('drawColor(I)V', -1)
  } catch (e) {
    console.warn('DocViewer canvas fill failed:', e)
  }
}

export function humanSize(bytes: number): string {
  let n = Number(bytes)
  const units: string[] = t('units')
  const last = units[units.length - 1]
  for (const u of units) {
    if (n < 1024 || u === last) {
      return u === units[0] ? `${Math.round(n)} ${u}` : `${n.toFixed(1)} ${u}`
    }
    n /= 1024.0
  }
  return `${bytes} ${units[0]}`
}

export function fmtErr(e: unknown): string {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`.slice(0, 400)
  }
  return String(e).slice(0, 400)
}
