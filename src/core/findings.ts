import { blockSplit } from './agreement'
import { categoryStandings, leaderboard, type CategoryStanding } from './leaderboard'
import type { Category, EngineId, Run } from './model'

export interface Findings {
  leader: { engine: EngineId; passRate: number } | null
  blockedOnlyChromium: number
  blockedOnlyOthers: number
  hardestCategory: { category: Category; passRate: number } | null
  fastest: { engine: EngineId; medianMs: number } | null
  slowest: { engine: EngineId; medianMs: number } | null
}

function averagePassRate(standing: CategoryStanding): number {
  const rates = Object.values(standing.passRates)
  return rates.length === 0 ? 0 : rates.reduce((sum, rate) => sum + rate, 0) / rates.length
}

export function findings(run: Run): Findings {
  const standings = leaderboard(run)
  const split = blockSplit(run.results)
  const timed = standings.flatMap((standing) => (standing.medianMs === null ? [] : [{ engine: standing.engine.id, medianMs: standing.medianMs }]))
  const byTime = [...timed].sort((a, b) => a.medianMs - b.medianMs)
  const hardest = [...categoryStandings(run)].sort((a, b) => averagePassRate(a) - averagePassRate(b))[0]
  return {
    leader: standings[0] ? { engine: standings[0].engine.id, passRate: standings[0].passRate } : null,
    blockedOnlyChromium: split.blockedOnlyForReference.length,
    blockedOnlyOthers: split.blockedOnlyForOthers.length,
    hardestCategory: hardest ? { category: hardest.category, passRate: averagePassRate(hardest) } : null,
    fastest: byTime[0] ?? null,
    slowest: byTime.length > 1 ? byTime[byTime.length - 1] : null,
  }
}
