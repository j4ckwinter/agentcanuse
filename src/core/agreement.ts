import type { Outcome, Result } from './model'

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
