import type { RunSummary } from '../../core/model'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { dayLabel, ORIGIN_LABELS, shortDate, timeLabel } from '@/labels'
import { runsByDay } from '@/run-days'

function triggerLabel(run: RunSummary, latest: boolean) {
  if (!latest) return shortDate(run.startedAt)
  return (
    <>
      Latest run <span data-detail className="font-normal text-fg-muted">· {dayLabel(run.startedAt)}</span>
    </>
  )
}

export function RunPicker({ runs, current, onPick }: { runs: RunSummary[]; current: string; onPick: (id: string) => void }) {
  const selected = runs.find((run) => run.id === current) ?? runs[0]
  const latestId = runs[0]?.id
  return (
    <Select value={current} onValueChange={onPick}>
      <SelectTrigger size="sm" className="h-8 min-w-0 gap-2 overflow-hidden rounded-md border-transparent px-2 text-label font-medium shadow-none hover:bg-hover [&_[data-detail]]:hidden sm:[&_[data-detail]]:inline" aria-label="Choose a run">
        <SelectValue>
          <span className="truncate">{triggerLabel(selected, selected.id === latestId)}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="max-h-96 min-w-56">
        {runsByDay(runs).map(({ day, runs: dayRuns }) => (
          <SelectGroup key={day}>
            <SelectLabel className="px-2 pt-2 text-caption font-medium text-fg-muted">{dayLabel(dayRuns[0].startedAt)}</SelectLabel>
            {dayRuns.map((run) => (
              <SelectItem key={run.id} value={run.id} className="py-1.5 text-label">
                <span className="flex flex-col">
                  <span className="flex items-center gap-2">
                    {timeLabel(run.startedAt)}
                    {run.id === latestId && <span className="rounded border border-line px-1 text-micro text-fg-muted">Latest</span>}
                  </span>
                  <span className="text-caption text-fg-muted">
                    {ORIGIN_LABELS[run.origin].short} · {run.siteCount} sites
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
