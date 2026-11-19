import { expect, it } from 'vitest'
import { findings } from './findings'
import type { EngineId, Outcome, Result, Run } from './model'

function result(site: string, engine: EngineId, outcome: Outcome, durationMs: number): Result {
  return { site, engine, outcome, status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 0, linkCount: 0, durationMs, error: null, shot: null }
}

const run: Run = {
  id: 'r',
  startedAt: '2026-11-20T03:17:00.000Z',
  origin: 'data-centre',
  engines: [
    { id: 'chromium', version: '158' },
    { id: 'lightpanda', version: '1.0.4' },
  ],
  sites: [
    { id: 'zillow', name: 'Zillow', category: 'listings', url: 'https://www.zillow.com/', expect: [] },
    { id: 'gov-uk', name: 'GOV.UK', category: 'government', url: 'https://www.gov.uk/', expect: [] },
  ],
  results: [
    result('zillow', 'chromium', 'blocked', 300),
    result('zillow', 'lightpanda', 'passed', 900),
    result('gov-uk', 'chromium', 'passed', 2000),
    result('gov-uk', 'lightpanda', 'passed', 1100),
  ],
}

it('summarises the leader, the blocking split, the hardest category and the speed range', () => {
  expect(findings(run)).toEqual({
    leader: { engine: 'lightpanda', passRate: 1 },
    blockedOnlyChromium: 1,
    blockedOnlyOthers: 0,
    hardestCategory: { category: 'listings', passRate: 0.5 },
    fastest: { engine: 'lightpanda', medianMs: 1000 },
    slowest: { engine: 'chromium', medianMs: 1150 },
  })
})
