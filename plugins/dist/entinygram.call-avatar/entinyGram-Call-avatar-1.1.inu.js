// ==InuPlugin==
// @name         Call avatar
// @id           entinygram.call-avatar
// @author       entinyGram
// @version      1.1
// @description  Full-screen caller photo instead of the circular avatar in voice calls
// @icon         inu://photo
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// @requires     entinygram.sdk >=0.1.0-alpha
// ==/InuPlugin==


// src/i18n.ts
function language(value) {
  const short = String(value).toLowerCase();
  if (short.startsWith("uk")) return "uk";
  if (short.startsWith("ru")) return "ru";
  if (short.startsWith("fa")) return "fa";
  return "en";
}
function appLang() {
  try {
    const controller = inu.jvm.cls("org.telegram.messenger.LocaleController");
    const short = controller.callStatic("getInstance").call("getCurrentLocaleInfo").getField("shortName");
    if (short) return language(short);
  } catch {
  }
  try {
    const locale = inu.jvm.cls("java.util.Locale");
    return language(locale.callStatic("getDefault").call("getLanguage"));
  } catch {
  }
  return "en";
}
var STRINGS = {
  title: {
    uk: "Фото дзвінка",
    ru: "Фото звонка",
    en: "Call avatar",
    fa: "عکس تماس"
  },
  enabled: {
    uk: "Фото на весь екран під час дзвінка",
    ru: "Фото на весь экран во время звонка",
    en: "Full-screen photo during calls",
    fa: "عکس تمام‌صفحه در طول تماس"
  },
  mode: {
    uk: "Коли показувати фото",
    ru: "Когда показывать фото",
    en: "When to show the photo",
    fa: "زمان نمایش عکس"
  },
  always: {
    uk: "Завжди",
    ru: "Всегда",
    en: "Always",
    fa: "همیشه"
  },
  before: {
    uk: "До відповіді",
    ru: "До ответа",
    en: "Before answer",
    fa: "قبل از پاسخ"
  },
  after: {
    uk: "Після відповіді",
    ru: "После ответа",
    en: "After answer",
    fa: "بعد از پاسخ"
  },
  supported: {
    uk: "Для голосових дзвінків. Без фото залишається штатний аватар; під час відео фон вимикається.",
    ru: "Для голосовых звонков. Без фото остаётся стандартный аватар; во время видео фон отключается.",
    en: "For voice calls. Without a photo, the native avatar remains; the background is disabled during video calls.",
    fa: "برای تماس‌های صوتی. بدون عکس، آواتار پیش‌فرض باقی می‌ماند؛ پس‌زمینه در تماس‌های ویدیویی غیرفعال می‌شود."
  },
  unsupported: {
    uk: "Ця версія клієнта не підтримує потрібні хуки дзвінків.",
    ru: "Эта версия клиента не поддерживает необходимые хуки звонков.",
    en: "This client version does not support the required call hooks.",
    fa: "این نسخه از کلاینت از قلاب‌های تماس لازم پشتیبانی نمی‌کند."
  }
};
function t(key) {
  return STRINGS[key][appLang()];
}

// src/index.ts
var VoIP = inu.jvm.cls("org.telegram.ui.VoIPFragment");
var VoIPService = inu.jvm.cls("org.telegram.messenger.voip.VoIPService");
var BackupImageView = inu.jvm.cls("org.telegram.ui.Components.BackupImageView");
var FrameLayout = inu.jvm.cls("android.widget.FrameLayout");
var LayoutParams = inu.jvm.cls("android.widget.FrameLayout$LayoutParams");
var View = inu.jvm.cls("android.view.View");
var ImageLocation = inu.jvm.cls("org.telegram.messenger.ImageLocation");
var Looper = inu.jvm.cls("android.os.Looper");
var Handler = inu.jvm.cls("android.os.Handler");
var CountDownLatch = inu.jvm.cls("java.util.concurrent.CountDownLatch");
var TimeUnit = inu.jvm.cls("java.util.concurrent.TimeUnit");
var AndroidUtilities = inu.jvm.cls("org.telegram.messenger.AndroidUtilities");
var BackgroundProvider = inu.jvm.cls("org.telegram.ui.Components.voip.VoIPBackgroundProvider");
var Paint = inu.jvm.cls("android.graphics.Paint");
var AtomicReference = inu.jvm.cls("java.util.concurrent.atomic.AtomicReference");
var styledProvider = new AtomicReference();
var buttonPaint = new Paint(1);
var revealPaint = new Paint(1);
buttonPaint.call("setColor", 1493172224);
revealPaint.call("setColor", 0);
var handler = new Handler(Looper.callStatic("getMainLooper"));
var off = [];
var supported = false;
var active = null;
function enabled() {
  return localStorage.getItem("call-avatar.enabled") !== "false";
}
var modes = ["always", "before", "after"];
function modeIndex() {
  return Math.max(0, modes.indexOf(localStorage.getItem("call-avatar.mode") ?? "always"));
}
function refresh() {
  onUI(() => {
    detach(true);
    const fragment = VoIP.callStatic("getInstance");
    if (supported && fragment !== null) sync(fragment);
  });
}
function onUI(fn) {
  const current = Looper.callStatic("myLooper");
  if (current !== null && current.call("equals", Looper.callStatic("getMainLooper"))) {
    fn();
    return;
  }
  const done = new CountDownLatch(1);
  let cancelled = false;
  let failure;
  const task = inu.jvm.runnable(() => {
    try {
      if (!cancelled) fn();
    } catch (error) {
      failure = error;
    } finally {
      done.call("countDown");
    }
  });
  if (!handler.call("post", task)) throw new Error("call-avatar: UI handler rejected task");
  if (!done.call("await(JLjava/util/concurrent/TimeUnit;)Z", 1, TimeUnit.getStaticField("SECONDS"))) {
    cancelled = true;
    handler.call("removeCallbacks", task);
    throw new Error("call-avatar: UI task timed out; reopen the call screen");
  }
  if (failure !== void 0) throw failure;
}
function detach(restore) {
  if (!active) return;
  const old = active;
  active = null;
  styledProvider.call("set", null);
  old.fragment.getField("backgroundProvider").call("invalidateViews");
  const parent = old.layer.call("getParent");
  if (parent !== null) parent.call("removeView", old.layer);
  const params = old.status.call("getLayoutParams");
  params.setField("topMargin", old.topMargin);
  old.status.call("setLayoutParams", params);
  if (restore) {
    old.fragment.call("showCallingUserAvatarMini(ZZ)V", false, false);
    old.fragment.call("updateViewState()V");
  }
}
function sync(fragment) {
  const user = fragment.getField("callingUser");
  const noVideo = !fragment.getField("currentUserIsVideo") && !fragment.getField("callingUserIsVideo");
  const answered = fragment.getField("wasEstablished") || fragment.getField("currentState") === VoIPService.getStaticField("STATE_ESTABLISHED");
  const mode = modes[modeIndex()];
  const showInState = mode === "always" || (mode === "before" ? !answered : answered);
  const location = user === null ? null : ImageLocation.callStatic(
    "getForUserOrChat",
    fragment.getField("currentAccount"),
    user,
    ImageLocation.getStaticField("TYPE_BIG")
  );
  if (!enabled() || !showInState || !noVideo || location === null || fragment.getField("isFinished")) {
    detach(!fragment.getField("isFinished"));
    return;
  }
  const mini = fragment.getField("callingUserPhotoViewMini");
  if (mini === null) return;
  if (active && !active.fragment.call("equals", fragment)) detach(true);
  if (!active) {
    const parent = mini.call("getParent");
    if (parent === null) return;
    const context = mini.call("getContext");
    const layer = new FrameLayout(context);
    const image = new BackupImageView(context);
    image.call("setRoundRadius", 0);
    image.call("getImageReceiver").call("setAspectFit", false);
    image.call("setImage(Lorg/telegram/messenger/ImageLocation;Ljava/lang/String;Landroid/graphics/drawable/Drawable;Ljava/lang/Object;)V", location, null, null, user);
    layer.call("addView", image, new LayoutParams(-1, -1));
    const scrim = new View(context);
    scrim.call("setBackgroundColor", 1711276032);
    layer.call("addView", scrim, new LayoutParams(-1, -1));
    layer.call("setImportantForAccessibility", 4);
    layer.call("setClickable", false);
    const cover = fragment.getField("voIpCoverView");
    const index = parent.call("indexOfChild", cover);
    parent.call("addView", layer, Math.max(0, index + 1), new LayoutParams(-1, -1));
    const status = fragment.getField("statusLayout");
    active = { fragment, layer, mini, status, topMargin: status.call("getLayoutParams").getField("topMargin") };
    const provider = fragment.getField("backgroundProvider");
    styledProvider.call("set", provider);
    provider.call("invalidateViews");
  }
  mini.call("animate").call("setListener", null).call("cancel");
  mini.call("setVisibility", 4);
  positionText(fragment);
}
function positionText(fragment) {
  if (!active || !active.fragment.call("equals", fragment)) return;
  const insets = fragment.getField("lastInsets");
  const insetTop = insets === null ? 0 : insets.call("getSystemWindowInsetTop");
  const params = active.status.call("getLayoutParams");
  active.topMargin = AndroidUtilities.callStatic("dp", 135) + insetTop;
  const expanded = fragment.getField("emojiExpanded");
  params.setField("topMargin", expanded ? active.topMargin : AndroidUtilities.callStatic("dp", 72) + insetTop);
  active.status.call("setLayoutParams", params);
  if (!expanded) {
    active.status.call("animate").call("setListener", null).call("cancel");
    active.status.call("setTranslationY", 0);
    active.status.call("setAlpha", 1);
    fragment.setField("statusLayoutAnimateToOffset", 0);
  }
}
try {
  off.push(inu.xposed.hookMethod(BackgroundProvider.getDeclaredMethod("getLightPaint()Landroid/graphics/Paint;"), {
    after: inu.xposed.routine({
      v: 1,
      source: `
      (ctx) => {\r
            if (ctx.thisObject === styledProvider.get()) ctx.setReturnValue(buttonPaint)\r
          }`,
      captures: ["styledProvider", "buttonPaint"],
      slots: 0,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["this"],
        ["call", 0, ["get"], []],
        ["eq", 2, 3],
        ["jumpIfFalsy", 4, 7],
        ["setResult", 1]
      ],
      tries: []
    }, [styledProvider, buttonPaint])
  }));
  off.push(inu.xposed.hookMethod(BackgroundProvider.getDeclaredMethod("getRevealPaint()Landroid/graphics/Paint;"), {
    after: inu.xposed.routine({
      v: 1,
      source: `
      (ctx) => {\r
            if (ctx.thisObject === styledProvider.get()) ctx.setReturnValue(revealPaint)\r
          }`,
      captures: ["styledProvider", "revealPaint"],
      slots: 0,
      code: [
        ["capture", 0],
        ["capture", 1],
        ["this"],
        ["call", 0, ["get"], []],
        ["eq", 2, 3],
        ["jumpIfFalsy", 4, 7],
        ["setResult", 1]
      ],
      tries: []
    }, [styledProvider, revealPaint])
  }));
  for (const method of ["updateViewState()V", "setInsets(Landroid/view/WindowInsets;)V"]) {
    off.push(inu.xposed.hookMethod(VoIP.getDeclaredMethod(method), {
      after(ctx) {
        if (method === "updateViewState()V") sync(ctx.thisObject);
        else positionText(ctx.thisObject);
      }
    }));
  }
  off.push(inu.xposed.hookMethod(VoIP.getDeclaredMethod("showCallingUserAvatarMini(ZZ)V"), {
    after(ctx) {
      try {
        sync(ctx.thisObject);
      } catch (error) {
        console.warn("call-avatar: could not update photo", error);
        detach(true);
      }
    }
  }));
  off.push(inu.xposed.hookMethod(VoIP.getDeclaredMethod("destroy()V"), {
    before(ctx) {
      if (active && active.fragment.call("equals", ctx.thisObject)) detach(false);
    }
  }));
  supported = true;
  onUI(() => {
    const fragment = VoIP.callStatic("getInstance");
    if (fragment !== null) sync(fragment);
  });
} catch (error) {
  supported = false;
  for (const unhook of off.splice(0)) unhook();
  try {
    onUI(() => detach(true));
  } catch (cleanupError) {
    console.warn("call-avatar: cleanup failed", cleanupError);
  }
  console.warn("call-avatar: this client does not support the required call hooks", error);
}
inu.onUnload(() => {
  for (const unhook of off.splice(0)) unhook();
  onUI(() => detach(true));
});
inu.registerSettings(inu.ui.settingsPage({
  title: t("title"),
  items: () => [
    inu.ui.check({
      id: "enabled",
      text: t("enabled"),
      checked: enabled(),
      onChange(value) {
        localStorage.setItem("call-avatar.enabled", String(value));
        refresh();
      }
    }),
    inu.ui.select({
      id: "mode",
      text: t("mode"),
      items: [t("always"), t("before"), t("after")],
      selected: modeIndex(),
      onChange(index) {
        localStorage.setItem("call-avatar.mode", modes[index] ?? "always");
        refresh();
      }
    }),
    inu.ui.separator(t(supported ? "supported" : "unsupported"))
  ]
}));
