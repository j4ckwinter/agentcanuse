import { blockSplit, REFERENCE_ENGINE } from '../../core/agreement'
import type { Standing } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { ENGINE_NAMES, percent } from '@/labels'

function sites(count: number): string {
  return `${count} ${count === 1 ? 'site' : 'sites'}`
}

export function Headline({ run, standings }: { run: Run; standings: Standing[] }) {
  const [leader] = standings
  if (leader === undefined) return null
  const split = blockSplit(run.results)
  return (
    <p className="text-lg leading-relaxed text-balance">
      Across {run.sites.length} real sites, <strong>{ENGINE_NAMES[leader.engine.id]}</strong> passed the most, at {percent(leader.passRate)}.{' '}
      {ENGINE_NAMES[REFERENCE_ENGINE]} was blocked on <strong>{sites(split.blockedOnlyForReference.length)}</strong> where a lighter engine
      got in, and the reverse happened on {sites(split.blockedOnlyForOthers.length)}.
    </p>
  )
}
