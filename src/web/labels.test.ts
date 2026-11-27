import { expect, it } from 'vitest'
import { engineNames } from './labels'

it('names one engine on its own', () => {
  expect(engineNames(['moli'])).toBe('Moli')
})

it('joins two engines with and', () => {
  expect(engineNames(['chromium', 'moli'])).toBe('Chromium and Moli')
})

it('lists three or more engines with commas and a final and', () => {
  expect(engineNames(['chromium', 'lightpanda', 'obscura', 'moli'])).toBe('Chromium, Lightpanda, Obscura and Moli')
})
