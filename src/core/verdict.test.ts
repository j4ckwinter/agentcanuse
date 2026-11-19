import { describe, expect, it } from 'vitest'
import type { EngineId, Outcome, Result } from './model'
import { comparedVerdict, verdictFor, verdictsBySite } from './verdict'

function result(engine: EngineId, outcome: Outcome, site = 'site'): Result {
  return { site, engine, outcome, status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 0, linkCount: 0, durationMs: 0, error: null, shot: null, tree: null, hidden: null }
}
const verdict = (chromium: Outcome, lightpanda: Outcome, obscura: Outcome) =>
  verdictFor([result('chromium', chromium), result('lightpanda', lightpanda), result('obscura', obscura)])

describe('verdictFor', () => {
  it('says a site works everywhere when every engine that visited passed', () => {
    expect(verdict('passed', 'passed', 'passed')).toBe('works-everywhere')
    expect(verdict('passed', 'skipped', 'passed')).toBe('works-everywhere')
  })

  it('says a site blocks every engine when all of them were blocked', () => {
    expect(verdict('blocked', 'blocked', 'blocked')).toBe('blocks-every-engine')
  })

  it('says a site blocks Chromium when Chromium was blocked and a lighter engine passed', () => {
    expect(verdict('blocked', 'passed', 'blocked')).toBe('blocks-chromium')
  })

  it('says a site trips up lighter engines when Chromium passed and another engine did not', () => {
    expect(verdict('passed', 'empty', 'passed')).toBe('trips-lighter-engines')
    expect(verdict('passed', 'blocked', 'passed')).toBe('trips-lighter-engines')
  })

  it('calls anything else mixed, and a site nobody visited not visited', () => {
    expect(verdict('empty', 'incomplete', 'failed')).toBe('mixed')
    expect(verdict('skipped', 'skipped', 'skipped')).toBe('not-visited')
  })
})

describe('verdictsBySite', () => {
  it('gives each site in a run its verdict', () => {
    const results = [result('chromium', 'blocked', 'zillow'), result('lightpanda', 'passed', 'zillow'), result('chromium', 'passed', 'gov-uk'), result('lightpanda', 'passed', 'gov-uk')]
    expect(verdictsBySite(results)).toEqual(new Map([['zillow', 'blocks-chromium'], ['gov-uk', 'works-everywhere']]))
  })
})

describe('comparedVerdict', () => {
  it('gives no verdict when fewer than two engines visited, since there is nothing to compare', () => {
    expect(comparedVerdict([result('lightpanda', 'passed')])).toBeNull()
    expect(comparedVerdict([result('lightpanda', 'passed'), result('chromium', 'skipped')])).toBeNull()
  })

  it('compares two or more engines the same way as verdictFor', () => {
    expect(comparedVerdict([result('chromium', 'blocked'), result('lightpanda', 'passed')])).toBe('blocks-chromium')
  })
})
