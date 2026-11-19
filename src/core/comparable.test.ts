import { describe, expect, it } from 'vitest'
import { sameSurvey, siteListFingerprint } from './comparable'

describe('siteListFingerprint', () => {
  it('ignores the order of the sites', () => {
    expect(siteListFingerprint(['zillow', 'gov-uk', 'nhs'])).toBe(siteListFingerprint(['nhs', 'zillow', 'gov-uk']))
  })

  it('tells apart two lists of the same length', () => {
    expect(siteListFingerprint(['zillow', 'gov-uk'])).not.toBe(siteListFingerprint(['zillow', 'nhs']))
  })
})

describe('sameSurvey', () => {
  it('needs the same network and the same site list', () => {
    const home = { origin: 'home' as const, siteList: 'a1' }
    expect(sameSurvey(home, { origin: 'home', siteList: 'a1' })).toBe(true)
    expect(sameSurvey(home, { origin: 'data-centre', siteList: 'a1' })).toBe(false)
    expect(sameSurvey(home, { origin: 'home', siteList: 'b2' })).toBe(false)
  })
})
