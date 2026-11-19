import { inject, pageview } from '@vercel/analytics'
import type { Route } from './route'

export interface PageView {
  route: string
  path: string
}

export function pageViewFor(route: Route): PageView {
  switch (route.view) {
    case 'home':
      return { route: '/', path: '/' }
    case 'engines':
      return route.engine === null ? { route: '/engines', path: '/engines' } : { route: '/engines/[engine]', path: `/engines/${route.engine}` }
    case 'sites':
      return route.site === null ? { route: '/sites', path: '/sites' } : { route: '/sites/[site]', path: `/sites/${route.site}` }
    case 'releases':
      return { route: '/releases', path: '/releases' }
    case 'method':
      return { route: '/method', path: '/method' }
  }
}

export function startAnalytics(): void {
  inject({ disableAutoTrack: true })
}

export function recordView(view: PageView): void {
  pageview(view)
}
