import { Bitmap, BitmapConfig, fillWhite, JFile, ParcelFileDescriptor, PdfPage, PdfRenderer } from '../jvm.js'
import { t } from '../i18n.js'

export function openPdf(path: string): { renderer: JavaObject, pfd: JavaObject, count: number } {
  const pfd = ParcelFileDescriptor.callStatic(
    'open',
    new JFile(path),
    ParcelFileDescriptor.getStaticField('MODE_READ_ONLY'),
  )
  const renderer = new PdfRenderer(pfd)
  const count = Number(renderer.call('getPageCount'))
  if (count < 1) {
    renderer.call('close')
    pfd.call('close')
    throw new Error(String(t('err_empty_pdf')))
  }
  return { renderer, pfd, count }
}

export function renderPdfPage(
  renderer: JavaObject,
  index: number,
  displayWidth: number,
): JavaObject {
  const page = renderer.call('openPage', index)
  try {
    const pw = Number(page.call('getWidth'))
    const ph = Number(page.call('getHeight'))
    let sc = Math.min((displayWidth * 2.0) / pw, 3200.0 / Math.max(pw, ph))
    sc = Math.max(sc, 0.5)
    const w = Math.max(1, Math.round(pw * sc))
    const h = Math.max(1, Math.round(ph * sc))

    const bmp = Bitmap.callStatic('createBitmap', w, h, BitmapConfig.getStaticField('ARGB_8888'))
    fillWhite(bmp)
    page.call('render', bmp, null, null, PdfPage.getStaticField('RENDER_MODE_FOR_DISPLAY'))
    return bmp
  } finally {
    page.call('close')
  }
}

