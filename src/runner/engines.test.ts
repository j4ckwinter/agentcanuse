import { describe, expect, it } from 'vitest'
import { kitesurfLaunch } from './engines'

const endpoint = 'wss://api.cloudflare.com/client/v4/accounts/abc/browser-run/devtools/browser?browser=kitesurf'

describe('kitesurfLaunch', () => {
  it('leaves Kitesurf out when no endpoint is set', () => {
    expect(kitesurfLaunch({})).toEqual({ unavailable: expect.stringContaining('KITESURF_ENDPOINT is not set') })
    expect(kitesurfLaunch({ KITESURF_ENDPOINT: '' })).toHaveProperty('unavailable')
  })

  it('sends the token as a bearer header to a hosted session', () => {
    const launch = kitesurfLaunch({ KITESURF_ENDPOINT: endpoint, KITESURF_TOKEN: 'secret' })
    expect(launch).toMatchObject({ engine: { id: 'kitesurf', endpoint, headers: { Authorization: 'Bearer secret' }, hosted: true } })
  })

  it('sends no auth header when there is no token', () => {
    expect(kitesurfLaunch({ KITESURF_ENDPOINT: endpoint, KITESURF_TOKEN: '' })).toMatchObject({ engine: { headers: {} } })
  })

  it('labels the version from KITESURF_VERSION, or as hosted', () => {
    expect(kitesurfLaunch({ KITESURF_ENDPOINT: endpoint })).toMatchObject({ engine: { version: 'hosted' } })
    expect(kitesurfLaunch({ KITESURF_ENDPOINT: endpoint, KITESURF_VERSION: 'beta' })).toMatchObject({ engine: { version: 'beta' } })
  })
})
