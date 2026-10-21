// No Vibration by @akresik, kept in entinyGram's plugin repository with the author's name on it

let hooked = 0
const failed: string[] = []

function hook(className: string, method: string, before: (ctx: any) => void): void {
  try {
    inu.xposed.hookAllOverloads(inu.jvm.cls(className), method, { before })
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
  hook(cls, 'vibrate', skipVoid)
}

hook('android.view.View', 'performHapticFeedback', skipBool)
hook('android.view.ViewRootImpl', 'performHapticFeedback', skipBool)

hook('android.app.Notification$Builder', 'setVibrate', nullArg0)
hook('android.app.Notification$Builder', 'setDefaults', stripVibrateDefault)
hook('android.app.NotificationChannel', 'enableVibration', falseArg0)
hook('android.app.NotificationChannel', 'setVibrationPattern', nullArg0)

console.log(`no-vibration: hooked ${hooked}, skipped ${failed.length}`)
for (const f of failed) console.log(`  skipped ${f}`)
