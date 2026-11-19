import { useEffect, useState } from 'react'

export type Route = { view: 'leaderboard' } | { view: 'sites'; site: string | null } | { view: 'releases' } | { view: 'method' }

export function parseRoute(hash: string): Route {
  const [view, detail] = hash.replace(/^#\/?/, '').split('/')
  if (view === 'sites') return { view: 'sites', site: detail ? decodeURIComponent(detail) : null }
  if (view === 'releases') return { view: 'releases' }
  if (view === 'method') return { view: 'method' }
  return { view: 'leaderboard' }
}

export function routeHash(route: Route): string {
  if (route.view === 'sites') return route.site === null ? '#sites' : `#sites/${encodeURIComponent(route.site)}`
  return `#${route.view}`
}

export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return [route, (next) => (window.location.hash = routeHash(next))]
}
