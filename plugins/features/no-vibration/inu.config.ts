import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'no-vibration': {
      entry: 'src/index.ts',
      manifest: {
        id: 'no-vibration',
        name: 'No Vibration',
        author: '@akresik',
        version: '1.0.0',
        description: {
          en: 'Disables all vibration (probably)',
          ru: 'Отключает всю вибрацию (наверное)',
        },
        icon: 'tg://emoji?id=5445360890230625242',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      },
    },
  },
})
