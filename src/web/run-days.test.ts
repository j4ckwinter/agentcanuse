import { expect, it } from 'vitest'
import type { RunSummary } from '../core/model'
import { runsByDay } from './run-days'

function run(startedAt: string): RunSummary {
  return { id: startedAt, startedAt, origin: 'home', engines: [], siteCount: 124, siteList: 'x', passRates: {} }
}

it('groups runs, newest first, under the UTC day they started', () => {
  const runs = [run('2026-11-20T03:17:00.000Z'), run('2026-11-19T16:37:00.000Z'), run('2026-11-19T13:19:00.000Z')]
  expect(runsByDay(runs).map(({ day, runs: grouped }) => [day, grouped.length])).toEqual([
    ['2026-11-20', 1],
    ['2026-11-19', 2],
  ])
})
