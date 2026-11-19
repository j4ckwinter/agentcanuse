import type { Change } from '../core/diff'
import type { Category, EngineId, Origin, Outcome } from '../core/model'

export const ENGINE_NAMES: Record<EngineId, string> = {
  chromium: 'Chromium',
  lightpanda: 'Lightpanda',
  obscura: 'Obscura',
  kitesurf: 'Kitesurf',
}

export const OUTCOME_LABELS: Record<Outcome, { label: string; meaning: string; tone: string; bar: string }> = {
  passed: { label: 'Passed', meaning: 'Every expected phrase was on the page', tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200', bar: 'bg-emerald-500' },
  incomplete: { label: 'Incomplete', meaning: 'The page loaded, but some expected content was missing', tone: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200', bar: 'bg-amber-400' },
  empty: { label: 'Empty', meaning: 'Almost no text came back', tone: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200', bar: 'bg-orange-500' },
  blocked: { label: 'Blocked', meaning: 'The site refused the engine or showed a bot check', tone: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200', bar: 'bg-rose-500' },
  failed: { label: 'Failed', meaning: 'The engine errored or timed out', tone: 'bg-zinc-800 text-zinc-50 dark:bg-zinc-200 dark:text-zinc-900', bar: 'bg-zinc-700 dark:bg-zinc-300' },
  skipped: { label: 'Skipped', meaning: 'Not visited, usually because robots.txt asks us not to', tone: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400', bar: 'bg-zinc-300 dark:bg-zinc-600' },
}

export const CATEGORY_LABELS: Record<Category, string> = {
  docs: 'Docs',
  developer: 'Developer tools',
  government: 'Government',
  reference: 'Reference',
  news: 'News',
  shopping: 'Shopping',
  travel: 'Travel and tickets',
  listings: 'Property and listings',
  services: 'Apps and services',
}

export const ORIGIN_LABELS: Record<Origin, { label: string; short: string; caveat: string | null }> = {
  home: { label: 'a home connection', short: 'home', caveat: null },
  'data-centre': {
    label: 'a data centre (GitHub Actions)',
    short: 'data centre',
    caveat: 'This run came from a data centre. Sites tend to block data-centre traffic more than home connections, so blocked rates may run higher than an agent at home would see.',
  },
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
