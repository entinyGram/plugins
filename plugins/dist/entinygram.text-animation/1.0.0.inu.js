// ==InuPlugin==
// @name         Text animation
// @id           entinygram.text-animation
// @author       entinyGram
// @version      1.0.0
// @description  Animated typing and deleting in the message input
// @icon         inu://edit
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// @entiny-menu  category-chats
// @entiny-inline category-chats.end rows=enable
// @requires     entinygram.sdk >=0.1.0-alpha
// ==/InuPlugin==


// ../../sdk/entiny/src/embed.ts
var REGISTRY_KEY = "entiny.embed";
var CHANGED_KEY = "__changed";
function embedRegistry() {
  const props = inu.jvm.cls("java.lang.System").callStatic("getProperties");
  let registry = props.call("get", REGISTRY_KEY);
  if (registry === null) {
    props.call("putIfAbsent", REGISTRY_KEY, new (inu.jvm.cls("java.util.concurrent.ConcurrentHashMap"))());
    registry = props.call("get", REGISTRY_KEY);
  }
  return registry;
}
function notifyChanged(registry) {
  const changed = registry.call("get", CHANGED_KEY);
  if (changed !== null) changed.call("run");
}
function embed(spec) {
  const BiFunction = inu.jvm.cls("java.util.function.BiFunction");
  const handle = (op, arg) => {
    switch (op) {
      case "meta":
        return JSON.stringify({ name: spec.name, placements: spec.placements });
      case "rows":
        return JSON.stringify(spec.rows(arg));
      case "event": {
        const { row, value } = JSON.parse(arg);
        spec.onEvent(row, value);
        return "";
      }
      case "open":
        spec.open?.();
        return "";
      case "choices":
        return JSON.stringify(spec.choices?.(arg) ?? []);
      case "choice": {
        const { id, picked } = JSON.parse(arg);
        spec.onChoice?.(id, picked);
        return "";
      }
      default:
        return "";
    }
  };
  const Handler = inu.jvm.defineClass({
    interfaces: [BiFunction],
    methods: {
      apply: {
        params: ["java.lang.Object", "java.lang.Object"],
        returns: "java.lang.Object",
        body: (_self, op, arg) => handle(op, arg)
      }
    }
  });
  const registry = embedRegistry();
  registry.call("put", spec.id, new Handler());
  notifyChanged(registry);
  return () => {
    registry.call("remove", spec.id);
    notifyChanged(registry);
  };
}
function embedChanged() {
  notifyChanged(embedRegistry());
}

// src/i18n.ts
function appLang() {
  try {
    const LocaleController = inu.jvm.cls("org.telegram.messenger.LocaleController");
    const short = String(LocaleController.callStatic("getInstance").call("getCurrentLocaleInfo").getField("shortName")).toLowerCase();
    if (short.startsWith("uk")) return "uk";
    if (short.startsWith("ru")) return "ru";
  } catch {
  }
  try {
    const JLocale = inu.jvm.cls("java.util.Locale");
    const lang = String(JLocale.callStatic("getDefault").call("getLanguage")).toLowerCase();
    if (lang.startsWith("uk")) return "uk";
    if (lang.startsWith("ru")) return "ru";
  } catch {
  }
  return "en";
}
var STRINGS = {
  title: {
    uk: "Анімація тексту",
    ru: "Анимация текста",
    en: "Text animation"
  },
  general: {
    uk: "Загальні",
    ru: "Основные",
    en: "General"
  },
  enable: {
    uk: "Увімкнути анімацію тексту",
    ru: "Включить анимацию текста",
    en: "Enable text animation"
  },
  enabled: {
    uk: "Увімкнено",
    ru: "Включено",
    en: "Enabled"
  },
  duration: {
    uk: "Тривалість",
    ru: "Длительность",
    en: "Duration"
  },
  wave_delay: {
    uk: "Затримка хвилі",
    ru: "Задержка волны",
    en: "Wave delay"
  },
  effects: {
    uk: "Ефекти",
    ru: "Эффекты",
    en: "Effects"
  },
  blur: {
    uk: "Розмиття",
    ru: "Размытие",
    en: "Blur"
  },
  slide: {
    uk: "Зсув",
    ru: "Сдвиг",
    en: "Slide"
  },
  scale: {
    uk: "Масштабування",
    ru: "Масштабирование",
    en: "Scale"
  },
  rotate: {
    uk: "Поворот",
    ru: "Вращение",
    en: "Rotate"
  },
  deletion: {
    uk: "Видалення",
    ru: "Удаление",
    en: "Deletion"
  },
  ghost: {
    uk: "Привид при видаленні",
    ru: "Призрак при удалении",
    en: "Ghost on delete"
  },
  particle_style: {
    uk: "Стиль частинок",
    ru: "Стиль частиц",
    en: "Particle style"
  },
  particles_per_char: {
    uk: "Частинок на символ",
    ru: "Частиц на символ",
    en: "Particles per char"
  },
  note_info: {
    uk: "Анімація відтворюється в полі введення повідомлення під час друку",
    ru: "Анимация воспроизводится в поле ввода сообщения при наборе текста",
    en: "The animation plays in the message input as you type"
  },
  note_unsupported: {
    uk: "Цей пристрій не підтримує перехоплення, необхідні для плагіна",
    ru: "Это устройство не поддерживает перехваты, необходимые для этого плагина",
    en: "This device does not support the hooks needed for this plugin"
  }
};
function t(key) {
  const l = appLang();
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[l] ?? entry.en;
}
function particleStyleNames() {
  const l = appLang();
  if (l === "uk") {
    return ["Пил", "Іскри", "Сніг", "Сакура", "Літери", "Падіння"];
  }
  if (l === "ru") {
    return ["Пыль", "Искры", "Снег", "Сакура", "Буквы", "Падение"];
  }
  return ["Dust", "Sparks", "Snow", "Sakura", "Letters", "Fall"];
}

// src/index.ts
var SystemClock = inu.jvm.cls("android.os.SystemClock");
var Canvas = inu.jvm.cls("android.graphics.Canvas");
var Paint = inu.jvm.cls("android.graphics.Paint");
var Color = inu.jvm.cls("android.graphics.Color");
var BlurMaskFilter = inu.jvm.cls("android.graphics.BlurMaskFilter");
var Path = inu.jvm.cls("android.graphics.Path");
var PathMeasure = inu.jvm.cls("android.graphics.PathMeasure");
var Spannable = inu.jvm.cls("android.text.Spannable");
var ForegroundColorSpan = inu.jvm.cls("android.text.style.ForegroundColorSpan");
var ReplacementSpan = inu.jvm.cls("android.text.style.ReplacementSpan");
var StaticLayout = inu.jvm.cls("android.text.StaticLayout");
var LayoutAlignment = inu.jvm.cls("android.text.Layout$Alignment");
var Gravity = inu.jvm.cls("android.view.Gravity");
var PasswordTransformationMethod = inu.jvm.cls("android.text.method.PasswordTransformationMethod");
var EditTextBoldCursor = inu.jvm.cls("org.telegram.ui.Components.EditTextBoldCursor");
var AndroidUtilities = inu.jvm.cls("org.telegram.messenger.AndroidUtilities");
var JSystem = inu.jvm.cls("java.lang.System");
var JCharacter = inu.jvm.cls("java.lang.Character");
var JMath = inu.jvm.cls("java.lang.Math");
var JArray = inu.jvm.cls("java.lang.reflect.Array");
var SPAN_EXCLUSIVE = 33;
var TRANSPARENT = 0;
var GRAVITY_VERTICAL_MASK = 112;
var GRAVITY_CENTER_V = 16;
var GRAVITY_BOTTOM = 80;
var BLUR_NORMAL = inu.jvm.cls("android.graphics.BlurMaskFilter$Blur").getStaticField("NORMAL");
var ALIGN_NORMAL = LayoutAlignment.getStaticField("ALIGN_NORMAL");
var density = 2;
try {
  density = AndroidUtilities.getStaticField("density") ?? 2;
} catch (_) {
}
function dp(val) {
  return Math.ceil(density * val);
}
function toLen(val) {
  if (val == null) return 0;
  if (typeof val === "string") return val.length;
  if (typeof val.length === "number") return val.length;
  if (typeof val.call === "function") {
    try {
      return val.call("length");
    } catch (_) {
    }
  }
  return 0;
}
function toStr(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val.call === "function") {
    try {
      return val.call("toString");
    } catch (_) {
    }
  }
  return String(val);
}
var DEFAULTS = {
  enable: "true",
  duration: "300",
  blur_enabled: "true",
  blur_radius: "10",
  slide_enabled: "true",
  slide_dist: "20",
  scale_enabled: "false",
  rotate_enabled: "false",
  wave_step: "25",
  delete_ghost: "true",
  particle_count: "5",
  particle_style: "0"
};
function cfgBool(key) {
  return (localStorage.getItem(`ta.${key}`) ?? DEFAULTS[key]) === "true";
}
function cfgInt(key) {
  return parseInt(localStorage.getItem(`ta.${key}`) ?? DEFAULTS[key], 10);
}
function cfgSet(key, value) {
  localStorage.setItem(`ta.${key}`, value);
}
function cfgDuration() {
  return Math.max(80, Math.min(900, cfgInt("duration")));
}
function cfgBlurRadius() {
  return cfgBool("blur_enabled") ? cfgInt("blur_radius") : 0;
}
function cfgSlideDist() {
  if (!cfgBool("slide_enabled")) return 0;
  return dp(cfgInt("slide_dist"));
}
function cfgWaveStep() {
  return cfgInt("wave_step");
}
function cfgParticleCount() {
  return cfgInt("particle_count");
}
function cfgParticleStyle() {
  return Math.max(0, Math.min(5, cfgInt("particle_style")));
}
var WAVE_CAP = 700;
var MAX_GHOSTS = 160;
var SEND_WINDOW = 1500;
var PARTICLE_MAX = 400;
var TWO_PI = 6.2831855;
var STYLE_SPARKS = 1;
var STYLE_SNOW = 2;
var STYLE_SAKURA = 3;
var STYLE_TEXT = 4;
var STYLE_FALL = 5;
var SAKURA_COLORS = [16766948, 16761558, 16756427, 16488636];
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function createParticle(x, y, color, textSize, style, text) {
  const base = Math.max(1, textSize);
  const p = {
    x,
    y,
    color,
    text: text || "*",
    style,
    vx: 0,
    vy: 0,
    life: 1,
    size: 0,
    decay: 0,
    rotation: Math.random() * 360,
    angularVelocity: 0,
    spinDamping: 1,
    gravity: 0,
    drag: 0,
    wind: 0,
    wobble: 0,
    wobblePhase: Math.random() * TWO_PI,
    wobbleSpeed: 0.08,
    stretch: 1,
    turbAmp: 0,
    turbFreqX: 0,
    turbFreqY: 0,
    turbPhaseX: Math.random() * TWO_PI,
    turbPhaseY: Math.random() * TWO_PI,
    flickerSpeed: 0,
    flickerPhase: Math.random() * TWO_PI,
    time: 0,
    restitution: 0,
    bounded: false,
    boundLeft: 0,
    boundRight: 0,
    boundBottom: 0
  };
  switch (style) {
    case STYLE_SPARKS: {
      const angle = Math.random() * TWO_PI;
      const force = rand(2.6, 7);
      p.vx = Math.cos(angle) * force * 1.3;
      p.vy = Math.sin(angle) * force * 1.25 * 0.85 - rand(1.2, 2.4);
      p.size = Math.max(1, rand(base / 12, base / 7.5));
      p.decay = Math.random() < 0.3 ? rand(0.045, 0.075) : rand(0.02, 0.04);
      p.gravity = 0.11;
      p.drag = 0.055;
      p.wind = rand(-0.012, 0.012);
      p.turbAmp = 0.02;
      p.turbFreqX = rand(0.14, 0.3);
      p.turbFreqY = rand(0.12, 0.26);
      p.flickerSpeed = rand(0.55, 1.1);
      p.angularVelocity = rand(-12, 12);
      break;
    }
    case STYLE_SNOW: {
      p.vx = rand(-0.8, 0.8) * 1.3;
      p.vy = rand(-0.6, 0.25) * 1.25;
      p.size = Math.max(2, rand(base / 9, base / 5.5));
      p.decay = rand(7e-3, 0.015);
      p.gravity = 0.014;
      p.drag = 0.025;
      p.wind = rand(4e-3, 0.014);
      p.wobble = rand(0.45, 1.3);
      p.wobbleSpeed = rand(0.05, 0.09);
      p.angularVelocity = rand(-2.5, 2.5);
      p.spinDamping = 0.998;
      p.turbAmp = 0.012;
      p.turbFreqX = rand(0.06, 0.14);
      p.turbFreqY = rand(0.05, 0.12);
      break;
    }
    case STYLE_SAKURA: {
      p.color = SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)];
      p.vx = rand(-0.9, 1.2) * 1.3 * 0.8 + rand(0.05, 0.3);
      p.vy = rand(-1, 0.15) * 1.25 * 0.55;
      p.size = Math.max(2.6, rand(base / 6.8, base / 4.4));
      p.decay = rand(6e-3, 0.013);
      p.gravity = 0.03;
      p.drag = 0.03;
      p.wind = rand(4e-3, 0.014);
      p.wobble = rand(0.8, 1.8);
      p.wobbleSpeed = rand(0.045, 0.075);
      p.angularVelocity = rand(-2.2, 2.2);
      p.spinDamping = 0.985;
      p.stretch = rand(1.45, 2);
      p.turbAmp = 8e-3;
      p.turbFreqX = rand(0.05, 0.12);
      p.turbFreqY = rand(0.04, 0.1);
      break;
    }
    case STYLE_TEXT: {
      const angle = -1.5707964 + rand(-1.1, 1.1);
      const force = rand(1.6, 3.8);
      p.vx = Math.cos(angle) * force * 1.3;
      p.vy = Math.sin(angle) * force * 1.25;
      p.size = Math.max(4, base * rand(0.5, 0.72));
      p.decay = rand(0.014, 0.028);
      p.gravity = 0.09;
      p.drag = 0.015;
      p.wind = rand(-0.01, 0.01);
      p.angularVelocity = rand(-14, 14);
      p.spinDamping = 0.992;
      p.turbAmp = 8e-3;
      p.turbFreqX = rand(0.08, 0.16);
      p.turbFreqY = rand(0.07, 0.14);
      break;
    }
    case STYLE_FALL: {
      p.vx = rand(-0.05, 0.05) * base * 1.4;
      p.vy = -rand(0.09, 0.18) * base;
      p.size = Math.max(6, base);
      p.decay = rand(45e-4, 65e-4);
      p.gravity = base * 0.011;
      p.drag = 0.012;
      p.rotation = 0;
      p.angularVelocity = rand(-5, 5);
      p.spinDamping = 0.995;
      p.restitution = rand(0.35, 0.5);
      p.bounded = true;
      break;
    }
    default: {
      const angle = Math.random() * TWO_PI;
      const force = rand(0.6, 2.6);
      p.vx = Math.cos(angle) * force * 1.3;
      p.vy = Math.sin(angle) * force * 1.25 * 0.6 - rand(0.5, 1.3);
      p.size = Math.max(1.5, rand(base / 11, base / 5.5));
      p.decay = rand(0.014, 0.032);
      p.gravity = 0.012;
      p.drag = 0.05;
      p.wind = rand(-0.01, 0.01);
      p.turbAmp = 0.055;
      p.turbFreqX = rand(0.11, 0.23);
      p.turbFreqY = rand(0.09, 0.19);
      p.flickerSpeed = rand(0.25, 0.5);
      p.angularVelocity = rand(-4, 4);
      break;
    }
  }
  return p;
}
function particleFade(p) {
  const l = Math.max(0, Math.min(1, p.life));
  if (p.style === STYLE_FALL) return Math.min(1, l / 0.2);
  return l * l * (3 - 2 * l);
}
function particleCollide(p, scale) {
  const half = p.size * 0.32;
  if (p.x - half < p.boundLeft) {
    p.x = p.boundLeft + half;
    if (p.vx < 0) p.vx = -p.vx * p.restitution;
  } else if (p.x + half > p.boundRight) {
    p.x = p.boundRight - half;
    if (p.vx > 0) p.vx = -p.vx * p.restitution;
  }
  if (p.y + half <= p.boundBottom) return;
  p.y = p.boundBottom - half;
  if (p.vy > 0) p.vy = p.vy < p.gravity * 2.5 ? 0 : -p.vy * p.restitution;
  p.vx *= Math.pow(0.965, scale);
  const roll = p.vx / Math.max(1, half) * 57.29578;
  p.angularVelocity += (roll - p.angularVelocity) * Math.min(1, 0.25 * scale);
}
function particleUpdate(p, dt) {
  const scale = Math.max(0.25, Math.min(3, dt / 16));
  p.time += scale;
  p.wobblePhase += p.wobbleSpeed * scale;
  p.vx += p.wind * scale;
  if (p.turbAmp !== 0) {
    p.vx += Math.sin(p.time * p.turbFreqX + p.turbPhaseX) * p.turbAmp * scale;
    p.vy += Math.cos(p.time * p.turbFreqY + p.turbPhaseY) * p.turbAmp * 0.6 * scale;
  }
  const sway = p.wobble === 0 ? 0 : Math.sin(p.wobblePhase) * p.wobble;
  p.x += (p.vx + sway) * scale;
  p.y += p.vy * scale;
  if (p.style === STYLE_SAKURA && p.wobble !== 0) {
    p.y += Math.cos(p.wobblePhase * 2) * p.wobble * 0.18 * scale;
    p.rotation += Math.cos(p.wobblePhase) * 1.9 * scale;
  }
  p.vy += p.gravity * scale;
  const dragFactor = Math.pow(1 - Math.min(0.5, p.drag), scale);
  p.vx *= dragFactor;
  p.vy *= 1 - (1 - dragFactor) * 0.55;
  p.rotation += p.angularVelocity * scale;
  if (p.spinDamping < 1) p.angularVelocity *= Math.pow(p.spinDamping, scale);
  if (p.bounded && p.boundRight > p.boundLeft) particleCollide(p, scale);
  p.life -= p.decay * scale;
  return p.life > 0;
}
function spawnParticles(out, style, count, text, paint, x, baseline, width) {
  const tSize = paint.call("getTextSize");
  const fall = style === STYLE_FALL;
  const budget = Math.min(fall ? 1 : count, PARTICLE_MAX - out.length);
  if (budget <= 0) return;
  const color = paint.call("getColor");
  const glyphTop = baseline - tSize * 0.78;
  const glyphHeight = Math.max(1, tSize * 0.82);
  const centerX = x + width * 0.5;
  const centerY = glyphTop + glyphHeight * 0.55;
  for (let j = 0; j < budget; j++) {
    let px, py;
    if (fall) {
      px = centerX;
      py = baseline - Math.max(6, tSize) * 0.35;
    } else {
      px = x + width * ((j + 0.5) / Math.max(1, count)) + (Math.random() - 0.5) * width * 0.6;
      py = glyphTop + Math.random() * glyphHeight;
    }
    const p = createParticle(px, py, color, tSize, style, text);
    if (!fall) {
      p.vx += (px - centerX) / Math.max(1, width * 0.5) * 1.5;
      p.vy += (py - centerY) / Math.max(1, glyphHeight * 0.5) * 0.5;
    }
    out.push(p);
  }
}
function stepParticles(list, dt, left, right, bottom) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if (p.bounded) {
      p.boundLeft = left;
      p.boundRight = right;
      p.boundBottom = bottom;
    }
    if (!particleUpdate(p, dt)) list.splice(i, 1);
  }
}
var PaintStyle = inu.jvm.cls("android.graphics.Paint$Style");
var PaintCap = inu.jvm.cls("android.graphics.Paint$Cap");
var PaintAlign = inu.jvm.cls("android.graphics.Paint$Align");
var strokePaint = new Paint(1);
strokePaint.call("setStyle", PaintStyle.getStaticField("STROKE"));
strokePaint.call("setStrokeCap", PaintCap.getStaticField("ROUND"));
var fillPaint = new Paint(1);
var textPaint = new Paint(1);
textPaint.call("setTextAlign", PaintAlign.getStaticField("CENTER"));
function argb(paint, color, alpha) {
  paint.call(
    "setARGB",
    Math.max(0, Math.min(255, alpha)),
    color >> 16 & 255,
    color >> 8 & 255,
    color & 255
  );
}
function lighten(color, amount) {
  let r = color >> 16 & 255;
  let g = color >> 8 & 255;
  let b = color & 255;
  r += (255 - r) * amount | 0;
  g += (255 - g) * amount | 0;
  b += (255 - b) * amount | 0;
  return r << 16 | g << 8 | b;
}
function mix(from, to, t2) {
  const r = (from >> 16 & 255) + ((to >> 16 & 255) - (from >> 16 & 255)) * t2 | 0;
  const g = (from >> 8 & 255) + ((to >> 8 & 255) - (from >> 8 & 255)) * t2 | 0;
  const b = (from & 255) + ((to & 255) - (from & 255)) * t2 | 0;
  return r << 16 | g << 8 | b;
}
function flicker(p) {
  return p.flickerSpeed <= 0 ? 1 : 0.8 + 0.2 * Math.sin(p.time * p.flickerSpeed + p.flickerPhase);
}
function drawDust(canvas, p, alpha) {
  const a = alpha * flicker(p) | 0;
  const radius = Math.max(0.8, p.size * (0.5 + 0.4 * (1 - p.life)) * 0.5);
  argb(fillPaint, lighten(p.color, 0.3), Math.min(255, a * 0.32 | 0));
  canvas.call("drawCircle", p.x, p.y, radius * 2, fillPaint);
  argb(fillPaint, p.color, a * 0.88 | 0);
  canvas.call("drawCircle", p.x, p.y, radius, fillPaint);
  if (p.life > 0.5) {
    argb(fillPaint, lighten(p.color, 0.7), Math.min(255, a * (p.life - 0.5) * 2 * 0.85 | 0));
    canvas.call("drawCircle", p.x, p.y, radius * 0.45, fillPaint);
  }
}
function drawSpark(canvas, p, alpha) {
  const a = alpha * flicker(p) | 0;
  const size = Math.max(1, p.size * (0.45 + 0.55 * p.life));
  const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
  let dirX, dirY;
  if (speed > 0.05) {
    dirX = p.vx / speed;
    dirY = p.vy / speed;
  } else {
    const r = p.rotation * 0.017453;
    dirX = Math.cos(r);
    dirY = Math.sin(r);
  }
  const tail = Math.min(size * 7, size * 1.6 + speed * 3.2);
  argb(strokePaint, p.color, a * 0.45 | 0);
  strokePaint.call("setStrokeWidth", Math.max(1, size * 0.3));
  canvas.call("drawLine", p.x - dirX * tail, p.y - dirY * tail, p.x, p.y, strokePaint);
  argb(strokePaint, lighten(p.color, 0.35 + 0.25 * p.life), a * 0.85 | 0);
  strokePaint.call("setStrokeWidth", Math.max(1, size * 0.42));
  canvas.call("drawLine", p.x - dirX * tail * 0.45, p.y - dirY * tail * 0.45, p.x, p.y, strokePaint);
  argb(fillPaint, lighten(p.color, Math.min(0.9, 0.55 + 0.35 * p.life)), a);
  canvas.call("drawCircle", p.x, p.y, Math.max(1, size * 0.46), fillPaint);
}
function drawSnow(canvas, p, alpha) {
  const size = Math.max(2, p.size * (0.55 + 0.45 * p.life));
  const frosted = lighten(p.color, 0.6);
  argb(fillPaint, frosted, alpha * 0.16 | 0);
  canvas.call("drawCircle", p.x, p.y, size * 0.85, fillPaint);
  argb(strokePaint, frosted, Math.max(32, alpha));
  strokePaint.call("setStrokeWidth", Math.max(1, size * 0.13));
  canvas.call("save");
  canvas.call("rotate", p.rotation, p.x, p.y);
  const r = Math.max(2, size * 0.5);
  for (let i = 0; i < 3; i++) {
    canvas.call("rotate", 60, p.x, p.y);
    canvas.call("drawLine", p.x - r, p.y, p.x + r, p.y, strokePaint);
    const branch = r * 0.35;
    canvas.call("drawLine", p.x + r * 0.38, p.y, p.x + r * 0.38 - branch, p.y - branch, strokePaint);
    canvas.call("drawLine", p.x + r * 0.38, p.y, p.x + r * 0.38 - branch, p.y + branch, strokePaint);
  }
  canvas.call("restore");
  argb(fillPaint, lighten(p.color, 0.85), alpha * 0.9 | 0);
  canvas.call("drawCircle", p.x, p.y, Math.max(1, size * 0.1), fillPaint);
}
function drawSakuraPetal(canvas, p, alpha) {
  const size = Math.max(2, p.size * (0.55 + 0.45 * p.life));
  const w = Math.max(2, size * 0.62);
  const h = Math.max(3, size * p.stretch);
  const sakuraPath = new Path();
  sakuraPath.call("moveTo", 0, -h * 0.5);
  sakuraPath.call("cubicTo", w * 0.95, -h * 0.58, w * 1.03, h * 0.02, w * 0.22, h * 0.42);
  sakuraPath.call("cubicTo", w * 0.1, h * 0.49, w * 0.04, h * 0.52, 0, h * 0.56);
  sakuraPath.call("cubicTo", -w * 0.04, h * 0.52, -w * 0.1, h * 0.49, -w * 0.22, h * 0.42);
  sakuraPath.call("cubicTo", -w * 1.03, h * 0.02, -w * 0.95, -h * 0.58, 0, -h * 0.5);
  canvas.call("save");
  canvas.call("translate", p.x, p.y);
  canvas.call("rotate", p.rotation);
  canvas.call("save");
  canvas.call("scale", 1.3, 1.24);
  argb(fillPaint, lighten(p.color, 0.45), alpha * 0.22 | 0);
  canvas.call("drawPath", sakuraPath, fillPaint);
  canvas.call("restore");
  argb(fillPaint, p.color, Math.max(24, alpha));
  canvas.call("drawPath", sakuraPath, fillPaint);
  canvas.call("save");
  canvas.call("scale", 0.55, 0.55);
  canvas.call("translate", 0, -h * 0.1);
  argb(fillPaint, lighten(p.color, 0.35), alpha * 0.45 | 0);
  canvas.call("drawPath", sakuraPath, fillPaint);
  canvas.call("restore");
  argb(strokePaint, mix(p.color, 14706586, 0.55), Math.min(160, Math.max(28, alpha * 11 / 20 | 0)));
  strokePaint.call("setStrokeWidth", Math.max(1, size * 0.08));
  canvas.call("drawLine", 0, -h * 0.28, 0, h * 0.38, strokePaint);
  canvas.call("restore");
}
function drawTextParticle(canvas, p, alpha) {
  const size = Math.max(6, p.size);
  const shrink = p.style === STYLE_FALL ? 1 : 0.55 + 0.45 * p.life;
  argb(textPaint, p.color, alpha);
  textPaint.call("setTextSize", size);
  canvas.call("save");
  canvas.call("translate", p.x, p.y);
  canvas.call("rotate", p.rotation);
  canvas.call("scale", shrink, shrink);
  canvas.call("drawText(Ljava/lang/String;FFLandroid/graphics/Paint;)V", p.text, 0, size * 0.35, textPaint);
  canvas.call("restore");
}
function drawParticlesList(canvas, list, typeface) {
  textPaint.call("setTypeface", typeface);
  for (const p of list) {
    const alpha = Math.max(0, Math.min(255, particleFade(p) * 255 | 0));
    if (alpha <= 0) continue;
    switch (p.style) {
      case STYLE_SPARKS:
        drawSpark(canvas, p, alpha);
        break;
      case STYLE_SNOW:
        drawSnow(canvas, p, alpha);
        break;
      case STYLE_SAKURA:
        drawSakuraPetal(canvas, p, alpha);
        break;
      case STYLE_TEXT:
      case STYLE_FALL:
        drawTextParticle(canvas, p, alpha);
        break;
      default:
        drawDust(canvas, p, alpha);
        break;
    }
  }
}
var states = /* @__PURE__ */ new Map();
var forcedViews = /* @__PURE__ */ new Set();
var viewHandles = /* @__PURE__ */ new Map();
function viewId(view) {
  return JSystem.callStatic("identityHashCode", view);
}
function newState() {
  return {
    prevText: "",
    dirty: false,
    running: false,
    sendTime: 0,
    lastParticleTick: 0,
    watcher: null,
    tickRunnable: null,
    glyphPaint: null,
    glyphs: /* @__PURE__ */ new Map(),
    hiddenSpans: /* @__PURE__ */ new Map(),
    ghosts: [],
    particles: []
  };
}
function isActive(vid) {
  return cfgBool("enable") || forcedViews.has(vid);
}
var TextWatcher = inu.jvm.cls("android.text.TextWatcher");
var WatcherImpl = inu.jvm.defineClass({
  interfaces: [TextWatcher],
  fields: { viewHash: "int" },
  methods: {
    beforeTextChanged: {
      params: ["java.lang.CharSequence", "int", "int", "int"],
      returns: "void",
      body: () => {
      }
    },
    onTextChanged: {
      params: ["java.lang.CharSequence", "int", "int", "int"],
      returns: "void",
      body: (self) => {
        const hash = self.getField("viewHash");
        const st = states.get(hash);
        if (st) st.dirty = true;
      }
    },
    afterTextChanged: {
      params: ["android.text.Editable"],
      returns: "void",
      body: () => {
      }
    }
  }
});
function ensureState(view) {
  const vid = viewId(view);
  let st = states.get(vid);
  if (!st) {
    st = newState();
    st.prevText = toStr(view.call("getText"));
    try {
      const watcher = new WatcherImpl();
      watcher.setField("viewHash", vid);
      st.watcher = watcher;
      view.call("addTextChangedListener", watcher);
    } catch (err) {
      console.warn("TextAnim watcher failed", err);
    }
    states.set(vid, st);
    viewHandles.set(vid, view);
  }
  return st;
}
function releaseView(vid) {
  const st = states.get(vid);
  if (!st) return;
  const view = viewHandles.get(vid);
  if (view && st.watcher) {
    try {
      view.call("removeTextChangedListener", st.watcher);
    } catch (_) {
    }
    try {
      removeHiddenSpans(view, st);
    } catch (_) {
    }
  }
  st.glyphs.clear();
  st.ghosts.length = 0;
  st.particles.length = 0;
  states.delete(vid);
  viewHandles.delete(vid);
}
function easeOut(t2) {
  const inv = 1 - Math.max(0, Math.min(1, t2));
  return 1 - inv * inv * inv * inv * inv;
}
var blurCache = /* @__PURE__ */ new Map();
function getBlurFilter(radius) {
  const key = Math.max(1, Math.round(radius * 2));
  let filter = blurCache.get(key);
  if (!filter) {
    filter = new BlurMaskFilter(key / 2, BLUR_NORMAL);
    blurCache.set(key, filter);
  }
  return filter;
}
function getGlyphPaint(view, st) {
  if (!st.glyphPaint) st.glyphPaint = new Paint();
  st.glyphPaint.call("set", view.call("getPaint"));
  return st.glyphPaint;
}
function textTop(view) {
  const layout = view.call("getLayout");
  if (layout === null) return view.call("getExtendedPaddingTop");
  const box = view.call("getHeight") - view.call("getExtendedPaddingTop") - view.call("getExtendedPaddingBottom");
  const gravityV = view.call("getGravity") & GRAVITY_VERTICAL_MASK;
  let offset = 0;
  const layoutH = layout.call("getHeight");
  if (gravityV === GRAVITY_CENTER_V) offset = Math.max(0, (box - layoutH) / 2 | 0);
  else if (gravityV === GRAVITY_BOTTOM) offset = Math.max(0, box - layoutH);
  return view.call("getExtendedPaddingTop") + offset;
}
function deletionLayout(view, prev, start, count) {
  const layout = view.call("getLayout");
  const remaining = toLen(view.call("getText"));
  if (count > 1 || layout === null || start + count > remaining) {
    const padL = view.call("getCompoundPaddingLeft");
    const padR = view.call("getCompoundPaddingRight");
    const width = view.call("getWidth") - padL - padR;
    if (width > 0 && prev.length > 0) {
      const paint = view.call("getPaint");
      const mult = view.call("getLineSpacingMultiplier");
      const extra = view.call("getLineSpacingExtra");
      return new StaticLayout(prev, paint, width, ALIGN_NORMAL, mult, extra, false);
    }
  }
  return layout;
}
function updateHiddenSpans(view, st) {
  const text = view.call("getText");
  if (text === null) return;
  removeHiddenSpans(view, st);
  const len = toLen(text);
  if (typeof text.call !== "function") return;
  for (const [idx, glyph] of st.glyphs) {
    if (idx < 0 || idx >= len) continue;
    const span = new ForegroundColorSpan(TRANSPARENT);
    const end = Math.min(len, idx + glyph.length);
    try {
      text.call("setSpan", span, idx, end, SPAN_EXCLUSIVE);
      st.hiddenSpans.set(idx, span);
    } catch (_) {
    }
  }
}
function removeHiddenSpans(view, st) {
  if (st.hiddenSpans.size === 0) return;
  const text = view.call("getText");
  if (text !== null && typeof text.call === "function") {
    for (const span of st.hiddenSpans.values()) {
      try {
        text.call("removeSpan", span);
      } catch (_) {
      }
    }
  }
  st.hiddenSpans.clear();
}
function shiftGlyphs(st, curLen, prevLen, prefix, suffix, shift) {
  if (st.glyphs.size === 0) return;
  const result = /* @__PURE__ */ new Map();
  for (const [idx, glyph] of st.glyphs) {
    if (idx < prefix) result.set(idx, glyph);
    else if (idx >= prevLen - suffix) {
      const newIdx = idx + shift;
      if (newIdx >= 0 && newIdx < curLen) result.set(newIdx, glyph);
    }
  }
  st.glyphs.clear();
  for (const [k, v] of result) st.glyphs.set(k, v);
}
function addGlyphs(view, st, cur, start, end, now) {
  const block = end - start > 1;
  const wStep = cfgWaveStep();
  let order = 0;
  let i = start;
  while (i < end) {
    const cp = cur.codePointAt(i);
    const len = cp > 65535 ? 2 : 1;
    const text = cur.substring(i, i + len);
    const skip = text.trim().length === 0 || len > 1;
    if (!skip) {
      const delay = block && wStep > 0 ? Math.min(WAVE_CAP, order * wStep) : 0;
      st.glyphs.set(i, { start: now + delay, text, length: len });
      order++;
    }
    i += len;
  }
}
function addGhosts(view, st, layout, start, deleted, now) {
  const paint = view.call("getPaint");
  const layoutLen = toLen(layout.call("getText"));
  const top = textTop(view);
  let i = 0;
  while (i < deleted.length && st.ghosts.length < MAX_GHOSTS) {
    const cp = deleted.codePointAt(i);
    const len = cp > 65535 ? 2 : 1;
    const text = deleted.substring(i, i + len);
    if (text.trim().length > 0 && len === 1) {
      const offset = Math.max(0, Math.min(layoutLen, start + i));
      const width = paint.call("measureText(Ljava/lang/String;)F", text);
      let x = view.call("getPaddingLeft") + layout.call("getPrimaryHorizontal", offset);
      const safeOff = Math.min(offset, Math.max(0, layoutLen - 1));
      if (layout.call("isRtlCharAt", safeOff)) x -= width;
      const baseline = top + layout.call("getLineBaseline", layout.call("getLineForOffset", offset));
      st.ghosts.push({ text, x, baseline, width, start: now });
    }
    i += len;
  }
}
function applyTransform(canvas, cx, cy, progress) {
  const doScale = cfgBool("scale_enabled");
  const doRotate = cfgBool("rotate_enabled");
  if (!doScale && !doRotate) return;
  canvas.call("translate", cx, cy);
  if (doScale) {
    const s = 0.3 + 0.7 * progress;
    canvas.call("scale", s, s);
  }
  if (doRotate) canvas.call("rotate", -15 * (1 - progress));
  canvas.call("translate", -cx, -cy);
}
function drawGlyphs(view, canvas, st) {
  const base = view.call("getPaint");
  const layout = view.call("getLayout");
  if (layout === null) return;
  const content = view.call("getText");
  if (content === null) return;
  const len = toLen(content);
  const paint = getGlyphPaint(view, st);
  const alpha0 = base.call("getAlpha");
  const tSize = base.call("getTextSize");
  const now = SystemClock.callStatic("uptimeMillis");
  const dur = cfgDuration();
  const radius = cfgBlurRadius();
  const sharpDelay = radius > 0 ? 0.2 : 0;
  const top = textTop(view);
  const padL = view.call("getPaddingLeft");
  const slide = cfgSlideDist();
  for (const [idx, glyph] of st.glyphs) {
    const end = idx + glyph.length;
    if (idx < 0 || end > len) continue;
    const line = layout.call("getLineForOffset", idx);
    const rtl = layout.call("isRtlCharAt", idx);
    let x = padL + layout.call("getPrimaryHorizontal", idx);
    const width = base.call("measureText(Ljava/lang/String;)F", glyph.text);
    if (rtl) x -= width;
    const y = top + layout.call("getLineBaseline", line);
    const raw = Math.max(0, Math.min(1, (now - glyph.start) / dur));
    const progress = easeOut(raw);
    const drawY = y - slide * (1 - progress);
    canvas.call("save");
    applyTransform(canvas, x + width / 2, drawY - tSize / 3, progress);
    if (radius > 0 && progress < 1) {
      const a2 = (1 - progress) * alpha0 | 0;
      if (a2 > 4) {
        paint.call("setAlpha", a2);
        paint.call("setMaskFilter", getBlurFilter(radius * (1 - progress)));
        canvas.call("drawText(Ljava/lang/String;FFLandroid/graphics/Paint;)V", glyph.text, x, drawY, paint);
        paint.call("setMaskFilter", null);
      }
    }
    const visible = progress <= sharpDelay ? 0 : (progress - sharpDelay) / (1 - sharpDelay);
    const a = visible * alpha0 | 0;
    if (a > 0) {
      paint.call("setAlpha", a);
      canvas.call("drawText(Ljava/lang/String;FFLandroid/graphics/Paint;)V", glyph.text, x, drawY, paint);
    }
    canvas.call("restore");
  }
}
function drawGhosts(view, canvas, st) {
  const paint = getGlyphPaint(view, st);
  const now = SystemClock.callStatic("uptimeMillis");
  const alpha0 = view.call("getPaint").call("getAlpha");
  const tSize = view.call("getPaint").call("getTextSize");
  const dur = cfgDuration();
  const slide = cfgSlideDist();
  const radius = cfgBlurRadius();
  for (const ghost of st.ghosts) {
    const raw = Math.max(0, (now - ghost.start) / dur);
    if (raw >= 1) continue;
    const fade = 1 - raw;
    const progress = easeOut(fade);
    const drawY = ghost.baseline - slide * (1 - progress);
    canvas.call("save");
    applyTransform(canvas, ghost.x + ghost.width / 2, drawY - tSize / 3, progress);
    const r = radius * (1 - progress);
    let alphaFade = fade;
    if (r >= 0.5) {
      const a2 = Math.min(1, (1 - progress) * 2) * fade * alpha0 | 0;
      if (a2 > 4) {
        paint.call("setAlpha", a2);
        paint.call("setMaskFilter", getBlurFilter(r));
        canvas.call("drawText(Ljava/lang/String;FFLandroid/graphics/Paint;)V", ghost.text, ghost.x, drawY, paint);
        paint.call("setMaskFilter", null);
      }
      alphaFade *= progress;
    }
    const a = alphaFade * alpha0 | 0;
    if (a > 0) {
      paint.call("setAlpha", a);
      canvas.call("drawText(Ljava/lang/String;FFLandroid/graphics/Paint;)V", ghost.text, ghost.x, drawY, paint);
    }
    canvas.call("restore");
  }
}
function drawAllParticles(view, canvas, st) {
  const now = SystemClock.callStatic("uptimeMillis");
  const dt = st.lastParticleTick === 0 ? 16 : Math.min(50, now - st.lastParticleTick);
  st.lastParticleTick = now;
  const left = view.call("getScrollX");
  const right = left + view.call("getWidth");
  const bottom = view.call("getScrollY") + view.call("getHeight") - dp(1);
  stepParticles(st.particles, dt, left, right, bottom);
  drawParticlesList(canvas, st.particles, view.call("getPaint").call("getTypeface"));
}
function startLoop(view, vid, st) {
  if (st.running) return;
  st.running = true;
  const tick = () => {
    if (!states.has(vid)) {
      st.running = false;
      return;
    }
    try {
      if (view.call("getWindowToken") === null) {
        st.running = false;
        st.glyphs.clear();
        st.ghosts.length = 0;
        st.particles.length = 0;
        removeHiddenSpans(view, st);
        return;
      }
    } catch (_) {
    }
    const now = SystemClock.callStatic("uptimeMillis");
    const dur = cfgDuration();
    for (const [idx, glyph] of st.glyphs) {
      if (now - glyph.start >= dur) {
        st.glyphs.delete(idx);
        const span = st.hiddenSpans.get(idx);
        if (span) {
          const text = view.call("getText");
          if (text !== null && typeof text.call === "function") {
            try {
              text.call("removeSpan", span);
            } catch (_) {
            }
          }
          st.hiddenSpans.delete(idx);
        }
      }
    }
    st.ghosts = st.ghosts.filter((g) => now - g.start < dur);
    view.call("invalidate");
    if (st.glyphs.size > 0 || st.particles.length > 0 || st.ghosts.length > 0) {
      view.call("postDelayed", st.tickRunnable, 16);
    } else {
      st.running = false;
      st.lastParticleTick = 0;
      removeHiddenSpans(view, st);
    }
  };
  if (!st.tickRunnable) {
    st.tickRunnable = inu.jvm.runnable(tick);
  }
  view.call("postDelayed", st.tickRunnable, 16);
}
function handleBeforeDraw(view) {
  const vid = viewId(view);
  if (!isActive(vid)) return;
  const st = ensureState(view);
  const text = view.call("getText");
  if (text === null) return;
  const cur = toStr(text);
  const prev = st.prevText;
  if (!st.dirty && cur === prev) return;
  st.dirty = false;
  const transform = view.call("getTransformationMethod");
  if (transform !== null) {
    try {
      if (PasswordTransformationMethod.callStatic("getInstance").call("equals", transform)) {
        st.prevText = cur;
        return;
      }
    } catch (_) {
    }
  }
  const curLen = cur.length;
  const prevLen = prev.length;
  let prefix = 0;
  const limit = Math.min(curLen, prevLen);
  while (prefix < limit && cur[prefix] === prev[prefix]) prefix++;
  let suffix = 0;
  while (suffix < curLen - prefix && suffix < prevLen - prefix && cur[curLen - 1 - suffix] === prev[prevLen - 1 - suffix]) suffix++;
  const deletedCount = prevLen - suffix - prefix;
  const insertedEnd = curLen - suffix;
  const insertedCount = insertedEnd - prefix;
  if (deletedCount <= 0 && insertedCount <= 0) return;
  const now = SystemClock.callStatic("uptimeMillis");
  if (deletedCount > 0) {
    const deleted = prev.substring(prefix, prefix + deletedCount);
    if (deleted.trim().length > 0) {
      const sendClear = curLen === 0 && insertedCount === 0 && now - st.sendTime < SEND_WINDOW;
      if (sendClear) st.sendTime = 0;
      const layout = deletionLayout(view, prev, prefix, deleted.length);
      if (layout !== null) {
        const pCount = cfgParticleCount();
        if (pCount > 0) {
          const pStyle = cfgParticleStyle();
          const paint = view.call("getPaint");
          const top2 = textTop(view);
          const layoutLen2 = toLen(layout.call("getText"));
          let di = 0;
          while (di < deleted.length) {
            const dLen = deleted.codePointAt(di) > 65535 ? 2 : 1;
            const dText = deleted.substring(di, di + dLen);
            if (dText.trim().length > 0 && st.particles.length < PARTICLE_MAX) {
              const offset = Math.max(0, Math.min(layoutLen2, prefix + di));
              const dWidth = Math.max(1, paint.call("measureText(Ljava/lang/String;)F", dText));
              let dx = view.call("getPaddingLeft") + layout.call("getPrimaryHorizontal", offset);
              const safeOff = Math.min(offset, Math.max(0, layoutLen2 - 1));
              if (layout.call("isRtlCharAt", safeOff)) dx -= dWidth;
              const dBaseline = top2 + layout.call("getLineBaseline", layout.call("getLineForOffset", offset));
              spawnParticles(st.particles, pStyle, pCount, dText, paint, dx, dBaseline, dWidth);
            }
            di += dLen;
          }
        }
        const lettersFall = cfgParticleCount() > 0 && cfgParticleStyle() === STYLE_FALL;
        if (cfgBool("delete_ghost") && !sendClear && !lettersFall && insertedCount === 0) {
          addGhosts(view, st, layout, prefix, deleted, now);
        }
      }
    }
  }
  shiftGlyphs(st, curLen, prevLen, prefix, suffix, insertedCount - deletedCount);
  if (insertedCount > 0) addGlyphs(view, st, cur, prefix, insertedEnd, now);
  st.prevText = cur;
  if (st.glyphs.size > 0 || st.particles.length > 0 || st.ghosts.length > 0) {
    updateHiddenSpans(view, st);
    startLoop(view, viewId(view), st);
  } else {
    removeHiddenSpans(view, st);
  }
}
function handleAfterDraw(view, canvas) {
  const vid = viewId(view);
  if (!isActive(vid)) return;
  const st = states.get(vid);
  if (!st) return;
  try {
    if (st.ghosts.length > 0) drawGhosts(view, canvas, st);
    if (st.glyphs.size > 0) drawGlyphs(view, canvas, st);
    if (st.particles.length > 0) drawAllParticles(view, canvas, st);
  } catch (error) {
    console.warn("TextAnim draw error", error);
  }
}
var hooked = true;
var unhook = null;
try {
  const onDraw = EditTextBoldCursor.getDeclaredMethod("onDraw(Landroid/graphics/Canvas;)V");
  unhook = inu.xposed.hookMethod(onDraw, {
    before(ctx) {
      try {
        handleBeforeDraw(ctx.thisObject);
      } catch (err) {
        console.error("text-animation: before error", err);
      }
    },
    after(ctx) {
      try {
        handleAfterDraw(ctx.thisObject, ctx.args[0]);
      } catch (err) {
        console.error("text-animation: after error", err);
      }
    }
  });
} catch (error) {
  hooked = false;
  console.warn("text-animation: hooking failed", error);
}
inu.onUnload(() => {
  if (unhook) {
    try {
      unhook();
    } catch (_) {
    }
    unhook = null;
  }
  for (const vid of [...states.keys()]) {
    releaseView(vid);
  }
  forcedViews.clear();
  blurCache.clear();
});
var page = inu.ui.settingsPage({
  title: "Text animation",
  items: () => {
    const enabled = cfgBool("enable");
    const items = [
      inu.ui.header(t("general")),
      inu.ui.check({
        id: "enable",
        text: t("enable"),
        checked: enabled,
        onChange: (checked) => {
          cfgSet("enable", String(checked));
        }
      })
    ];
    if (enabled) {
      items.push(
        inu.ui.slider({
          id: "duration",
          text: t("duration"),
          min: 80,
          max: 900,
          step: 10,
          value: cfgInt("duration"),
          label: (v) => `${v} ms`,
          onChange: (v) => cfgSet("duration", String(v))
        }),
        inu.ui.slider({
          id: "wave",
          text: t("wave_delay"),
          min: 0,
          max: 120,
          step: 5,
          value: cfgInt("wave_step"),
          label: (v) => `${v} ms`,
          onChange: (v) => cfgSet("wave_step", String(v))
        }),
        inu.ui.separator(),
        inu.ui.header(t("effects")),
        inu.ui.check({
          id: "blur",
          text: t("blur"),
          checked: cfgBool("blur_enabled"),
          onChange: (c) => cfgSet("blur_enabled", String(c))
        }),
        inu.ui.check({
          id: "slide",
          text: t("slide"),
          checked: cfgBool("slide_enabled"),
          onChange: (c) => cfgSet("slide_enabled", String(c))
        }),
        inu.ui.check({
          id: "scale",
          text: t("scale"),
          checked: cfgBool("scale_enabled"),
          onChange: (c) => cfgSet("scale_enabled", String(c))
        }),
        inu.ui.check({
          id: "rotate",
          text: t("rotate"),
          checked: cfgBool("rotate_enabled"),
          onChange: (c) => cfgSet("rotate_enabled", String(c))
        }),
        inu.ui.separator(),
        inu.ui.header(t("deletion")),
        inu.ui.check({
          id: "ghost",
          text: t("ghost"),
          checked: cfgBool("delete_ghost"),
          onChange: (c) => cfgSet("delete_ghost", String(c))
        }),
        inu.ui.select({
          id: "particle-style",
          text: t("particle_style"),
          items: particleStyleNames(),
          selected: cfgParticleStyle(),
          onChange: (idx) => cfgSet("particle_style", String(idx))
        }),
        inu.ui.slider({
          id: "particle-count",
          text: t("particles_per_char"),
          min: 0,
          max: 12,
          step: 1,
          value: cfgInt("particle_count"),
          label: (v) => `${v}`,
          onChange: (v) => cfgSet("particle_count", String(v))
        })
      );
    }
    items.push(inu.ui.separator(hooked ? t("note_info") : t("note_unsupported")));
    return items;
  }
});
inu.registerSettings(page);
embed({
  id: "entinygram.text-animation",
  name: "Text animation",
  placements: {
    screen: ["category-chats"],
    inline: [{ slot: "category-chats.end", rows: ["enable"] }]
  },
  rows: () => [{
    id: "enable",
    type: "check",
    text: t("title"),
    subtitle: cfgBool("enable") ? t("enabled") : void 0,
    checked: cfgBool("enable")
  }],
  onEvent: (_row, value) => {
    cfgSet("enable", value);
    embedChanged();
  },
  open: () => {
    inu.ui.openPage(page);
  }
});
