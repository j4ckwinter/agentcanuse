import { describe, expect, it } from 'vitest'
import { givesUp, stopsPublishing } from './publishing'

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

describe('givesUp', () => {
  it('drops Kitesurf from a run after three stalls or failed restarts in a row', () => {
    expect(givesUp('kitesurf', 2)).toBe(false)
    expect(givesUp('kitesurf', 3)).toBe(true)
  })

  it('never gives up on a local engine', () => {
    expect(givesUp('chromium', 50)).toBe(false)
  })
})
