import { expect, it } from 'vitest'
import { fromStored, type StoredRun } from './stored'

it('reads a run saved before trees were captured as having no tree for each visit', () => {
  const stored: StoredRun = {
    id: 'r',
    startedAt: '2026-11-19T12:19:00.000Z',
    origin: 'home',
    engines: [{ id: 'chromium', version: '158' }],
    sites: [],
    results: [{ site: 'a', engine: 'chromium', outcome: 'passed', status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 900, linkCount: 3, durationMs: 1000, error: null, shot: null }],
  }
  expect(fromStored(stored).results[0].tree).toBeNull()
  expect(fromStored(stored).results[0].hidden).toBeNull()
})
