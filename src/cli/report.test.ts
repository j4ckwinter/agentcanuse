import { expect, it } from 'vitest'
import type { Result } from '../core/model'
import { formatReport } from './report'

function result(outcome: Result['outcome'], overrides: Partial<Result> = {}): Result {
  return { site: 'check', engine: 'chromium', outcome, status: 200, title: '', excerpt: '', found: [], missing: [], textLength: 3329, linkCount: 0, durationMs: 2500, error: null, shot: null, tree: null, ...overrides }
}

it('prints one aligned row per engine, the engines it skipped, and the verdict', () => {
  const report = formatReport(
    'https://www.zillow.com/',
    [
      { engine: 'chromium', version: '158.0.8127.36', result: result('blocked', { status: 403, missing: ['Zillow'], textLength: 106 }) },
      { engine: 'lightpanda', version: '1.0.4', result: result('passed', { durationMs: 3200, tree: { nodes: 400, controls: 40, namedControls: 40, headings: 5, landmarks: 3 } }) },
    ],
    [{ engine: 'kitesurf', reason: 'KITESURF_ENDPOINT is not set' }],
    'blocks-chromium',
  )
  expect(report).toBe(
    [
      'https://www.zillow.com/',
      '',
      'engine      version        outcome  status  time  tree        detail',
      'chromium    158.0.8127.36  blocked  403     2.5s  not judged  missing "Zillow"',
      'lightpanda  1.0.4          passed   200     3.2s  usable      3,329 characters read',
      'kitesurf: not run (KITESURF_ENDPOINT is not set)',
      '',
      'Blocks headless Chrome. zillow.com blocked Chromium, but a lighter engine got in.',
    ].join('\n'),
  )
})
