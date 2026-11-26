import { readsHidden, type HiddenReads } from '../core/hidden'
import { isTreeUsable, type TreeSummary } from '../core/tree'
import type { Change } from '../core/diff'
import { RELEASE_REPOS } from '../core/releases'
import type { Category, EngineId, Origin, Outcome } from '../core/model'
import type { Verdict } from '../core/verdict'

export interface EngineInfo {
  name: string
  about: string
  homepage: string
}

export const ENGINE_INFO: Record<EngineId, EngineInfo> = {
  chromium: {
    name: 'Chromium',
    about: "Google's open-source browser, run as the headless shell. Most agents still drive it, so it's the reference.",
    homepage: 'https://www.chromium.org/',
  },
  lightpanda: {
    name: 'Lightpanda',
    about: 'A headless browser written from scratch in Zig for agents and automation.',
    homepage: 'https://github.com/lightpanda-io/browser',
  },
  obscura: {
    name: 'Obscura',
    about: 'A headless browser written in Rust for agents and scraping, with its own layout and paint.',
    homepage: 'https://github.com/h4ckf0r0day/obscura',
  },
  kitesurf: {
    name: 'Kitesurf',
    about: "Cloudflare's experimental browser engine for agents, built to run on Workers.",
    homepage: 'https://github.com/cloudflare/kitesurf',
  },
  moli: {
    name: 'Moli',
    about: "Lexmount's headless browser for agents, written in Rust, with layout and paint done on demand.",
    homepage: 'https://github.com/lexmount/moli',
  },
}

export function releaseNotesUrl(engine: EngineId, version: string): string | null {
  const repo = RELEASE_REPOS[engine]
  return repo === null ? null : `https://github.com/${repo}/releases/tag/${encodeURIComponent(version)}`
}

export type OutcomeMark = 'dot' | 'half' | 'ring' | 'slash' | 'cross' | 'dash'

export const OUTCOME_LABELS: Record<Outcome, { label: string; meaning: string; mark: OutcomeMark; color: string }> = {
  passed: { label: 'Passed', meaning: 'Every expected phrase was on the page', mark: 'dot', color: 'var(--status-good)' },
  incomplete: { label: 'Incomplete', meaning: 'The page loaded, but some expected content was missing', mark: 'half', color: 'var(--status-warning)' },
  empty: { label: 'Empty', meaning: 'Almost no text came back', mark: 'ring', color: 'var(--status-serious)' },
  blocked: { label: 'Blocked', meaning: 'The site refused the engine or showed a bot check', mark: 'slash', color: 'var(--status-critical)' },
  failed: { label: 'Failed', meaning: 'The engine errored or timed out', mark: 'cross', color: 'var(--status-neutral)' },
  skipped: { label: 'Skipped', meaning: 'Not visited, because robots.txt asks us not to', mark: 'dash', color: 'var(--status-none)' },
}

export type Tone = 'good' | 'info' | 'warning' | 'critical' | 'neutral'

export const VERDICT_LABELS: Record<Verdict, { label: string; tone: Tone; sentence: (site: string) => string }> = {
  'works-everywhere': { label: 'Works everywhere', tone: 'good', sentence: (site) => `Every engine could read ${site}.` },
  'blocks-chromium': { label: 'Blocks headless Chrome', tone: 'info', sentence: (site) => `${site} blocked Chromium, but a lighter engine got in.` },
  'trips-lighter-engines': { label: 'Trips up lighter engines', tone: 'warning', sentence: (site) => `Chromium read ${site}, but a lighter engine didn't.` },
  'blocks-every-engine': { label: 'Blocks every engine', tone: 'critical', sentence: (site) => `${site} turned every engine away.` },
  mixed: { label: 'Mixed results', tone: 'neutral', sentence: (site) => `The engines got different, partial results on ${site}.` },
  'not-visited': { label: 'Not visited', tone: 'neutral', sentence: (site) => `${site}'s robots.txt asks us not to visit, so we didn't.` },
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
  home: { label: 'a home connection', short: 'Home', caveat: null },
  'data-centre': {
    label: 'a data centre',
    short: 'Data centre',
    caveat: 'This run came from a data centre. Sites tend to block data centres more than home connections, so blocking may look worse than an agent at home would see.',
  },
}

export const CHANGE_LABELS: Record<Change, { label: string }> = {
  fixed: { label: 'Now passing' },
  regressed: { label: 'Stopped passing' },
  shifted: { label: 'Changed' },
}

export const ENGINE_COLORS: Record<EngineId, string> = {
  chromium: 'var(--series-1)',
  lightpanda: 'var(--series-2)',
  obscura: 'var(--series-3)',
  kitesurf: 'var(--series-4)',
  moli: 'var(--series-5)',
}

export function treeLabel(tree: TreeSummary | null): string {
  if (tree === null) return 'Not judged'
  return isTreeUsable(tree) ? 'Usable' : 'Not usable'
}

export function hiddenLabel(hidden: HiddenReads | null): string {
  if (hidden === null) return 'Not judged'
  return readsHidden(hidden) ? 'Reads it' : 'Skips it'
}

export function describeHidden(hidden: HiddenReads): string {
  return `${hidden.read} of ${hidden.sampled} hidden pieces read`
}

export function describeTree(tree: TreeSummary): string {
  return `${tree.namedControls} of ${tree.controls} controls named · ${tree.headings} headings · ${tree.landmarks} landmarks`
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function seconds(ms: number | null): string {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)}s`
}

export function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}
