// ==InuPlugin==
// @name         Hide Folder Tags
// @id           user.hide-folder-tags
// @author       Pixuz
// @version      1.1.0
// @description  Hide the colored folder badges (SH, BOT, GR, CH, etc.) under chat names. Lightweight, no per-frame hooks.
// @description:uz Chat nomining tagidagi rangli papka belgilarini (SH, BOT, GR, CH…) yashirish. Yengil, kadrlik hook yo‘q.
// @icon         inu://settings
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// ==/InuPlugin==

const DEFAULTS = {
  enabled: true,
};

function load() {
  try {
    const raw = localStorage.getItem('hide-folder-tags');
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}
function save(s) {
  localStorage.setItem('hide-folder-tags', JSON.stringify(s));
}
let state = load();

// ---------------------------------------------------------------------------
const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader');
const Process = inu.jvm.cls('android.os.Process');
const System = inu.jvm.cls('java.lang.System');

function restartApp() {
  try {
    const ctx = ApplicationLoader.getStaticField('applicationContext');
    if (!ctx) {
      inu.ui.toast('No context');
      return;
    }
    const pm = ctx.call('getPackageManager');
    const pkg = ctx.call('getPackageName');
    const intent = pm.call('getLaunchIntentForPackage', pkg);
    if (intent) {
      intent.call('addFlags', 0x10008000);
      ctx.call('startActivity', intent);
    }
    Process.callStatic('killProcess', Process.callStatic('myPid'));
    System.callStatic('exit', 0);
  } catch (e) {
    console.error('[HideFolderTags] restart', e);
    inu.ui.toast('Restart failed');
  }
}

// ---------------------------------------------------------------------------
function hideTags(cell) {
  if (!state.enabled || !cell) return;

  const candidates = [
    'folderTagsLayout',
    'topicsLayout',
    'tagLayout',
    'folderLayout',
    'dialogFolderTags',
    'foldersLayout',
    'folderTags',
    'tags',
  ];

  for (const name of candidates) {
    try {
      const v = cell.getField(name);
      if (v == null) continue;

      try { cell.setField(name, null); continue; } catch (_) {}
      try { v.call('setVisibility', 8); continue; } catch (_) {}
      try { v.call('clear'); continue; } catch (_) {}
    } catch (_) {}
  }

  try { cell.call('setFolderTags', null); } catch (_) {}
}

// ---------------------------------------------------------------------------
function installHooks() {
  if (!state.enabled) return;

  try {
    const DialogCell = inu.jvm.cls('org.telegram.ui.Cells.DialogCell');

    // Only run when the cell actually rebuilds its content – cheap
    inu.xposed.hookAllOverloads(DialogCell, 'buildLayout', {
      after(ctx) {
        hideTags(ctx.thisObject);
      },
    });

    try {
      inu.xposed.hookAllOverloads(DialogCell, 'setDialog', {
        after(ctx) {
          hideTags(ctx.thisObject);
        },
      });
    } catch (_) {}

    // update is called on data changes, still rare enough
    try {
      inu.xposed.hookAllOverloads(DialogCell, 'update', {
        after(ctx) {
          hideTags(ctx.thisObject);
        },
      });
    } catch (_) {}

    // NO onDraw hook – that was causing the lag

    console.log('[HideFolderTags] lightweight hooks installed');
  } catch (e) {
    console.error('[HideFolderTags] hook failed', e);
    inu.ui.toast('HideFolderTags: hook failed');
  }
}

// ---------------------------------------------------------------------------
const page = inu.ui.settingsPage({
  title: 'Hide Folder Tags',
  items: () => [
    inu.ui.header('Folder tags'),
    inu.ui.check({
      id: 'enabled',
      text: 'Hide folder tags under chat names',
      subtitle: 'Removes SH, BOT, GR, CH and similar badges',
      checked: state.enabled,
      onChange: (v) => {
        state.enabled = v;
        save(state);
      },
    }),

    inu.ui.separator(),
    inu.ui.header('Actions'),
    inu.ui.button({
      id: 'restart',
      text: 'Restart Telegram',
      subtitle: 'Apply changes cleanly',
      icon: inu.icons.common('refresh'),
      onClick: async () => {
        const a = await inu.ui.dialog({
          title: 'Restart?',
          message: 'App will close and reopen.',
          positive: 'Restart',
          negative: 'Cancel',
        });
        if (a === 'positive') restartApp();
      },
    }),

    inu.ui.separator(
      'v1.1 – removed the heavy onDraw hook that caused stuttering. ' +
      'Tags are still hidden, but the chat list stays smooth.'
    ),
  ],
});

inu.registerSettings(page);

// ---------------------------------------------------------------------------
installHooks();
console.log('[HideFolderTags] v1.1 loaded (no onDraw)');