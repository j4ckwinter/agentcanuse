import { useEffect, useState } from 'react'
import { sameSurvey } from '../core/comparable'
import type { Run, RunSummary } from '../core/model'
import { loadRun } from './data'

export const HISTORY_RUNS = 7

export function comparableRuns(runs: RunSummary[], current: RunSummary): RunSummary[] {
  return runs
    .filter((run) => sameSurvey(run, current) && run.startedAt <= current.startedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, HISTORY_RUNS)
}

export function useHistory(runs: RunSummary[], current: Run): Run[] | null {
  const [loaded, setLoaded] = useState<{ key: string; runs: Run[] } | null>(null)
  const summary = runs.find((run) => run.id === current.id)
  const ids = summary ? comparableRuns(runs, summary).map((run) => run.id) : [current.id]
  const key = ids.join(',')
  useEffect(() => {
    let live = true
    Promise.allSettled(ids.map((id) => (id === current.id ? Promise.resolve(current) : loadRun(id)))).then((settled) => {
      const loadedRuns = settled.flatMap((outcome) => (outcome.status === 'fulfilled' ? [outcome.value] : []))
      if (live) setLoaded({ key, runs: loadedRuns })
    })
    return () => {
      live = false
    }
  }, [key])
  return loaded !== null && loaded.key === key ? loaded.runs : null
}
