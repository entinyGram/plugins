import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'doc-viewer': {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.doc-viewer',
        name: 'Doc Viewer',
        author: 'Daxo-Developer && @Daxo_OS (original), entinyGram (Inugram port)',
        version: '1.2.0',
        description: 'In-app viewer for PDF, DOCX, XLSX, text, code, images, archives and more',
        icon: 'inu://document',
        grants: ['unsafe.jvm', 'unsafe.xposed', 'clipboard.write'],
        extra: { 'entiny-tags': 'media tools' },
      },
    },
  },
})

