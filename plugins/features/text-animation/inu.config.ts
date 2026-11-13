import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'text-animation': {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.text-animation',
        name: 'Text animation',
        author: 'entinyGram',
        version: '1.2.0',
        description: 'Deprecated. Animated typing and deleting in the message input',
        icon: 'inu://edit',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
        extra: { 'entiny-tags': 'ui chat' },
      },
    },
  },
})
