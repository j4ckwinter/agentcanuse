import type { EngineId, Outcome, Run } from './model'

export interface HistoryPoint {
  run: string
  startedAt: string
  version: string
  outcome: Outcome
}

export function siteHistory(runs: Run[], site: string, engine: EngineId): HistoryPoint[] {
  return [...runs]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .flatMap((run): HistoryPoint[] => {
      const result = run.results.find((entry) => entry.site === site && entry.engine === engine)
      const version = run.engines.find((entry) => entry.id === engine)?.version
      if (result === undefined || version === undefined || result.outcome === 'skipped') return []
      return [{ run: run.id, startedAt: run.startedAt, version, outcome: result.outcome }]
    })
}

export function isFlaky(points: HistoryPoint[]): boolean {
  return points.some((point, index) => index > 0 && point.version === points[index - 1].version && point.outcome !== points[index - 1].outcome)
}
