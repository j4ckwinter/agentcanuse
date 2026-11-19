import type { Change } from '../core/diff'
import type { EngineId, Outcome } from '../core/model'

export const ENGINE_NAMES: Record<EngineId, string> = {
  chromium: 'Chromium',
  lightpanda: 'Lightpanda',
  obscura: 'Obscura',
  kitesurf: 'Kitesurf',
}

export const OUTCOME_LABELS: Record<Outcome, { label: string; meaning: string; tone: string }> = {
  passed: { label: 'Passed', meaning: 'Every expected phrase was on the page', tone: 'bg-emerald-100 text-emerald-900' },
  incomplete: { label: 'Incomplete', meaning: 'The page loaded, but some expected content was missing', tone: 'bg-amber-100 text-amber-900' },
  empty: { label: 'Empty', meaning: 'Almost no text came back', tone: 'bg-orange-100 text-orange-900' },
  blocked: { label: 'Blocked', meaning: 'The site refused the engine or showed a bot check', tone: 'bg-rose-100 text-rose-900' },
  failed: { label: 'Failed', meaning: 'The engine errored or timed out', tone: 'bg-zinc-800 text-zinc-50' },
  skipped: { label: 'Skipped', meaning: 'Not visited, usually because robots.txt asks us not to', tone: 'bg-zinc-100 text-zinc-500' },
}

export const CHANGE_LABELS: Record<Change, { label: string; tone: string }> = {
  fixed: { label: 'Now passing', tone: 'text-emerald-700' },
  regressed: { label: 'Stopped passing', tone: 'text-rose-700' },
  shifted: { label: 'Changed', tone: 'text-zinc-600' },
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function seconds(ms: number | null): string {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)}s`
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}
