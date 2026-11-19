import type { RunSummary } from '../core/model'

export interface RunDay {
  day: string
  runs: RunSummary[]
}

export function runsByDay(runs: RunSummary[]): RunDay[] {
  const days: RunDay[] = []
  for (const run of runs) {
    const day = run.startedAt.slice(0, 10)
    const last = days.at(-1)
    if (last?.day === day) last.runs.push(run)
    else days.push({ day, runs: [run] })
  }
  return days
}
