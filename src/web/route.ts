import { useEffect, useState } from 'react'
import { CATEGORIES, ENGINE_IDS, type Category, type EngineId } from '../core/model'
import { BLOCKINGS, NO_FILTER, type Blocking, type SiteFilter } from './site-filter'

export type Route =
  | { view: 'home'; run: string | null }
  | { view: 'engines'; run: string | null; engine: EngineId | null }
  | { view: 'sites'; run: string | null; site: string | null; filter: SiteFilter }
  | { view: 'releases'; run: string | null }
  | { view: 'method'; run: string | null }

export type Section = Route['view']

export function sectionRoute(section: Section, run: string | null): Route {
  switch (section) {
    case 'home':
    case 'releases':
    case 'method':
      return { view: section, run }
    case 'engines':
      return { view: 'engines', run, engine: null }
    case 'sites':
      return { view: 'sites', run, site: null, filter: NO_FILTER }
  }
}

function oneOf<T extends string>(values: readonly T[], value: string | null): T | null {
  return value !== null && (values as readonly string[]).includes(value) ? (value as T) : null
}

function readFilter(params: URLSearchParams): SiteFilter {
  return {
    query: params.get('q') ?? NO_FILTER.query,
    category: oneOf<Category>(CATEGORIES, params.get('category')) ?? NO_FILTER.category,
    disagreeingOnly: params.get('disagree') === '1',
    blocking: oneOf<Blocking>(BLOCKINGS, params.get('blocking')) ?? NO_FILTER.blocking,
  }
}

function writeFilter(params: URLSearchParams, filter: SiteFilter): void {
  if (filter.query !== NO_FILTER.query) params.set('q', filter.query)
  if (filter.category !== NO_FILTER.category) params.set('category', filter.category)
  if (filter.disagreeingOnly) params.set('disagree', '1')
  if (filter.blocking !== NO_FILTER.blocking) params.set('blocking', filter.blocking)
}

function decoded(segment: string | undefined): string | null {
  if (!segment) return null
  try {
    return decodeURIComponent(segment)
  } catch {
    return null
  }
}

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const [view, detail] = path.split('/')
  const params = new URLSearchParams(query)
  const run = params.get('run')
  switch (view) {
    case 'sites':
      return { view: 'sites', run, site: decoded(detail), filter: readFilter(params) }
    case 'engines':
    case 'engine':
      return { view: 'engines', run, engine: oneOf<EngineId>(ENGINE_IDS, detail ?? null) }
    case 'releases':
    case 'method':
      return { view, run }
    default:
      return { view: 'home', run }
  }
}

function withParams(path: string, params: URLSearchParams): string {
  const query = params.toString()
  if (path === '') return query === '' ? '#' : `#?${query}`
  return query === '' ? `#${path}` : `#${path}?${query}`
}

export function routeHash(route: Route): string {
  const params = new URLSearchParams()
  if (route.run !== null) params.set('run', route.run)
  switch (route.view) {
    case 'home':
      return withParams('', params)
    case 'engines':
      return withParams(route.engine === null ? 'engines' : `engines/${route.engine}`, params)
    case 'sites':
      writeFilter(params, route.filter)
      return withParams(route.site === null ? 'sites' : `sites/${encodeURIComponent(route.site)}`, params)
    case 'releases':
    case 'method':
      return withParams(route.view, params)
  }
}

export function useRoute(): [Route, (route: Route, options?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = (next: Route, options: { replace?: boolean } = {}) => {
    const hash = routeHash(next)
    if (options.replace) {
      window.history.replaceState(null, '', hash)
      setRoute(next)
    } else {
      window.location.hash = hash
    }
  }
  return [route, navigate]
}
