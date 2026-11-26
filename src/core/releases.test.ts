import { describe, expect, it } from 'vitest'
import { pinUpdates } from './releases'

const pins = { chromium: 'stable', lightpanda: '1.0.4', obscura: 'v0.2.7', kitesurf: 'endpoint', moli: 'v1.1.27' }

describe('pinUpdates', () => {
  it('bumps an engine whose latest release differs from its pin', () => {
    expect(pinUpdates(pins, { lightpanda: '1.0.5', obscura: 'v0.2.7' })).toEqual([{ engine: 'lightpanda', from: '1.0.4', to: '1.0.5' }])
  })

  it('changes nothing when every pin is already the latest release', () => {
    expect(pinUpdates(pins, { lightpanda: '1.0.4', obscura: 'v0.2.7' })).toEqual([])
  })

  it('leaves an engine alone when its latest release could not be found', () => {
    expect(pinUpdates(pins, { obscura: 'v0.2.8' })).toEqual([{ engine: 'obscura', from: 'v0.2.7', to: 'v0.2.8' }])
  })

  it('bumps Moli from its GitHub releases like the other local engines', () => {
    expect(pinUpdates(pins, { moli: 'v1.1.28' })).toEqual([{ engine: 'moli', from: 'v1.1.27', to: 'v1.1.28' }])
  })

  it('never pins engines that are not installed from a GitHub release', () => {
    expect(pinUpdates(pins, { chromium: '159.0.1', kitesurf: 'v1' })).toEqual([])
  })
})
