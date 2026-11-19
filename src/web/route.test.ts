import { describe, expect, it } from 'vitest'
import { parseRoute, routeHash, type Route } from './route'
import { NO_FILTER } from './site-filter'

describe('routes', () => {
  it('opens the home page for an empty, old or unknown hash', () => {
    expect(parseRoute('#leaderboard')).toEqual({ view: 'home', run: null })
    expect(parseRoute('')).toEqual({ view: 'home', run: null })
    expect(parseRoute('#nonsense')).toEqual({ view: 'home', run: null })
  })

  it('reads a site comparison and its filter from the hash', () => {
    expect(parseRoute('#sites/quotes-js?category=news&disagree=1&q=bbc&blocking=only-chromium')).toEqual({
      view: 'sites',
      run: null,
      site: 'quotes-js',
      filter: { query: 'bbc', category: 'news', disagreeingOnly: true, blocking: 'only-chromium' },
    })
  })

  it('ignores filter values it does not know', () => {
    expect(parseRoute('#sites?category=sport&blocking=sometimes')).toEqual({ view: 'sites', run: null, site: null, filter: NO_FILTER })
  })

  it('reads an engine page, and falls back to the home page for an unknown engine', () => {
    expect(parseRoute('#engine/obscura?run=2026-11-19T13-37Z')).toEqual({ view: 'engine', run: '2026-11-19T13-37Z', engine: 'obscura' })
    expect(parseRoute('#engine/netscape')).toEqual({ view: 'home', run: null })
  })

  it('treats a site id that cannot be decoded as no site', () => {
    expect(parseRoute('#sites/%E0')).toEqual({ view: 'sites', run: null, site: null, filter: NO_FILTER })
  })

  it('writes hashes that read back as the same route', () => {
    const routes: Route[] = [
      { view: 'home', run: null },
      { view: 'home', run: '2026-11-19T12-24Z' },
      { view: 'sites', run: null, site: null, filter: NO_FILTER },
      { view: 'sites', run: '2026-11-19T12-24Z', site: 'gov-uk', filter: { query: 'a b', category: 'docs', disagreeingOnly: true, blocking: 'only-others' } },
      { view: 'engine', run: null, engine: 'lightpanda' },
      { view: 'releases' },
      { view: 'method' },
    ]
    for (const route of routes) expect(parseRoute(routeHash(route))).toEqual(route)
  })

  it('writes the home page as a bare hash', () => {
    expect(routeHash({ view: 'home', run: null })).toBe('#')
    expect(routeHash({ view: 'home', run: 'r1' })).toBe('#?run=r1')
  })

  it('keeps an unfiltered hash short', () => {
    expect(routeHash({ view: 'sites', run: null, site: null, filter: NO_FILTER })).toBe('#sites')
  })
})
