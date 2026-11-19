import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { CATEGORIES } from '../core/model'
import { CATEGORY_LABELS } from './labels'

it('offers every category, in order, on the suggest-a-site form', () => {
  const form = readFileSync(join(import.meta.dirname, '..', '..', '.github', 'ISSUE_TEMPLATE', 'suggest-a-site.yml'), 'utf8')
  const options = form.slice(form.indexOf('options:'), form.indexOf('validations:', form.indexOf('options:')))
  const listed = [...options.matchAll(/^\s+- (.+)$/gm)].map((match) => match[1])
  expect(listed).toEqual(CATEGORIES.map((category) => CATEGORY_LABELS[category]))
})
