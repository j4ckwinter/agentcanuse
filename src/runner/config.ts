import { readFile, writeFile } from 'node:fs/promises'
import { CATEGORIES, ENGINE_IDS, type EngineId, type Site } from '../core/model'

export type Pins = Record<EngineId, string>

export async function loadSites(path: string): Promise<Site[]> {
  const sites = JSON.parse(await readFile(path, 'utf8')) as Site[]
  const ids = new Set<string>()
  for (const site of sites) {
    if (ids.has(site.id)) throw new Error(`Duplicate site id in ${path}: ${site.id}`)
    ids.add(site.id)
    if (!(CATEGORIES as readonly string[]).includes(site.category)) throw new Error(`${site.id} has an unknown category: ${site.category}`)
    if (site.expect.length === 0) throw new Error(`${site.id} lists no expected phrases`)
    new URL(site.url)
  }
  return sites
}

export function pinsFrom(raw: Partial<Record<string, { version: string }>>, source: string): Pins {
  return Object.fromEntries(
    ENGINE_IDS.map((id) => {
      const entry = raw[id]
      if (entry === undefined) throw new Error(`${source} has no entry for ${id}`)
      return [id, entry.version]
    }),
  ) as Pins
}

export async function loadPins(path: string): Promise<Pins> {
  return pinsFrom(JSON.parse(await readFile(path, 'utf8')) as Record<string, { version: string }>, path)
}

export async function savePins(path: string, pins: Pins): Promise<void> {
  const entries = ENGINE_IDS.map((id) => `  "${id}": { "version": ${JSON.stringify(pins[id])} }`)
  await writeFile(path, `{\n${entries.join(',\n')}\n}\n`)
}

export function isEngineId(value: string): value is EngineId {
  return (ENGINE_IDS as readonly string[]).includes(value)
}
