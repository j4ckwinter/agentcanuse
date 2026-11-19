import { describe, expect, it } from 'vitest'
import { hiddenReads, hiddenSample, readsHidden, textKey, withHiddenReads } from './hidden'
import type { EngineId, Outcome, Result } from './model'

const hidden = (index: number) => `Role details for job number ${index}, shown after See more`

describe('hiddenSample', () => {
  it('keeps hidden text long enough to mean something, once each, ignoring case and spacing', () => {
    expect(hiddenSample(['short', hidden(1), `  ${hidden(1).toUpperCase()} `], 'visible page text')).toEqual(['roledetailsforjobnumber1,shownafterseemore'])
  })

  it('drops hidden text that the page also shows, like a duplicated mobile menu', () => {
    expect(hiddenSample([hidden(1), hidden(2)], `Header ${hidden(2)} footer`)).toEqual(['roledetailsforjobnumber1,shownafterseemore'])
  })

  it('takes at most twenty pieces, each cut to a probe of eighty characters', () => {
    const sample = hiddenSample(Array.from({ length: 30 }, (_, index) => `${hidden(index)} ${'x'.repeat(100)}`), '')
    expect(sample).toHaveLength(20)
    expect(sample.every((probe) => probe.length === 80)).toBe(true)
  })
})

describe('hiddenSample from long blocks', () => {
  it('cuts a long hidden block into several probes, taking from each block in turn', () => {
    const long = Array.from({ length: 6 }, (_, index) => hidden(index)).join(' ')
    const sample = hiddenSample([long, hidden(9)], '')
    expect(sample.length).toBeGreaterThanOrEqual(4)
    expect(sample[1]).toBe('roledetailsforjobnumber9,shownafterseemore')
  })
})

describe('hiddenReads', () => {
  const sample = hiddenSample([1, 2, 3, 4, 5, 6].map(hidden), '')

  it('counts the hidden pieces an engine read, even with its words run together', () => {
    const text = `Intro ${hidden(1).replaceAll(' ', '')} and ${hidden(2)} and ${hidden(3)}`
    expect(hiddenReads(sample, text)).toEqual({ sampled: 6, read: 3 })
  })

  it('gives nothing when the page hid too little to judge', () => {
    expect(hiddenReads(sample.slice(0, 4), hidden(1))).toBeNull()
  })

  it('says an engine reads hidden content when it read at least half the sample', () => {
    expect(readsHidden({ sampled: 6, read: 3 })).toBe(true)
    expect(readsHidden({ sampled: 6, read: 2 })).toBe(false)
  })
})

describe('withHiddenReads', () => {
  function result(engine: EngineId, site: string, outcome: Outcome): Result {
    return { site, engine, outcome, status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 0, linkCount: 0, durationMs: 0, error: null, shot: null, tree: null, hidden: null }
  }
  const sample = hiddenSample([1, 2, 3, 4, 5].map(hidden), '')
  const evidence = {
    samples: new Map([['a', sample], ['b', sample]]),
    texts: new Map([
      [textKey('a', 'lightpanda'), [1, 2, 3, 4, 5].map(hidden).join(' ')],
      [textKey('b', 'lightpanda'), [1, 2, 3, 4, 5].map(hidden).join(' ')],
    ]),
  }

  it('judges a lighter engine only where both it and Chromium passed', () => {
    const results = withHiddenReads([result('chromium', 'a', 'passed'), result('lightpanda', 'a', 'passed'), result('chromium', 'b', 'blocked'), result('lightpanda', 'b', 'passed')], evidence)
    expect(results.map((entry) => entry.hidden)).toEqual([null, { sampled: 5, read: 5 }, null, null])
  })
})
