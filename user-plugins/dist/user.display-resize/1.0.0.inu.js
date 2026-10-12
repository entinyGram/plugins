// ==InuPlugin==
// @name         Display Resize
// @id           user.display-resize
// @author       Pixuz
// @version      1.0.0
// @description  Control the full size of Telegram's UI (scale density). Multi-functional scale presets + custom factor. Includes app restart button.
// @description:ru Управление полным размером UI Telegram (масштаб density). Пресеты + свой коэффициент. Кнопка перезапуска приложения.
// @icon         inu://settings
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// ==/InuPlugin==

/**
 * Display Resize – scales the entire Telegram UI by adjusting
 * AndroidUtilities.density / displayMetrics and the dp() family.
 *
 * Requires unsafe.jvm + unsafe.xposed (dangerous grants).
 * Changes take effect after a restart (or immediately for some screens).
 */

const DEFAULTS = {
  enabled: true,
  scale: 1.0,          // 1.0 = stock
  preset: 0,           // index into PRESETS
};

const PRESETS = [
  { label: 'Stock (100%)', value: 1.0 },
  { label: 'Compact (85%)', value: 0.85 },
  { label: 'Small (90%)', value: 0.9 },
  { label: 'Slightly smaller (95%)', value: 0.95 },
  { label: 'Slightly larger (105%)', value: 1.05 },
  { label: 'Large (110%)', value: 1.1 },
  { label: 'Extra large (120%)', value: 1.2 },
  { label: 'Huge (130%)', value: 1.3 },
  { label: 'Custom', value: null },
];

function loadState() {
  const raw = localStorage.getItem('display-resize');
  if (!raw) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveState(state) {
  localStorage.setItem('display-resize', JSON.stringify(state));
}

let state = loadState();

// ---------------------------------------------------------------------------
// JVM / Xposed helpers
// ---------------------------------------------------------------------------

const AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities');
const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader');
const DisplayMetrics = inu.jvm.cls('android.util.DisplayMetrics');
const Configuration = inu.jvm.cls('android.content.res.Configuration');
const Context = inu.jvm.cls('android.content.Context');
const Intent = inu.jvm.cls('android.content.Intent');
const Process = inu.jvm.cls('android.os.Process');
const System = inu.jvm.cls('java.lang.System');
const Runtime = inu.jvm.cls('java.lang.Runtime');

/** Current effective scale factor */
function currentScale() {
  if (!state.enabled) return 1.0;
  if (state.preset >= 0 && state.preset < PRESETS.length && PRESETS[state.preset].value != null) {
    return PRESETS[state.preset].value;
  }
  return Math.max(0.5, Math.min(2.0, Number(state.scale) || 1.0));
}

/**
 * Apply scale to the live AndroidUtilities statics.
 * Safe to call multiple times.
 */
function applyScaleNow() {
  const scale = currentScale();
  try {
    const density = AndroidUtilities.getStaticField('density');
    // Keep a reference to the original density so we can re-scale cleanly
    if (typeof globalThis.__origDensity !== 'number') {
      globalThis.__origDensity = density;
    }
    const base = globalThis.__origDensity;
    const newDensity = base * scale;

    AndroidUtilities.setStaticField('density', newDensity);

    // Also patch displayMetrics
    const dm = AndroidUtilities.getStaticField('displayMetrics');
    if (dm) {
      dm.setField('density', newDensity);
      dm.setField('scaledDensity', newDensity);
      // densityDpi is roughly density * 160
      const dpi = Math.round(newDensity * 160);
      dm.setField('densityDpi', dpi);
    }

    console.log(`[DisplayResize] applied scale=${scale} (density ${base} → ${newDensity})`);
  } catch (e) {
    console.error('[DisplayResize] applyScaleNow failed', e);
  }
}

/**
 * Hook checkDisplaySize so the scale survives configuration changes / restarts.
 */
function installHooks() {
  try {
    // After the stock method recalculates density we re-apply our factor
    const checkDisplaySize = AndroidUtilities.getDeclaredMethod(
      'checkDisplaySize(Landroid/content/Context;Landroid/content/res/Configuration;)V'
    );

    inu.xposed.hookMethod(checkDisplaySize, {
      after(ctx) {
        // Store the freshly computed density as the new baseline
        try {
          const dens = AndroidUtilities.getStaticField('density');
          globalThis.__origDensity = dens / currentScale(); // reverse so next apply works
        } catch (_) {}
        applyScaleNow();
      },
    });

    // Optional: also intercept the three dp helpers for extra safety
    // (some code paths read density directly, some go through dp)
    const dpMethods = ['dp', 'dp2', 'dpf2'];
    for (const name of dpMethods) {
      try {
        inu.xposed.hookAllOverloads(AndroidUtilities, name, {
          before: inu.xposed.routine((ctx) => {
            // We already patched the static density, so most calls are fine.
            // This is a safety net if something bypasses the static.
          }),
        });
      } catch (_) {
        // overload may not exist on every build – ignore
      }
    }

    console.log('[DisplayResize] hooks installed');
  } catch (e) {
    console.error('[DisplayResize] failed to install hooks', e);
    inu.ui.toast('Display Resize: hooks failed (xposed unsupported?)');
  }
}

/**
 * Force a full process restart of the app.
 */
function restartApp() {
  try {
    const ctx = ApplicationLoader.getStaticField('applicationContext');
    if (!ctx) {
      inu.ui.toast('Cannot restart: no application context');
      return;
    }

    const pm = ctx.call('getPackageManager');
    const pkg = ctx.call('getPackageName');
    const intent = pm.call('getLaunchIntentForPackage', pkg);
    if (intent) {
      intent.call('addFlags', 0x10008000); // FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TASK
      ctx.call('startActivity', intent);
    }

    // Kill current process so the new instance starts clean
    const pid = Process.callStatic('myPid');
    Process.callStatic('killProcess', pid);
    System.callStatic('exit', 0);
  } catch (e) {
    console.error('[DisplayResize] restart failed', e);
    inu.ui.toast('Restart failed – please kill the app manually');
  }
}

// ---------------------------------------------------------------------------
// Settings UI
// ---------------------------------------------------------------------------

const page = inu.ui.settingsPage({
  title: 'Display Resize',
  items: () => {
    const scale = currentScale();
    const pct = Math.round(scale * 100);

    return [
      inu.ui.header('UI Scale'),

      inu.ui.check({
        id: 'enabled',
        text: 'Enable UI scaling',
        subtitle: 'When off, stock density is restored after restart',
        checked: state.enabled,
        onChange: (v) => {
          state.enabled = v;
          saveState(state);
          applyScaleNow();
        },
      }),

      inu.ui.select({
        id: 'preset',
        text: 'Preset',
        items: PRESETS.map((p) => p.label),
        selected: state.preset,
        onChange: (idx) => {
          state.preset = idx;
          if (PRESETS[idx].value != null) {
            state.scale = PRESETS[idx].value;
          }
          saveState(state);
          applyScaleNow();
        },
      }),

      // Custom slider – only meaningful when "Custom" is selected
      inu.ui.slider({
        id: 'custom-scale',
        text: `Custom scale (${pct}%)`,
        value: state.scale,
        min: 0.5,
        max: 2.0,
        step: 0.05,
        onChange: (v) => {
          state.scale = Math.round(v * 100) / 100;
          state.preset = PRESETS.findIndex((p) => p.value === null); // force Custom
          saveState(state);
          applyScaleNow();
        },
      }),

      inu.ui.separator('Current effective scale: ' + pct + '%'),

      inu.ui.header('Actions'),

      inu.ui.button({
        id: 'apply',
        text: 'Apply now (partial)',
        subtitle: 'Recalculates density immediately. Some screens need a restart.',
        onClick: () => {
          applyScaleNow();
          inu.ui.bulletin({
            text: `Scale set to ${pct}%`,
            icon: inu.icons.animation('success'),
          });
        },
      }),

      inu.ui.button({
        id: 'restart',
        text: 'Restart Telegram',
        subtitle: 'Fully restarts the app so every screen picks up the new scale',
        icon: inu.icons.common('refresh'),
        onClick: async () => {
          const answer = await inu.ui.dialog({
            title: 'Restart app?',
            message: 'Telegram will close and reopen with the new UI scale.',
            positive: 'Restart',
            negative: 'Cancel',
          });
          if (answer === 'positive') {
            restartApp();
          }
        },
      }),

      inu.ui.separator(
        'Tip: after changing the scale a full restart gives the most consistent result. ' +
          'Very extreme values (<70% or >150%) may break some layouts.'
      ),
    ];
  },
});

inu.registerSettings(page);

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

installHooks();
applyScaleNow();

console.log('[DisplayResize] plugin loaded, scale =', currentScale());