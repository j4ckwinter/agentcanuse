import { describe, expect, it } from 'vitest'
import { leaderboard, median } from './leaderboard'
import type { EngineId, Outcome, Result, Run } from './model'

function result(engine: EngineId, site: string, outcome: Outcome, durationMs = 1000): Result {
  return {
    site,
    engine,
    outcome,
    status: 200,
    title: '',
    excerpt: '',
    found: [],
    missing: [],
    textLength: 0,
    linkCount: 0,
    durationMs,
    error: null,
    shot: null,
  }
}

const run: Run = {
  id: 'r1',
  startedAt: '2026-11-19T21:00:00.000Z',
  engines: [
    { id: 'chromium', version: '150.0.1' },
    { id: 'lightpanda', version: '1.0.4' },
  ],
  sites: [],
  results: [
    result('chromium', 'a', 'passed', 900),
    result('chromium', 'b', 'passed', 1100),
    result('chromium', 'c', 'blocked', 300),
    result('chromium', 'd', 'skipped'),
    result('lightpanda', 'a', 'passed', 200),
    result('lightpanda', 'b', 'empty', 100),
    result('lightpanda', 'c', 'failed', 30000),
    result('lightpanda', 'd', 'skipped'),
  ],
}

describe('leaderboard', () => {
  it('ranks engines by pass rate over the sites they attempted', () => {
    const [first, second] = leaderboard(run)
    expect(first.engine.id).toBe('chromium')
    expect(first.attempted).toBe(3)
    expect(first.passRate).toBeCloseTo(2 / 3)
    expect(first.blockedRate).toBeCloseTo(1 / 3)
    expect(second.engine.id).toBe('lightpanda')
    expect(second.passRate).toBeCloseTo(1 / 3)
  })

  it('leaves failed and skipped visits out of the median time', () => {
    const lightpanda = leaderboard(run).find((standing) => standing.engine.id === 'lightpanda')
    expect(lightpanda?.medianMs).toBe(150)
  })

  it('counts every outcome, including ones that did not happen', () => {
    const chromium = leaderboard(run)[0]
    expect(chromium.counts).toEqual({ passed: 2, incomplete: 0, empty: 0, blocked: 1, failed: 0, skipped: 1 })
  })
})

describe('median', () => {
  it('handles empty, odd and even lists', () => {
    expect(median([])).toBeNull()
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})
