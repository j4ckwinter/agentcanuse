import { summariseTree } from './tree'
import type { EngineId, Outcome, Result, Site, Visit } from './model'

export const MIN_TEXT_LENGTH = 200
export const EXCERPT_LENGTH = 600
export const BLOCKING_STATUSES: readonly number[] = [401, 403, 429, 503]
export const CHALLENGE_PHRASES: readonly string[] = [
  'just a moment',
  'verify you are human',
  'are you a robot',
  'are you a person or a robot',
  'human verification',
  'performing security verification',
  'you have been blocked',
  'checking your browser',
  'access denied',
  'enable javascript and cookies to continue',
  'captcha',
]

export function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

function looksBlocked(visit: Visit, text: string): boolean {
  if (visit.status !== null && BLOCKING_STATUSES.includes(visit.status)) return true
  const title = normalize(visit.title)
  const opening = text.slice(0, 2000)
  return CHALLENGE_PHRASES.some((phrase) => title.includes(phrase) || (text.length < 2000 && opening.includes(phrase)))
}

function outcomeOf(visit: Visit, text: string, missing: string[]): Outcome {
  if (visit.error !== null) return 'failed'
  if (looksBlocked(visit, text)) return 'blocked'
  if (text.length < MIN_TEXT_LENGTH) return 'empty'
  return missing.length === 0 ? 'passed' : 'incomplete'
}

export function judge(site: Site, engine: EngineId, visit: Visit, shot: string | null): Result {
  const text = normalize(visit.text)
  const found = site.expect.filter((phrase) => text.includes(normalize(phrase)))
  const missing = site.expect.filter((phrase) => !found.includes(phrase))
  return {
    site: site.id,
    engine,
    outcome: outcomeOf(visit, text, missing),
    status: visit.status,
    title: visit.title.trim(),
    excerpt: visit.text.replace(/\s+/g, ' ').trim().slice(0, EXCERPT_LENGTH),
    found,
    missing,
    textLength: text.length,
    linkCount: visit.linkCount,
    durationMs: visit.durationMs,
    error: visit.error,
    shot,
    tree: visit.tree === null ? null : summariseTree(visit.tree),
  }
}

export function skipped(site: Site, engine: EngineId, reason: string): Result {
  return {
    site: site.id,
    engine,
    outcome: 'skipped',
    status: null,
    title: '',
    excerpt: '',
    found: [],
    missing: site.expect,
    textLength: 0,
    linkCount: 0,
    durationMs: 0,
    error: reason,
    shot: null,
    tree: null,
  }
}
