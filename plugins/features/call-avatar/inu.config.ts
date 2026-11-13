import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'call-avatar': {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.call-avatar',
        name: 'Call avatar',
        author: 'entinyGram',
        version: '1.2.0',
        description: 'Full-screen caller photo instead of the circular avatar in voice calls',
        icon: 'inu://photo',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
        extra: { 'entiny-tags': 'calls ui' },
      },
    },
  },
})