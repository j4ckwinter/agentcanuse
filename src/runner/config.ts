import { readFile } from 'node:fs/promises'
import { ENGINE_IDS, type EngineId, type Site } from '../core/model'

export type Pins = Record<EngineId, string>

export async function loadSites(path: string): Promise<Site[]> {
  const sites = JSON.parse(await readFile(path, 'utf8')) as Site[]
  const ids = new Set<string>()
  for (const site of sites) {
    if (ids.has(site.id)) throw new Error(`Duplicate site id in ${path}: ${site.id}`)
    ids.add(site.id)
    new URL(site.url)
  }
  return sites
}

export async function loadPins(path: string): Promise<Pins> {
  const raw = JSON.parse(await readFile(path, 'utf8')) as Record<string, { version: string }>
  return Object.fromEntries(
    ENGINE_IDS.map((id) => {
      const entry = raw[id]
      if (entry === undefined) throw new Error(`${path} has no entry for ${id}`)
      return [id, entry.version]
    }),
  ) as Pins
}

export function isEngineId(value: string): value is EngineId {
  return (ENGINE_IDS as readonly string[]).includes(value)
}
