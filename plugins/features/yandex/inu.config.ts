import { defineConfig } from '@inugram/cli'

// one plugin for everything Yandex: a translation provider, and Yandex static maps for location previews
export default defineConfig({
  plugins: {
    yandex: {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.yandex',
        name: 'Yandex',
        author: 'entinyGram',
        version: '1.2.0',
        description: 'Yandex Cloud Translate and Yandex static maps',
        grants: ['fetch(translate.api.cloud.yandex.net)', 'unsafe.jvm', 'unsafe.xposed'],
        extra: { 'entiny-tags': 'ai integrations' },
      },
    },
  },
})
