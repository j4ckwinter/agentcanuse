import type { Run, RunSummary } from '../../core/model'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ORIGIN_LABELS, shortDate } from '@/labels'

export function RunPicker({ runs, current, onPick }: { runs: RunSummary[]; current: Run; onPick: (id: string) => void }) {
  const isLatest = current.id === runs[0].id
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-fg-muted">
      <span>{isLatest ? 'latest run' : 'an earlier run'}</span>
      <Select value={current.id} onValueChange={onPick}>
        <SelectTrigger size="sm" className="h-7 rounded-md border-transparent px-1.5 text-[13px] text-fg-secondary shadow-none hover:bg-hover" aria-label="Choose a run">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {runs.map((run, position) => (
            <SelectItem key={run.id} value={run.id} className="text-[13px]">
              {shortDate(run.startedAt)} · {ORIGIN_LABELS[run.origin].short} · {run.siteCount} sites{position === 0 ? ' · latest' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>
        from {ORIGIN_LABELS[current.origin].label} · {runs.length} runs so far
      </span>
    </div>
  )
}
