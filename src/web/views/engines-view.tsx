import type { Run, RunSummary } from '../../core/model'
import { PageHeader } from '@/components/page-header'
import { EnginesCard } from '@/views/engines-card'
import { SpeedChart } from '@/views/speed-chart'

export function EnginesView({ run, runs, runParam }: { run: Run; runs: RunSummary[]; runParam: string | null }) {
  return (
    <>
      <PageHeader title="Engines" description="Every engine in this run, with its outcomes, speed and how sure each number is. Pick one to see every site it didn’t pass." />
      <EnginesCard run={run} runs={runs} runParam={runParam} />
      <SpeedChart run={run} />
    </>
  )
}
