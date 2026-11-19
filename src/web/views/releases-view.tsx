import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { diffRuns, releaseComparison, type EngineDiff } from '../../core/diff'
import type { EngineId, Run, RunSummary } from '../../core/model'
import { OutcomeLabel } from '@/components/outcome-mark'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { loadRun } from '@/data'
import { CHANGE_LABELS, ENGINE_INFO, ORIGIN_LABELS, shortDate } from '@/labels'

function engineIds(runs: RunSummary[]): EngineId[] {
  return [...new Set(runs.flatMap((run) => run.engines.map((engine) => engine.id)))]
}

type DiffState = { diff: EngineDiff; names: Map<string, string> } | { error: string } | null

function useDiff(before: string | null, after: string | null, engine: EngineId): DiffState {
  const [state, setState] = useState<DiffState>(null)
  useEffect(() => {
    setState(null)
    if (before === null || after === null) return
    let current = true
    Promise.all([loadRun(before), loadRun(after)])
      .then(([earlier, later]: [Run, Run]) => {
        if (current) setState({ diff: diffRuns(earlier, later, engine), names: new Map(later.sites.map((site) => [site.id, site.name])) })
      })
      .catch((error: unknown) => {
        if (current) setState({ error: error instanceof Error ? error.message : String(error) })
      })
    return () => {
      current = false
    }
  }, [before, after, engine])
  return state
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function summary(diff: EngineDiff): string {
  const fixed = diff.changes.filter((change) => change.change === 'fixed').length
  const regressed = diff.changes.filter((change) => change.change === 'regressed').length
  return `${plural(fixed, 'site')} now passing, ${regressed} stopped passing, ${plural(diff.changes.length - fixed - regressed, 'other change')}.`
}

export function ReleasesView({ runs }: { runs: RunSummary[] }) {
  const engines = useMemo(() => engineIds(runs), [runs])
  const [engine, setEngine] = useState<EngineId>(engines[0] ?? 'chromium')
  const comparison = useMemo(() => releaseComparison(runs, engine), [runs, engine])
  const [before, setBefore] = useState<string | null>(null)
  useEffect(() => setBefore(comparison?.before ?? null), [comparison])
  const result = useDiff(before, comparison?.after ?? null, engine)
  const originOf = (id: string | null) => runs.find((run) => run.id === id)?.origin
  const crossesNetworks = before !== null && originOf(before) !== originOf(comparison?.after ?? null)
  const candidates = runs.filter((run) => run.id !== comparison?.after && run.engines.some((entry) => entry.id === engine))

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium">Releases</h2>
        <p className="leading-relaxed text-fg-secondary">what changed between an engine's latest run and its last run on a different version.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={engine} onValueChange={(value) => setEngine(value as EngineId)}>
          <SelectTrigger className="h-8 rounded-lg text-[13px]" aria-label="Engine">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {engines.map((id) => (
              <SelectItem key={id} value={id}>
                {ENGINE_INFO[id].name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {comparison !== null && before !== null && (
          <Select value={before} onValueChange={setBefore}>
            <SelectTrigger className="h-8 rounded-lg text-[13px]" aria-label="Compare with">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((run) => (
                <SelectItem key={run.id} value={run.id}>
                  {shortDate(run.startedAt)} · {run.engines.find((entry) => entry.id === engine)?.version} · {ORIGIN_LABELS[run.origin].short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {comparison !== null && <span className="text-[13px] text-fg-muted">against the latest run</span>}
      </div>
      {crossesNetworks && <p className="text-[13px] text-fg-muted">these runs came from different networks, so a change in blocking may be the network, not the engine.</p>}
      {comparison === null && <p className="text-fg-secondary">this engine needs two runs before there's anything to compare.</p>}
      {result !== null && 'error' in result && <p className="text-sm text-destructive">{result.error}</p>}
      {result !== null && 'diff' in result && (
        <section className="flex flex-col gap-4" aria-label="Changes">
          <p className="text-fg-secondary">
            <span className="font-mono text-fg">{result.diff.beforeVersion}</span> <ArrowRight className="inline size-3.5 text-fg-muted" />{' '}
            <span className="font-mono text-fg">{result.diff.afterVersion}</span>
            {': '}
            {summary(result.diff)}
          </p>
          {result.diff.changes.length === 0 ? (
            <p className="text-fg-muted">no site changed outcome between these runs.</p>
          ) : (
            <ul className="flex flex-col">
              {result.diff.changes.map((change) => (
                <li key={change.site} className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 rounded-lg px-3 py-2 hover:bg-raised">
                  <a href={`#sites/${change.site}`} className="truncate text-sm hover:underline">
                    {result.names.get(change.site) ?? change.site}
                  </a>
                  <OutcomeLabel outcome={change.before} />
                  <ArrowRight className="size-3.5 text-fg-muted" />
                  <OutcomeLabel outcome={change.after} />
                  <span className="col-span-4 text-[12px] text-fg-muted">{CHANGE_LABELS[change.change].label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  )
}
