import type { EngineId } from './model'

export const RELEASE_REPOS: Record<EngineId, string | null> = {
  chromium: null,
  lightpanda: 'lightpanda-io/browser',
  obscura: 'h4ckf0r0day/obscura',
  kitesurf: null,
}

export interface PinUpdate {
  engine: EngineId
  from: string
  to: string
}

export function pinUpdates(pins: Record<EngineId, string>, latest: Partial<Record<EngineId, string>>): PinUpdate[] {
  return (Object.keys(RELEASE_REPOS) as EngineId[]).flatMap((engine): PinUpdate[] => {
    const to = latest[engine]
    if (RELEASE_REPOS[engine] === null || to === undefined || to === pins[engine]) return []
    return [{ engine, from: pins[engine], to }]
  })
}
