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
    about: "google's open-source browser, run as the headless shell. most agents still drive it, so it's the reference.",
    homepage: 'https://www.chromium.org/',
  },
  lightpanda: {
    name: 'Lightpanda',
    about: 'a headless browser written from scratch in zig for agents and automation.',
    homepage: 'https://github.com/lightpanda-io/browser',
  },
  obscura: {
    name: 'Obscura',
    about: 'a headless browser written in rust for agents and scraping, with its own layout and paint.',
    homepage: 'https://github.com/h4ckf0r0day/obscura',
  },
  kitesurf: {
    name: 'Kitesurf',
    about: "cloudflare's experimental browser engine for agents, built to run on workers.",
    homepage: 'https://github.com/cloudflare/kitesurf',
  },
}

export function releaseNotesUrl(engine: EngineId, version: string): string | null {
  const repo = RELEASE_REPOS[engine]
  return repo === null ? null : `https://github.com/${repo}/releases/tag/${encodeURIComponent(version)}`
}

export type OutcomeMark = 'dot' | 'half' | 'ring' | 'slash' | 'cross' | 'dash'

export const OUTCOME_LABELS: Record<Outcome, { label: string; meaning: string; mark: OutcomeMark }> = {
  passed: { label: 'passed', meaning: 'every expected phrase was on the page', mark: 'dot' },
  incomplete: { label: 'incomplete', meaning: 'the page loaded, but some expected content was missing', mark: 'half' },
  empty: { label: 'empty', meaning: 'almost no text came back', mark: 'ring' },
  blocked: { label: 'blocked', meaning: 'the site refused the engine or showed a bot check', mark: 'slash' },
  failed: { label: 'failed', meaning: 'the engine errored or timed out', mark: 'cross' },
  skipped: { label: 'skipped', meaning: 'not visited, because robots.txt asks us not to', mark: 'dash' },
}

export const VERDICT_LABELS: Record<Verdict, { label: string; sentence: (site: string) => string }> = {
  'works-everywhere': { label: 'works everywhere', sentence: (site) => `every engine could read ${site}.` },
  'blocks-chromium': { label: 'blocks headless chrome', sentence: (site) => `${site} blocked chromium, but a lighter engine got in.` },
  'trips-lighter-engines': { label: 'trips up lighter engines', sentence: (site) => `chromium read ${site} fine, but a lighter engine didn't.` },
  'blocks-every-engine': { label: 'blocks every engine', sentence: (site) => `${site} turned every engine away.` },
  mixed: { label: 'mixed results', sentence: (site) => `the engines got different, partial results on ${site}.` },
  'not-visited': { label: 'not visited', sentence: (site) => `${site}'s robots.txt asks us not to visit, so we didn't.` },
}

export const CATEGORY_LABELS: Record<Category, string> = {
  docs: 'docs',
  developer: 'developer tools',
  government: 'government',
  reference: 'reference',
  news: 'news',
  shopping: 'shopping',
  travel: 'travel and tickets',
  listings: 'property and listings',
  services: 'apps and services',
}

export const ORIGIN_LABELS: Record<Origin, { label: string; short: string; caveat: string | null }> = {
  home: { label: 'a home connection', short: 'home', caveat: null },
  'data-centre': {
    label: 'a data centre',
    short: 'data centre',
    caveat: 'this run came from a data centre. sites tend to block those more than home connections, so blocking may look worse than an agent at home would see.',
  },
}

export const CHANGE_LABELS: Record<Change, { label: string }> = {
  fixed: { label: 'now passing' },
  regressed: { label: 'stopped passing' },
  shifted: { label: 'changed' },
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function seconds(ms: number | null): string {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)}s`
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).toLowerCase() + ' utc'
}
