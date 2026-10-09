export function packedName(pluginName: string, version: string): string {
  const base = /^entinygram/i.test(pluginName) ? pluginName : `entinyGram ${pluginName}`
  const safe = base.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')
  return `${safe}-${version}.inu.js`
}
