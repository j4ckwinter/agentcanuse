import { describe, expect, it } from 'vitest'
import { nextTheme, resolveTheme, storedTheme } from './theme'

describe('theme', () => {
  it('only trusts a stored value that is a theme', () => {
    expect(storedTheme('dark')).toBe('dark')
    expect(storedTheme('purple')).toBeUndefined()
    expect(storedTheme(null)).toBeUndefined()
  })

  it('follows the system until a visitor chooses', () => {
    expect(resolveTheme(undefined, true)).toBe('dark')
    expect(resolveTheme(undefined, false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('toggles between the two', () => {
    expect(nextTheme('dark')).toBe('light')
    expect(nextTheme('light')).toBe('dark')
  })
})
