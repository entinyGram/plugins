import { embed, embedChanged } from '@entiny/sdk/embed'
import { clearTileSource, setTileSource } from '@entiny/sdk/maps'

const KEY = 'apiKey'
const MAPS = 'maps'
const TILES = 'tiles'

// The app builds the URL of a location's preview image in AndroidUtilities.formapMapUrl, on whatever thread loads the
// image. With the switch on and a key set, a routine answers instead: it runs in Java and never waits for the JS engine.

const AtomicBoolean: any = inu.jvm.cls('java.util.concurrent.atomic.AtomicBoolean')
const AtomicReference: any = inu.jvm.cls('java.util.concurrent.atomic.AtomicReference')
const AndroidUtilities: any = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const JMath: any = inu.jvm.cls('java.lang.Math')
const JString: any = inu.jvm.cls('java.lang.String')
const JLocale: any = inu.jvm.cls('java.util.Locale')

function apiKey(): string {
  return localStorage.getItem(KEY) ?? ''
}

// shared with the routine by identity: a capture of a Java object is the object itself
const useMaps: any = new AtomicBoolean(localStorage.getItem(MAPS) === '1')
const key: any = new AtomicReference(encodeURIComponent(apiKey()))

// size is the logical one, @Nx asks 2GIS for the sharper image; zoom runs 1..18, latitude comes first
const WITH_MARKER = 'https://static.maps.2gis.com/2.0?s=%dx%d@%dx&c=%.6f,%.6f&z=%d&pt=%.6f,%.6f~k:p~c:rd&key=%s'
const PLAIN = 'https://static.maps.2gis.com/2.0?s=%dx%d@%dx&c=%.6f,%.6f&z=%d&key=%s'

// the app's own map: raster tiles with the same key, drawn by the app's OSM renderer
let tilesOn = localStorage.getItem(TILES) === '1'
let tilesState = 'off'

function applyTiles() {
  try {
    if (tilesOn && apiKey() !== '') {
      setTileSource({
        name: '2gis',
        url: `https://tile{n}.maps.2gis.com/v2/tiles/online_hd/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey())}`,
        attribution: '© 2GIS',
        maxZoom: 18,
      })
      tilesState = 'active'
    } else {
      clearTileSource()
      tilesState = tilesOn ? 'waiting for a key' : 'off'
    }
  } catch (error) {
    tilesState = `failed: ${(error as Error).message}`
    console.warn('the map tiles are not available', error)
  }
}

applyTiles()

let hooked = true
let hookError = ''
try {
  // formapMapUrl(int account, double lat, double lon, int width, int height, boolean marker, int zoom, int provider)
  inu.xposed.hookMethod(AndroidUtilities.getDeclaredMethod('formapMapUrl(IDDIIZII)Ljava/lang/String;'), {
    before: inu.xposed.routine((ctx: any) => {
      const token: any = key.get()
      if (!useMaps.get() || token.length() === 0) return
      const scale = JMath.round(JMath.min(2.0, JMath.ceil(AndroidUtilities.density)))
      const lat = ctx.args[1]
      const lon = ctx.args[2]
      const width = JMath.max(120, JMath.min(1280, ctx.args[3]))
      const height = JMath.max(90, JMath.min(1280, ctx.args[4]))
      const zoom = JMath.max(1, JMath.min(18, ctx.args[6]))
      if (ctx.args[5]) {
        ctx.setReturnValue(JString.format(JLocale.US, WITH_MARKER, [width, height, scale, lat, lon, zoom, lat, lon, token]))
      } else {
        ctx.setReturnValue(JString.format(JLocale.US, PLAIN, [width, height, scale, lat, lon, zoom, token]))
      }
    }),
  })
} catch (error) {
  // some devices cannot hook at all; the page says so instead of failing the plugin
  hooked = false
  hookError = String((error as Error).message ?? error)
  console.warn('hooking is not available', error)
}

// --- settings: the rows are placed by id, see inu.config.ts ------------------------------------------------------

const page = inu.ui.settingsPage({
  title: '2GIS',
  items: () => [
    ...(hookError ? [inu.ui.separator(hookError)] : []),
    inu.ui.button({
      id: 'key',
      text: '2GIS API key',
      subtitle: 'A Static API key from the 2GIS Platform Manager',
      value: apiKey() === '' ? 'Not set' : '••••••••',
      onClick: async () => {
        const value = await inu.ui.prompt({ title: '2GIS API key', value: apiKey(), selectAll: true })
        if (value === null) return
        localStorage.setItem(KEY, value.trim())
        key.call('set', encodeURIComponent(value.trim()))
        applyTiles()
        page.invalidate()
      },
    }),
    inu.ui.check({
      id: 'tiles',
      text: 'Map tiles',
      subtitle: `Draws the map in the app with 2GIS tiles · ${tilesState}`,
      checked: tilesOn,
      onChange: (checked) => {
        tilesOn = checked
        localStorage.setItem(TILES, checked ? '1' : '0')
        applyTiles()
      },
    }),
    inu.ui.check({
      id: 'maps',
      text: 'Static maps',
      subtitle: hooked ? 'Used whenever the app builds a preview from a map service' : `The preview hook failed: ${hookError}`,
      checked: useMaps.call('get'),
      onChange: (checked) => {
        useMaps.call('set', checked)
        localStorage.setItem(MAPS, checked ? '1' : '0')
      },
    }),
  ],
})

inu.registerSettings(page)

// the options in the app's map pickers; the SDK plugin puts them there
embed({
  id: 'entinygram.2gis',
  name: '2GIS',
  placements: { choice: ['behavior.map-provider', 'behavior.map-preview-provider'] },
  rows: () => [],
  onEvent: () => {},
  choices: slot => slot === 'behavior.map-provider'
    ? [{ id: 'tiles', title: 'Map tiles', subtitle: 'Draws the map in the app with 2GIS tiles', checked: tilesOn }]
    : [{ id: 'maps', title: 'Static maps', subtitle: 'Location previews from the 2GIS Static API', checked: useMaps.call('get') }],
  onChoice: (id, picked) => {
    if (id === 'tiles') {
      tilesOn = picked
      localStorage.setItem(TILES, picked ? '1' : '0')
      applyTiles()
    } else {
      useMaps.call('set', picked)
      localStorage.setItem(MAPS, picked ? '1' : '0')
    }
    embedChanged()
  },
})
