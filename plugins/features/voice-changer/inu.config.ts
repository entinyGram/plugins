import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'voice-changer': {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.voice-changer',
        name: 'Voice Changer',
        author: 'entinyGram',
        version: '1.2.0',
        description: {
          en: 'Changes your voice in voice messages, video messages and calls',
          uk: 'Змінює ваш голос у голосових, відеоповідомленнях і дзвінках',
          ru: 'Меняет ваш голос в голосовых, видеосообщениях и звонках',
        },
        icon: 'inu://mute',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
        extra: { 'entiny-tags': 'media calls' },
      },
    },
  },
})
