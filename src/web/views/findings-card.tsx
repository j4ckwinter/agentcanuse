import { Gauge, Layers, ShieldOff } from 'lucide-react'
import { REFERENCE_ENGINE } from '../../core/agreement'
import { findings } from '../../core/findings'
import type { Run } from '../../core/model'
import { Card } from '@/components/card'
import { CATEGORY_LABELS, ENGINE_INFO, percent, seconds } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER, type SiteFilter } from '@/site-filter'

const LINK = 'font-medium text-accent-blue hover:underline'

function sites(count: number): string {
  return `${count} ${count === 1 ? 'site' : 'sites'}`
}

function Finding({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-fg-secondary">{icon}</span>
      <p className="text-sm leading-relaxed text-fg-secondary">{children}</p>
    </li>
  )
}

export function FindingsCard({ run, runParam }: { run: Run; runParam: string | null }) {
  const found = findings(run)
  const filtered = (filter: Partial<SiteFilter>) => routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, ...filter } })
  return (
    <Card title="Findings" description="What this run shows, with a link to the sites behind each.">
      <ul className="flex flex-col gap-4">
        {found.blockedOnlyChromium > 0 && (
          <Finding icon={<ShieldOff className="size-4" />}>
            Lighter engines got past the bot check on{' '}
            <a className={LINK} href={filtered({ blocking: 'only-chromium' })}>
              {sites(found.blockedOnlyChromium)}
            </a>{' '}
            that blocked {ENGINE_INFO[REFERENCE_ENGINE].name}. The reverse happened on{' '}
            <a className={LINK} href={filtered({ blocking: 'only-others' })}>
              {sites(found.blockedOnlyOthers)}
            </a>
            .
          </Finding>
        )}
        {found.hardestCategory !== null && (
          <Finding icon={<Layers className="size-4" />}>
            <a className={LINK} href={filtered({ category: found.hardestCategory.category })}>
              {CATEGORY_LABELS[found.hardestCategory.category]}
            </a>{' '}
            is the hardest category. The engines passed {percent(found.hardestCategory.passRate)} of those sites on average.
          </Finding>
        )}
        {found.fastest !== null && found.slowest !== null && (
          <Finding icon={<Gauge className="size-4" />}>
            {ENGINE_INFO[found.fastest.engine].name} is the quickest at {seconds(found.fastest.medianMs)} a page. {ENGINE_INFO[found.slowest.engine].name} takes{' '}
            {seconds(found.slowest.medianMs)}.
          </Finding>
        )}
      </ul>
    </Card>
  )
}
