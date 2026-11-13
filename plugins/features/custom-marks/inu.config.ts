import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'custom-marks': {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.custom-marks',
        name: 'Custom marks',
        author: 'entinyGram',
        version: '1.0.0',
        description: {
          en: 'Your own text for the "edited" and "deleted" marks on messages',
          uk: 'Власний текст для міток «змінено» і «видалено» на повідомленнях',
          ru: 'Свой текст для меток «изменено» и «удалено» на сообщениях',
        },
        icon: 'inu://edit',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
        extra: { 'entiny-tags': 'ui chat' },
      },
    },
  },
})
