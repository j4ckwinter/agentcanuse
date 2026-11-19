import { useMemo } from 'react'
import type { Run, RunSummary } from '../../core/model'
import { verdictsBySite } from '../../core/verdict'
import { OutcomeKey } from '@/components/outcome-mark'
import { ORIGIN_LABELS } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'
import { CategoryGrid } from '@/views/category-grid'
import { Disagreements } from '@/views/disagreements'
import { EngineList } from '@/views/engine-list'
import { FindingsList } from '@/views/findings-list'
import { SiteSearch } from '@/views/site-search'

interface HomeViewProps {
  run: Run
  runs: RunSummary[]
  runParam: string | null
  runPicker: React.ReactNode
}

export function HomeView({ run, runs, runParam, runPicker }: HomeViewProps) {
  const verdicts = useMemo(() => verdictsBySite(run.results), [run])
  const siteHref = (site: string) => routeHash({ view: 'sites', run: runParam, site, filter: NO_FILTER })
  const caveat = ORIGIN_LABELS[run.origin].caveat
  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="leading-relaxed">
          agents don't browse with chrome much anymore. they use lighter engines built for them. agentcanuse runs each one against {run.sites.length} real sites every
          night, so you can see which ones read the page, find what's on it, and get let in.
        </p>
        <SiteSearch run={run} verdicts={verdicts} siteHref={siteHref} />
        {runPicker}
        {caveat !== null && <p className="text-[13px] text-fg-muted">{caveat}</p>}
      </div>
      <EngineList run={run} runs={runs} runParam={runParam} />
      <FindingsList run={run} runParam={runParam} />
      <CategoryGrid run={run} runParam={runParam} />
      <Disagreements run={run} verdicts={verdicts} runParam={runParam} />
      <div className="flex flex-col gap-2">
        <OutcomeKey />
        <a href="#method" className="text-[13px] text-fg-muted underline decoration-faint underline-offset-4 hover:text-fg">
          how each visit is scored
        </a>
      </div>
    </>
  )
}
