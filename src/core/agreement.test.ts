import { expect, it } from 'vitest'
import { sitesWhereEnginesDisagree } from './agreement'
import type { EngineId, Outcome, Result } from './model'

function result(site: string, engine: EngineId, outcome: Outcome): Result {
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

it('finds the sites where engines reached different outcomes, ignoring skipped visits', () => {
  const results = [
    result('zillow', 'chromium', 'blocked'),
    result('zillow', 'lightpanda', 'passed'),
    result('gov-uk', 'chromium', 'passed'),
    result('gov-uk', 'lightpanda', 'passed'),
    result('ebay', 'chromium', 'blocked'),
    result('ebay', 'lightpanda', 'blocked'),
    result('npm', 'chromium', 'skipped'),
    result('npm', 'lightpanda', 'passed'),
  ]
  expect(sitesWhereEnginesDisagree(results)).toEqual(new Set(['zillow']))
})
