import { describe, expect, it } from 'vitest'
import type { Run } from '../core/model'
import { HOME_TITLE, pageTitle } from './page-title'
import { NO_FILTER } from './site-filter'

const run = {
  id: 'r',
  startedAt: '2026-11-19T13:37:00.000Z',
  origin: 'home',
  engines: [],
  sites: [{ id: 'zillow', name: 'Zillow', category: 'listings', url: 'https://www.zillow.com/', expect: [] }],
  results: [],
} satisfies Run

describe('pageTitle', () => {
  it('gives the home page the question the site answers', () => {
    expect(pageTitle({ view: 'home', run: null }, run)).toBe(HOME_TITLE)
  })

  it('names the site, engine or section being viewed', () => {
    expect(pageTitle({ view: 'sites', run: null, site: 'zillow', filter: NO_FILTER }, run)).toBe('Zillow · agentcanuse')
    expect(pageTitle({ view: 'sites', run: null, site: null, filter: NO_FILTER }, run)).toBe('Sites · agentcanuse')
    expect(pageTitle({ view: 'engine', run: null, engine: 'lightpanda' }, run)).toBe('Lightpanda · agentcanuse')
    expect(pageTitle({ view: 'method' }, null)).toBe('Method · agentcanuse')
  })

  it('falls back to the section name for a site it cannot find', () => {
    expect(pageTitle({ view: 'sites', run: null, site: 'missing', filter: NO_FILTER }, run)).toBe('Sites · agentcanuse')
  })
})
