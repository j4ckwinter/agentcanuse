export const ENGINE_IDS = ['chromium', 'lightpanda', 'obscura', 'kitesurf'] as const
export type EngineId = (typeof ENGINE_IDS)[number]

export const CATEGORIES = ['docs', 'developer', 'government', 'reference', 'news', 'shopping', 'travel', 'listings', 'services'] as const
export type Category = (typeof CATEGORIES)[number]

export const ORIGINS = ['home', 'data-centre'] as const
export type Origin = (typeof ORIGINS)[number]

export const OUTCOMES = ['passed', 'incomplete', 'empty', 'blocked', 'failed', 'skipped'] as const
export type Outcome = (typeof OUTCOMES)[number]

export interface Site {
  id: string
  name: string
  category: Category
  url: string
  expect: string[]
}

export interface Visit {
  status: number | null
  title: string
  text: string
  linkCount: number
  durationMs: number
  error: string | null
}

export interface Result {
  site: string
  engine: EngineId
  outcome: Outcome
  status: number | null
  title: string
  excerpt: string
  found: string[]
  missing: string[]
  textLength: number
  linkCount: number
  durationMs: number
  error: string | null
  shot: string | null
}

export interface EngineRun {
  id: EngineId
  version: string
}

export interface Run {
  id: string
  startedAt: string
  origin: Origin
  engines: EngineRun[]
  sites: Site[]
  results: Result[]
}

export interface RunSummary {
  id: string
  startedAt: string
  origin: Origin
  engines: EngineRun[]
  siteCount: number
  siteList: string
  passRates: Partial<Record<EngineId, number>>
}
