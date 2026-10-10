import { Activity, AndroidUtilities, FileLoader, initJvm, JFile, MessageObject, TLObject, UserConfig } from './jvm.js'
import { detectFormat, fileExt, SETTING_OF, TEXTUAL } from './types.js'
import { looksLikeText } from './parsers/text.js'
import { openPdf } from './parsers/pdf.js'
import { DocViewer } from './viewer.js'
import { t } from './i18n.js'

initJvm()

const activeViewers: DocViewer[] = []

function isSettingEnabled(key: string, def = true): boolean {
  const val = localStorage.getItem(key)
  if (val === null) return def
  return val !== 'false'
}

function resolveFile(args: any[]): [path: string, name: string, mime: string] | null {
  if (!args || args.length === 0 || !args[0]) return null
  const first = args[0]
  let path: string | null = null
  let name: string | null = null
  let mime = ''

  try {
    if (typeof first === 'string') {
      path = first
      if (args.length > 1 && typeof args[1] === 'string') name = args[1]
      if (args.length > 2 && typeof args[2] === 'string') mime = args[2]
    } else if (MessageObject.isInstance(first)) {
      const owner = first.getField('messageOwner')
      const ap = owner?.getField('attachPath')
      if (ap) {
        const apStr = String(ap)
        const apFile = new JFile(apStr)
        if (apFile.call('exists')) path = apStr
      }
      if (!path) {
        const acc = Number(first.getField('currentAccount'))
        const f = FileLoader.callStatic('getInstance', acc).call('getPathToMessage', owner)
        if (f && f.call('exists')) path = String(f.call('getAbsolutePath'))
      }
      const doc = first.call('getDocument')
      if (doc) {
        mime = String(doc.getField('mime_type') ?? '')
        try {
          name = String(FileLoader.callStatic('getDocumentFileName', doc))
        } catch {}
      }
    } else if (JFile.isInstance(first)) {
      path = String(first.call('getAbsolutePath'))
      if (args.length > 1 && args[1]) name = String(args[1])
      if (args.length > 2 && args[2]) mime = String(args[2])
    } else if (TLObject.isInstance(first)) {
      const acc = Number(UserConfig.getStaticField('selectedAccount'))
      const f = FileLoader.callStatic('getInstance', acc).call('getPathToAttach', first, true)
      if (f && f.call('exists')) path = String(f.call('getAbsolutePath'))
      try {
        mime = String(first.getField('mime_type') ?? '')
        name = String(FileLoader.callStatic('getDocumentFileName', first))
      } catch {}
    }
  } catch (e) {
    console.warn('DocViewer resolveFile error:', e)
  }

  if (!path) return null
  const jf = new JFile(path)
  if (!jf.call('exists') || !jf.call('isFile') || Number(jf.call('length')) === 0) {
    return null
  }
  if (!name || name === 'None' || name === 'null') {
    name = String(jf.call('getName'))
  }
  return [path, name, mime]
}

function getActivity(args: any[]): JavaObject | null {
  for (const a of args) {
    if (a && typeof a === 'object') {
      try {
        if (Activity.isInstance(a)) return a
      } catch {}
    }
  }
  return inu.android.getCurrentActivity()
}

function tryOpen(args: any[]): boolean {
  const resolved = resolveFile(args)
  if (!resolved) return false
  const [path, name, mime] = resolved

  let fmt = detectFormat(name, mime)
  if (TEXTUAL.has(fmt ?? '') || fmt === 'sniff') {
    if (!looksLikeText(path)) return false
    if (fmt === 'sniff') fmt = 'text'
  }
  if (!fmt) return false

  const settingKey = SETTING_OF[fmt]
  if (settingKey && !isSettingEnabled(settingKey, true)) {
    return false
  }

  const act = getActivity(args)
  if (!act) return false

  const ext = fileExt(name) || fileExt(path)
  let renderer: JavaObject | null = null
  let pfd: JavaObject | null = null
  let count = 1

  if (fmt === 'pdf') {
    try {
      const pdf = openPdf(path)
      renderer = pdf.renderer
      pfd = pdf.pfd
      count = pdf.count
    } catch (e) {
      console.warn('DocViewer cannot open PDF, falling back to stock:', e)
      return false
    }
  }

  try {
    const viewer = new DocViewer(act, path, name, fmt, ext, mime, renderer, pfd, count)
    activeViewers.push(viewer)
    viewer.show()
    return true
  } catch (e) {
    console.warn('DocViewer show error:', e)
    return false
  }
}

// Hook AndroidUtilities.openForView
inu.xposed.hookAllOverloads(AndroidUtilities, 'openForView', {
  before: (ctx) => {
    if (tryOpen(ctx.args)) {
      ctx.setReturnValue(true)
    }
  },
})

inu.onUnload(() => {
  for (const v of [...activeViewers]) {
    try { v.close() } catch {}
  }
  activeViewers.length = 0
})

function getLangIndex(): number {
  const v = localStorage.getItem('docviewer_lang')
  if (v === 'uk') return 1
  if (v === 'en') return 2
  if (v === 'ru') return 3
  return 0
}

// Settings
const settingsPage = inu.ui.settingsPage({
  title: 'Doc Viewer',
  items: () => [
    inu.ui.header(t('header_language')),
    inu.ui.select({
      id: 'docviewer_lang',
      text: t('header_language'),
      items: [t('lang_auto'), 'Українська', 'English', 'Русский'],
      selected: getLangIndex(),
      onChange: (index) => {
        const val = index === 1 ? 'uk' : index === 2 ? 'en' : index === 3 ? 'ru' : 'auto'
        localStorage.setItem('docviewer_lang', val)
      },
    }),

    inu.ui.header(t('header_formats')),
    inu.ui.check({
      id: 'pdf',
      text: t('setting_pdf'),
      checked: isSettingEnabled('pdf', true),
      onChange: (v) => { localStorage.setItem('pdf', String(v)) },
    }),
    inu.ui.check({
      id: 'docs',
      text: t('setting_docs'),
      checked: isSettingEnabled('docs', true),
      onChange: (v) => { localStorage.setItem('docs', String(v)) },
    }),
    inu.ui.check({
      id: 'books',
      text: t('setting_books'),
      checked: isSettingEnabled('books', true),
      onChange: (v) => { localStorage.setItem('books', String(v)) },
    }),
    inu.ui.check({
      id: 'text',
      text: t('setting_text'),
      checked: isSettingEnabled('text', true),
      onChange: (v) => { localStorage.setItem('text', String(v)) },
    }),
    inu.ui.check({
      id: 'web',
      text: t('setting_web'),
      checked: isSettingEnabled('web', true),
      onChange: (v) => { localStorage.setItem('web', String(v)) },
    }),
    inu.ui.check({
      id: 'image',
      text: t('setting_image'),
      checked: isSettingEnabled('image', true),
      onChange: (v) => { localStorage.setItem('image', String(v)) },
    }),
    inu.ui.check({
      id: 'archive',
      text: t('setting_archive'),
      checked: isSettingEnabled('archive', true),
      onChange: (v) => { localStorage.setItem('archive', String(v)) },
    }),

    inu.ui.header(t('header_viewing')),
    inu.ui.check({
      id: 'invert',
      text: t('setting_invert'),
      checked: isSettingEnabled('invert', false),
      onChange: (v) => { localStorage.setItem('invert', String(v)) },
    }),
    inu.ui.check({
      id: 'fitwidth',
      text: t('setting_fitwidth'),
      checked: isSettingEnabled('fitwidth', false),
      onChange: (v) => { localStorage.setItem('fitwidth', String(v)) },
    }),
    inu.ui.check({
      id: 'remember',
      text: t('setting_remember'),
      checked: isSettingEnabled('remember', true),
      onChange: (v) => { localStorage.setItem('remember', String(v)) },
    }),
    inu.ui.check({
      id: 'volume',
      text: t('setting_volume'),
      checked: isSettingEnabled('volume', true),
      onChange: (v) => { localStorage.setItem('volume', String(v)) },
    }),
    inu.ui.check({
      id: 'keepon',
      text: t('setting_keepon'),
      checked: isSettingEnabled('keepon', true),
      onChange: (v) => { localStorage.setItem('keepon', String(v)) },
    }),
    inu.ui.check({
      id: 'wrap',
      text: t('setting_wrap'),
      checked: isSettingEnabled('wrap', true),
      onChange: (v) => { localStorage.setItem('wrap', String(v)) },
    }),
    inu.ui.check({
      id: 'prettyjson',
      text: t('setting_prettyjson'),
      checked: isSettingEnabled('prettyjson', true),
      onChange: (v) => { localStorage.setItem('prettyjson', String(v)) },
    }),
    inu.ui.check({
      id: 'csv_table',
      text: t('setting_csv_table'),
      checked: isSettingEnabled('csv_table', true),
      onChange: (v) => { localStorage.setItem('csv_table', String(v)) },
    }),
    inu.ui.separator(t('separator_desc')),
  ],
})

inu.registerSettings(settingsPage)

