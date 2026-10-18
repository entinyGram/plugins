import { defineConfig } from '@inugram/cli'
import { withEntiny } from '@entiny/sdk'

// 2GIS for the app's map and for location previews, chosen next to the stock map providers
export default defineConfig({
  plugins: {
    '2gis': {
      entry: 'src/index.ts',
      manifest: withEntiny({
        id: 'entinygram.2gis',
        name: '2GIS',
        author: 'entinyGram',
        version: '1.0.0',
        description: '2GIS map and location previews',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      }, {}),
    },
  },
})
