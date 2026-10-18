import { defineConfig } from '@inugram/cli'
import { withEntiny } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    'call-avatar': {
      entry: 'src/index.ts',
      manifest: withEntiny({
        id: 'entinygram.call-avatar',
        name: 'Call avatar',
        author: 'entinyGram',
        version: '1.1',
        description: 'Full-screen caller photo instead of the circular avatar in voice calls',
        icon: 'inu://photo',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      }, {}),
    },
  },
})