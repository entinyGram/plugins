import { defineConfig } from '@inugram/cli'
import { withEntiny, withTags } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    'text-animation': {
      entry: 'src/index.ts',
      manifest: withTags(withEntiny(
        {
          id: 'entinygram.text-animation',
          name: 'Text animation',
          author: 'entinyGram',
          version: '1.0.1',
          description: 'Animated typing and deleting in the message input',
          icon: 'inu://edit',
          grants: ['unsafe.jvm', 'unsafe.xposed'],
        },
        {
          screen: ['category-chats'],
          inline: [{ slot: 'chats-messages.end', rows: ['enable'] }],
        },
      ), 'ui', 'chat'),
    },
  },
})
