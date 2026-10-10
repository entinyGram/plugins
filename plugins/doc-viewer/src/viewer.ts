import {
  C_BAR, C_BG, C_BTN, C_ERR, C_PILL, C_SUB, C_TEXT,
  Doc, ENCODINGS, FONT_NAMES, KIND, LABELS, MAX_HITS, MAX_SPANS, MD_EXT,
  TEXTUAL, THEMES, WEB_LABELS,
} from './types.js'
import {
  AlertBuilder, BgSpan, Bitmap, ColorDrawable, ColorMatrix, ColorMatrixColorFilter,
  createClickListener, createDismissListener, createDlgClickListener, createGestureListener,
  createKeyListener, createLayoutListener, createScaleListener, createTouchListener,
  Dialog, dp, EditText, FileProvider, FLP, fmtErr, FrameLayout, GestureDetector, Gravity, HScrollView,
  humanSize, ImageView, InputType, Intent, JFile, JString, LinearLayout, LLP,
  Matrix, MotionEvent, RectF, rounded, RStyle, runOnUI, ScaleGestureDetector, ScaleType, ScrollView,
  SpannableString, TextView, Toast, TruncateAt, Typeface, View, WebView,
} from './jvm.js'
import { buildTextDoc } from './parsers/text.js'
import { buildDoc } from './parsers/office.js'
import { archiveDoc } from './parsers/archive.js'
import { buildWeb } from './parsers/web.js'
import { decodeImage } from './parsers/image.js'
import { renderPdfPage } from './parsers/pdf.js'
import { formatLabel, t } from './i18n.js'

export class DocViewer {
  act: JavaObject
  path: string
  name: string
  fmt: string
  ext: string
  kind: string
  label: string
  mime: string
  renderer: JavaObject | null
  pfd: JavaObject | null
  count: number
  index = 0
  token = 0
  shownTok = -1
  closed = false
  srcBitmap: JavaObject | null = null
  bitmap: JavaObject | null = null
  cache = new Map<number, JavaObject>()
  cacheOrder: number[] = []
  rot = 0
  bw = 1
  bh = 1
  fit = 1.0
  minScale = 1.0
  maxZoom = 6.0
  matrix: JavaObject
  vals: any = null
  lx = 0.0
  ly = 0.0
  chrome = true
  dlg: JavaObject | null = null
  root: JavaObject | null = null
  iv: JavaObject | null = null
  loading: JavaObject | null = null
  topBar: JavaObject | null = null
  box: JavaObject | null = null
  pager: JavaObject | null = null
  searchBar: JavaObject | null = null
  sv: JavaObject | null = null
  hsv: JavaObject | null = null
  tv: JavaObject | null = null
  wv: JavaObject | null = null
  nameTv: JavaObject | null = null
  subTv: JavaObject | null = null
  prevB: JavaObject | null = null
  nextB: JavaObject | null = null
  counter: JavaObject | null = null
  sCount: JavaObject | null = null
  doc: Doc | null = null
  pages: string[] = []
  loadTok = 0
  keepIndex: number | null = null
  enc: string | null = null
  font = 0
  wrap = true
  webZoom = 100
  hits: Array<[page: number, start: number, end: number]> = []
  hitsByPage = new Map<number, number[]>()
  cur = -1
  invert = false
  fitWidth = false
  textSize = 15.0
  theme = 0
  density = 1.0
  sizeTxt: string
  cleanupFns: Array<() => void> = []

  constructor(
    act: JavaObject,
    path: string,
    name: string,
    fmt: string,
    ext: string,
    mime: string,
    renderer: JavaObject | null = null,
    pfd: JavaObject | null = null,
    count = 1,
  ) {
    this.act = act
    this.path = path
    this.name = name
    this.fmt = fmt
    this.ext = ext
    this.kind = KIND[fmt] ?? 'text'
    this.label = formatLabel(fmt, ext)
    this.mime = mime ?? ''
    this.renderer = renderer
    this.pfd = pfd
    this.count = Math.max(1, count)

    this.matrix = new Matrix()
    this.invert = localStorage.getItem('invert') === 'true'
    this.fitWidth = localStorage.getItem('fitwidth') === 'true'
    this.textSize = Number(localStorage.getItem('text_size') ?? '15.0')
    this.theme = Number(localStorage.getItem('theme') ?? '0') % THEMES.length

    const res = act.call('getResources')
    const dm = res.call('getDisplayMetrics')
    this.density = Number(dm.getField('density'))

    const file = new JFile(path)
    this.sizeTxt = humanSize(Number(file.call('length')))
  }

  dp(v: number): number {
    return dp(this.density, v)
  }

  toast(text: string) {
    try {
      Toast.callStatic('makeText', this.act, text, 0).call('show')
    } catch {}
  }

  sysDim(name: string): number {
    try {
      const res = this.act.call('getResources')
      const rid = Number(res.call('getIdentifier', name, 'dimen', 'android'))
      if (rid > 0) {
        return Number(res.call('getDimensionPixelSize', rid))
      }
    } catch {}
    return 0
  }

  viewSize(): [number, number] {
    let w = this.iv ? Number(this.iv.call('getWidth')) : 0
    let h = this.iv ? Number(this.iv.call('getHeight')) : 0
    if (w <= 0 || h <= 0) {
      const dm = this.act.call('getResources').call('getDisplayMetrics')
      w = Number(dm.getField('widthPixels'))
      h = Number(dm.getField('heightPixels'))
    }
    return [w, h]
  }

  button(text: string, size: number, fn: () => void, w = 44, h = 44, bg = C_BTN): JavaObject {
    const tv = new TextView(this.act)
    tv.call('setText', text)
    tv.call('setTextSize', Number(size))
    tv.call('setTextColor', C_TEXT)
    tv.call('setGravity', Gravity.getStaticField('CENTER'))
    tv.call('setBackground', rounded(bg, this.dp(h / 2.0)))
    tv.call('setLayoutParams', new LLP(this.dp(w), this.dp(h)))

    const [listener, unreg] = createClickListener(fn)
    this.cleanupFns.push(unreg)
    tv.call('setOnClickListener', listener)
    return tv
  }

  pill(): JavaObject {
    const p = new LinearLayout(this.act)
    p.call('setOrientation', LinearLayout.getStaticField('HORIZONTAL'))
    p.call('setGravity', Gravity.getStaticField('CENTER_VERTICAL'))
    p.call('setBackground', rounded(C_PILL, this.dp(30)))
    p.call('setPadding', this.dp(8), this.dp(8), this.dp(8), this.dp(8))
    return p
  }

  counterView(minWidth: number): JavaObject {
    const tv = new TextView(this.act)
    tv.call('setTextColor', C_TEXT)
    tv.call('setTextSize', 15.0)
    tv.call('setTypeface', Typeface.getStaticField('DEFAULT_BOLD'))
    tv.call('setGravity', Gravity.getStaticField('CENTER'))
    tv.call('setMinWidth', this.dp(minWidth))
    return tv
  }

  setLoading(text: string, color = C_SUB) {
    if (this.loading) {
      this.loading.call('setText', text)
      this.loading.call('setTextColor', color)
      this.loading.call('setVisibility', View.getStaticField('VISIBLE'))
    }
  }

  showError(text: string) {
    if (this.loading) {
      this.setLoading(`${t('load_fail')}\n\n${text}`, C_ERR)
    } else {
      this.toast(text)
    }
  }

  builder(): JavaObject {
    try {
      return new AlertBuilder(this.act, RStyle.getStaticField('Theme_DeviceDefault_Dialog_Alert'))
    } catch {
      return new AlertBuilder(this.act)
    }
  }

  inputDialog(title: string, initial: string, number: boolean, okText: string, onOk: (v: string) => void) {
    const et = new EditText(this.act)
    et.call('setInputType', number ? InputType.getStaticField('TYPE_CLASS_NUMBER') : InputType.getStaticField('TYPE_CLASS_TEXT'))
    et.call('setSingleLine', true)
    et.call('setText', initial)
    et.call('setSelectAllOnFocus', true)

    const [dlgClick, unreg] = createDlgClickListener((_, which) => {
      onOk(String(et.call('getText').call('toString')).trim())
    })
    this.cleanupFns.push(unreg)

    const b = this.builder()
    b.call('setTitle', title)
    b.call('setPositiveButton', okText, dlgClick)
    b.call('setNegativeButton', t('cancel'), null)
    const d = b.call('create')
    d.call('setView', et, this.dp(20), this.dp(8), this.dp(20), 0)
    try {
      d.call('getWindow').call('setSoftInputMode', 5)
    } catch {}
    d.call('show')
    et.call('requestFocus')
  }

  loadPos(): number {
    try {
      const raw = localStorage.getItem('docviewer_pos')
      if (raw) {
        const d = JSON.parse(raw)
        return Number(d[this.path] ?? 0)
      }
    } catch {}
    return 0
  }

  savePos() {
    if ((this.kind !== 'pdf' && this.kind !== 'text') || this.count < 2) return
    if (localStorage.getItem('remember') === 'false') return
    try {
      const raw = localStorage.getItem('docviewer_pos')
      const d = raw ? JSON.parse(raw) : {}
      d[this.path] = this.index
      localStorage.setItem('docviewer_pos', JSON.stringify(d))
    } catch {}
  }

  show() {
    const act = this.act
    const dlg = new Dialog(act, RStyle.getStaticField('Theme_Black_NoTitleBar_Fullscreen'))
    this.dlg = dlg
    const win = dlg.call('getWindow')
    try {
      win.call('setBackgroundDrawable', new ColorDrawable(C_BG))
      const p = win.call('getAttributes')
      p.setField('windowAnimations', RStyle.getStaticField('Animation_Dialog'))
      win.call('setAttributes', p)
      if (localStorage.getItem('keepon') !== 'false') {
        win.call('addFlags', 128) // FLAG_KEEP_SCREEN_ON
      }
    } catch (e) {
      console.warn('DocViewer window error:', e)
    }

    const sbh = this.sysDim('status_bar_height')
    const nbh = this.sysDim('navigation_bar_height')

    const root = new FrameLayout(act)
    root.call('setBackgroundColor', C_BG)
    this.root = root

    if (this.kind === 'text') {
      this.buildTextView(root, sbh, nbh)
    } else if (this.kind === 'web') {
      this.buildWebView(root, sbh)
    } else {
      this.buildImageView(root)
    }

    const ld = new TextView(act)
    ld.call('setText', t('loading'))
    ld.call('setTextColor', C_SUB)
    ld.call('setTextSize', 15.0)
    ld.call('setGravity', Gravity.getStaticField('CENTER'))
    ld.call('setPadding', this.dp(28), 0, this.dp(28), 0)
    try { ld.call('setTextIsSelectable', true) } catch {}
    this.loading = ld
    root.call('addView', ld, new FLP(-1, -2, Gravity.getStaticField('CENTER')))

    this.buildTopBar(root, sbh)
    if (this.kind === 'pdf' || this.kind === 'text') {
      this.buildBottom(root, nbh)
    }

    dlg.call('setContentView', root)

    const [dismissL, unregDismiss] = createDismissListener(() => this.cleanup())
    this.cleanupFns.push(unregDismiss)
    dlg.call('setOnDismissListener', dismissL)

    const [keyL, unregKey] = createKeyListener((keyCode, ev) => this.onKey(keyCode, ev))
    this.cleanupFns.push(unregKey)
    dlg.call('setOnKeyListener', keyL)

    this.updateSub()
    this.syncChrome()
    dlg.call('show')

    if (this.kind === 'pdf') {
      const start = localStorage.getItem('remember') !== 'false' ? this.loadPos() : 0
      this.showPage(Math.max(0, Math.min(this.count - 1, start)))
    } else if (this.kind === 'image') {
      this.loadImage()
    } else if (this.kind === 'text') {
      this.startLoad()
    } else {
      this.startWeb()
    }
  }

  buildImageView(root: JavaObject) {
    const act = this.act
    const iv = new ImageView(act)
    iv.call('setScaleType', ScaleType.getStaticField('MATRIX'))
    iv.call('setBackgroundColor', C_BG)
    this.iv = iv

    const [scaleL, unregScale] = createScaleListener((ev, det) => {
      if (ev === 'scale') {
        const factor = Number(det.call('getScaleFactor'))
        const fx = Number(det.call('getFocusX'))
        const fy = Number(det.call('getFocusY'))
        this.zoomBy(factor, fx, fy)
        return true
      }
      return true
    })
    this.cleanupFns.push(unregScale)
    const scaleDet = new ScaleGestureDetector(act, scaleL)

    const [gestL, unregGest] = createGestureListener((ev, ...args) => {
      if (ev === 'doubleTap') {
        const e = args[0]
        this.doubleTap(Number(e.call('getX')), Number(e.call('getY')))
        return true
      }
      if (ev === 'singleTapConfirmed') {
        this.toggleChrome()
        return true
      }
      if (ev === 'fling') {
        const vx = Number(args[2])
        const vy = Number(args[3])
        if (this.fitsWidth() && Math.abs(vx) > 900 && Math.abs(vx) > Math.abs(vy) * 1.5) {
          this.go(this.index + (vx < 0 ? 1 : -1))
          return true
        }
      }
      return false
    })
    this.cleanupFns.push(unregGest)
    const gestDet = new GestureDetector(act, gestL)
    gestDet.call('setOnDoubleTapListener', gestL)

    const [touchL, unregTouch] = createTouchListener((ev) => {
      try {
        scaleDet.call('onTouchEvent', ev)
        gestDet.call('onTouchEvent', ev)
        const a = Number(ev.call('getActionMasked'))
        if (a === MotionEvent.getStaticField('ACTION_DOWN')) {
          this.lx = Number(ev.call('getX'))
          this.ly = Number(ev.call('getY'))
        } else if (a === MotionEvent.getStaticField('ACTION_MOVE') && Number(ev.call('getPointerCount')) === 1) {
          if (!scaleDet.call('isInProgress')) {
            const x = Number(ev.call('getX'))
            const y = Number(ev.call('getY'))
            if (this.bitmap) {
              this.matrix.call('postTranslate', Number(x - this.lx), Number(y - this.ly))
              this.fixBounds()
              this.applyMatrix()
            }
            this.lx = x
            this.ly = y
          }
        }
      } catch (e) {
        console.warn('DocViewer touch error:', e)
      }
      return true
    })
    this.cleanupFns.push(unregTouch)
    iv.call('setOnTouchListener', touchL)

    const [layoutL, unregLayout] = createLayoutListener(() => {
      if (this.bitmap) this.resetZoom()
    })
    this.cleanupFns.push(unregLayout)
    iv.call('addOnLayoutChangeListener', layoutL)

    root.call('addView', iv, new FLP(-1, -1))
  }

  buildTextView(root: JavaObject, sbh: number, nbh: number) {
    const act = this.act
    const sv = new ScrollView(act)
    sv.call('setVerticalScrollBarEnabled', true)
    const tv = new TextView(act)
    tv.call('setLineSpacing', 0.0, 1.25)
    tv.call('setPadding', this.dp(18), sbh + this.dp(86), this.dp(18), nbh + this.dp(130))
    try { tv.call('setTextIsSelectable', true) } catch {}

    const [clickL, unreg] = createClickListener(() => this.toggleChrome())
    this.cleanupFns.push(unreg)
    tv.call('setOnClickListener', clickL)

    this.sv = sv
    this.tv = tv
    this.attachText()
    this.applyFont()
    this.applyTheme()
    root.call('addView', sv, new FLP(-1, -1))
  }

  attachText() {
    if (!this.sv || !this.tv) return
    if (this.hsv) {
      this.hsv.call('removeAllViews')
      this.hsv = null
    }
    this.sv.call('removeAllViews')
    if (this.wrap) {
      this.tv.call('setMinWidth', 0)
      this.sv.call('addView', this.tv, new FLP(-1, -2))
    } else {
      const hsv = new HScrollView(this.act)
      hsv.call('setHorizontalScrollBarEnabled', true)
      const dm = this.act.call('getResources').call('getDisplayMetrics')
      this.tv.call('setMinWidth', Number(dm.getField('widthPixels')))
      hsv.call('addView', this.tv, new FLP(-2, -2))
      this.sv.call('addView', hsv, new FLP(-1, -2))
      this.hsv = hsv
    }
  }

  buildWebView(root: JavaObject, sbh: number) {
    const wv = new WebView(this.act)
    const s = wv.call('getSettings')
    s.call('setJavaScriptEnabled', false)
    s.call('setBlockNetworkLoads', true)
    s.call('setAllowFileAccess', false)
    s.call('setAllowContentAccess', false)
    s.call('setSupportZoom', true)
    s.call('setBuiltInZoomControls', true)
    s.call('setDisplayZoomControls', false)
    s.call('setUseWideViewPort', true)
    s.call('setLoadWithOverviewMode', true)
    this.wv = wv
    this.applyTheme()
    const lp = new FLP(-1, -1)
    lp.call('setMargins', 0, sbh + this.dp(76), 0, 0)
    root.call('addView', wv, lp)
  }

  buildTopBar(root: JavaObject, sbh: number) {
    const act = this.act
    const bar = new LinearLayout(act)
    bar.call('setOrientation', LinearLayout.getStaticField('HORIZONTAL'))
    bar.call('setGravity', Gravity.getStaticField('CENTER_VERTICAL'))
    bar.call('setBackground', rounded(C_BAR, this.dp(28)))
    bar.call('setPadding', this.dp(6), this.dp(6), this.dp(6), this.dp(6))
    bar.call('addView', this.button('✕', 18, () => this.close()))

    const titles = new LinearLayout(act)
    titles.call('setOrientation', LinearLayout.getStaticField('VERTICAL'))
    this.nameTv = new TextView(act)
    this.nameTv.call('setText', this.name)
    this.nameTv.call('setTextColor', C_TEXT)
    this.nameTv.call('setTextSize', 16.0)
    this.nameTv.call('setTypeface', Typeface.getStaticField('DEFAULT_BOLD'))
    this.nameTv.call('setSingleLine', true)
    this.nameTv.call('setEllipsize', TruncateAt.getStaticField('END'))

    this.subTv = new TextView(act)
    this.subTv.call('setTextColor', C_SUB)
    this.subTv.call('setTextSize', 12.5)
    this.subTv.call('setSingleLine', true)

    titles.call('addView', this.nameTv)
    titles.call('addView', this.subTv)

    const tlp = new LLP(0, -2, 1.0)
    tlp.call('setMargins', this.dp(12), 0, this.dp(8), 0)
    bar.call('addView', titles, tlp)
    bar.call('addView', this.button('•••', 13, () => this.openMenu()))

    const blp = new FLP(-1, -2, Gravity.getStaticField('TOP'))
    blp.call('setMargins', this.dp(12), sbh + this.dp(8), this.dp(12), 0)
    root.call('addView', bar, blp)
    this.topBar = bar
  }

  buildBottom(root: JavaObject, nbh: number) {
    const act = this.act
    const box = new LinearLayout(act)
    box.call('setOrientation', LinearLayout.getStaticField('VERTICAL'))
    box.call('setGravity', Gravity.getStaticField('CENTER_HORIZONTAL'))

    if (this.kind === 'text') {
      const sb = this.pill()
      this.sCount = this.counterView(96)
      sb.call('addView', this.button('✕', 15, () => this.endSearch(), 42, 42))
      sb.call('addView', this.button('‹', 22, () => this.stepHit(-1), 42, 42))
      sb.call('addView', this.sCount)
      sb.call('addView', this.button('›', 22, () => this.stepHit(1), 42, 42))
      sb.call('setVisibility', View.getStaticField('GONE'))
      const slp = new LLP(-2, -2)
      slp.call('setMargins', 0, 0, 0, this.dp(8))
      box.call('addView', sb, slp)
      this.searchBar = sb
    }

    const pager = this.pill()
    this.prevB = this.button('‹', 24, () => this.go(this.index - 1), 46, 46)
    this.nextB = this.button('›', 24, () => this.go(this.index + 1), 46, 46)
    this.counter = this.counterView(86)

    const [clickL, unreg] = createClickListener(() => this.jumpDialog())
    this.cleanupFns.push(unreg)
    this.counter.call('setOnClickListener', clickL)

    pager.call('addView', this.prevB)
    pager.call('addView', this.counter)
    pager.call('addView', this.nextB)
    box.call('addView', pager, new LLP(-2, -2))
    this.pager = pager

    const plp = new FLP(-2, -2, Gravity.getStaticField('BOTTOM') | Gravity.getStaticField('CENTER_HORIZONTAL'))
    plp.call('setMargins', 0, 0, 0, nbh + this.dp(20))
    root.call('addView', box, plp)
    this.box = box
  }

  updateSub() {
    const parts = [this.label]
    if ((this.kind === 'pdf' || this.kind === 'text') && this.count > 1) {
      parts.push(`${this.count} ${t('pages_short')}`)
    }
    parts.push(this.sizeTxt)
    this.subTv?.call('setText', parts.join(' · '))
    this.updateCounter()
  }

  updateCounter() {
    if (!this.pager) return
    this.counter?.call('setText', `${this.index + 1} / ${this.count}`)
    this.prevB?.call('setAlpha', Number(this.index <= 0 ? 0.35 : 1.0))
    this.nextB?.call('setAlpha', Number(this.index >= this.count - 1 ? 0.35 : 1.0))
  }

  syncChrome() {
    const vis = this.chrome ? View.getStaticField('VISIBLE') : View.getStaticField('GONE')
    if (this.kind !== 'web') {
      this.topBar?.call('setVisibility', vis)
    }
    if (this.box) {
      this.box.call('setVisibility', vis)
      this.pager?.call('setVisibility', this.count > 1 ? View.getStaticField('VISIBLE') : View.getStaticField('GONE'))
    }
  }

  toggleChrome() {
    this.chrome = !this.chrome
    this.syncChrome()
  }

  close() {
    this.dlg?.call('dismiss')
  }

  cleanup() {
    if (this.closed) return
    this.closed = true
    this.savePos()

    for (const fn of this.cleanupFns) {
      try { fn() } catch {}
    }
    this.cleanupFns.length = 0

    if (this.wv) {
      try {
        this.root?.call('removeView', this.wv)
        this.wv.call('destroy')
      } catch {}
      this.wv = null
    }

    try {
      this.renderer?.call('close')
      this.renderer = null
      this.pfd?.call('close')
      this.pfd = null
    } catch {}
  }

  onKey(code: number, ev: any): boolean {
    if ((code !== 24 && code !== 25) || localStorage.getItem('volume') === 'false') {
      return false
    }
    const step = code === 25 ? 1 : -1
    const action = Number(ev.call('getAction'))
    if (this.kind === 'pdf') {
      if (action === 0) this.go(this.index + step)
      return true
    }
    if (this.kind === 'text' && this.doc) {
      if (action === 0) {
        if (this.sv?.call('canScrollVertically', step)) {
          const svH = Number(this.sv.call('getHeight'))
          this.sv.call('smoothScrollBy', 0, Math.round(step * svH * 0.85))
        } else if (this.index + step >= 0 && this.index + step < this.count) {
          this.go(this.index + step)
        }
      }
      return true
    }
    return false
  }

  startLoad(keepIndex = false) {
    this.loadTok++
    const tok = this.loadTok
    this.keepIndex = keepIndex ? this.index : null
    this.clearHits()
    this.setLoading(t('loading'))

    setTimeout(() => {
      try {
        const opts = {
          wrap: this.wrap,
          prettyjson: localStorage.getItem('prettyjson') !== 'false',
          csvTable: localStorage.getItem('csv_table') !== 'false',
        }
        let doc: Doc
        if (TEXTUAL.has(this.fmt)) {
          doc = buildTextDoc(this.path, this.fmt, this.ext, opts, this.enc)
        } else if (this.fmt === 'archive') {
          doc = archiveDoc(this.path)
        } else {
          doc = buildDoc(this.path, this.fmt, this.ext, opts, this.enc)
        }
        runOnUI(() => this.onDoc(doc, tok))
      } catch (e) {
        const msg = fmtErr(e)
        runOnUI(() => this.showError(msg))
      }
    }, 10)
  }

  onDoc(doc: Doc, tok: number) {
    if (this.closed || tok !== this.loadTok) return
    this.doc = doc
    this.pages = doc.pages
    this.count = doc.pages.length
    this.font = doc.font
    this.wrap = doc.wrap
    this.attachText()
    this.applyFont()
    this.loading?.call('setVisibility', View.getStaticField('GONE'))

    let start = 0
    if (this.keepIndex !== null) {
      start = this.keepIndex
    } else if (localStorage.getItem('remember') !== 'false') {
      start = this.loadPos()
    }
    this.updateSub()
    this.syncChrome()
    this.showTextPage(start)
  }

  applyFont() {
    if (!this.tv) return
    const faces = [
      Typeface.getStaticField('DEFAULT'),
      Typeface.getStaticField('SERIF'),
      Typeface.getStaticField('MONOSPACE'),
    ]
    this.tv.call('setTypeface', faces[this.font % faces.length])
    this.tv.call('setTextSize', Number(this.textSize))
  }

  applyTheme() {
    const t = THEMES[this.theme]
    if (this.kind === 'text') {
      this.root?.call('setBackgroundColor', t.bg)
      this.sv?.call('setBackgroundColor', t.bg)
      this.tv?.call('setTextColor', t.fg)
    } else if (this.kind === 'web') {
      this.wv?.call('setBackgroundColor', MD_EXT.has(this.ext) ? t.bg : -1)
    }
  }

  renderPage() {
    if (!this.tv) return
    const text = this.pages[this.index] ?? ''
    const ids = this.hitsByPage.get(this.index)
    if (!ids || ids.length === 0) {
      this.tv.call('setText', text)
      return
    }

    const t = THEMES[this.theme]
    const chosen = ids.filter(i => i !== this.cur).slice(0, MAX_SPANS)
    if (ids.includes(this.cur)) chosen.push(this.cur)

    const ss = new SpannableString(text)
    for (const i of chosen) {
      const hit = this.hits[i]
      if (hit) {
        const spanColor = i === this.cur ? t.cur : t.hit
        ss.call('setSpan', new BgSpan(spanColor), hit[1], hit[2], 33)
      }
    }
    this.tv.call('setText', ss)
  }

  showTextPage(idx: number) {
    this.index = Math.max(0, Math.min(this.count - 1, idx))
    this.renderPage()
    this.updateCounter()
    this.savePos()
    this.sv?.call('scrollTo', 0, 0)
  }

  searchDialog() {
    this.inputDialog(t('search'), '', false, t('find'), q => this.runSearch(q))
  }

  runSearch(query: string) {
    this.clearHits()
    if (!query) {
      this.renderPage()
      return
    }

    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const hits: Array<[page: number, start: number, end: number]> = []
    const byPage = new Map<number, number[]>()

    for (let p = 0; p < this.pages.length; p++) {
      const text = this.pages[p]
      pattern.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = pattern.exec(text)) !== null) {
        const hitIdx = hits.length
        if (!byPage.has(p)) byPage.set(p, [])
        byPage.get(p)!.push(hitIdx)
        hits.push([p, m.index, m.index + m[0].length])
        if (hits.length >= MAX_HITS) break
      }
      if (hits.length >= MAX_HITS) break
    }

    if (hits.length === 0) {
      this.toast(t('not_found'))
      this.renderPage()
      return
    }

    this.hits = hits
    this.hitsByPage = byPage
    const first = hits.findIndex(h => h[0] >= this.index)
    this.searchBar?.call('setVisibility', View.getStaticField('VISIBLE'))
    this.gotoHit(first >= 0 ? first : 0)
  }

  gotoHit(i: number) {
    this.cur = i
    const total = `${i + 1} / ${this.hits.length}${this.hits.length >= MAX_HITS ? '+' : ''}`
    this.sCount?.call('setText', total)
    this.showTextPage(this.hits[i][0])
  }

  stepHit(d: number) {
    if (this.hits.length > 0) {
      this.gotoHit((this.cur + d + this.hits.length) % this.hits.length)
    }
  }

  clearHits() {
    this.hits = []
    this.hitsByPage.clear()
    this.cur = -1
    this.searchBar?.call('setVisibility', View.getStaticField('GONE'))
  }

  endSearch() {
    const had = this.hits.length > 0
    this.clearHits()
    if (had && this.doc) this.renderPage()
  }

  startWeb() {
    this.loadTok++
    const tok = this.loadTok
    this.setLoading(t('loading'))

    setTimeout(() => {
      try {
        const page = buildWeb(this.path, this.ext, this.theme)
        runOnUI(() => {
          if (this.closed || tok !== this.loadTok || !this.wv) return
          this.wv.call('loadDataWithBaseURL', null, page, 'text/html', 'utf-8', null)
          this.loading?.call('setVisibility', View.getStaticField('GONE'))
        })
      } catch (e) {
        const msg = fmtErr(e)
        runOnUI(() => this.showError(msg))
      }
    }, 10)
  }

  zoomWeb(delta: number) {
    this.webZoom = Math.max(50, Math.min(300, this.webZoom + delta))
    this.wv?.call('getSettings').call('setTextZoom', this.webZoom | 0)
  }

  loadImage() {
    setTimeout(() => {
      try {
        const { bmp, rot } = decodeImage(this.path)
        this.rot = rot
        this.token++
        const tok = this.token
        runOnUI(() => this.setBitmap(bmp, tok))
      } catch (e) {
        const msg = fmtErr(e)
        runOnUI(() => this.showError(msg))
      }
    }, 10)
  }

  setBitmap(src: JavaObject, tok: number) {
    if (this.closed || tok !== this.token) return
    this.srcBitmap = src
    this.shownTok = tok
    this.display(src)
    this.loading?.call('setVisibility', View.getStaticField('GONE'))
  }

  display(src: JavaObject) {
    let bmp = src
    if (this.rot) {
      const m = new Matrix()
      m.call('postRotate', Number(this.rot))
      bmp = Bitmap.callStatic('createBitmap', src, 0, 0, src.call('getWidth'), src.call('getHeight'), m, true)
    }
    this.bitmap = bmp
    this.bw = Math.max(1, Number(bmp.call('getWidth')))
    this.bh = Math.max(1, Number(bmp.call('getHeight')))
    this.iv?.call('setImageBitmap', bmp)
    this.applyInvert()
    this.resetZoom()
  }

  applyInvert() {
    if (!this.iv) return
    if (this.invert) {
      const JArray = inu.jvm.cls('java.lang.reflect.Array')
      const FloatType = inu.jvm.cls('java.lang.Float').getStaticField('TYPE')
      const m = JArray.callStatic('newInstance', FloatType, 20)
      const values = [
        -1.0, 0.0, 0.0, 0.0, 255.0,
        0.0, -1.0, 0.0, 0.0, 255.0,
        0.0, 0.0, -1.0, 0.0, 255.0,
        0.0, 0.0, 0.0, 1.0, 0.0,
      ]
      for (let i = 0; i < 20; i++) {
        JArray.callStatic('setFloat', m, i, Number(values[i]))
      }
      this.iv.call('setColorFilter', new ColorMatrixColorFilter(new ColorMatrix(m)))
    } else {
      this.iv.call('clearColorFilter')
    }
  }

  rotate() {
    this.rot = (this.rot + 90) % 360
    if (this.srcBitmap) this.display(this.srcBitmap)
  }

  toggleFit() {
    this.fitWidth = !this.fitWidth
    localStorage.setItem('fitwidth', String(this.fitWidth))
    this.resetZoom()
  }

  toggleInvert() {
    this.invert = !this.invert
    localStorage.setItem('invert', String(this.invert))
    this.applyInvert()
  }

  curScale(): number {
    const JArray = inu.jvm.cls('java.lang.reflect.Array')
    const FloatType = inu.jvm.cls('java.lang.Float').getStaticField('TYPE')
    if (!this.vals) this.vals = JArray.callStatic('newInstance', FloatType, 9)
    this.matrix.call('getValues', this.vals)
    return Number(JArray.callStatic('getFloat', this.vals, 0))
  }

  contentRect(): JavaObject {
    const rf = new RectF(0.0, 0.0, Number(this.bw), Number(this.bh))
    this.matrix.call('mapRect', rf)
    return rf
  }

  fitsWidth(): boolean {
    if (!this.bitmap) return true
    const [vw] = this.viewSize()
    return Number(this.contentRect().call('width')) <= vw * 1.02
  }

  applyMatrix() {
    this.iv?.call('setImageMatrix', this.matrix)
    this.iv?.call('invalidate')
  }

  resetZoom() {
    if (!this.bitmap) return
    const [vw, vh] = this.viewSize()
    const pageFit = Math.min(vw / this.bw, vh / this.bh)
    this.minScale = pageFit
    this.fit = this.fitWidth ? Math.max(pageFit, vw / this.bw) : pageFit
    this.matrix.call('reset')
    this.matrix.call('postScale', Number(this.fit), Number(this.fit))
    this.fixBounds()
    this.applyMatrix()
  }

  fixBounds() {
    const [vw, vh] = this.viewSize()
    const rf = this.contentRect()
    const rfW = Number(rf.call('width'))
    const rfH = Number(rf.call('height'))
    const rfLeft = Number(rf.getField('left'))
    const rfRight = Number(rf.getField('right'))
    const rfTop = Number(rf.getField('top'))
    const rfBottom = Number(rf.getField('bottom'))

    let dx = 0.0
    let dy = 0.0
    if (rfW <= vw) {
      dx = (vw - rfW) / 2.0 - rfLeft
    } else if (rfLeft > 0) {
      dx = -rfLeft
    } else if (rfRight < vw) {
      dx = vw - rfRight
    }

    if (rfH <= vh) {
      dy = (vh - rfH) / 2.0 - rfTop
    } else if (rfTop > 0) {
      dy = -rfTop
    } else if (rfBottom < vh) {
      dy = vh - rfBottom
    }
    this.matrix.call('postTranslate', Number(dx), Number(dy))
  }

  zoomBy(f: number, fx: number, fy: number) {
    if (!this.bitmap) return
    const cur = this.curScale()
    const next = Math.max(this.minScale, Math.min(this.fit * this.maxZoom, cur * f))
    const factor = next / cur
    this.matrix.call('postScale', Number(factor), Number(factor), Number(fx), Number(fy))
    this.fixBounds()
    this.applyMatrix()
  }

  doubleTap(x: number, y: number) {
    if (!this.bitmap) return
    if (this.curScale() > this.fit * 1.1) {
      this.resetZoom()
    } else {
      this.zoomBy(2.6, x, y)
    }
  }

  go(idx: number) {
    if (idx < 0 || idx >= this.count) return
    if (this.kind === 'pdf') {
      if (idx !== this.index) this.showPage(idx)
    } else if (this.kind === 'text') {
      this.showTextPage(idx)
    }
  }

  showPage(idx: number) {
    this.index = idx
    this.token++
    const tok = this.token
    this.updateCounter()
    this.savePos()

    const cached = this.cache.get(idx)
    if (cached) {
      this.setBitmap(cached, tok)
      this.prefetch(idx + 1)
      return
    }

    if (!this.srcBitmap) this.setLoading(t('loading'))
    setTimeout(() => {
      try {
        if (this.closed || tok !== this.token || !this.renderer) return
        const dm = this.act.call('getResources').call('getDisplayMetrics')
        const bmp = renderPdfPage(this.renderer, idx, Number(dm.getField('widthPixels')))
        runOnUI(() => {
          if (this.closed) return
          this.cachePut(idx, bmp)
          if (tok === this.token) {
            this.setBitmap(bmp, tok)
            this.prefetch(idx + 1)
          }
        })
      } catch (e) {
        console.warn('DocViewer PDF render error:', e)
      }
    }, 10)
  }

  cachePut(idx: number, bmp: JavaObject) {
    this.cache.set(idx, bmp)
    this.cacheOrder = this.cacheOrder.filter(i => i !== idx)
    this.cacheOrder.push(idx)
    while (this.cacheOrder.length > 3) {
      const old = this.cacheOrder.shift()!
      if (old !== this.index) {
        this.cache.delete(old)
      } else {
        this.cacheOrder.push(old)
        break
      }
    }
  }

  prefetch(idx: number) {
    if (this.kind !== 'pdf' || idx < 0 || idx >= this.count || this.cache.has(idx)) return
    setTimeout(() => {
      try {
        if (this.closed || !this.renderer) return
        const dm = this.act.call('getResources').call('getDisplayMetrics')
        const bmp = renderPdfPage(this.renderer, idx, Number(dm.getField('widthPixels')))
        runOnUI(() => this.cachePut(idx, bmp))
      } catch {}
    }, 20)
  }

  jumpDialog() {
    if (this.count <= 1) return
    this.inputDialog(`${t('jump_to_page')} (1–${this.count})`, String(this.index + 1), true, t('jump'), (v) => {
      const n = parseInt(v, 10)
      if (!isNaN(n)) {
        this.go(Math.max(1, Math.min(this.count, n)) - 1)
      }
    })
  }

  copyToClipboard(text: string) {
    try {
      inu.clipboard.write(text)
      this.toast(t('copied'))
    } catch (e) {
      this.toast(`${t('copy_fail')}: ${fmtErr(e)}`)
    }
  }

  fileUri(): JavaObject {
    const pkg = String(this.act.call('getPackageName'))
    return FileProvider.callStatic('getUriForFile', this.act, `${pkg}.provider`, new JFile(this.path))
  }

  share() {
    try {
      const it = new Intent(Intent.getStaticField('ACTION_SEND'))
      it.call('setType', this.mime || '*/*')
      it.call('putExtra', Intent.getStaticField('EXTRA_STREAM'), this.fileUri())
      it.call('addFlags', 1)
      this.act.call('startActivity', Intent.callStatic('createChooser', it, t('share_file')))
    } catch (e) {
      this.toast(`${t('share_fail')}: ${fmtErr(e)}`)
    }
  }

  openExternal() {
    try {
      const it = new Intent(Intent.getStaticField('ACTION_VIEW'))
      it.call('setDataAndType', this.fileUri(), this.mime || '*/*')
      it.call('addFlags', 1)
      this.act.call('startActivity', Intent.callStatic('createChooser', it, t('open_ext')))
    } catch (e) {
      this.toast(`${t('open_fail')}: ${fmtErr(e)}`)
    }
  }

  info() {
    const lines = [
      `${t('info_name')}: ${this.name}`,
      `${t('info_size')}: ${this.sizeTxt}`,
      `${t('info_format')}: ${this.label}`,
    ]
    if ((this.kind === 'pdf' || this.kind === 'text') && this.count > 1) {
      lines.push(`${t('info_pages')}: ${this.count}`)
    }
    if (this.kind === 'image' && this.bitmap) {
      lines.push(`${t('info_resolution')}: ${this.bw} × ${this.bh}`)
    }
    if (this.doc?.raw) {
      lines.push(`${t('info_encoding')}: ${this.enc ?? this.doc.enc ?? 'utf-8'}`)
    }
    if (this.mime) lines.push(`${t('info_mime')}: ${this.mime}`)
    lines.push(`${t('info_path')}: ${this.path}`)

    const b = this.builder()
    b.call('setTitle', t('about_file'))
    b.call('setMessage', lines.join('\n'))
    b.call('setPositiveButton', t('ok'), null)
    b.call('show')
  }

  encodingDialog() {
    const [dlgClick, unreg] = createDlgClickListener((_, which) => {
      if (which >= 0 && which < ENCODINGS.length) {
        this.enc = ENCODINGS[which][1]
        this.startLoad(true)
      }
    })
    this.cleanupFns.push(unreg)

    const JArray = inu.jvm.cls('java.lang.reflect.Array')
    const StringCls = inu.jvm.cls('java.lang.String')
    const arr = JArray.callStatic('newInstance', StringCls, ENCODINGS.length)
    for (let i = 0; i < ENCODINGS.length; i++) {
      const label = i === 0 ? t('enc_auto') : ENCODINGS[i][0]
      JArray.callStatic('set', arr, i, label)
    }

    const b = this.builder()
    b.call('setTitle', t('menu_encoding'))
    b.call('setItems', arr, dlgClick)
    b.call('show')
  }

  openMenu() {
    const items: string[] = []
    const actions: Array<() => void> = []

    const add = (title: string, fn: () => void) => {
      items.push(title)
      actions.push(fn)
    }

    const onOff = (v: boolean) => v ? t('on') : t('off')

    if (this.kind === 'text' && this.doc) {
      add(t('menu_search'), () => this.searchDialog())
      if (this.hits.length > 0) add(t('menu_search_reset'), () => this.endSearch())
    }
    if ((this.kind === 'pdf' || this.kind === 'text') && this.count > 1) {
      add(t('menu_jump'), () => this.jumpDialog())
      add(t('menu_start'), () => this.go(0))
      add(t('menu_end'), () => this.go(this.count - 1))
    }
    if (this.kind === 'pdf' || this.kind === 'image') {
      add(`${t('menu_night')}: ${onOff(this.invert)}`, () => this.toggleInvert())
      add(t('menu_rotate'), () => this.rotate())
      add(`${t('menu_scale')}: ${this.fitWidth ? t('scale_screen') : t('scale_width')}`, () => this.toggleFit())
    }
    if (this.kind === 'text' && this.doc) {
      const fontNames = [t('font_default'), t('font_serif'), t('font_mono')]
      add(`${t('menu_font')}: ${fontNames[this.font % fontNames.length]}`, () => {
        this.font = (this.font + 1) % fontNames.length
        this.applyFont()
      })
      add(t('menu_font_larger'), () => {
        this.textSize = Math.min(34.0, this.textSize + 1.0)
        localStorage.setItem('text_size', String(this.textSize))
        this.tv?.call('setTextSize', Number(this.textSize))
      })
      add(t('menu_font_smaller'), () => {
        this.textSize = Math.max(8.0, this.textSize - 1.0)
        localStorage.setItem('text_size', String(this.textSize))
        this.tv?.call('setTextSize', Number(this.textSize))
      })
      add(`${t('menu_wrap')}: ${onOff(this.wrap)}`, () => {
        this.wrap = !this.wrap
        this.attachText()
      })
      const themeNames = [t('theme_dark'), t('theme_light'), t('theme_sepia')]
      add(`${t('menu_theme')}: ${themeNames[this.theme % themeNames.length]}`, () => {
        this.theme = (this.theme + 1) % THEMES.length
        localStorage.setItem('theme', String(this.theme))
        this.applyTheme()
        this.renderPage()
      })
      if (this.doc.raw) {
        add(`${t('menu_encoding')}: ${this.enc ?? this.doc.enc ?? t('enc_auto')}`, () => this.encodingDialog())
      }
      add(t('menu_copy_page'), () => this.copyToClipboard(this.pages[this.index] ?? ''))
      add(t('menu_copy_all'), () => this.copyToClipboard(this.pages.join(this.doc?.sep ?? '\n\n')))
    }
    if (this.kind === 'web') {
      if (MD_EXT.has(this.ext)) {
        const themeNames = [t('theme_dark'), t('theme_light'), t('theme_sepia')]
        add(`${t('menu_theme')}: ${themeNames[this.theme % themeNames.length]}`, () => {
          this.theme = (this.theme + 1) % THEMES.length
          localStorage.setItem('theme', String(this.theme))
          this.startWeb()
        })
      }
      add(t('menu_zoom_in'), () => this.zoomWeb(10))
      add(t('menu_zoom_out'), () => this.zoomWeb(-10))
    }
    add(t('share_file'), () => this.share())
    add(t('open_ext'), () => this.openExternal())
    add(t('about_file'), () => this.info())

    const [dlgClick, unreg] = createDlgClickListener((_, which) => {
      actions[which]?.()
    })
    this.cleanupFns.push(unreg)

    const JArray = inu.jvm.cls('java.lang.reflect.Array')
    const StringCls = inu.jvm.cls('java.lang.String')
    const arr = JArray.callStatic('newInstance', StringCls, items.length)
    for (let i = 0; i < items.length; i++) {
      JArray.callStatic('set', arr, i, items[i])
    }

    const b = this.builder()
    b.call('setTitle', t('menu_title'))
    b.call('setItems', arr, dlgClick)
    b.call('show')
  }
}
