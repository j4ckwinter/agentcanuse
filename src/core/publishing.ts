import type { EngineId } from './model'

export const BEST_EFFORT_ENGINES: readonly EngineId[] = ['kitesurf']

export const TROUBLES_BEFORE_GIVING_UP = 3

export function givesUp(engine: EngineId, troublesInARow: number): boolean {
  return BEST_EFFORT_ENGINES.includes(engine) && troublesInARow >= TROUBLES_BEFORE_GIVING_UP
}

export function stopsPublishing(engine: EngineId, expected: boolean): boolean {
  return !expected && !BEST_EFFORT_ENGINES.includes(engine)
}
