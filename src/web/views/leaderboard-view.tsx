import { useMemo, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { leaderboard, trend, type Standing } from '../../core/leaderboard'
import { OUTCOMES, type Run, type RunSummary } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ENGINE_INFO, ORIGIN_LABELS, OUTCOME_LABELS, percent, releaseNotesUrl, seconds } from '@/labels'
import { cn } from '@/lib/utils'
import { routeHash } from '@/route'
import { CategoryTable } from '@/views/category-table'
import { Headline } from '@/views/headline'
import { Sparkline } from '@/views/sparkline'

type SortKey = 'passRate' | 'blockedRate' | 'medianMs'

const SORTS: Record<SortKey, { label: string; compare: (a: Standing, b: Standing) => number }> = {
  passRate: { label: 'Pass rate', compare: (a, b) => b.passRate - a.passRate },
  blockedRate: { label: 'Blocked', compare: (a, b) => a.blockedRate - b.blockedRate },
  medianMs: { label: 'Median time', compare: (a, b) => (a.medianMs ?? Number.MAX_VALUE) - (b.medianMs ?? Number.MAX_VALUE) },
}

function SortHeader({ sortKey, active, onSort }: { sortKey: SortKey; active: SortKey; onSort: (key: SortKey) => void }) {
  return (
    <TableHead className="text-right whitespace-normal" aria-sort={active === sortKey ? 'descending' : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn('inline-flex items-center gap-1 hover:text-foreground', active === sortKey && 'text-foreground')}
      >
        {SORTS[sortKey].label}
        <ArrowDown className={cn('size-3', active === sortKey ? 'opacity-100' : 'opacity-0')} />
      </button>
    </TableHead>
  )
}

function OutcomeBar({ standing }: { standing: Standing }) {
  const total = Object.values(standing.counts).reduce((sum, count) => sum + count, 0)
  const shown = OUTCOMES.filter((outcome) => standing.counts[outcome] > 0)
  return (
    <div className="w-56 space-y-1">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {shown.map((outcome) => (
          <div
            key={outcome}
            title={`${OUTCOME_LABELS[outcome].label}: ${standing.counts[outcome]}`}
            className={OUTCOME_LABELS[outcome].bar}
            style={{ width: `${(standing.counts[outcome] / Math.max(total, 1)) * 100}%` }}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground tabular-nums">
        {shown.map((outcome) => `${standing.counts[outcome]} ${OUTCOME_LABELS[outcome].label.toLowerCase()}`).join(' · ')}
      </p>
    </div>
  )
}

function Version({ standing }: { standing: Standing }) {
  const notes = releaseNotesUrl(standing.engine.id, standing.engine.version)
  const text = <span className="font-mono text-xs">{standing.engine.version}</span>
  return notes === null ? text : (
    <a href={notes} className="text-muted-foreground hover:text-foreground hover:underline" title="Release notes">
      {text}
    </a>
  )
}

function Key() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {OUTCOMES.map((outcome) => (
        <OutcomeBadge key={outcome} outcome={outcome} />
      ))}
      <a href="#method" className="underline-offset-4 hover:text-foreground hover:underline">
        What these mean
      </a>
    </div>
  )
}

interface LeaderboardViewProps {
  run: Run
  runs: RunSummary[]
  runParam: string | null
}

export function LeaderboardView({ run, runs, runParam }: LeaderboardViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('passRate')
  const ranked = useMemo(() => leaderboard(run), [run])
  const standings = useMemo(() => [...ranked].sort(SORTS[sortKey].compare), [ranked, sortKey])
  const current = runs.find((summary) => summary.id === run.id)
  const trends = new Map(standings.map((standing) => [standing.engine.id, current ? trend(runs, current, standing.engine.id) : []]))
  const showTrend = [...trends.values()].some((points) => points.length >= 2)
  const caveat = ORIGIN_LABELS[run.origin].caveat
  return (
    <div className="space-y-8">
      <Headline run={run} standings={ranked} runParam={runParam} />
      {caveat !== null && <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{caveat}</p>}
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Engine</TableHead>
              <TableHead className="hidden md:table-cell">Outcomes</TableHead>
              <SortHeader sortKey="passRate" active={sortKey} onSort={setSortKey} />
              {showTrend && <TableHead className="hidden text-right lg:table-cell">Trend</TableHead>}
              <SortHeader sortKey="blockedRate" active={sortKey} onSort={setSortKey} />
              <SortHeader sortKey="medianMs" active={sortKey} onSort={setSortKey} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((standing) => (
              <TableRow key={standing.engine.id}>
                <TableCell className="max-w-72 whitespace-normal">
                  <a href={routeHash({ view: 'engine', run: runParam, engine: standing.engine.id })} className="font-medium hover:underline">
                    {ENGINE_INFO[standing.engine.id].name}
                  </a>{' '}
                  <Version standing={standing} />
                  <p className="hidden text-xs text-muted-foreground sm:block">{ENGINE_INFO[standing.engine.id].about}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <OutcomeBar standing={standing} />
                </TableCell>
                <TableCell className="text-right text-base font-semibold tabular-nums">{percent(standing.passRate)}</TableCell>
                {showTrend && (
                  <TableCell className="hidden text-right lg:table-cell">
                    <Sparkline points={trends.get(standing.engine.id) ?? []} />
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums">{percent(standing.blockedRate)}</TableCell>
                <TableCell className="text-right tabular-nums">{seconds(standing.medianMs)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Key />
      </div>
      <CategoryTable run={run} runParam={runParam} />
    </div>
  )
}
