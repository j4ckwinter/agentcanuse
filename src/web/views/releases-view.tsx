import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { diffRuns, releaseComparison, type EngineDiff } from '../../core/diff'
import type { EngineId, Run, RunSummary } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { loadRun } from '@/data'
import { CHANGE_LABELS, ENGINE_NAMES, ORIGIN_LABELS, shortDate } from '@/labels'

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

function DiffSummary({ diff }: { diff: EngineDiff }) {
  const fixed = diff.changes.filter((change) => change.change === 'fixed').length
  const regressed = diff.changes.filter((change) => change.change === 'regressed').length
  return (
    <p className="text-sm">
      <span className="font-mono">{diff.beforeVersion}</span> <ArrowRight className="inline size-3" />{' '}
      <span className="font-mono">{diff.afterVersion}</span>
      <span className="ml-3 text-emerald-700">{fixed} now passing</span>
      <span className="ml-3 text-rose-700">{regressed} stopped passing</span>
      <span className="ml-3 text-muted-foreground">{plural(diff.changes.length - fixed - regressed, 'other change')}</span>
    </p>
  )
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={engine} onValueChange={(value) => setEngine(value as EngineId)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {engines.map((id) => (
              <SelectItem key={id} value={id}>
                {ENGINE_NAMES[id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {comparison !== null && before !== null && (
          <Select value={before} onValueChange={setBefore}>
            <SelectTrigger className="w-64">
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
        {comparison !== null && <span className="text-sm text-muted-foreground">compared with the latest run</span>}
      </div>
      {crossesNetworks && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          These runs came from different networks, so a change in blocking may be the network rather than the engine.
        </p>
      )}
      {comparison === null && <p className="text-sm text-muted-foreground">This engine needs two runs before there is anything to compare.</p>}
      {result !== null && 'error' in result && <p className="text-sm text-rose-700">{result.error}</p>}
      {result !== null && 'diff' in result && (
        <>
          <DiffSummary diff={result.diff} />
          {result.diff.changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No site changed outcome between these runs.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.diff.changes.map((change) => (
                  <TableRow key={change.site}>
                    <TableCell className="font-medium">
                      <a href={`#sites/${change.site}`} className="hover:underline">
                        {result.names.get(change.site) ?? change.site}
                      </a>
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={change.before} />
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={change.after} />
                    </TableCell>
                    <TableCell className={CHANGE_LABELS[change.change].tone}>{CHANGE_LABELS[change.change].label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  )
}
