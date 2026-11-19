import { describe, expect, it } from 'vitest'
import { marginOfError, wilsonInterval } from './confidence'

describe('wilsonInterval', () => {
  it('gives the 95% Wilson interval for a share', () => {
    const interval = wilsonInterval(8, 10)!
    expect(interval.low).toBeCloseTo(0.4902, 3)
    expect(interval.high).toBeCloseTo(0.9433, 3)
  })

  it('stays inside 0 and 1 at the extremes', () => {
    const all = wilsonInterval(10, 10)!
    expect(all.high).toBe(1)
    expect(all.low).toBeGreaterThan(0.69)
    expect(wilsonInterval(0, 10)!.low).toBe(0)
  })

  it('has nothing to say with no trials', () => {
    expect(wilsonInterval(0, 0)).toBeNull()
  })
})

describe('marginOfError', () => {
  it('narrows as the sample grows', () => {
    expect(marginOfError(80, 100)!).toBeLessThan(marginOfError(8, 10)!)
    expect(marginOfError(97, 121)!).toBeCloseTo(0.07, 2)
  })
})
