import { startEmbedEngine } from './embed/engine.js'

try {
  const engine = startEmbedEngine()
  if (!engine.hooked) console.warn(`embed: off (${engine.reason})`)
} catch (e) {
  console.warn('embed: off', e)
}
