import { describe, expect, it } from 'vitest'
import { diffRuns, releaseComparison } from './diff'
import type { EngineId, Outcome, Result, Run } from './model'

function result(engine: EngineId, site: string, outcome: Outcome): Result {
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
    durationMs: 0,
    error: null,
    shot: null,
  }
}

function runOf(id: string, version: string, outcomes: Record<string, Outcome>): Run {
  return {
    id,
    startedAt: '2026-11-19T21:00:00.000Z',
    engines: [{ id: 'lightpanda', version }],
    sites: [],
    results: [
      ...Object.entries(outcomes).map(([site, outcome]) => result('lightpanda', site, outcome)),
      result('chromium', 'a', 'failed'),
    ],
  }
}

describe('diffRuns', () => {
  const before = runOf('r1', '1.0.2', { a: 'empty', b: 'passed', c: 'failed', d: 'passed', e: 'skipped' })
  const after = runOf('r2', '1.0.4', { a: 'passed', b: 'incomplete', c: 'empty', d: 'passed', e: 'passed', f: 'passed' })

  it('lists regressions first, then fixes, then other shifts', () => {
    const diff = diffRuns(before, after, 'lightpanda')
    expect(diff.changes).toEqual([
      { site: 'b', before: 'passed', after: 'incomplete', change: 'regressed' },
      { site: 'a', before: 'empty', after: 'passed', change: 'fixed' },
      { site: 'c', before: 'failed', after: 'empty', change: 'shifted' },
    ])
  })

  it('names the engine versions on each side', () => {
    const diff = diffRuns(before, after, 'lightpanda')
    expect(diff.beforeVersion).toBe('1.0.2')
    expect(diff.afterVersion).toBe('1.0.4')
  })

  it('ignores sites that were skipped or new on either side', () => {
    const sites = diffRuns(before, after, 'lightpanda').changes.map((change) => change.site)
    expect(sites).not.toContain('e')
    expect(sites).not.toContain('f')
  })

  it('reports no version for an engine missing from a run', () => {
    expect(diffRuns(before, after, 'obscura')).toEqual({
      engine: 'obscura',
      beforeVersion: null,
      afterVersion: null,
      changes: [],
    })
  })
})

describe('releaseComparison', () => {
  const summary = (id: string, startedAt: string, version: string | null) => ({
    id,
    startedAt,
    engines: version === null ? [] : [{ id: 'lightpanda' as const, version }],
  })
  const runs = [
    summary('r1', '2026-11-17T21:00:00Z', '1.0.2'),
    summary('r2', '2026-11-18T21:00:00Z', '1.0.4'),
    summary('r3', '2026-11-19T21:00:00Z', '1.0.4'),
    summary('r4', '2026-11-20T21:00:00Z', null),
  ]

  it('compares the latest run with the newest run on a different version', () => {
    expect(releaseComparison(runs, 'lightpanda')).toEqual({ before: 'r1', after: 'r3' })
  })

  it('falls back to the previous run when the version never changed', () => {
    expect(releaseComparison(runs.slice(1), 'lightpanda')).toEqual({ before: 'r2', after: 'r3' })
  })

  it('needs two runs that include the engine', () => {
    expect(releaseComparison(runs.slice(2), 'lightpanda')).toBeNull()
    expect(releaseComparison(runs, 'obscura')).toBeNull()
  })
})
