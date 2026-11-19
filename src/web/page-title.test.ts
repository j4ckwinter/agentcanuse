import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { EngineId, Outcome, Result, Run } from '../core/model'
import { BRAND_NAME } from './brand'
import { HOME_TITLE, pageTitle } from './page-title'
import { NO_FILTER } from './site-filter'

const run = {
  id: 'r',
  startedAt: '2026-11-19T13:37:00.000Z',
  origin: 'home',
  engines: [],
  sites: [{ id: 'zillow', name: 'Zillow', category: 'listings', url: 'https://www.zillow.com/', expect: [] }],
  results: [visit('chromium', 'blocked'), visit('lightpanda', 'passed')],
} satisfies Run

function visit(engine: EngineId, outcome: Outcome): Result {
  return { site: 'zillow', engine, outcome, status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 0, linkCount: 0, durationMs: 1000, error: null, shot: null, tree: null }
}

describe('pageTitle', () => {
  it('gives the home page the question the site answers', () => {
    expect(pageTitle({ view: 'home', run: null }, run)).toBe(HOME_TITLE)
  })

  it('gives a site page its verdict, so a shared link explains itself', () => {
    expect(pageTitle({ view: 'sites', run: null, site: 'zillow', filter: NO_FILTER }, run)).toBe('Zillow: Blocks headless Chrome · Agent Can Use')
  })

  it('names the engine or section being viewed', () => {
    expect(pageTitle({ view: 'sites', run: null, site: null, filter: NO_FILTER }, run)).toBe('Sites · Agent Can Use')
    expect(pageTitle({ view: 'engines', run: null, engine: 'lightpanda' }, run)).toBe('Lightpanda · Agent Can Use')
    expect(pageTitle({ view: 'engines', run: null, engine: null }, run)).toBe('Engines · Agent Can Use')
    expect(pageTitle({ view: 'method', run: null }, null)).toBe('Method · Agent Can Use')
  })

  it('falls back to the section name for a site it cannot find', () => {
    expect(pageTitle({ view: 'sites', run: null, site: 'missing', filter: NO_FILTER }, run)).toBe('Sites · Agent Can Use')
  })
})

describe('the static pages', () => {
  const root = join(import.meta.dirname, '..', '..')

  it('use the same name and home title as the app', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8')
    expect(html).toContain(`<title>${HOME_TITLE}</title>`)
    expect(html).toContain(`<meta property="og:title" content="${BRAND_NAME}" />`)
    const manifest = JSON.parse(readFileSync(join(root, 'public', 'site.webmanifest'), 'utf8')) as { name: string; short_name: string }
    expect([manifest.name, manifest.short_name]).toEqual([BRAND_NAME, BRAND_NAME])
  })
})
