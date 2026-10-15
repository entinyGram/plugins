import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const source = readFileSync(new URL('../src/i18n.ts', import.meta.url), 'utf8').replace(/^export /gm, '')
const code = new Bun.Transpiler({ loader: 'ts' }).transformSync(source) + '\n;({ appLang, t })'

for (const [app, system, expected] of [
  ['uk', 'en', 'uk'], ['UK_ua', 'en', 'uk'], ['ru-RU', 'en', 'ru'], ['fa-IR', 'en', 'fa'],
  ['en', 'ru', 'en'], ['de', 'uk', 'en'], [null, 'uk', 'uk'],
  [null, 'ru', 'ru'], [null, 'fa', 'fa'], [null, 'de', 'en'], [null, null, 'en'],
] as const) {
  test(`language selection: app=${app}, system=${system}`, () => {
    const api = runInNewContext(code, {
      inu: { jvm: { cls(name: string) {
        const value = name.endsWith('LocaleController') ? app : system
        if (value === null) throw new Error('unavailable')
        return { callStatic: () => ({ call: () => name.endsWith('LocaleController')
          ? { getField: () => value } : value }) }
      } } },
    })
    expect(api.appLang()).toBe(expected)
    expect(api.t('unsupported')).toBe({
      uk: 'Ця версія клієнта не підтримує потрібні хуки дзвінків.',
      ru: 'Эта версия клиента не поддерживает необходимые хуки звонков.',
      en: 'This client version does not support the required call hooks.',
      fa: 'این نسخه از کلاینت از قلاب‌های تماس لازم پشتیبانی نمی‌کند.',
    }[expected])
    for (const key of ['title', 'enabled', 'mode', 'always', 'before', 'after', 'supported']) {
      expect(api.t(key)).toBeTruthy()
    }
  })
}