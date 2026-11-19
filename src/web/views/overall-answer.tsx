import { REFERENCE_ENGINE } from '../../core/agreement'
import { findings, type Overall } from '../../core/findings'
import type { Run } from '../../core/model'
import { ENGINE_INFO, percent } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER, type SiteFilter } from '@/site-filter'

const LINK = 'font-medium text-accent-blue hover:underline'

function sites(count: number): string {
  return `${count} ${count === 1 ? 'site' : 'sites'}`
}

function headline(overall: Overall, siteCount: number): string {
  switch (overall.kind) {
    case 'ahead':
      return `${ENGINE_INFO[overall.engine].name} is ahead, reading ${percent(overall.passRate)} of ${siteCount} real sites.`
    case 'level':
      return `No engine is clearly ahead. Each one reads between ${percent(overall.low)} and ${percent(overall.high)} of ${siteCount} real sites, within the margin of error.`
  }
}

export function OverallAnswer({ run, runParam }: { run: Run; runParam: string | null }) {
  const found = findings(run)
  const filtered = (filter: Partial<SiteFilter>) => routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, ...filter } })
  return (
    <div className="flex max-w-3xl flex-col gap-1.5">
      {found.overall !== null && <p className="text-base text-fg">{headline(found.overall, run.sites.length)}</p>}
      {found.blockedOnlyChromium > 0 && (
        <p className="text-sm text-fg-secondary">
          The difference is bot checks: lighter engines got past them on{' '}
          <a className={LINK} href={filtered({ blocking: 'only-chromium' })}>
            {sites(found.blockedOnlyChromium)}
          </a>{' '}
          that blocked {ENGINE_INFO[REFERENCE_ENGINE].name}, and the reverse happened on{' '}
          <a className={LINK} href={filtered({ blocking: 'only-others' })}>
            {sites(found.blockedOnlyOthers)}
          </a>
          .
        </p>
      )}
    </div>
  )
}
