import { REFERENCE_ENGINE } from './agreement'
import type { EngineId, Outcome, Result } from './model'

export const VERDICTS = ['works-everywhere', 'blocks-chromium', 'trips-lighter-engines', 'blocks-every-engine', 'mixed', 'not-visited'] as const
export type Verdict = (typeof VERDICTS)[number]

export function verdictFor(results: Result[]): Verdict {
  const visited = new Map<EngineId, Outcome>(results.filter((result) => result.outcome !== 'skipped').map((result) => [result.engine, result.outcome]))
  const outcomes = [...visited.values()]
  if (outcomes.length === 0) return 'not-visited'
  if (outcomes.every((outcome) => outcome === 'passed')) return 'works-everywhere'
  if (outcomes.every((outcome) => outcome === 'blocked')) return 'blocks-every-engine'
  const reference = visited.get(REFERENCE_ENGINE)
  const others = [...visited].filter(([engine]) => engine !== REFERENCE_ENGINE).map(([, outcome]) => outcome)
  if (reference === 'blocked' && others.includes('passed')) return 'blocks-chromium'
  if (reference === 'passed' && others.some((outcome) => outcome !== 'passed')) return 'trips-lighter-engines'
  return 'mixed'
}

export function verdictsBySite(results: Result[]): Map<string, Verdict> {
  const bySite = new Map<string, Result[]>()
  for (const result of results) bySite.set(result.site, [...(bySite.get(result.site) ?? []), result])
  return new Map([...bySite].map(([site, siteResults]) => [site, verdictFor(siteResults)]))
}
