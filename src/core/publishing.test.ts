import { describe, expect, it } from 'vitest'
import { stopsPublishing } from './publishing'

describe('stopsPublishing', () => {
  it('holds back a run when a local engine fails', () => {
    expect(stopsPublishing('chromium', false)).toBe(true)
    expect(stopsPublishing('obscura', false)).toBe(true)
  })

  it('publishes without Kitesurf when the hosted service fails', () => {
    expect(stopsPublishing('kitesurf', false)).toBe(false)
  })

  it('publishes when an engine was expected to be missing', () => {
    expect(stopsPublishing('kitesurf', true)).toBe(false)
    expect(stopsPublishing('lightpanda', true)).toBe(false)
  })
})
