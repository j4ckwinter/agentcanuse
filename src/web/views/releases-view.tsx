import { useEffect, useMemo, useState } from 'react'
import { diffRuns, releaseComparison, type EngineDiff } from '../../core/diff'
import type { EngineId, Run, RunSummary } from '../../core/model'
import { Card, StatTile } from '@/components/card'
import { OutcomeLabel } from '@/components/outcome-mark'
import { PageHeader } from '@/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { loadRun } from '@/data'
import { CHANGE_LABELS, ENGINE_COLORS, ENGINE_INFO, ORIGIN_LABELS, shortDate } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

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

function changeCounts(diff: EngineDiff): { fixed: number; regressed: number; other: number } {
  const fixed = diff.changes.filter((change) => change.change === 'fixed').length
  const regressed = diff.changes.filter((change) => change.change === 'regressed').length
  return { fixed, regressed, other: diff.changes.length - fixed - regressed }
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

  const counts = result !== null && 'diff' in result ? changeCounts(result.diff) : null
  return (
    <>
      <PageHeader title="Releases" description="What changed for an engine between its latest run and its last run on a different version. A new release is picked up within six hours." />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={engine} onValueChange={(value) => setEngine(value as EngineId)}>
          <SelectTrigger size="sm" className="h-8 rounded-md text-label" aria-label="Engine">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {engines.map((id) => (
              <SelectItem key={id} value={id}>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: ENGINE_COLORS[id] }} aria-hidden="true" />
                  {ENGINE_INFO[id].name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {comparison !== null && before !== null && (
          <>
            <span className="text-label text-fg-muted">compared with</span>
            <Select value={before} onValueChange={setBefore}>
              <SelectTrigger size="sm" className="h-8 rounded-md text-label" aria-label="Compare with">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {candidates.map((run) => (
                  <SelectItem key={run.id} value={run.id}>
                    {shortDate(run.startedAt)} · {run.engines.find((entry) => entry.id === engine)?.version} · {ORIGIN_LABELS[run.origin].short}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      {crossesNetworks && <p className="text-label text-fg-muted">These runs came from different networks, so a change in blocking may be the network rather than the engine.</p>}
      {comparison === null && (
        <div className="rounded-xl border border-dashed border-line bg-surface px-card py-12 text-center">
          <p className="text-sm font-medium">Nothing to compare yet</p>
          <p className="mt-1 text-label text-fg-muted">{ENGINE_INFO[engine].name} needs two runs before a release can be compared.</p>
        </div>
      )}
      {result !== null && 'error' in result && <p className="text-sm text-destructive">{result.error}</p>}
      {result !== null && 'diff' in result && counts !== null && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatTile label="Now passing" value={counts.fixed} accent="var(--status-good)" />
            <StatTile label="Stopped passing" value={counts.regressed} accent="var(--status-critical)" />
            <StatTile label="Other changes" value={counts.other} />
          </div>
          <Card
            title={
              `${result.diff.beforeVersion} → ${result.diff.afterVersion}`
            }
            description={`${ENGINE_INFO[engine].name}, site by site`}
          >
            {result.diff.changes.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-muted">No site changed outcome between these runs.</p>
            ) : (
              <div className="-mx-card -my-card overflow-x-auto">
                <table className="w-full min-w-table-narrow border-collapse">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="px-3 py-2 pl-card text-left text-caption font-medium text-fg-muted">Site</th>
                      <th className="px-3 py-2 text-left text-caption font-medium text-fg-muted">Before</th>
                      <th className="px-3 py-2 text-left text-caption font-medium text-fg-muted">After</th>
                      <th className="px-3 py-2 pr-card text-left text-caption font-medium text-fg-muted">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.diff.changes.map((change) => (
                      <tr key={change.site} className="relative border-b border-line last:border-0 hover:bg-raised">
                        <td className="px-3 py-2.5 pl-card">
                          <a href={routeHash({ view: 'sites', run: null, site: change.site, filter: NO_FILTER })} className="text-sm font-medium after:absolute after:inset-0 hover:underline">
                            {result.names.get(change.site) ?? change.site}
                          </a>
                        </td>
                        <td className="px-3 py-2.5">
                          <OutcomeLabel outcome={change.before} />
                        </td>
                        <td className="px-3 py-2.5">
                          <OutcomeLabel outcome={change.after} />
                        </td>
                        <td className="px-3 py-2.5 pr-card text-label text-fg-secondary">{CHANGE_LABELS[change.change].label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
