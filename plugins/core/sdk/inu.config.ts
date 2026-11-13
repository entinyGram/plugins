import { defineConfig } from '@inugram/cli'
import { SDK_ID, SDK_VERSION, withTags } from '@entiny/sdk'

// deprecated: kept for reference, no plugin requires it anymore
export default defineConfig({
  plugins: {
    sdk: {
      entry: 'src/index.ts',
      manifest: withTags({
        id: SDK_ID,
        name: 'entinyGram SDK',
        author: 'entinyGram',
        version: SDK_VERSION,
        description: 'Deprecated: no plugin needs it anymore, uninstall',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      }, 'dev'),
    },
  },
})
