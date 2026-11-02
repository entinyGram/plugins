import { embed, embedChanged } from '@entiny/sdk/embed'
import { type StringKey, t } from './i18n.js'

const PRESETS: Array<{ id: string, mode: number, step: number }> = [
  { id: 'off', mode: 0, step: 0 },
  // step is how far the delay moves per sample in 1/256 sample: (1 - pitch ratio) * 256
  { id: 'deep', mode: 1, step: 51 },
  { id: 'high', mode: 1, step: -102 },
  { id: 'girl', mode: 1, step: -77 },
  { id: 'robot', mode: 2, step: 0 },
]

const SCOPES = ['everywhere', 'messages', 'calls']

const RING_SIZE = 2048
// delay window of 1024 samples in 1/256 units; HALF is where the second tap sits
const WINDOW = 1024 * 256
const HALF = WINDOW / 2
const CARRIER_HZ = 50

const JArray: any = inu.jvm.cls('java.lang.reflect.Array')
const intType: any = inu.jvm.cls('java.lang.Integer').getStaticField('TYPE')
const AudioRecord: any = inu.jvm.cls('android.media.AudioRecord')
const ByteOrder: any = inu.jvm.cls('java.nio.ByteOrder')
const LITTLE: any = ByteOrder.getStaticField('LITTLE_ENDIAN')
const Log: any = inu.jvm.cls('android.util.Log')
const TAG = 'VoiceChanger'
const JThread: any = inu.jvm.cls('java.lang.Thread')
// WebRTC reads the microphone on this thread, which tells a call from a voice or video message
const CALL_THREAD = 'AudioRecordJavaThread'

// state shared with the routine: 0 mode, 1 write position, 2 delay, 3 delay step, 4 carrier phase, 5 calls seen, 6 scope (0 everywhere, 1 messages, 2 calls)
const STATE: any = JArray.callStatic('newInstance', intType, 8)
const RING: any = JArray.callStatic('newInstance', intType, RING_SIZE)

const MASK = RING_SIZE - 1

// Runs after the app read a chunk of microphone PCM16 and changes it in place. It stays in Java on purpose:
// a chunk is 10-20 ms of audio, so every sample costs, and the effects keep the chunk length.
const process = inu.xposed.routine((ctx: any) => {
  const bytes = ctx.returnValue
  if (bytes === null || bytes <= 0) return
  const mode = STATE[0]
  if (mode === 0) return
  const thread = JThread.currentThread().getName()
  const call = thread.startsWith(CALL_THREAD)
  const scope = STATE[6]
  if (scope === 1 && call) return
  if (scope === 2 && !call) return
  const calls = STATE[5]
  STATE[5] = calls + 1
  if (calls % 200 === 0) Log.d(TAG, 'chunk ' + calls + ' bytes=' + bytes + ' mode=' + mode + ' thread=' + thread)
  const buf = ctx.args[0]
  const base = buf.position()
  const count = bytes / 2
  const order = buf.order()
  buf.order(LITTLE)
  try {
    let w = STATE[1]
    if (mode === 1) {
      let d1 = STATE[2]
      const step = STATE[3]
      for (let i = 0; i < count; i++) {
        const at = base + i * 2
        const x = buf.getShort(at)
        RING[w & MASK] = x
        let d2 = d1 + HALF
        if (d2 >= WINDOW) d2 -= WINDOW
        const x1 = RING[(w - (d1 >> 8)) & MASK]
        const x2 = RING[(w - (d2 >> 8)) & MASK]
        let a = d1
        if (a > HALF) a = WINDOW - a
        let out = (x1 * a + x2 * (HALF - a)) / HALF
        if (out > 32767) out = 32767
        if (out < -32768) out = -32768
        buf.putShort(at, out)
        w++
        d1 += step
        if (d1 >= WINDOW) d1 -= WINDOW
        if (d1 < 0) d1 += WINDOW
      }
      STATE[2] = d1
    } else {
      let ph = STATE[4]
      const rate = ctx.thisObject.getSampleRate()
      const inc = CARRIER_HZ * 65536 / rate
      for (let i = 0; i < count; i++) {
        const at = base + i * 2
        const x = buf.getShort(at)
        let d = ph - 32768
        if (d < 0) d = -d
        buf.putShort(at, x * (d - 16384) * 2 / 32768)
        ph += inc
        if (ph >= 65536) ph -= 65536
      }
      STATE[4] = ph
    }
    STATE[1] = w & MASK
  } catch (e) {
    Log.d(TAG, 'process failed: ' + (e as any).toString())
  } finally {
    buf.order(order)
  }
})

let unhook: Array<() => void> = []

function install(): void {
  if (unhook.length > 0) return
  console.log('voice-changer: hooking AudioRecord.read')
  for (const sig of ['read(Ljava/nio/ByteBuffer;I)I', 'read(Ljava/nio/ByteBuffer;II)I']) {
    try {
      unhook.push(inu.xposed.hookMethod(AudioRecord.getDeclaredMethod(sig), { after: process }))
      console.log(`voice-changer: hooked ${sig}`)
    } catch (e) {
      console.warn(`voice-changer: could not hook ${sig}`, e)
    }
  }
}

function uninstall(): void {
  if (unhook.length > 0) console.log('voice-changer: unhooked')
  for (const off of unhook) off()
  unhook = []
}

function chosen(): number {
  const index = PRESETS.findIndex(p => p.id === localStorage.getItem('preset'))
  return index < 0 ? 0 : index
}

function scopeIndex(): number {
  const index = SCOPES.indexOf(localStorage.getItem('scope') ?? '')
  return index < 0 ? 0 : index
}

function apply(): void {
  const preset = PRESETS[chosen()]
  JArray.callStatic('setInt', STATE, 3, preset.step)
  JArray.callStatic('setInt', STATE, 6, scopeIndex())
  JArray.callStatic('setInt', STATE, 0, preset.mode)
  if (preset.mode === 0) uninstall()
  else install()
}

apply()

const titles = (): string[] => PRESETS.map(p => t(p.id as StringKey))
const scopeTitles = (): string[] => SCOPES.map(id => t(id as StringKey))

embed({
  id: 'entinygram.voice-changer',
  name: 'Voice Changer',
  placements: { inline: [{ slot: 'profile-accounts.calls-section.end', rows: ['preset', 'scope'] }] },
  rows: () => [{
    id: 'preset',
    type: 'select',
    text: t('title'),
    subtitle: t('info'),
    options: titles(),
    selected: chosen(),
  }, {
    id: 'scope',
    type: 'select',
    text: t('where'),
    options: scopeTitles(),
    selected: scopeIndex(),
  }],
  onEvent: (row, value) => {
    if (row === 'scope') localStorage.setItem('scope', SCOPES[Number(value)] ?? 'everywhere')
    else localStorage.setItem('preset', PRESETS[Number(value)]?.id ?? 'off')
    apply()
    embedChanged()
  },
})

inu.registerSettings(inu.ui.settingsPage({
  title: t('title'),
  items: () => [
    inu.ui.select({
      id: 'preset',
      text: t('title'),
      items: titles(),
      selected: chosen(),
      onChange: (index) => {
        localStorage.setItem('preset', PRESETS[index]?.id ?? 'off')
        apply()
      },
    }),
    inu.ui.select({
      id: 'scope',
      text: t('where'),
      items: scopeTitles(),
      selected: scopeIndex(),
      onChange: (index) => {
        localStorage.setItem('scope', SCOPES[index] ?? 'everywhere')
        apply()
      },
    }),
  ],
}))
