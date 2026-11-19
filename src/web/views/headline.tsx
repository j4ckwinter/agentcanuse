import { blockSplit, REFERENCE_ENGINE } from '../../core/agreement'
import type { Standing } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { ENGINE_INFO, percent } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER, type Blocking } from '@/site-filter'

function sites(count: number): string {
  return `${count} ${count === 1 ? 'site' : 'sites'}`
}

export function Headline({ run, standings, runParam }: { run: Run; standings: Standing[]; runParam: string | null }) {
  const [leader] = standings
  if (leader === undefined) return null
  const split = blockSplit(run.results)
  const filtered = (blocking: Blocking) => routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, blocking } })
  const link = 'font-semibold underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground'
  return (
    <p className="max-w-3xl text-lg leading-relaxed text-balance">
      Across {run.sites.length} real sites, <strong>{ENGINE_INFO[leader.engine.id].name}</strong> passed the most, at {percent(leader.passRate)}.{' '}
      {ENGINE_INFO[REFERENCE_ENGINE].name} was blocked on{' '}
      <a className={link} href={filtered('only-chromium')}>
        {sites(split.blockedOnlyForReference.length)}
      </a>{' '}
      where a lighter engine got in, and the reverse happened on{' '}
      <a className={link} href={filtered('only-others')}>
        {sites(split.blockedOnlyForOthers.length)}
      </a>
      .
    </p>
  )
}
