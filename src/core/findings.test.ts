import { describe, expect, it } from 'vitest'
import { findings } from './findings'
import type { EngineId, Outcome, Result, Run, Site } from './model'

function result(site: string, engine: EngineId, outcome: Outcome): Result {
  return { site, engine, outcome, status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 0, linkCount: 0, durationMs: 1000, error: null, shot: null }
}

function site(id: string): Site {
  return { id, name: id, category: 'docs', url: `https://${id}.test/`, expect: [] }
}

function runOf(outcomes: Record<'chromium' | 'lightpanda', Outcome[]>): Run {
  const count = outcomes.chromium.length
  const sites = Array.from({ length: count }, (_, index) => site(`s${index}`))
  return {
    id: 'r',
    startedAt: '2026-11-20T03:17:00.000Z',
    origin: 'data-centre',
    engines: [
      { id: 'chromium', version: '158' },
      { id: 'lightpanda', version: '1.0.4' },
    ],
    sites,
    results: sites.flatMap((entry, index) => [result(entry.id, 'chromium', outcomes.chromium[index]), result(entry.id, 'lightpanda', outcomes.lightpanda[index])]),
  }
}

function repeat(outcome: Outcome, times: number): Outcome[] {
  return Array.from({ length: times }, () => outcome)
}

describe('findings', () => {
  it('calls the engines level when their margins of error overlap, giving the range of pass rates', () => {
    const run = runOf({ chromium: ['blocked', 'passed'], lightpanda: ['passed', 'passed'] })
    expect(findings(run)).toEqual({ overall: { kind: 'level', low: 0.5, high: 1 }, blockedOnlyChromium: 1, blockedOnlyOthers: 0 })
  })

  it('names a leader only when its margin of error clears every other engine', () => {
    const run = runOf({ chromium: [...repeat('passed', 40), ...repeat('blocked', 60)], lightpanda: [...repeat('passed', 90), ...repeat('blocked', 10)] })
    expect(findings(run).overall).toEqual({ kind: 'ahead', engine: 'lightpanda', passRate: 0.9 })
  })
})
