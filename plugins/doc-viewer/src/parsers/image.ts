import { BFOptions, BitmapFactory, ExifInterface } from '../jvm.js'
import { t } from '../i18n.js'

export function exifRotation(path: string): number {
  try {
    const exif = new ExifInterface(path)
    const orientation = Number(exif.call('getAttributeInt', 'Orientation', 1))
    switch (orientation) {
      case 3: return 180
      case 6: return 90
      case 8: return 270
      default: return 0
    }
  } catch {
    return 0
  }
}

export function decodeImage(path: string): { bmp: JavaObject, rot: number } {
  const o = new BFOptions()
  o.setField('inJustDecodeBounds', true)
  BitmapFactory.callStatic('decodeFile', path, o)

  const outWidth = Number(o.getField('outWidth'))
  const outHeight = Number(o.getField('outHeight'))
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

  const rot = exifRotation(path)
  return { bmp, rot }
}

