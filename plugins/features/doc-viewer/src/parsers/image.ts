import { BFOptions, Bitmap, BitmapFactory, ExifInterface, Matrix } from '../jvm.js'
import { t } from '../i18n.js'

function exifOrientation(path: string): number {
  try {
    const exif = new ExifInterface(path)
    return Number(exif.call('getAttributeInt', 'Orientation', 1))
  } catch {
    return 1
  }
}

function rotation(orientation: number): number {
  switch (orientation) {
    case 3: return 180
    case 6: return 90
    case 8: return 270
    default: return 0
  }
}

export function exifRotation(path: string): number {
  return rotation(exifOrientation(path))
}

function recycle(bmp: JavaObject) {
  try { bmp.call('recycle') } catch {}
}

export function decodeImage(path: string): { bmp: JavaObject, rot: number } {
  const o = new BFOptions()
  o.setField('inJustDecodeBounds', true)
  BitmapFactory.callStatic('decodeFile', path, o)

  const outWidth = Number(o.getField('outWidth'))
  const outHeight = Number(o.getField('outHeight'))
  if (!Number.isFinite(outWidth) || !Number.isFinite(outHeight) || outWidth <= 0 || outHeight <= 0) {
    throw new Error(String(t('err_decode_image')))
  }
  let sample = 1
  while (Math.max(outWidth, outHeight) / sample > 4096) {
    sample *= 2
  }

  const o2 = new BFOptions()
  o2.setField('inSampleSize', sample)
  const bmp = BitmapFactory.callStatic('decodeFile', path, o2)
  if (!bmp) {
    throw new Error(String(t('err_decode_image')))
  }

  const orientation = exifOrientation(path)
  if (![2, 4, 5, 7].includes(orientation)) {
    // Pure rotations remain the viewer's responsibility.
    return { bmp, rot: rotation(orientation) }
  }

  let mirrored: JavaObject | null = null
  try {
    const matrix = new Matrix()
    if (orientation === 2) matrix.call('setScale', -1, 1)
    if (orientation === 4) matrix.call('setScale', 1, -1)
    // Android postScale left-multiplies: these are transpose / transverse.
    if (orientation === 5 || orientation === 7) {
      matrix.call('setRotate', 90)
      matrix.call('postScale', orientation === 5 ? -1 : 1, orientation === 5 ? 1 : -1)
    }
    mirrored = Bitmap.callStatic('createBitmap', bmp, 0, 0, bmp.call('getWidth'), bmp.call('getHeight'), matrix, true)
    if (!mirrored) throw new Error(String(t('err_decode_image')))
    // Bridge handles may differ even when Java returned the source bitmap.
    if (!mirrored.call('equals', bmp)) recycle(bmp)
    return { bmp: mirrored, rot: 0 }
  } catch (error) {
    if (mirrored) recycle(mirrored)
    recycle(bmp)
    throw error
  }
}

