import { describe, expect, it } from 'vitest'
import { pageViewFor } from './analytics'
import { NO_FILTER } from './site-filter'

describe('pageViewFor', () => {
  it('groups site and engine pages by pattern while keeping the page itself', () => {
    expect(pageViewFor({ view: 'sites', run: '2026-11-19T16-37Z', site: 'zillow', filter: { ...NO_FILTER, disagreeingOnly: true } })).toEqual({ route: '/sites/[site]', path: '/sites/zillow' })
    expect(pageViewFor({ view: 'engines', run: null, engine: 'obscura' })).toEqual({ route: '/engines/[engine]', path: '/engines/obscura' })
  })

  it('records sections without the run or filters', () => {
    expect(pageViewFor({ view: 'home', run: '2026-11-19T16-37Z' })).toEqual({ route: '/', path: '/' })
    expect(pageViewFor({ view: 'sites', run: null, site: null, filter: { ...NO_FILTER, query: 'zillow' } })).toEqual({ route: '/sites', path: '/sites' })
  })
})
