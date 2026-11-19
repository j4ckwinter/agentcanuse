import { describe, expect, it } from 'vitest'
import { judge, skipped } from './judge'
import type { Site, Visit } from './model'

const site: Site = {
  id: 'example',
  name: 'Example',
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
