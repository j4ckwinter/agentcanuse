import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cn, FONT_SIZE_TOKENS } from './utils'

describe('cn', () => {
  it('keeps a custom text size alongside a text colour', () => {
    expect(cn('text-caption text-fg-muted', 'text-fg')).toBe('text-caption text-fg')
  })

  it('lets a later custom text size replace an earlier one', () => {
    expect(cn('text-caption', 'text-label')).toBe('text-label')
  })

  it('knows every text size defined in index.css', () => {
    const css = readFileSync(join(import.meta.dirname, '..', 'index.css'), 'utf8')
    const defined = [...css.matchAll(/--text-([a-z]+):/g)].map((match) => match[1])
    expect([...FONT_SIZE_TOKENS].sort()).toEqual(defined.sort())
  })
})
