import { defineConfig } from '@inugram/cli'
import { withEntiny } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    'no-vibration': {
      entry: 'src/index.ts',
      manifest: withEntiny(
        {
          id: 'entinygram.no-vibration',
          name: 'No Vibration',
          author: 'entinyGram',
          version: '1.0.0',
          description: {
            en: 'Turns off haptics, vibration and notification vibration, each on its own switch',
            uk: 'Вимикає тактильний відгук, вібрацію та вібрацію сповіщень, кожне окремим перемикачем',
            ru: 'Отключает тактильный отклик, вибрацию и вибрацию уведомлений, каждое отдельным переключателем',
          },
          icon: 'inu://settings',
          grants: ['unsafe.jvm', 'unsafe.xposed'],
        },
        { inline: [{ slot: 'behavior.device-section.end', rows: ['haptics', 'vibrator', 'notifications'] }] },
      ),
    },
  },
})
