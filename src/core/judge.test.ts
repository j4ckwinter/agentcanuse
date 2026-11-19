import { describe, expect, it } from 'vitest'
import { judge, skipped } from './judge'
import type { Site, Visit } from './model'

const site: Site = {
  id: 'example',
  name: 'Example',
  category: 'reference',
  url: 'https://example.com/',
  expect: ['Theory of Relativity', 'Nobel Prize'],
}

const longText = 'Albert Einstein developed the theory of relativity and won the Nobel Prize in Physics. '.repeat(5)

function visit(overrides: Partial<Visit> = {}): Visit {
  return { status: 200, title: 'Albert Einstein', text: longText, linkCount: 12, durationMs: 840, error: null, ...overrides }
}

describe('judge', () => {
  it('passes a page that shows every expected phrase, ignoring case and spacing', () => {
    const result = judge(site, 'lightpanda', visit({ text: longText.replace('theory of', 'THEORY\n  of') }), null)
    expect(result.outcome).toBe('passed')
    expect(result.found).toEqual(['Theory of Relativity', 'Nobel Prize'])
    expect(result.missing).toEqual([])
  })

  it('marks a rendered page that lacks an expected phrase as incomplete', () => {
    const result = judge(site, 'chromium', visit({ text: longText.replaceAll('Nobel Prize', 'award') }), null)
    expect(result.outcome).toBe('incomplete')
    expect(result.missing).toEqual(['Nobel Prize'])
  })

  it('passes a readable page when no phrases are expected, as a one-off check does', () => {
    expect(judge({ ...site, expect: [] }, 'chromium', visit(), null).outcome).toBe('passed')
    expect(judge({ ...site, expect: [] }, 'chromium', visit({ text: 'Loading…' }), null).outcome).toBe('empty')
  })

  it('treats a page with almost no text as empty', () => {
    expect(judge(site, 'obscura', visit({ text: 'Loading…' }), null).outcome).toBe('empty')
  })

  it('reports a blocking status code as blocked', () => {
    expect(judge(site, 'chromium', visit({ status: 403 }), null).outcome).toBe('blocked')
  })

  it('reports a short bot challenge page as blocked', () => {
    const challenge = visit({ title: 'Just a moment...', text: 'Checking your browser before accessing example.com.' })
    expect(judge(site, 'lightpanda', challenge, null).outcome).toBe('blocked')
  })

  it('recognises the bot checks seen on real sites as blocked', () => {
    const checks = [
      visit({ title: 'Skyscanner', text: 'Are you a person or a robot?' }),
      visit({ title: 'Human Verification | Open Library', text: 'Human Verification' }),
      visit({ title: 'codepen.io', text: 'Performing security verification' }),
      visit({ title: 'Attention Required!', text: 'Sorry, you have been blocked' }),
    ]
    for (const check of checks) expect(judge(site, 'chromium', check, null).outcome).toBe('blocked')
  })

  it('does not call a long article blocked because it mentions captcha', () => {
    const article = visit({ text: longText + ' A captcha is a test. '.repeat(100) })
    expect(judge(site, 'chromium', article, null).outcome).toBe('passed')
  })

  it('reports an engine error as failed even when text came back', () => {
    expect(judge(site, 'kitesurf', visit({ error: 'Navigation timeout' }), null).outcome).toBe('failed')
  })

  it('keeps a short single-line excerpt and the screenshot path', () => {
    const result = judge(site, 'chromium', visit({ text: 'a\n\nb  c'.repeat(400) }), 'shots/x.webp')
    expect(result.excerpt).not.toContain('\n')
    expect(result.excerpt.length).toBeLessThanOrEqual(600)
    expect(result.shot).toBe('shots/x.webp')
  })
})

describe('skipped', () => {
  it('records why a site was not visited', () => {
    const result = skipped(site, 'chromium', 'robots.txt disallows this page')
    expect(result.outcome).toBe('skipped')
    expect(result.error).toBe('robots.txt disallows this page')
  })
})
