import { useEffect, useMemo } from 'react'
import { blockSplit, sitesWhereEnginesDisagree } from '../../core/agreement'
import type { Run, RunSummary } from '../../core/model'
import { verdictsBySite } from '../../core/verdict'
import { routeHash, type Route } from '@/route'
import { describeFilter, filterSites, neighbours, type SiteFilter } from '@/site-filter'
import { SiteComparison } from '@/views/site-comparison'
import { SiteMatrix } from '@/views/site-matrix'

type SitesRoute = Extract<Route, { view: 'sites' }>

interface SitesViewProps {
  run: Run
  runs: RunSummary[]
  route: SitesRoute
  navigate: (route: Route, options?: { replace?: boolean }) => void
}

export function SitesView({ run, runs, route, navigate }: SitesViewProps) {
  const facts = useMemo(() => ({ disagreeing: sitesWhereEnginesDisagree(run.results), split: blockSplit(run.results) }), [run])
  const verdicts = useMemo(() => verdictsBySite(run.results), [run])
  const sites = filterSites(run.sites, route.filter, facts)
  const siteHref = (site: string | null) => routeHash({ ...route, site })
  const selected = run.sites.find((site) => site.id === route.site)
  const missingSite = route.site !== null && selected === undefined
  useEffect(() => {
    if (missingSite) navigate({ ...route, site: null }, { replace: true })
  }, [missingSite, route, navigate])

  if (selected === undefined) {
    const onFilter = (filter: SiteFilter) => navigate({ ...route, site: null, filter }, { replace: true })
    return <SiteMatrix run={run} sites={sites} verdicts={verdicts} filter={route.filter} onFilter={onFilter} disagreeing={facts.disagreeing.size} siteHref={siteHref} />
  }

  const { previous, next } = neighbours(sites, selected.id)
  const index = sites.findIndex((site) => site.id === selected.id)
  return (
    <SiteComparison
      run={run}
      site={selected}
      verdict={verdicts.get(selected.id) ?? 'mixed'}
      runs={runs}
      links={{
        back: siteHref(null),
        previous: previous && { href: siteHref(previous.id), name: previous.name },
        next: next && { href: siteHref(next.id), name: next.name },
        position: index === -1 ? null : `${index + 1} of ${sites.length}`,
        list: describeFilter(route.filter),
        engine: (engine) => routeHash({ view: 'engines', run: route.run, engine: engine.id }),
      }}
    />
  )
}
