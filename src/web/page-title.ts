import type { Run } from '../core/model'
import { verdictFor } from '../core/verdict'
import { BRAND_NAME } from './brand'
import { ENGINE_INFO, VERDICT_LABELS } from './labels'
import type { Route } from './route'

export const HOME_TITLE = `${BRAND_NAME} · Can AI agents’ browsers use the web?`

function siteHeading(id: string | null, run: Run | null): string {
  const site = id === null ? undefined : run?.sites.find((entry) => entry.id === id)
  if (run === null || site === undefined) return 'Sites'
  const verdict = verdictFor(run.results.filter((result) => result.site === site.id))
  return `${site.name}: ${VERDICT_LABELS[verdict].label}`
}

function heading(route: Route, run: Run | null): string | null {
  switch (route.view) {
    case 'home':
      return null
    case 'sites':
      return siteHeading(route.site, run)
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
