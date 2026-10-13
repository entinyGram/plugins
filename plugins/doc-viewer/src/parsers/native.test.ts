import { beforeEach, expect, mock, test } from 'bun:test'

// Run this file in its own Bun process: JVM module mocks are process-global.
let events: string[]
let faults: Set<string>
let width: number, height: number, orientation: number, count: number
let decoded: Handle | null, created: Handle | null, source: Handle, pfd: Handle, renderer: Handle, page: Handle
let samples: number[]
let matrix: MatrixMock | null
function hit(event: string) {
  events.push(event)
  if (faults.has(event)) throw new Error(event)
}
class Handle {
  recycled = 0
  closed = 0
  constructor(public kind: string, public identity: object = {}) {}
  call(method: string, ...args: any[]): any {
    hit(`${this.kind}.${method}`)
    if (method === 'getWidth') return this.kind === 'page' ? 600 : 3
    if (method === 'getHeight') return this.kind === 'page' ? 800 : 2
    if (method === 'getPageCount') return count
    if (method === 'openPage') { expect(args).toEqual([2]); return page }
    if (method === 'equals') return this.identity === args[0].identity
    if (method === 'recycle') { this.recycled++; return }
    if (method === 'close') { this.closed++; return }
    if (method === 'render') {
      expect(args).toEqual([created, null, null, 'display'])
      return
    }
    throw new Error(`unexpected method ${method}`)
  }
}
class Options {
  fields: Record<string, any> = {}
  setField(key: string, value: any) { this.fields[key] = value }
  getField(key: string) { return this.fields[key] }
}
class MatrixMock {
  values = [1, 0, 0, 1]
  constructor() { hit('matrix.new'); matrix = this }
  call(method: string, x: number, y?: number) {
    hit(`matrix.${method}`)
    if (method === 'setScale') this.values = [x, 0, 0, y!]
    else if (method === 'setRotate') {
      expect(x).toBe(90)
      this.values = [0, -1, 1, 0]
    } else if (method === 'postScale') {
      this.values = this.values.map((v, i) => v * (i < 2 ? x : y!))
    } else throw new Error(method)
  }
}
mock.module('../jvm.js', () => ({
  BFOptions: Options,
  BitmapFactory: { callStatic(method: string, path: string, opts: Options) {
    expect(method).toBe('decodeFile')
    expect(path).toBe('fixture')
    if (opts.fields.inJustDecodeBounds) {
      hit('decode.bounds')
      opts.fields.outWidth = width
      opts.fields.outHeight = height
      return null
    }
    hit('decode.pixels')
    samples.push(opts.fields.inSampleSize)
    return decoded
  } },
  ExifInterface: class {
    constructor(path: string) { expect(path).toBe('fixture'); hit('exif.new') }
    call(method: string, tag: string, fallback: number) {
      expect([method, tag, fallback]).toEqual(['getAttributeInt', 'Orientation', 1])
      hit('exif.read')
      return orientation
    }
  },
  Matrix: MatrixMock,
  Bitmap: { callStatic(method: string, ...args: any[]) {
    expect(method).toBe('createBitmap')
    hit('bitmap.create')
    if (args.length === 7) expect(args).toEqual([source, 0, 0, 3, 2, matrix, true])
    else {
      expect(args).toHaveLength(3)
      expect(args[2]).toBe('argb')
      events.push(`size:${args[0]}x${args[1]}`)
    }
    return created
  } },
  BitmapConfig: { getStaticField: () => 'argb' },
  fillWhite: (bmp: Handle) => { expect(bmp).toBe(created); hit('bitmap.white') },
  JFile: class { constructor(path: string) { expect(path).toBe('fixture') } },
  ParcelFileDescriptor: {
    getStaticField: () => 'readonly',
    callStatic(method: string, _file: any, mode: string) {
      expect([method, mode]).toEqual(['open', 'readonly'])
      hit('pfd.open')
      return pfd
    },
  },
  PdfRenderer: class {
    constructor(fd: Handle) { expect(fd).toBe(pfd); hit('renderer.new'); return renderer }
  },
  PdfPage: { getStaticField: () => 'display' },
}))
mock.module('../i18n.js', () => ({ t: (key: string) => key }))
const { decodeImage, exifRotation } = await import('./image.js')
const { openPdf, renderPdfPage } = await import('./pdf.js')
beforeEach(() => {
  events = []; faults = new Set(); samples = []; matrix = null
  width = 3; height = 2; orientation = 1; count = 4
  source = new Handle('source'); decoded = source; created = new Handle('output')
  pfd = new Handle('pfd'); renderer = new Handle('renderer'); page = new Handle('page')
})

// No actual Android codec, bitmap pixels, PDF engine or JVM bridge runs here.
test('image sampling uses powers of two and longest dimension', () => {
  for (const [w, h, sample] of [[4096, 2, 1], [4097, 2, 2], [2, 8192, 2], [2, 8193, 4]]) {
    width = w; height = h
    expect(decodeImage('fixture')).toEqual({ bmp: source, rot: 0 })
    expect(samples.at(-1)).toBe(sample)
  }
  expect(source.recycled).toBe(0)
})
test('invalid bounds and null decode fail without transform', () => {
  for (const value of [-1, 0, NaN, Infinity]) {
    width = value
    expect(() => decodeImage('fixture')).toThrow('err_decode_image')
  }
  expect(events).not.toContain('decode.pixels')
  width = 3; decoded = null
  expect(() => decodeImage('fixture')).toThrow('err_decode_image')
  expect(events).not.toContain('matrix.new')
})
test('decode errors propagate and EXIF errors fall back', () => {
  for (const event of ['decode.bounds', 'decode.pixels']) {
    faults = new Set([event])
    expect(() => decodeImage('fixture')).toThrow(event)
  }
  for (const event of ['exif.new', 'exif.read']) {
    faults = new Set([event])
    expect(decodeImage('fixture')).toEqual({ bmp: source, rot: 0 })
    expect(exifRotation('fixture')).toBe(0)
  }
  expect(source.recycled).toBe(0)
})
test('pure EXIF rotations retain bmp/rot viewer contract', () => {
  for (const [value, rot] of [[1, 0], [3, 180], [6, 90], [8, 270], [99, 0]]) {
    orientation = value
    expect(decodeImage('fixture')).toEqual({ bmp: source, rot })
    expect(exifRotation('fixture')).toBe(rot)
  }
  expect(matrix).toBeNull()
  expect(source.recycled).toBe(0)
})
for (const [value, expected] of [
  [2, [-1, 0, 0, 1]], [4, [1, 0, 0, -1]],
  [5, [0, 1, 1, 0]], [7, [0, -1, -1, 0]],
] as const) {
  test(`EXIF ${value} mirrors axes and transfers ownership`, () => {
    orientation = value
    expect(decodeImage('fixture')).toEqual({ bmp: created, rot: 0 })
    expect(matrix!.values.map(v => v === 0 ? 0 : v)).toEqual([...expected])
    expect(source.recycled).toBe(1)
    expect(created!.recycled).toBe(0)
  })
}
test('mirror errors and null output recycle decoded bitmap', () => {
  orientation = 5
  for (const event of ['matrix.new', 'matrix.setRotate', 'matrix.postScale', 'bitmap.create', 'source.getWidth', 'source.getHeight']) {
    faults = new Set([event]); source.recycled = 0
    expect(() => decodeImage('fixture')).toThrow(event)
    expect(source.recycled).toBe(1)
  }
  faults.clear(); source.recycled = 0; created = null
  expect(() => decodeImage('fixture')).toThrow('err_decode_image')
  expect(source.recycled).toBe(1)
})
test('another handle to source must not recycle live bitmap', () => {
  orientation = 2
  created = new Handle('alias', source.identity)
  expect(decodeImage('fixture').bmp).toBe(created)
  expect(source.recycled + created.recycled).toBe(0)
})
test('identity failure cleans both resources; recycle failure is best effort', () => {
  orientation = 4; faults.add('output.equals')
  expect(() => decodeImage('fixture')).toThrow('output.equals')
  expect(source.recycled).toBe(1)
  expect(created!.recycled).toBe(1)
  faults = new Set(['source.recycle'])
  expect(decodeImage('fixture').bmp).toBe(created)
})

test('PDF open transfers live renderer and descriptor', () => {
  expect(openPdf('fixture')).toEqual({ renderer, pfd, count: 4 })
  expect(events).toEqual(['pfd.open', 'renderer.new', 'renderer.getPageCount'])
})
test('PDF constructor/count/empty failures close acquired resources', () => {
  faults.add('renderer.new')
  expect(() => openPdf('fixture')).toThrow('renderer.new')
  expect(pfd.closed).toBe(1)
  expect(renderer.closed).toBe(0)
  faults = new Set(['renderer.getPageCount', 'renderer.close'])
  expect(() => openPdf('fixture')).toThrow('renderer.getPageCount')
  expect(pfd.closed).toBe(2)
  faults.clear(); count = 0
  expect(() => openPdf('fixture')).toThrow('err_empty_pdf')
  expect(renderer.closed).toBe(1)
  expect(pfd.closed).toBe(3)
})
test('PDF descriptor open error propagates without invented cleanup', () => {
  faults.add('pfd.open')
  expect(() => openPdf('fixture')).toThrow('pfd.open')
  expect(events).toEqual(['pfd.open'])
})
test('PDF render sizes, fills white, renders, closes page but keeps bitmap', () => {
  expect(renderPdfPage(renderer as any, 2, 500)).toBe(created)
  expect(events).toContain('size:1000x1333')
  expect(events.slice(-3)).toEqual(['bitmap.white', 'page.render', 'page.close'])
  expect(page.closed).toBe(1)
  expect(created!.recycled).toBe(0)
  events = []
  renderPdfPage(renderer as any, 2, 10000)
  expect(events).toContain('size:2400x3200')
})
test('PDF open/allocation/metadata failures release only acquired resources', () => {
  faults.add('renderer.openPage')
  expect(() => renderPdfPage(renderer as any, 2, 500)).toThrow('renderer.openPage')
  expect(page.closed).toBe(0)
  for (const event of ['page.getWidth', 'page.getHeight', 'bitmap.create']) {
    faults = new Set([event]); page.closed = 0
    expect(() => renderPdfPage(renderer as any, 2, 500)).toThrow(event)
    expect(page.closed).toBe(1)
    expect(created!.recycled).toBe(0)
  }
})
test('PDF fill/render failures recycle output and close page despite recycle error', () => {
  for (const event of ['bitmap.white', 'page.render']) {
    faults = new Set([event]); page.closed = 0; created!.recycled = 0
    expect(() => renderPdfPage(renderer as any, 2, 500)).toThrow(event)
    expect(created!.recycled).toBe(1)
    expect(page.closed).toBe(1)
  }
  faults = new Set(['page.render', 'output.recycle']); page.closed = 0
  expect(() => renderPdfPage(renderer as any, 2, 500)).toThrow('page.render')
  expect(page.closed).toBe(1)
})
test('PDF close failure preserves successful bitmap and original render error', () => {
  faults.add('page.close')
  expect(renderPdfPage(renderer as any, 2, 500)).toBe(created)
  expect(created!.recycled).toBe(0)
  faults.add('page.render')
  expect(() => renderPdfPage(renderer as any, 2, 500)).toThrow('page.render')
  expect(created!.recycled).toBe(1)
})
test('PDF rejects nonfinite page count', () => {
  count = NaN
  expect(() => openPdf('fixture')).toThrow('err_empty_pdf')
  expect(pfd.closed).toBe(1)
})
