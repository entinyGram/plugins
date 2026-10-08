export interface TileSource {
  name: string
  /** https url with `{z}`, `{x}`, `{y}`; `{n}` is replaced by a host number 0..4 */
  url: string
  attribution: string
  minZoom?: number
  maxZoom?: number
  /** pixels, 128..512 */
  tileSize?: number
}

const tiles = () => inu.jvm.cls('desu.inugram.helpers.maps.EntinyMapTiles')

/** draws the app's map from these raster tiles; needs the `unsafe.jvm` grant */
export function setTileSource(source: TileSource): void {
  tiles().callStatic('set', source.name, source.url, source.attribution, source.minZoom ?? 0, source.maxZoom ?? 18, source.tileSize ?? 256)
}

/** back to the app's own tiles */
export function clearTileSource(): void {
  tiles().callStatic('clear')
}
