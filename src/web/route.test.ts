import { describe, expect, it } from 'vitest'
import { parseRoute, routeHash } from './route'

describe('routes', () => {
  it('opens the leaderboard for an empty or unknown hash', () => {
    expect(parseRoute('')).toEqual({ view: 'leaderboard' })
    expect(parseRoute('#nonsense')).toEqual({ view: 'leaderboard' })
  })

  it('reads a site comparison from the hash', () => {
    expect(parseRoute('#sites/quotes-js')).toEqual({ view: 'sites', site: 'quotes-js' })
    expect(parseRoute('#sites')).toEqual({ view: 'sites', site: null })
  })

  it('writes hashes that read back as the same route', () => {
    for (const route of [{ view: 'leaderboard' }, { view: 'sites', site: 'gov-uk' }, { view: 'sites', site: null }, { view: 'releases' }, { view: 'method' }] as const) {
      expect(parseRoute(routeHash(route))).toEqual(route)
    }
  })
})
