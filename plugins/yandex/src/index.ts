import { embed, embedChanged } from '@entiny/sdk/embed'

const KEY = 'apiKey'
const MAPS = 'maps'
const ENDPOINT = 'https://translate.api.cloud.yandex.net/translate/v2/translate'

// --- translation -------------------------------------------------------------------------------------------------

function apiKey(): string {
  return localStorage.getItem(KEY) ?? ''
}

// Yandex has no regional Chinese variants and uses the old code for Hebrew
function normalize(code: string): string {
  const lower = code.toLowerCase()
  if (['zh-cn', 'zh-hans', 'zh-hant', 'zh-tw'].includes(lower)) return 'zh'
  return lower === 'iw' ? 'he' : lower
}

inu.registerTranslationProvider({
  id: 'yandex',
  name: 'Yandex Translate',
  async translate({ texts, to, signal }) {
    const key = apiKey()
    if (key === '') throw new Error('Set the Yandex API key in the translation provider settings')
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Api-Key ${key}` },
      body: JSON.stringify({ targetLanguageCode: normalize(to), texts }),
      signal,
    })
    if (!response.ok) throw new Error(`Yandex Translate answered ${response.status}`)
    const data = await response.json() as { translations?: Array<{ text?: string }> }
    const translations = data.translations ?? []
    if (translations.length !== texts.length) throw new Error('Yandex Translate returned an empty result')
    return translations.map(item => item.text ?? '')
  },
})

// --- maps --------------------------------------------------------------------------------------------------------
// The app builds the URL of a location's preview image in AndroidUtilities.formapMapUrl, on whatever thread loads the
// image. With the switch on, a routine answers instead: it runs in Java and never waits for the JS engine.

const AtomicBoolean: any = inu.jvm.cls('java.util.concurrent.atomic.AtomicBoolean')
const AndroidUtilities: any = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const LocaleController: any = inu.jvm.cls('org.telegram.messenger.LocaleController')
const JMath: any = inu.jvm.cls('java.lang.Math')
const JString: any = inu.jvm.cls('java.lang.String')
const JLocale: any = inu.jvm.cls('java.util.Locale')

// shared with the routine by identity: a capture of a Java object is the object itself
const useMaps: any = new AtomicBoolean(localStorage.getItem(MAPS) === '1')
// the languages Yandex static maps know besides English
const LANGS = ['ru_RU', 'tr_TR']
const WITH_MARKER = 'https://static-maps.yandex.ru/1.x/?ll=%.6f,%.6f&z=%d&size=%d,%d&l=map&scale=%d&pt=%.6f,%.6f,vkbkm&lang=%s'
const PLAIN = 'https://static-maps.yandex.ru/1.x/?ll=%.6f,%.6f&z=%d&size=%d,%d&l=map&scale=%d&lang=%s'

let hooked = true
try {
  // formapMapUrl(int account, double lat, double lon, int width, int height, boolean marker, int zoom, int provider)
  inu.xposed.hookMethod(AndroidUtilities.getDeclaredMethod('formapMapUrl(IDDIIZII)Ljava/lang/String;'), {
    before: inu.xposed.routine((ctx: any) => {
      if (!useMaps.get()) return
      const scale = JMath.round(JMath.min(2.0, JMath.ceil(AndroidUtilities.density)))
      const short = LocaleController.getInstance().getCurrentLocaleInfo().shortName
      let lang = 'en_US'
      for (const candidate of LANGS) {
        const lowered: any = candidate.toLowerCase()
        if (lowered.contains(short)) lang = candidate
      }
      const lat = ctx.args[1]
      const lon = ctx.args[2]
      const width = ctx.args[3] * scale
      const height = ctx.args[4] * scale
      if (ctx.args[5]) {
        ctx.setReturnValue(JString.format(JLocale.US, WITH_MARKER, [lon, lat, ctx.args[6], width, height, scale, lon, lat, lang]))
      } else {
        ctx.setReturnValue(JString.format(JLocale.US, PLAIN, [lon, lat, ctx.args[6], width, height, scale, lang]))
      }
    }),
  })
} catch (error) {
  // some devices cannot hook at all; the page says so instead of failing the plugin
  hooked = false
  console.warn('hooking is not available', error)
}

// --- settings: the rows are placed by id, see inu.config.ts ------------------------------------------------------

const page = inu.ui.settingsPage({
  title: 'Yandex',
  items: () => [
    inu.ui.button({
      id: 'key',
      text: 'Yandex API key',
      value: apiKey() === '' ? 'Not set' : '••••••••',
      onClick: async () => {
        const value = await inu.ui.prompt({ title: 'Yandex API key', value: apiKey(), selectAll: true })
        if (value === null) return
        localStorage.setItem(KEY, value.trim())
        page.invalidate()
      },
    }),
    inu.ui.check({
      id: 'maps',
      text: 'Yandex',
      subtitle: hooked ? 'Used whenever the app builds a preview from a map service' : 'This device does not allow the hooks the plugin needs',
      checked: useMaps.call('get'),
      onChange: (checked) => {
        useMaps.call('set', checked)
        localStorage.setItem(MAPS, checked ? '1' : '0')
      },
    }),
  ],
})

inu.registerSettings(page)

// the key field sits under the translator's provider list while Yandex is the chosen provider
const InuConfig: any = inu.jvm.cls('desu.inugram.InuConfig')
function yandexChosen(): boolean {
  return String(InuConfig.getStaticField('TRANSLATION_PROVIDER').call('getValue')).endsWith(':yandex')
}

embed({
  id: 'entinygram.yandex',
  name: 'Yandex',
  placements: { inline: [{ slot: 'translate-provider.end', rows: ['key'] }], choice: ['behavior.map-preview-provider'] },
  rows: slot => slot === 'translate-provider.end' && yandexChosen()
    ? [{ id: 'key', type: 'button', text: 'Yandex API key', value: apiKey() === '' ? 'Not set' : '••••••••' }]
    : [],
  onEvent: (row) => {
    if (row !== 'key') return
    // a dialog needs the plugin thread, which the screen's hook is not on
    setTimeout(async () => {
      const value = await inu.ui.prompt({ title: 'Yandex API key', value: apiKey(), selectAll: true })
      if (value === null) return
      localStorage.setItem(KEY, value.trim())
      embedChanged()
    }, 0)
  },
  choices: () => [{ id: 'maps', title: 'Yandex', subtitle: 'Location previews from Yandex static maps', checked: useMaps.call('get') }],
  onChoice: (_id, picked) => {
    useMaps.call('set', picked)
    localStorage.setItem(MAPS, picked ? '1' : '0')
    embedChanged()
  },
})
