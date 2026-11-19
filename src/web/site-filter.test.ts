import { describe, expect, it } from 'vitest'
import type { Site } from '../core/model'
import { describeFilter, filterSites, neighbours, NO_FILTER, searchSites, type SiteFacts } from './site-filter'

const sites: Site[] = [
  { id: 'zillow', name: 'Zillow', category: 'listings', url: 'https://www.zillow.com/', expect: [] },
  { id: 'gov-uk', name: 'GOV.UK bank holidays', category: 'government', url: 'https://www.gov.uk/bank-holidays', expect: [] },
  { id: 'nhs', name: 'NHS condition', category: 'government', url: 'https://www.nhs.uk/conditions/flu/', expect: [] },
  { id: 'arxiv', name: 'arXiv abstract', category: 'reference', url: 'https://arxiv.org/abs/1706.03762', expect: [] },
]
const facts: SiteFacts = { disagreeing: new Set(['zillow', 'nhs', 'arxiv']), split: { blockedOnlyForReference: ['zillow'], blockedOnlyForOthers: ['arxiv'] } }
const ids = (list: (Site | null)[]) => list.map((site) => site?.id ?? null)

describe('filterSites', () => {
  it('keeps every site when nothing is filtered', () => {
    expect(ids(filterSites(sites, NO_FILTER, facts))).toEqual(['zillow', 'gov-uk', 'nhs', 'arxiv'])
  })

  it('matches the search against the name, id or hostname, ignoring case', () => {
    expect(ids(filterSites(sites, { ...NO_FILTER, query: 'BANK' }, facts))).toEqual(['gov-uk'])
    expect(ids(filterSites(sites, { ...NO_FILTER, query: 'nhs.uk' }, facts))).toEqual(['nhs'])
  })

  it('combines the category with the disagreeing-only switch', () => {
    expect(ids(filterSites(sites, { ...NO_FILTER, category: 'government', disagreeingOnly: true }, facts))).toEqual(['nhs'])
  })

  it('narrows to the sites that blocked only Chromium, or only another engine', () => {
    expect(ids(filterSites(sites, { ...NO_FILTER, blocking: 'only-chromium' }, facts))).toEqual(['zillow'])
    expect(ids(filterSites(sites, { ...NO_FILTER, blocking: 'only-others' }, facts))).toEqual(['arxiv'])
  })
})

describe('neighbours', () => {
  it('finds the sites either side of the current one in the filtered order', () => {
    const { previous, next } = neighbours(sites, 'gov-uk')
    expect(ids([previous, next])).toEqual(['zillow', 'nhs'])
  })

  it('has nothing before the first site, nothing after the last, and nothing for a site not in the list', () => {
    expect(neighbours(sites, 'zillow').previous).toBeNull()
    expect(neighbours(sites, 'arxiv').next).toBeNull()
    expect(neighbours(sites, 'missing')).toEqual({ previous: null, next: null })
  })
})

describe('searchSites', () => {
  it('finds nothing for an empty search', () => {
    expect(searchSites(sites, '  ')).toEqual([])
  })

  it('puts sites whose name or address starts with the search first', () => {
    expect(ids(searchSites(sites, 'zi'))).toEqual(['zillow'])
    expect(ids(searchSites(sites, 'gov'))).toEqual(['gov-uk'])
    expect(ids(searchSites(sites, 'a'))).toEqual(['arxiv', 'gov-uk'])
  })
})

describe('describeFilter', () => {
  it('names the list a site page steps through', () => {
    expect(describeFilter(NO_FILTER)).toBe('All sites')
    expect(describeFilter({ ...NO_FILTER, disagreeingOnly: true, category: 'news' })).toBe('Engines disagree · News')
    expect(describeFilter({ ...NO_FILTER, blocking: 'only-chromium', query: ' bbc ' })).toBe('Blocked Chromium only · “bbc”')
  })
})
