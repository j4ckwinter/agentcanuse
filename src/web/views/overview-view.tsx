import { useMemo } from 'react'
import { Info } from 'lucide-react'
import type { Run, RunSummary } from '../../core/model'
import { verdictsBySite } from '../../core/verdict'
import { PageHeader } from '@/components/page-header'
import { ORIGIN_LABELS } from '@/labels'
import { CategoryGuide } from '@/views/category-guide'
import { DisagreementsCard } from '@/views/disagreements-card'
import { EnginesCard } from '@/views/engines-card'
import { FindingsCard } from '@/views/findings-card'
import { TestExplainer } from '@/views/test-explainer'

export function OverviewView({ run, runs, runParam }: { run: Run; runs: RunSummary[]; runParam: string | null }) {
  const verdicts = useMemo(() => verdictsBySite(run.results), [run])
  const caveat = ORIGIN_LABELS[run.origin].caveat
  return (
    <>
      <PageHeader
        title="Can AI agents’ browsers use the web?"
        description={`Agents browse with lighter engines built for them, not just Chrome. We run each one against the same ${run.sites.length} real sites and score whether it can load the page, find what’s on it, and get past the bot checks.`}
      />
      <TestExplainer />
      {caveat !== null && (
        <p className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-label text-fg-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-accent-blue" />
          {caveat}
        </p>
      )}
      <EnginesCard run={run} runs={runs} runParam={runParam} />
      <CategoryGuide run={run} runParam={runParam} />
      <FindingsCard run={run} runParam={runParam} />
      <DisagreementsCard run={run} verdicts={verdicts} runParam={runParam} />
    </>
  )
}
