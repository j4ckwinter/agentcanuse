import { ArrowRight, Info } from 'lucide-react'
import { sitesWhereEnginesDisagree } from '../../core/agreement'
import type { Run, RunSummary } from '../../core/model'
import { ORIGIN_LABELS } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'
import { CategoryGuide } from '@/views/category-guide'
import { EnginesCard } from '@/views/engines-card'
import { OverallAnswer } from '@/views/overall-answer'

const LINK_ROW = 'flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-card py-3.5 text-sm hover:bg-raised'

export function OverviewView({ run, runs, runParam }: { run: Run; runs: RunSummary[]; runParam: string | null }) {
  const caveat = ORIGIN_LABELS[run.origin].caveat
  const disagreeing = sitesWhereEnginesDisagree(run.results).size
  return (
    <>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Can AI agents’ browsers use the web?</h1>
        <OverallAnswer run={run} runParam={runParam} />
        <a href={routeHash({ view: 'method', run: runParam })} className="inline-flex items-center gap-1 self-start text-label font-medium text-fg-secondary hover:text-fg">
          How we test <ArrowRight className="size-3.5" />
        </a>
      </div>
      {caveat !== null && (
        <p className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-label text-fg-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-accent-blue" />
          {caveat}
        </p>
      )}
      <EnginesCard run={run} runs={runs} runParam={runParam} />
      <CategoryGuide run={run} runParam={runParam} />
      {disagreeing > 0 && (
        <a href={routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, disagreeingOnly: true } })} className={LINK_ROW}>
          <span>
            <span className="font-medium">{disagreeing} sites</span> <span className="text-fg-secondary">where the engines got different results</span>
          </span>
          <ArrowRight className="size-4 text-fg-muted" />
        </a>
      )}
    </>
  )
}
