import { useEffect, useState } from 'react'
import type { Run, RunSummary } from '../core/model'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { loadIndex, loadRun } from '@/data'
import { useRoute, type Route } from '@/route'
import { NO_FILTER } from '@/site-filter'
import { EngineView } from '@/views/engine-view'
import { Footer } from '@/views/footer'
import { LeaderboardView } from '@/views/leaderboard-view'
import { MethodView } from '@/views/method-view'
import { ReleasesView } from '@/views/releases-view'
import { RunPicker } from '@/views/run-picker'
import { SitesView } from '@/views/sites-view'

type Loaded<T> = { value: T } | { error: string } | null

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function useIndex(): Loaded<RunSummary[]> {
  const [loaded, setLoaded] = useState<Loaded<RunSummary[]>>(null)
  useEffect(() => {
    loadIndex()
      .then((runs) => setLoaded(runs.length === 0 ? { error: 'No runs have been recorded yet.' } : { value: runs }))
      .catch((error: unknown) => setLoaded({ error: messageOf(error) }))
  }, [])
  return loaded
}

function useRun(id: string | null): Loaded<Run> {
  const [loaded, setLoaded] = useState<{ id: string; result: Loaded<Run> } | null>(null)
  useEffect(() => {
    if (id === null) return
    let current = true
    loadRun(id)
      .then((run) => current && setLoaded({ id, result: { value: run } }))
      .catch((error: unknown) => current && setLoaded({ id, result: { error: messageOf(error) } }))
    return () => {
      current = false
    }
  }, [id])
  return loaded !== null && loaded.id === id ? loaded.result : null
}

function runParamOf(route: Route): string | null {
  return 'run' in route ? route.run : null
}

function tabRoute(view: string, run: string | null): Route {
  switch (view) {
    case 'sites':
      return { view: 'sites', run, site: null, filter: NO_FILTER }
    case 'releases':
      return { view: 'releases' }
    case 'method':
      return { view: 'method' }
    default:
      return { view: 'leaderboard', run }
  }
}

function withRun(route: Route, run: string | null): Route {
  return 'run' in route ? { ...route, run } : { view: 'leaderboard', run }
}

interface BodyProps {
  route: Route
  runs: RunSummary[]
  run: Run
  navigate: (route: Route, options?: { replace?: boolean }) => void
}

function Body({ route, runs, run, navigate }: BodyProps) {
  switch (route.view) {
    case 'leaderboard':
      return <LeaderboardView run={run} runs={runs} runParam={route.run} />
    case 'sites':
      return <SitesView run={run} route={route} navigate={navigate} />
    case 'engine':
      return <EngineView run={run} engine={route.engine} runParam={route.run} />
    case 'releases':
      return <ReleasesView runs={runs} />
    case 'method':
      return <MethodView />
  }
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
      <rect width="32" height="32" rx="7" className="fill-foreground" />
      <rect x="7" y="18" width="4" height="7" rx="1" fill="#10b981" />
      <rect x="14" y="12" width="4" height="13" rx="1" fill="#10b981" />
      <rect x="21" y="7" width="4" height="18" rx="1" fill="#f43f5e" />
    </svg>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="Loading">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-10 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

export function App() {
  const index = useIndex()
  const [route, navigate] = useRoute()
  const runParam = runParamOf(route)
  const runs = index !== null && 'value' in index ? index.value : null
  const known = runs?.find((summary) => summary.id === runParam)
  const runId = runs === null ? null : (known?.id ?? runs[0].id)
  const unknownRun = runs !== null && runParam !== null && known === undefined
  const run = useRun(runId)
  const tab = route.view === 'engine' ? 'leaderboard' : route.view
  const error = (index !== null && 'error' in index && index.error) || (run !== null && 'error' in run && run.error) || null
  const ready = runs !== null && run !== null && 'value' in run ? { runs, run: run.value } : null

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <a href="#leaderboard" className="inline-flex items-center gap-2.5">
          <Mark />
          <h1 className="text-3xl font-semibold tracking-tight">agentcanuse</h1>
        </a>
        <p className="text-muted-foreground">
          The browser engines AI agents use, run against real sites. Which ones render the page, find the content, and get let in.
        </p>
        {ready !== null && (
          <RunPicker runs={ready.runs} current={ready.run} onPick={(id) => navigate(withRun(route, id === ready.runs[0].id ? null : id))} />
        )}
      </header>
      <Tabs value={tab} onValueChange={(view) => navigate(tabRoute(view, runParam))}>
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="method">Method</TabsTrigger>
        </TabsList>
      </Tabs>
      <main className="flex-1 space-y-4">
        {unknownRun && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            There's no run called “{runParam}”, so this shows the latest run instead.
          </p>
        )}
        {error !== null && <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>}
        {error === null && ready === null && <LoadingRows />}
        {ready !== null && <Body route={route} runs={ready.runs} run={ready.run} navigate={navigate} />}
      </main>
      <Footer latest={runs?.[0] ?? null} />
    </div>
  )
}
