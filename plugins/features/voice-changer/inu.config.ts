import { defineConfig } from '@inugram/cli'
import { withEntiny } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    'voice-changer': {
      entry: 'src/index.ts',
      manifest: withEntiny(
        {
          id: 'entinygram.voice-changer',
          name: 'Voice Changer',
          author: 'entinyGram',
          version: '0.1.0',
          description: {
            en: 'Changes your voice in voice messages, video messages and calls',
            uk: 'Змінює ваш голос у голосових, відеоповідомленнях і дзвінках',
            ru: 'Меняет ваш голос в голосовых, видеосообщениях и звонках',
          },
          icon: 'inu://mute',
          grants: ['unsafe.jvm', 'unsafe.xposed'],
        },
        { inline: [{ slot: 'behavior.calls-section.end', rows: ['preset', 'scope'] }] },
      ),
    },
  },
})
