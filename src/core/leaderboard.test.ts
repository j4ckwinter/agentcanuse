import { describe, expect, it } from 'vitest'
import { categoryStandings, leaderboard, median, summarise, trend } from './leaderboard'
import type { RunSummary } from './model'
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
    tree: null,
    hidden: null,
  }
}

const run: Run = {
  id: 'r1',
  startedAt: '2026-11-19T21:00:00.000Z',
  origin: 'home',
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

describe('categoryStandings', () => {
  it('gives each engine a pass rate per category over the sites it attempted', () => {
    const categorised: Run = {
      ...run,
      sites: [
        { id: 'a', name: 'A', category: 'docs', url: 'https://a.test/', expect: [] },
        { id: 'b', name: 'B', category: 'docs', url: 'https://b.test/', expect: [] },
        { id: 'c', name: 'C', category: 'shopping', url: 'https://c.test/', expect: [] },
        { id: 'd', name: 'D', category: 'shopping', url: 'https://d.test/', expect: [] },
      ],
    }
    expect(categoryStandings(categorised)).toEqual([
      { category: 'docs', sites: 2, passRates: { chromium: 1, lightpanda: 0.5 }, leaders: ['chromium'] },
      { category: 'shopping', sites: 2, passRates: { chromium: 0, lightpanda: 0 }, leaders: ['chromium', 'lightpanda'] },
    ])
  })
})

describe('categoryStandings with skipped sites', () => {
  it('gives no rate to an engine that visited nothing in a category, and drops a category nobody visited', () => {
    const partly: Run = {
      ...run,
      sites: [
        { id: 'a', name: 'A', category: 'docs', url: 'https://a.test/', expect: [] },
        { id: 'd', name: 'D', category: 'news', url: 'https://d.test/', expect: [] },
      ],
      results: [result('chromium', 'a', 'passed'), result('lightpanda', 'a', 'skipped'), result('chromium', 'd', 'skipped'), result('lightpanda', 'd', 'skipped')],
    }
    expect(categoryStandings(partly)).toEqual([{ category: 'docs', sites: 1, passRates: { chromium: 1 }, leaders: ['chromium'] }])
  })
})

describe('leaderboard trees', () => {
  const usable = { nodes: 50, controls: 10, namedControls: 10, headings: 2, landmarks: 1 }
  const unnamed = { ...usable, namedControls: 2 }

  it('counts usable trees only among the pages an engine passed', () => {
    const withTrees: Run = {
      ...run,
      results: [
        { ...result('chromium', 'a', 'passed'), tree: usable },
        { ...result('chromium', 'b', 'passed'), tree: unnamed },
        { ...result('chromium', 'c', 'blocked'), tree: usable },
        { ...result('chromium', 'd', 'passed'), tree: null },
      ],
    }
    expect(leaderboard(withTrees).find((standing) => standing.engine.id === 'chromium')?.trees).toEqual({ checked: 2, usable: 1 })
  })
})

describe('summarise', () => {
  it('records the site count and each engine pass rate for the run index', () => {
    const summary = summarise({ ...run, sites: [{ id: 'a', name: 'A', category: 'docs', url: 'https://a.test/', expect: [] }] })
    expect(summary.siteCount).toBe(1)
    expect(summary.passRates.chromium).toBeCloseTo(2 / 3)
    expect(summary.passRates.lightpanda).toBeCloseTo(1 / 3)
  })
})

describe('trend', () => {
  const at = (id: string, startedAt: string, origin: 'home' | 'data-centre', siteCount: number, rate: number | null): RunSummary => ({
    id,
    startedAt,
    origin,
    engines: [],
    siteCount,
    siteList: `list-${siteCount}`,
    passRates: rate === null ? {} : { lightpanda: rate },
  })
  const runs = [
    at('n4', '2026-11-23T03:00Z', 'data-centre', 124, 0.84),
    at('n1', '2026-11-20T03:00Z', 'data-centre', 124, 0.8),
    at('home', '2026-11-20T12:00Z', 'home', 124, 0.9),
    at('small', '2026-11-19T03:00Z', 'data-centre', 30, 0.7),
    at('n2', '2026-11-21T03:00Z', 'data-centre', 124, null),
    at('n3', '2026-11-22T03:00Z', 'data-centre', 124, 0.82),
  ]

  it('follows one engine through comparable runs, oldest first, up to the run being viewed', () => {
    expect(trend(runs, runs[5], 'lightpanda')).toEqual([
      { run: 'n1', passRate: 0.8 },
      { run: 'n3', passRate: 0.82 },
    ])
  })

  it('leaves out runs from another network, with a different site list, or without the engine', () => {
    expect(trend(runs, runs[0], 'lightpanda').map((point) => point.run)).toEqual(['n1', 'n3', 'n4'])
  })
})
