import type { Origin } from './model'

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

export function siteListFingerprint(siteIds: string[]): string {
  let hash = FNV_OFFSET
  for (const character of [...siteIds].sort().join('\n')) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, FNV_PRIME) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function sameNetwork(a: { origin: Origin }, b: { origin: Origin }): boolean {
  return a.origin === b.origin
}

export function sameSurvey(a: { origin: Origin; siteList: string }, b: { origin: Origin; siteList: string }): boolean {
  return sameNetwork(a, b) && a.siteList === b.siteList
}
