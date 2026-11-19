import { describe, expect, it } from 'vitest'
import { isFlaky, siteHistory } from './history'
import type { EngineId, Outcome, Result, Run } from './model'

function result(site: string, engine: EngineId, outcome: Outcome): Result {
  return { site, engine, outcome, status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 0, linkCount: 0, durationMs: 0, error: null, shot: null, tree: null }
}

function run(id: string, startedAt: string, version: string, outcome: Outcome): Run {
  return { id, startedAt, origin: 'data-centre', engines: [{ id: 'lightpanda', version }], sites: [], results: [result('zillow', 'lightpanda', outcome), result('zillow', 'chromium', 'blocked')] }
}

describe('siteHistory', () => {
  it('lists an engine’s outcomes on a site, oldest first, leaving out skipped visits', () => {
    const runs = [run('r3', '2026-11-22T03:17Z', '1.0.5', 'passed'), run('r1', '2026-11-20T03:17Z', '1.0.4', 'blocked'), run('r2', '2026-11-21T03:17Z', '1.0.4', 'skipped')]
    expect(siteHistory(runs, 'zillow', 'lightpanda')).toEqual([
      { run: 'r1', startedAt: '2026-11-20T03:17Z', version: '1.0.4', outcome: 'blocked' },
      { run: 'r3', startedAt: '2026-11-22T03:17Z', version: '1.0.5', outcome: 'passed' },
    ])
  })
})

describe('isFlaky', () => {
  it('flags an outcome that changed while the engine version stayed the same', () => {
    const points = siteHistory([run('r1', '2026-11-20', '1.0.4', 'passed'), run('r2', '2026-11-21', '1.0.4', 'empty')], 'zillow', 'lightpanda')
    expect(isFlaky(points)).toBe(true)
  })

  it('does not blame a change that came with a new release, or a steady result', () => {
    expect(isFlaky(siteHistory([run('r1', '2026-11-20', '1.0.4', 'empty'), run('r2', '2026-11-21', '1.0.5', 'passed')], 'zillow', 'lightpanda'))).toBe(false)
    expect(isFlaky(siteHistory([run('r1', '2026-11-20', '1.0.4', 'passed'), run('r2', '2026-11-21', '1.0.4', 'passed')], 'zillow', 'lightpanda'))).toBe(false)
  })
})
