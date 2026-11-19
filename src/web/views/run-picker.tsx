import type { Run, RunSummary } from '../../core/model'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ORIGIN_LABELS, shortDate } from '@/labels'

export function RunPicker({ runs, current, onPick }: { runs: RunSummary[]; current: Run; onPick: (id: string) => void }) {
  const isLatest = current.id === runs[0].id
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span>{isLatest ? 'Latest run' : 'Showing an earlier run'}</span>
      <Select value={current.id} onValueChange={onPick}>
        <SelectTrigger size="sm" className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {runs.map((run, position) => (
            <SelectItem key={run.id} value={run.id} className="text-xs">
              {shortDate(run.startedAt)} · {ORIGIN_LABELS[run.origin].short} · {run.siteCount} sites{position === 0 ? ' · latest' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>{runs.length} runs recorded</span>
    </div>
  )
}
