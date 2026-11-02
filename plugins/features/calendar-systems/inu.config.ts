import { defineConfig } from '@inugram/cli'
import { withEntiny, withTags } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    calendars: {
      entry: 'src/index.ts',
      manifest: withTags(withEntiny({
        id: 'entinygram.calendar-systems',
        name: 'Calendar systems',
        author: 'entinyGram',
        version: '1.1.1',
        description: 'Show dates in the Hijri, Persian, Indian and other calendars',
        icon: 'inu://calendar',
        // rewrites how the app formats dates, which is what these two grants are for
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      }, {}), 'ui'),
    },
  },
})
