import { sameSurvey, siteListFingerprint } from './comparable'
import { isTreeUsable, judgedTree } from './tree'
import { CATEGORIES, OUTCOMES, type Category, type EngineId, type EngineRun, type Outcome, type Result, type Run, type RunSummary } from './model'

export interface Standing {
  engine: EngineRun
  counts: Record<Outcome, number>
  attempted: number
  passRate: number
  blockedRate: number
  medianMs: number | null
  trees: { checked: number; usable: number }
}

function emptyCounts(): Record<Outcome, number> {
  return Object.fromEntries(OUTCOMES.map((outcome) => [outcome, 0])) as Record<Outcome, number>
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole
}

function treeCounts(results: Result[]): Standing['trees'] {
  const checked = results.flatMap((result) => judgedTree(result) ?? [])
  return { checked: checked.length, usable: checked.filter(isTreeUsable).length }
}

function standingFor(engine: EngineRun, results: Result[]): Standing {
  const counts = emptyCounts()
  for (const result of results) counts[result.outcome] += 1
  const attempted = results.length - counts.skipped
  const timed = results.filter((result) => result.outcome !== 'skipped' && result.outcome !== 'failed')
  return {
    engine,
    counts,
    attempted,
    passRate: rate(counts.passed, attempted),
    blockedRate: rate(counts.blocked, attempted),
    medianMs: median(timed.map((result) => result.durationMs)),
    trees: treeCounts(results),
  }
}

export function leaderboard(run: Run): Standing[] {
  return run.engines
    .map((engine) => standingFor(engine, run.results.filter((result) => result.engine === engine.id)))
    .sort((a, b) => b.passRate - a.passRate || a.blockedRate - b.blockedRate)
}

export interface CategoryStanding {
  category: Category
  sites: number
  passRates: Partial<Record<EngineId, number>>
  leaders: EngineId[]
}

export function categoryStandings(run: Run): CategoryStanding[] {
  const categoryOf = new Map(run.sites.map((site) => [site.id, site.category]))
  return CATEGORIES.flatMap((category): CategoryStanding[] => {
    const inCategory = run.results.filter((result) => categoryOf.get(result.site) === category)
    if (inCategory.length === 0) return []
    const passRates: Partial<Record<EngineId, number>> = {}
    for (const { id } of run.engines) {
      const attempted = inCategory.filter((result) => result.engine === id && result.outcome !== 'skipped')
      if (attempted.length > 0) passRates[id] = rate(attempted.filter((result) => result.outcome === 'passed').length, attempted.length)
    }
    const rates = Object.values(passRates)
    if (rates.length === 0) return []
    const best = Math.max(...rates)
    const leaders = run.engines.map((engine) => engine.id).filter((id) => passRates[id] === best)
    return [{ category, sites: run.sites.filter((site) => site.category === category).length, passRates, leaders }]
  })
}

export function summarise(run: Run): RunSummary {
  const passRates: Partial<Record<EngineId, number>> = {}
  for (const standing of leaderboard(run)) passRates[standing.engine.id] = standing.passRate
  return {
    id: run.id,
    startedAt: run.startedAt,
    origin: run.origin,
    engines: run.engines,
    siteCount: run.sites.length,
    siteList: siteListFingerprint(run.sites.map((site) => site.id)),
    passRates,
  }
}

export interface TrendPoint {
  run: string
  passRate: number
}

export function trend(runs: RunSummary[], current: RunSummary, engine: EngineId): TrendPoint[] {
  return runs
    .filter((run) => sameSurvey(run, current) && run.startedAt <= current.startedAt)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .flatMap((run): TrendPoint[] => {
      const passRate = run.passRates[engine]
      return passRate === undefined ? [] : [{ run: run.id, passRate }]
    })
}
