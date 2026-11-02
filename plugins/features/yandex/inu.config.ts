import { defineConfig } from '@inugram/cli'
import { withEntiny, withTags } from '@entiny/sdk'

// one plugin for everything Yandex: a translation provider, and Yandex static maps for location previews
export default defineConfig({
  plugins: {
    yandex: {
      entry: 'src/index.ts',
      manifest: withTags(withEntiny({
        id: 'entinygram.yandex',
        name: 'Yandex',
        author: 'entinyGram',
        version: '1.0.1',
        description: 'Yandex Cloud Translate and Yandex static maps',
        grants: ['fetch(translate.api.cloud.yandex.net)', 'unsafe.jvm', 'unsafe.xposed'],
      }, {}), 'ai', 'integrations'),
    },
  },
})
