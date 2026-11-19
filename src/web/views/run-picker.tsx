import type { RunSummary } from '../../core/model'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ORIGIN_LABELS, shortDate } from '@/labels'

export function RunPicker({ runs, current, onPick }: { runs: RunSummary[]; current: string; onPick: (id: string) => void }) {
  return (
    <Select value={current} onValueChange={onPick}>
      <SelectTrigger size="sm" className="h-8 max-w-[9.5rem] min-w-0 gap-2 overflow-hidden rounded-md border-transparent px-2 text-[13px] font-medium shadow-none hover:bg-hover sm:max-w-none" aria-label="Choose a run">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {runs.map((run, position) => (
          <SelectItem key={run.id} value={run.id} className="text-[13px]">
            <span className="flex items-center gap-2">
              {position === 0 ? 'Latest run' : shortDate(run.startedAt)}
              <span className="text-fg-muted">
                {position === 0 && `${shortDate(run.startedAt)} · `}
                {ORIGIN_LABELS[run.origin].short} · {run.siteCount} sites
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
