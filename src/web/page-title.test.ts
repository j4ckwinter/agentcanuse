import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Run } from '../core/model'
import { BRAND_NAME } from './brand'
import { HOME_TITLE, pageTitle } from './page-title'
import { NO_FILTER } from './site-filter'

const run = {
  id: 'r',
  startedAt: '2026-11-19T13:37:00.000Z',
  origin: 'home',
  engines: [],
  sites: [{ id: 'zillow', name: 'Zillow', category: 'listings', url: 'https://www.zillow.com/', expect: [] }],
  results: [],
} satisfies Run

describe('pageTitle', () => {
  it('gives the home page the question the site answers', () => {
    expect(pageTitle({ view: 'home', run: null }, run)).toBe(HOME_TITLE)
  })

  it('names the site, engine or section being viewed', () => {
    expect(pageTitle({ view: 'sites', run: null, site: 'zillow', filter: NO_FILTER }, run)).toBe('Zillow · Agent Can Use')
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
