import { describe, expect, it } from 'vitest'
import type { Site } from '../core/model'
import { filterSites, NO_FILTER } from './site-filter'

const sites: Site[] = [
  { id: 'zillow', name: 'Zillow', category: 'listings', url: 'https://www.zillow.com/', expect: [] },
  { id: 'gov-uk', name: 'GOV.UK bank holidays', category: 'government', url: 'https://www.gov.uk/bank-holidays', expect: [] },
  { id: 'nhs', name: 'NHS condition', category: 'government', url: 'https://www.nhs.uk/conditions/flu/', expect: [] },
]
const ids = (list: Site[]) => list.map((site) => site.id)

describe('filterSites', () => {
  it('keeps every site when nothing is filtered', () => {
    expect(ids(filterSites(sites, NO_FILTER, new Set()))).toEqual(['zillow', 'gov-uk', 'nhs'])
  })

  it('matches the search against the name, id or hostname, ignoring case', () => {
    expect(ids(filterSites(sites, { ...NO_FILTER, query: 'BANK' }, new Set()))).toEqual(['gov-uk'])
    expect(ids(filterSites(sites, { ...NO_FILTER, query: 'nhs.uk' }, new Set()))).toEqual(['nhs'])
  })

  it('combines the category with the disagreeing-only switch', () => {
    const filter = { ...NO_FILTER, category: 'government' as const, disagreeingOnly: true }
    expect(ids(filterSites(sites, filter, new Set(['nhs', 'zillow'])))).toEqual(['nhs'])
  })
})
