import { blockSplit } from './agreement'
import { wilsonInterval } from './confidence'
import { leaderboard, type Standing } from './leaderboard'
import type { EngineId, Run } from './model'

export type Overall = { kind: 'ahead'; engine: EngineId; passRate: number } | { kind: 'level'; low: number; high: number }

export interface Findings {
  overall: Overall | null
  blockedOnlyChromium: number
  blockedOnlyOthers: number
}

function interval(standing: Standing) {
  return wilsonInterval(standing.counts.passed, standing.attempted)
}

function overall(standings: Standing[]): Overall | null {
  const visited = standings.filter((standing) => standing.attempted > 0)
  if (visited.length === 0) return null
  const [leader, ...rest] = visited
  const leaderLow = interval(leader)?.low ?? 0
  if (rest.length > 0 && rest.every((standing) => (interval(standing)?.high ?? 0) < leaderLow)) {
    return { kind: 'ahead', engine: leader.engine.id, passRate: leader.passRate }
  }
  const rates = visited.map((standing) => standing.passRate)
  return { kind: 'level', low: Math.min(...rates), high: Math.max(...rates) }
}

export function findings(run: Run): Findings {
  const split = blockSplit(run.results)
  return {
    overall: overall(leaderboard(run)),
    blockedOnlyChromium: split.blockedOnlyForReference.length,
    blockedOnlyOthers: split.blockedOnlyForOthers.length,
  }
}
