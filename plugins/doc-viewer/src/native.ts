let helpers: DefinedClass | null = null

function native(): DefinedClass {
  if (helpers) return helpers
  const FloatBuffer: any = inu.jvm.cls('java.nio.FloatBuffer')
  const ColorMatrix: any = inu.jvm.cls('android.graphics.ColorMatrix')
  const Filter: any = inu.jvm.cls('android.graphics.ColorMatrixColorFilter')
  const StringClass: any = inu.jvm.cls('java.lang.String')
  helpers = inu.jvm.defineClass({ staticMethods: {
    strings: { params: ['java.util.ArrayList'], returns: 'java.lang.String[]', body: inu.jvm.routine(function (list: any) {
      return list.toArray(new StringClass('').split(','))
    }) },
    scale: { params: ['android.graphics.Matrix'], returns: 'float', body: inu.jvm.routine(function (matrix: any) {
      const values = FloatBuffer.allocate(9).array()
      matrix.getValues(values)
      return values[0]
    }) },
    invert: { params: [], returns: 'android.graphics.ColorMatrixColorFilter', body: inu.jvm.routine(function () {
      const values = FloatBuffer.allocate(20).array()
      values[0] = -1
      values[4] = 255
      values[6] = -1
      values[9] = 255
      values[12] = -1
      values[14] = 255
      values[18] = 1
      return new Filter(new ColorMatrix(values))
    }) },
  } })
  return helpers
}

export function matrixScale(matrix: JavaObject): number {
  return Number(native().callStatic('scale', matrix))
}

export function inversionFilter(): JavaObject {
  return native().callStatic('invert')
}

export function stringArray(items: string[]): JavaObject {
  const list = new (inu.jvm.cls('java.util.ArrayList'))()
  for (const item of items) list.call('add', item)
  return native().callStatic('strings', list)
}