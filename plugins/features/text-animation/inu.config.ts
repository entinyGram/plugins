import { defineConfig } from '@inugram/cli'
import { withEntiny } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    'text-animation': {
      entry: 'src/index.ts',
      manifest: withEntiny(
        {
          id: 'entinygram.text-animation',
          name: 'Text animation',
          author: 'entinyGram',
          version: '1.0.0',
          description: 'Animated typing and deleting in the message input',
          icon: 'inu://edit',
          grants: ['unsafe.jvm', 'unsafe.xposed'],
        },
        {
          screen: ['category-chats'],
          inline: [{ slot: 'category-chats.end', rows: ['enable'] }],
        },
      ),
    },
  },
})
