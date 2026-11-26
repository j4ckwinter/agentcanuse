import type { EngineId } from './model'

export const BEST_EFFORT_ENGINES: readonly EngineId[] = ['kitesurf']

export function stopsPublishing(engine: EngineId, expected: boolean): boolean {
  return !expected && !BEST_EFFORT_ENGINES.includes(engine)
}
