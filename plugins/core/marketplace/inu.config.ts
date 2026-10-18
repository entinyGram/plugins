import { defineConfig } from '@inugram/cli'
import { SDK_ID, SDK_VERSION } from '@entiny/sdk'

// What other plugins require. The app reads the SDK's directives from the plugins that depend on this one,
// so without it they neither install nor run.
export default defineConfig({
  // the marketplace's tab icons are plain .svg files next to the code, inlined as text
  esbuild: options => ({ ...options, loader: { ...options.loader, '.svg': 'text' } }),
  plugins: {
    sdk: {
      entry: 'src/index.ts',
      manifest: {
        id: SDK_ID,
        name: 'entinyGram SDK',
        author: 'entinyGram',
        version: SDK_VERSION,
        description: 'Needed by plugins that use the entinyGram SDK',
        grants: ['fetch(raw.githubusercontent.com)', 'account.read(peers, messages, history)', 'openUrl', 'clipboard.write', 'unsafe.fs', 'unsafe.jvm', 'unsafe.xposed'],
      },
    },
  },
})
