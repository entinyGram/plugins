import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    calendars: {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.calendar-systems',
        name: 'Calendar systems',
        author: 'entinyGram',
        version: '1.2.0',
        description: 'Show dates in the Hijri, Persian, Indian and other calendars',
        icon: 'inu://calendar',
        // rewrites how the app formats dates, which is what these two grants are for
        grants: ['unsafe.jvm', 'unsafe.xposed'],
        extra: { 'entiny-tags': 'ui' },
      },
    },
  },
})
