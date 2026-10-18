// The plain-text fallback for a row that the app cannot draw as a view: the version goes in front of the title and
// the trailing `value` stays free for the row's state (installed, update). The rows that do get drawn as views put
// the version in a colored pill instead (`row.ts`).
export function withVersion(string: string, version?: string): string {
  return version ? `v${version}  ${string}` : string
}
