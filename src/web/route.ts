import { useEffect, useState } from 'react'
import { CATEGORIES, ENGINE_IDS, type Category, type EngineId } from '../core/model'
import { BLOCKINGS, NO_FILTER, type Blocking, type SiteFilter } from './site-filter'

export type Route =
  | { view: 'leaderboard'; run: string | null }
  | { view: 'sites'; run: string | null; site: string | null; filter: SiteFilter }
  | { view: 'engine'; run: string | null; engine: EngineId }
  | { view: 'releases' }
  | { view: 'method' }

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
    case 'engine': {
      const engine = oneOf<EngineId>(ENGINE_IDS, detail ?? null)
      return engine === null ? { view: 'leaderboard', run } : { view: 'engine', run, engine }
    }
    case 'releases':
      return { view: 'releases' }
    case 'method':
      return { view: 'method' }
    default:
      return { view: 'leaderboard', run }
  }
}

function withParams(path: string, params: URLSearchParams): string {
  const query = params.toString()
  return query === '' ? `#${path}` : `#${path}?${query}`
}

export function routeHash(route: Route): string {
  const params = new URLSearchParams()
  switch (route.view) {
    case 'leaderboard':
      if (route.run !== null) params.set('run', route.run)
      return withParams('leaderboard', params)
    case 'sites':
      if (route.run !== null) params.set('run', route.run)
      writeFilter(params, route.filter)
      return withParams(route.site === null ? 'sites' : `sites/${encodeURIComponent(route.site)}`, params)
    case 'engine':
      if (route.run !== null) params.set('run', route.run)
      return withParams(`engine/${route.engine}`, params)
    case 'releases':
    case 'method':
      return `#${route.view}`
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
