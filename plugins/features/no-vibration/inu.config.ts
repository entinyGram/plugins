import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'no-vibration': {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.no-vibration',
        name: 'No Vibration',
        author: 'entinyGram',
        version: '1.2.0',
        description: {
          en: 'Deprecated. Turns off haptics, vibration and notification vibration, each on its own switch',
          uk: 'Застарілий. Вимикає тактильний відгук, вібрацію та вібрацію сповіщень, кожне окремим перемикачем',
          ru: 'Устарел. Отключает тактильный отклик, вибрацию и вибрацию уведомлений, каждое отдельным переключателем',
        },
        icon: 'inu://settings',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
        extra: { 'entiny-tags': 'tools' },
      },
    },
  },
})
