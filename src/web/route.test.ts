import { describe, expect, it } from 'vitest'
import { parseRoute, routeHash, sectionRoute, type Route } from './route'
import { NO_FILTER } from './site-filter'

describe('routes', () => {
  it('opens the home page for an empty, old or unknown hash', () => {
    expect(parseRoute('')).toEqual({ view: 'home', run: null })
    expect(parseRoute('#leaderboard')).toEqual({ view: 'home', run: null })
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

  it('reads the engines list and one engine, including old engine links', () => {
    expect(parseRoute('#engines')).toEqual({ view: 'engines', run: null, engine: null })
    expect(parseRoute('#engines/obscura?run=2026-11-19T13-37Z')).toEqual({ view: 'engines', run: '2026-11-19T13-37Z', engine: 'obscura' })
    expect(parseRoute('#engine/lightpanda')).toEqual({ view: 'engines', run: null, engine: 'lightpanda' })
    expect(parseRoute('#engines/netscape')).toEqual({ view: 'engines', run: null, engine: null })
  })

  it('keeps the selected run on every page', () => {
    expect(parseRoute('#method?run=r1')).toEqual({ view: 'method', run: 'r1' })
    expect(parseRoute('#releases?run=r1')).toEqual({ view: 'releases', run: 'r1' })
    expect(routeHash(sectionRoute('method', 'r1'))).toBe('#method?run=r1')
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
      { view: 'engines', run: null, engine: null },
      { view: 'engines', run: 'r2', engine: 'lightpanda' },
      { view: 'releases', run: null },
      { view: 'method', run: 'r3' },
    ]
    for (const route of routes) expect(parseRoute(routeHash(route))).toEqual(route)
  })

  it('writes the home page as a bare hash and keeps an unfiltered hash short', () => {
    expect(routeHash({ view: 'home', run: null })).toBe('#')
    expect(routeHash({ view: 'home', run: 'r1' })).toBe('#?run=r1')
    expect(routeHash({ view: 'sites', run: null, site: null, filter: NO_FILTER })).toBe('#sites')
  })
})
