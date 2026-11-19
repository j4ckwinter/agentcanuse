import { useMemo, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { leaderboard, type Standing } from '../../core/leaderboard'
import { OUTCOMES, type Run } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ENGINE_NAMES, OUTCOME_LABELS, percent, seconds } from '@/labels'
import { cn } from '@/lib/utils'

type SortKey = 'passRate' | 'blockedRate' | 'medianMs'

const SORTS: Record<SortKey, { label: string; compare: (a: Standing, b: Standing) => number }> = {
  passRate: { label: 'Pass rate', compare: (a, b) => b.passRate - a.passRate },
  blockedRate: { label: 'Blocked', compare: (a, b) => a.blockedRate - b.blockedRate },
  medianMs: { label: 'Median time', compare: (a, b) => (a.medianMs ?? Number.MAX_VALUE) - (b.medianMs ?? Number.MAX_VALUE) },
}

function SortHeader({ sortKey, active, onSort }: { sortKey: SortKey; active: SortKey; onSort: (key: SortKey) => void }) {
  return (
    <TableHead className="text-right">
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
  return (
    <div className="flex h-2 w-40 overflow-hidden rounded-full bg-muted">
      {OUTCOMES.map((outcome) => (
        <div
          key={outcome}
          title={`${OUTCOME_LABELS[outcome].label}: ${standing.counts[outcome]}`}
          className={OUTCOME_LABELS[outcome].tone}
          style={{ width: `${(standing.counts[outcome] / Math.max(total, 1)) * 100}%` }}
        />
      ))}
    </div>
  )
}

export function LeaderboardView({ run }: { run: Run }) {
  const [sortKey, setSortKey] = useState<SortKey>('passRate')
  const standings = useMemo(() => [...leaderboard(run)].sort(SORTS[sortKey].compare), [run, sortKey])
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Engine</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Outcomes</TableHead>
            <SortHeader sortKey="passRate" active={sortKey} onSort={setSortKey} />
            <SortHeader sortKey="blockedRate" active={sortKey} onSort={setSortKey} />
            <SortHeader sortKey="medianMs" active={sortKey} onSort={setSortKey} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing) => (
            <TableRow key={standing.engine.id}>
              <TableCell className="font-medium">{ENGINE_NAMES[standing.engine.id]}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{standing.engine.version}</TableCell>
              <TableCell>
                <OutcomeBar standing={standing} />
              </TableCell>
              <TableCell className="text-right text-base font-semibold tabular-nums">{percent(standing.passRate)}</TableCell>
              <TableCell className="text-right tabular-nums">{percent(standing.blockedRate)}</TableCell>
              <TableCell className="text-right tabular-nums">{seconds(standing.medianMs)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {OUTCOMES.map((outcome) => (
          <span key={outcome} className="flex items-center gap-1.5">
            <OutcomeBadge outcome={outcome} />
            {OUTCOME_LABELS[outcome].meaning}
          </span>
        ))}
      </div>
    </div>
  )
}
