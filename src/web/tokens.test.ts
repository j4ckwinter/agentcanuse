import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const WEB = join(import.meta.dirname)
const EXEMPT = [join('components', 'ui'), 'brand.ts']

const RULES: { name: string; pattern: RegExp }[] = [
  { name: 'a one-off size in pixels or rems, like text-[13px]', pattern: /-\[-?\d+(\.\d+)?(px|rem)\]/g },
  { name: 'a raw hex colour', pattern: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/g },
  { name: 'a hard-coded SVG font size', pattern: /fontSize=/g },
]

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (EXEMPT.some((exempt) => relative(WEB, path) === exempt)) return []
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : []
  })
}

describe('design tokens', () => {
  for (const { name, pattern } of RULES) {
    it(`no component uses ${name}`, () => {
      const offenders = sourceFiles(WEB).flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .flatMap((line, index) => (line.match(pattern) ?? []).map((match) => `${relative(WEB, file)}:${index + 1} ${match}`)),
      )
      expect(offenders).toEqual([])
    })
  }
})
