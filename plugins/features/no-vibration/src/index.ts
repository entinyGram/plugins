// Based on No Vibration by @akresik: the hooks below are his list, grouped by what they silence and put behind switches.
import { embed, embedChanged } from '@entiny/sdk/embed'
import { type StringKey, t } from './i18n.js'

type Kind = 'haptics' | 'vibrator' | 'notifications'

const KINDS: Kind[] = ['haptics', 'vibrator', 'notifications']

// everything is blocked until the user says otherwise, which is what the original plugin does
const blocked = (kind: Kind): boolean => localStorage.getItem(`block.${kind}`) !== 'false'
const isKind = (value: string): value is Kind => (KINDS as string[]).includes(value)

let hooked = 0
const failed: string[] = []

function hook(kind: Kind, className: string, method: string, action: (ctx: any) => void): void {
  try {
    inu.xposed.hookAllOverloads(inu.jvm.cls(className), method, {
      before: (ctx: any) => { if (blocked(kind)) action(ctx) },
    })
    hooked++
  } catch (e) {
    failed.push(`${className}#${method}: ${(e as Error).message}`)
  }
}

const skipVoid = (ctx: any): void => ctx.setReturnValue(null)
const skipBool = (ctx: any): void => ctx.setReturnValue(false)
const nullArg0 = (ctx: any): void => { ctx.args[0] = null }
const falseArg0 = (ctx: any): void => { ctx.args[0] = false }
// Notification.DEFAULT_VIBRATE is bit 2
const stripVibrateDefault = (ctx: any): void => { ctx.args[0] = ctx.args[0] & ~2 }

for (const cls of [
  'android.os.Vibrator',
  'android.os.SystemVibrator',
  'android.os.SystemVibrator$MultiVibrator',
  'android.os.SystemVibratorManager',
  'android.os.SystemVibratorManager$SingleVibrator',
  'android.os.IVibratorService$Stub$Proxy',
  'android.os.IVibratorManagerService$Stub$Proxy',
]) {
  hook('vibrator', cls, 'vibrate', skipVoid)
}

hook('haptics', 'android.view.View', 'performHapticFeedback', skipBool)
hook('haptics', 'android.view.ViewRootImpl', 'performHapticFeedback', skipBool)

hook('notifications', 'android.app.Notification$Builder', 'setVibrate', nullArg0)
hook('notifications', 'android.app.Notification$Builder', 'setDefaults', stripVibrateDefault)
hook('notifications', 'android.app.NotificationChannel', 'enableVibration', falseArg0)
hook('notifications', 'android.app.NotificationChannel', 'setVibrationPattern', nullArg0)

console.log(`no-vibration: hooked ${hooked}, skipped ${failed.length}`)
for (const f of failed) console.log(`  skipped ${f}`)

embed({
  id: 'entinygram.no-vibration',
  name: 'No Vibration',
  placements: { inline: [{ slot: 'behavior.device-section.end', rows: KINDS }] },
  rows: () => KINDS.map(kind => ({
    id: kind,
    type: 'check' as const,
    text: t(kind),
    subtitle: t(`${kind}Info` as StringKey),
    checked: blocked(kind),
  })),
  onEvent: (row, value) => {
    if (!isKind(row)) return
    localStorage.setItem(`block.${row}`, value)
    embedChanged()
  },
})
