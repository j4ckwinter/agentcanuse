import type { Run } from '../core/model'
import { BRAND_NAME } from './brand'
import { ENGINE_INFO } from './labels'
import type { Route } from './route'

export const HOME_TITLE = `${BRAND_NAME} · Can AI agents’ browsers use the web?`

function heading(route: Route, run: Run | null): string | null {
  switch (route.view) {
    case 'home':
      return null
    case 'sites':
      return (route.site !== null && run?.sites.find((site) => site.id === route.site)?.name) || 'Sites'
    case 'engines':
      return route.engine === null ? 'Engines' : ENGINE_INFO[route.engine].name
    case 'releases':
      return 'Releases'
    case 'method':
      return 'Method'
  }
}

export function pageTitle(route: Route, run: Run | null): string {
  const title = heading(route, run)
  return title === null ? HOME_TITLE : `${title} · ${BRAND_NAME}`
}
