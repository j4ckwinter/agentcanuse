import { OUTCOMES, type EngineRun, type Outcome, type Result, type Run } from './model'

export interface Standing {
  engine: EngineRun
  counts: Record<Outcome, number>
  attempted: number
  passRate: number
  blockedRate: number
  medianMs: number | null
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
  }
}

export function leaderboard(run: Run): Standing[] {
  return run.engines
    .map((engine) => standingFor(engine, run.results.filter((result) => result.engine === engine.id)))
    .sort((a, b) => b.passRate - a.passRate || a.blockedRate - b.blockedRate)
}
