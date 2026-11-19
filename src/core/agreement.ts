import type { EngineId, Outcome, Result } from './model'

export function sitesWhereEnginesDisagree(results: Result[]): Set<string> {
  const outcomes = new Map<string, Set<Outcome>>()
  for (const result of results) {
    if (result.outcome === 'skipped') continue
    const seen = outcomes.get(result.site) ?? new Set<Outcome>()
    seen.add(result.outcome)
    outcomes.set(result.site, seen)
  }
  return new Set([...outcomes].filter(([, seen]) => seen.size > 1).map(([site]) => site))
}

export const REFERENCE_ENGINE: EngineId = 'chromium'

export interface BlockSplit {
  blockedOnlyForReference: string[]
  blockedOnlyForOthers: string[]
}

function outcomesBySite(results: Result[]): Map<string, Map<EngineId, Outcome>> {
  const bySite = new Map<string, Map<EngineId, Outcome>>()
  for (const result of results) {
    const outcomes = bySite.get(result.site) ?? new Map<EngineId, Outcome>()
    outcomes.set(result.engine, result.outcome)
    bySite.set(result.site, outcomes)
  }
  return bySite
}

function othersHad(outcomes: Map<EngineId, Outcome>, outcome: Outcome): boolean {
  return [...outcomes].some(([engine, other]) => engine !== REFERENCE_ENGINE && other === outcome)
}

export function blockSplit(results: Result[]): BlockSplit {
  const sites = [...outcomesBySite(results)]
  return {
    blockedOnlyForReference: sites
      .filter(([, outcomes]) => outcomes.get(REFERENCE_ENGINE) === 'blocked' && othersHad(outcomes, 'passed'))
      .map(([site]) => site),
    blockedOnlyForOthers: sites
      .filter(([, outcomes]) => outcomes.get(REFERENCE_ENGINE) === 'passed' && othersHad(outcomes, 'blocked'))
      .map(([site]) => site),
  }
}
