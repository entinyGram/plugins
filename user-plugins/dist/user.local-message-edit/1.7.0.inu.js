// ==InuPlugin==
// @name         Local Message Edit
// @id           user.local-message-edit
// @author       Pixuz
// @version      1.7.0
// @description  Local edit/reset of message text. Works in private chats, groups, channels, and bots.
// @icon         inu://settings
// @grant        unsafe.jvm
// @grant        unsafe.xposed
// @plugin-api   1
// @platform     android
// ==/InuPlugin==

const STORAGE_KEY = 'local-message-edits';

function loadMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) || {}) : {};
  } catch (_) {
    return {};
  }
}

function saveMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// ID Normalizatsiya: Guruh, Superguruh, Kanal va Botlar uchun
// Telegram'da kanallar/superguruhlar dialogId si -100XXXXXXXXXX ko'rinishida,
// oddiy guruhlar esa -XXXXXXXXX ko'rinishida bo'ladi. SDK esa ba'zan musbat
// channel_id yoki chat_id qaytarishi mumkin. Barcha variantlarni tekshiramiz.
// ---------------------------------------------------------------------------
function normalizeDialogCandidates(rawDialogId) {
  if (rawDialogId == null) return ['any'];
  const s = String(rawDialogId).trim();
  if (!s || s === '[object Object]' || s === 'undefined' || s === 'null') {
    return ['any'];
  }

  const candidates = new Set([s]);

  // Faqat raqamlardan iborat bo'lsa (manfiy yoki musbat)
  if (/^-?\d+$/.test(s)) {
    const abs = s.replace(/^-/, '');
    candidates.add(abs);
    candidates.add('-' + abs);

    // Agar -100 bilan boshlansa (masalan -100123456789 -> 123456789 va -123456789)
    if (abs.startsWith('100') && abs.length > 5) {
      const stripped = abs.slice(3);
      candidates.add(stripped);
      candidates.add('-' + stripped);
    } else {
      // Aks holda -100 qo'shib ko'ramiz (123456789 -> -100123456789)
      candidates.add('-100' + abs);
      candidates.add('100' + abs);
    }
  }

  return Array.from(candidates);
}

function makeKey(dialogId, msgId) {
  return String(dialogId) + '_' + String(msgId);
}

function getOverride(dialogId, msgId) {
  if (msgId == null) return null;
  const map = loadMap();
  const candidates = normalizeDialogCandidates(dialogId);

  for (const dId of candidates) {
    const entry = map[makeKey(dId, msgId)];
    if (entry) return entry;
  }

  // Fallback: agar dialogId SDK va Java o'rtasida butunlay farq qilsa,
  // lekin msgId mos kelsa (yoki 'any_<msgId>' sifatida saqlangan bo'lsa)
  if (map[makeKey('any', msgId)]) {
    return map[makeKey('any', msgId)];
  }
  return null;
}

function setOverride(dialogId, msgId, originalText, newText) {
  if (msgId == null) return;
  const map = loadMap();
  const entry = { original: originalText, text: newText, ts: Date.now() };

  const candidates = normalizeDialogCandidates(dialogId);
  for (const dId of candidates) {
    map[makeKey(dId, msgId)] = entry;
  }
  saveMap(map);
}

function removeOverride(dialogId, msgId) {
  if (msgId == null) return;
  const map = loadMap();
  const candidates = normalizeDialogCandidates(dialogId);

  for (const dId of candidates) {
    delete map[makeKey(dId, msgId)];
  }
  delete map[makeKey('any', msgId)];
  saveMap(map);
}

// ---------------------------------------------------------------------------
// SDK Context va Message obyektidan ma'lumotlarni xavfsiz ajratib olish
// ---------------------------------------------------------------------------
function extractFromSdkContext(ctx) {
  if (!ctx) return { m: null, id: null, dialogId: null, text: '' };

  const messages = Array.isArray(ctx.messages) ? ctx.messages : [];
  const m = messages[0] ?? ctx.message ?? ctx.msg ?? null;

  let id =
    m?.id ??
    m?.messageId ??
    m?.msgId ??
    m?.message_id ??
    ctx.messageId ??
    ctx.id ??
    null;

  let dialogId =
    m?.dialogId ??
    m?.dialog_id ??
    m?.chatId ??
    m?.chat_id ??
    m?.channelId ??
    m?.channel_id ??
    ctx.dialogId ??
    ctx.dialog_id ??
    ctx.chatId ??
    ctx.peerId ??
    null;

  // Agar peerId obyekt bo'lsa (masalan { channelId: ..., chatId: ..., userId: ... })
  const peer = m?.peerId ?? m?.peer_id ?? m?.peer ?? ctx.peer;
  if (dialogId == null && peer != null) {
    if (typeof peer === 'number' || typeof peer === 'string') {
      dialogId = peer;
    } else if (typeof peer === 'object') {
      if (peer.channel_id || peer.channelId) {
        dialogId = '-100' + String(peer.channel_id ?? peer.channelId);
      } else if (peer.chat_id || peer.chatId) {
        dialogId = '-' + String(peer.chat_id ?? peer.chatId);
      } else if (peer.user_id || peer.userId) {
        dialogId = String(peer.user_id ?? peer.userId);
      }
    }
  }

  // Agar m ichida Java MessageObject (raw / javaObject) bo'lsa
  const rawJava = m?.raw ?? m?.javaObject ?? m?.messageObject ?? ctx.messageObject ?? null;
  if ((id == null || dialogId == null) && rawJava) {
    const extracted = extractIdsFromJava(rawJava);
    if (id == null) id = extracted.id;
    if (dialogId == null) dialogId = extracted.dialogId;
  }

  let text = '';
  if (m != null) {
    if (typeof m.text === 'string' && m.text.length > 0) text = m.text;
    else if (typeof m.message === 'string' && m.message.length > 0) text = m.message;
    else if (typeof m.caption === 'string' && m.caption.length > 0) text = m.caption;
    else if (typeof m.text === 'string') text = m.text;
    else if (typeof m.message === 'string') text = m.message;
    else if (typeof m.caption === 'string') text = m.caption;
  }

  return { m, id, dialogId: dialogId ?? 'any', text, rawJava };
}

// ---------------------------------------------------------------------------
// JAVA MessageObject va TLRPC.Message dan ID larni olish (Guruh/Kanal/Bot)
// ---------------------------------------------------------------------------
function extractIdsFromJava(javaMsg) {
  let id = null;
  let dialogId = null;
  if (!javaMsg) return { id, dialogId };

  let owner = null;
  try { owner = javaMsg.getField('messageOwner'); } catch (_) {}

  // 1. Message ID
  try { id = javaMsg.call('getId'); } catch (_) {}
  if (id == null) {
    try { id = javaMsg.getField('id'); } catch (_) {}
  }
  if (id == null && owner) {
    try { id = owner.getField('id'); } catch (_) {}
  }

  // 2. Dialog ID (MessageObject.getDialogId() guruh/kanal/bot uchun eng ishonchlisi)
  try { dialogId = javaMsg.call('getDialogId'); } catch (_) {}

  if (dialogId == null || dialogId === 0 || dialogId === '0') {
    if (owner) {
      try {
        const dId = owner.getField('dialog_id');
        if (dId != null && dId !== 0 && dId !== '0') dialogId = dId;
      } catch (_) {}
    }
  }

  // 3. TLRPC.Peer (owner.peer_id) ichidan olish (kanallar va guruhlar uchun)
  if (dialogId == null || dialogId === 0 || dialogId === '0') {
    try {
      const peer = owner ? owner.getField('peer_id') : javaMsg.getField('peer_id');
      if (peer) {
        let channelId = null;
        let chatId = null;
        let userId = null;
        try { channelId = peer.getField('channel_id'); } catch (_) {}
        try { chatId = peer.getField('chat_id'); } catch (_) {}
        try { userId = peer.getField('user_id'); } catch (_) {}

        if (channelId && Number(channelId) !== 0) {
          dialogId = '-100' + String(channelId);
        } else if (chatId && Number(chatId) !== 0) {
          dialogId = '-' + String(chatId);
        } else if (userId && Number(userId) !== 0) {
          dialogId = String(userId);
        }
      }
    } catch (_) {}
  }

  return { id, dialogId };
}

// ---------------------------------------------------------------------------
// Java MessageObject ga o'zgarishni qo'llash (matn, caption, layout)
// ---------------------------------------------------------------------------
function applyToJavaMessageObject(javaMsg, recreateLayout = false) {
  if (!javaMsg) return false;
  try {
    const { id, dialogId } = extractIdsFromJava(javaMsg);
    if (id == null) return false;

    const ov = getOverride(dialogId, id);
    if (!ov) return false;

    const newText = ov.text;
    let changed = false;

    // 1. TLRPC.Message (messageOwner) ichidagi xom matnni yangilash
    try {
      const owner = javaMsg.getField('messageOwner');
      if (owner) {
        const oldRaw = owner.getField('message');
        if (oldRaw == null || String(oldRaw) !== newText) {
          owner.setField('message', newText);
          changed = true;
        }
        // Entities (bold, link va h.k.) yangi matn uzunligiga mos kelmay qolib
        // crash bermasligi uchun tozalaymiz:
        try {
          const entities = owner.getField('entities');
          if (entities) {
            entities.call('clear');
          }
        } catch (_) {}
      }
    } catch (_) {}

    // 2. MessageObject.messageText ni yangilash
    try {
      const current = javaMsg.getField('messageText');
      const currentStr = current != null ? String(current) : '';
      if (currentStr !== newText) {
        javaMsg.setField('messageText', newText);
        changed = true;
      }
    } catch (_) {}

    // 3. Kanal postlari va media xabarlar uchun caption ni ham yangilash
    try {
      const currentCaption = javaMsg.getField('caption');
      if (currentCaption != null) {
        const capStr = String(currentCaption);
        if (capStr !== newText) {
          javaMsg.setField('caption', newText);
          changed = true;
        }
      }
    } catch (_) {}

    // 4. Agar matn o'zgargan bo'lsa yoki majburiy qayta chizish so'ralsa,
    // MessageObject ning textLayoutBlocks keshini yangilaymiz
    if (changed || recreateLayout) {
      try {
        javaMsg.call('generateCaption');
      } catch (_) {}
      try {
        javaMsg.call('generateLayout', null);
      } catch (_) {}
    }

    return true;
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Xposed Hooklar
// ---------------------------------------------------------------------------
function installApplyHooks() {
  // 1. ChatMessageCell: xabar ekranga chizilishidan oldin
  try {
    const Cell = inu.jvm.cls('org.telegram.ui.Cells.ChatMessageCell');
    inu.xposed.hookAllOverloads(Cell, 'setMessageObject', {
      before(ctx) {
        try {
          applyToJavaMessageObject(ctx.args[0], true);
        } catch (_) {}
      },
    });
    console.log('[LocalEdit] ChatMessageCell hooked');
  } catch (e) {
    console.warn('[LocalEdit] ChatMessageCell hook error:', e);
  }

  // 2. MessageObject: layout generatsiya qilinishidan oldin va konstruktorda
  try {
    const MessageObject = inu.jvm.cls('org.telegram.messenger.MessageObject');
    try {
      inu.xposed.hookAllOverloads(MessageObject, 'generateLayout', {
        before(ctx) {
          try {
            applyToJavaMessageObject(ctx.thisObject, false);
          } catch (_) {}
        },
      });
    } catch (_) {}

    try {
      inu.xposed.hookAllOverloads(MessageObject, 'checkLayout', {
        before(ctx) {
          try {
            applyToJavaMessageObject(ctx.thisObject, false);
          } catch (_) {}
        },
      });
    } catch (_) {}

    try {
      inu.xposed.hookAllOverloads(MessageObject, 'generateCaption', {
        before(ctx) {
          try {
            applyToJavaMessageObject(ctx.thisObject, false);
          } catch (_) {}
        },
      });
    } catch (_) {}

    console.log('[LocalEdit] MessageObject hooked');
  } catch (e) {
    console.warn('[LocalEdit] MessageObject hook error:', e);
  }
}

// ---------------------------------------------------------------------------
// Message Actions (Shaxsiy chat, Guruh, Kanal va Botlar uchun)
// ---------------------------------------------------------------------------
inu.registerMessageAction({
  id: 'local-edit-text',
  text: 'Edit text',
  icon: inu.icons.common('edit'),
  placements: ['bubble', 'selection'],
  visible: () => true,
  callback: async (ctx) => {
    const { id, dialogId, text, rawJava } = extractFromSdkContext(ctx);
    if (id == null) {
      inu.ui.toast('Cannot identify message ID');
      return;
    }

    const existing = getOverride(dialogId, id);
    const currentText = existing ? existing.text : text;
    const originalText = existing ? existing.original : text;

    const newText = await inu.ui.prompt({
      title: 'Edit text (local)',
      message: 'Only visible on this device.',
      value: currentText,
      hint: 'New text…',
    });

    if (newText == null) return;

    setOverride(dialogId, id, originalText, newText);

    // Agar Java obyekti mavjud bo'lsa, darhol qo'llashga harakat qilamiz
    if (rawJava) {
      applyToJavaMessageObject(rawJava, true);
    }

    inu.ui.toast('Saved — scroll or re-enter chat to refresh');
  },
});

inu.registerMessageAction({
  id: 'local-reset-text',
  text: 'Reset text',
  icon: inu.icons.common('refresh'),
  placements: ['bubble', 'selection'],
  visible: (ctx) => {
    const { id, dialogId } = extractFromSdkContext(ctx);
    if (id == null) return false;
    return !!getOverride(dialogId, id);
  },
  callback: async (ctx) => {
    const { id, dialogId, rawJava } = extractFromSdkContext(ctx);
    if (id == null) return;

    const existing = getOverride(dialogId, id);
    removeOverride(dialogId, id);

    // Agar Java obyekti bo'lsa, asl matnni joyiga qaytaramiz
    if (rawJava && existing && existing.original != null) {
      try {
        const owner = rawJava.getField('messageOwner');
        if (owner) owner.setField('message', existing.original);
        rawJava.setField('messageText', existing.original);
        rawJava.call('generateLayout', null);
      } catch (_) {}
    }

    inu.ui.toast('Restored — scroll or re-enter chat to refresh');
  },
});

// ---------------------------------------------------------------------------
// Settings sahifasi
// ---------------------------------------------------------------------------
const page = inu.ui.settingsPage({
  title: 'Local Message Edit',
  items: () => {
    const map = loadMap();
    // Unikal tahrirlangan xabarlar sonini hisoblash (ts bo'yicha)
    const uniqueTimestamps = new Set(Object.values(map).map((v) => v?.ts).filter(Boolean));
    const count = uniqueTimestamps.size;

    return [
      inu.ui.header('How to use'),
      inu.ui.separator('Tap or long-press any message → Edit text. Works in private chats, groups, supergroups, channels, and bots.'),
      inu.ui.separator(`Locally edited messages: ${count}`),
      inu.ui.button({
        id: 'clear',
        text: 'Clear all local edits',
        onClick: async () => {
          const a = await inu.ui.dialog({
            title: 'Clear all?',
            message: 'All locally edited messages will be restored to their original text.',
            positive: 'Clear',
            negative: 'Cancel',
          });
          if (a === 'positive') {
            saveMap({});
            page.invalidate();
            inu.ui.toast('Cleared');
          }
        },
      }),
    ];
  },
});

inu.registerSettings(page);
installApplyHooks();
console.log('[LocalEdit] v1.7.0 loaded');
