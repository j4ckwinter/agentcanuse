import type { EngineId, Outcome, Run, RunSummary } from './model'

export type Change = 'fixed' | 'regressed' | 'shifted'

export interface SiteChange {
  site: string
  before: Outcome
  after: Outcome
  change: Change
}

export interface EngineDiff {
  engine: EngineId
  beforeVersion: string | null
  afterVersion: string | null
  changes: SiteChange[]
}

function classify(before: Outcome, after: Outcome): Change {
  if (after === 'passed') return 'fixed'
  if (before === 'passed') return 'regressed'
  return 'shifted'
}

function versionIn(run: Pick<Run, 'engines'>, engine: EngineId): string | null {
  return run.engines.find((entry) => entry.id === engine)?.version ?? null
}

const CHANGE_ORDER: Record<Change, number> = { regressed: 0, fixed: 1, shifted: 2 }

export function diffRuns(before: Run, after: Run, engine: EngineId): EngineDiff {
  const earlier = new Map(
    before.results.filter((result) => result.engine === engine).map((result) => [result.site, result.outcome]),
  )
  const changes = after.results
    .filter((result) => result.engine === engine && result.outcome !== 'skipped')
    .flatMap((result): SiteChange[] => {
      const previous = earlier.get(result.site)
      if (previous === undefined || previous === 'skipped' || previous === result.outcome) return []
      return [{ site: result.site, before: previous, after: result.outcome, change: classify(previous, result.outcome) }]
    })
    .sort((a, b) => CHANGE_ORDER[a.change] - CHANGE_ORDER[b.change] || a.site.localeCompare(b.site))
  return {
    engine,
    beforeVersion: versionIn(before, engine),
    afterVersion: versionIn(after, engine),
    changes,
  }
}

export function releaseComparison(runs: RunSummary[], engine: EngineId): { before: string; after: string } | null {
  const withEngine = [...runs]
    .filter((run) => versionIn(run, engine) !== null)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const [latest, ...older] = withEngine
  if (latest === undefined || older.length === 0) return null
  const latestVersion = versionIn(latest, engine)
  const previousRelease = older.find((run) => versionIn(run, engine) !== latestVersion) ?? older[0]
  return { before: previousRelease.id, after: latest.id }
}
