import { expect, it } from 'vitest'
import { runIdAt } from './run-id'

it('names a run by its UTC minute in a form safe for file paths', () => {
  expect(runIdAt(new Date('2026-11-19T21:07:45.123Z'))).toBe('2026-11-19T21-07Z')
})
