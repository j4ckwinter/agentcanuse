import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { findings } from '../../core/findings'
import { leaderboard } from '../../core/leaderboard'
import type { Run, RunSummary } from '../../core/model'
import { verdictsBySite } from '../../core/verdict'
import { StatTile } from '@/components/card'
import { ENGINE_COLORS, ENGINE_INFO, ORIGIN_LABELS, percent, seconds, shortDate } from '@/labels'
import { CategoryHeatmap } from '@/views/category-heatmap'
import { DisagreementsCard } from '@/views/disagreements-card'
import { EnginesCard } from '@/views/engines-card'
import { FindingsCard } from '@/views/findings-card'
import { SpeedChart } from '@/views/speed-chart'

function skippedSites(run: Run): number {
  return run.sites.filter((site) => run.results.filter((result) => result.site === site.id).every((result) => result.outcome === 'skipped')).length
}

export function OverviewView({ run, runs, runParam }: { run: Run; runs: RunSummary[]; runParam: string | null }) {
  const verdicts = useMemo(() => verdictsBySite(run.results), [run])
  const found = useMemo(() => findings(run), [run])
  const leader = leaderboard(run)[0]
  const skipped = skippedSites(run)
  const caveat = ORIGIN_LABELS[run.origin].caveat
  return (
    <>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-fg-secondary">How the browser engines AI agents use handle {run.sites.length} real sites.</p>
        </div>
        <p className="flex items-center gap-2 text-[13px] text-fg-muted">
          <span className="size-2 rounded-full bg-[var(--status-good)]" aria-hidden="true" />
          Run of {shortDate(run.startedAt)} from {ORIGIN_LABELS[run.origin].label}
        </p>
      </div>
      {caveat !== null && (
        <p className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-fg-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-accent-blue" />
          {caveat}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Sites surveyed" value={run.sites.length} detail={`${skipped} skipped by robots.txt`} />
        {leader && <StatTile label="Highest pass rate" value={percent(leader.passRate)} detail={ENGINE_INFO[leader.engine.id].name} accent={ENGINE_COLORS[leader.engine.id]} />}
        <StatTile label="Blocked Chromium only" value={found.blockedOnlyChromium} detail="sites a lighter engine got into" />
        {found.fastest && <StatTile label="Fastest median" value={seconds(found.fastest.medianMs)} detail={ENGINE_INFO[found.fastest.engine].name} accent={ENGINE_COLORS[found.fastest.engine]} />}
      </div>
      <EnginesCard run={run} runs={runs} runParam={runParam} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SpeedChart run={run} />
        <FindingsCard run={run} runParam={runParam} />
      </div>
      <CategoryHeatmap run={run} runParam={runParam} />
      <DisagreementsCard run={run} verdicts={verdicts} runParam={runParam} />
    </>
  )
}
