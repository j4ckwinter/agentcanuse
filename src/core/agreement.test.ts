import { expect, it } from 'vitest'
import { blockSplit, sitesWhereEnginesDisagree } from './agreement'
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

it('splits blocking into sites that stopped only Chromium and sites that stopped only another engine', () => {
  const results = [
    result('zillow', 'chromium', 'blocked'),
    result('zillow', 'lightpanda', 'passed'),
    result('zillow', 'obscura', 'blocked'),
    result('arxiv', 'chromium', 'passed'),
    result('arxiv', 'lightpanda', 'blocked'),
    result('ebay', 'chromium', 'blocked'),
    result('ebay', 'lightpanda', 'blocked'),
    result('booking', 'chromium', 'blocked'),
    result('booking', 'obscura', 'failed'),
  ]
  expect(blockSplit(results)).toEqual({ blockedOnlyForReference: ['zillow'], blockedOnlyForOthers: ['arxiv'] })
})
