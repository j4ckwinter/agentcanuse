import type { Category, Site } from '../core/model'

export interface SiteFilter {
  query: string
  category: Category | 'all'
  disagreeingOnly: boolean
}

export const NO_FILTER: SiteFilter = { query: '', category: 'all', disagreeingOnly: false }

function matchesQuery(site: Site, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return [site.name, site.id, new URL(site.url).hostname].some((text) => text.toLowerCase().includes(needle))
}

export function filterSites(sites: Site[], filter: SiteFilter, disagreeing: Set<string>): Site[] {
  return sites.filter(
    (site) =>
      (filter.category === 'all' || site.category === filter.category) &&
      (!filter.disagreeingOnly || disagreeing.has(site.id)) &&
      matchesQuery(site, filter.query),
  )
}
