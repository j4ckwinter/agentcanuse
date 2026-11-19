import type { BlockSplit } from '../core/agreement'
import type { Category, Site } from '../core/model'

export const BLOCKINGS = ['any', 'only-chromium', 'only-others'] as const
export type Blocking = (typeof BLOCKINGS)[number]

export interface SiteFilter {
  query: string
  category: Category | 'all'
  disagreeingOnly: boolean
  blocking: Blocking
}

export const NO_FILTER: SiteFilter = { query: '', category: 'all', disagreeingOnly: false, blocking: 'any' }

export interface SiteFacts {
  disagreeing: Set<string>
  split: BlockSplit
}

function matchesQuery(site: Site, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return [site.name, site.id, new URL(site.url).hostname].some((text) => text.toLowerCase().includes(needle))
}

function matchesBlocking(site: Site, blocking: Blocking, split: BlockSplit): boolean {
  switch (blocking) {
    case 'any':
      return true
    case 'only-chromium':
      return split.blockedOnlyForReference.includes(site.id)
    case 'only-others':
      return split.blockedOnlyForOthers.includes(site.id)
  }
}

export function filterSites(sites: Site[], filter: SiteFilter, facts: SiteFacts): Site[] {
  return sites.filter(
    (site) =>
      (filter.category === 'all' || site.category === filter.category) &&
      (!filter.disagreeingOnly || facts.disagreeing.has(site.id)) &&
      matchesBlocking(site, filter.blocking, facts.split) &&
      matchesQuery(site, filter.query),
  )
}

export function neighbours(sites: Site[], current: string): { previous: Site | null; next: Site | null } {
  const index = sites.findIndex((site) => site.id === current)
  if (index === -1) return { previous: null, next: null }
  return { previous: sites[index - 1] ?? null, next: sites[index + 1] ?? null }
}

export const SEARCH_RESULTS = 6

export function searchSites(sites: Site[], query: string): Site[] {
  if (query.trim() === '') return []
  const needle = query.trim().toLowerCase()
  const startsWith = (site: Site) => [site.name, new URL(site.url).hostname.replace(/^www\./, '')].some((text) => text.toLowerCase().startsWith(needle))
  return sites
    .filter((site) => matchesQuery(site, query))
    .sort((a, b) => Number(startsWith(b)) - Number(startsWith(a)))
    .slice(0, SEARCH_RESULTS)
}
