import { useEffect, useState } from 'react'
import type { Run, RunSummary } from '../core/model'
import { ArrowLeft, BookOpen, Code, History, List } from 'lucide-react'
import { repository } from '../../package.json'
import { ThemeToggle } from '@/components/theme-toggle'
import { loadIndex, loadRun } from '@/data'
import { routeHash, useRoute, type Route } from '@/route'
import { EngineView } from '@/views/engine-view'
import { Footer } from '@/views/footer'
import { HomeView } from '@/views/home-view'
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

function withRun(route: Route, run: string | null): Route {
  return 'run' in route ? { ...route, run } : { view: 'home', run }
}

const ICON_BUTTON = 'inline-flex size-7 items-center justify-center rounded-md text-fg-secondary transition-transform hover:bg-hover hover:text-fg active:scale-[0.97]'

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <a href="#" className="group/home">
        <h1 className="font-medium">agentcanuse</h1>
        <p className="mt-1 text-fg-muted">can ai agents' browsers use the web?</p>
      </a>
      <nav aria-label="Links">
        <ul className="flex gap-px">
          <li>
            <a href="#sites" aria-label="Every site" title="Every site" className={ICON_BUTTON}>
              <List className="size-4" />
            </a>
          </li>
          <li>
            <a href="#releases" aria-label="Releases" title="Releases" className={ICON_BUTTON}>
              <History className="size-4" />
            </a>
          </li>
          <li>
            <a href="#method" aria-label="How it works" title="How it works" className={ICON_BUTTON}>
              <BookOpen className="size-4" />
            </a>
          </li>
          <li>
            <a href={repository.url} aria-label="Source on GitHub" title="Source on GitHub" className={ICON_BUTTON}>
              <Code className="size-4" />
            </a>
          </li>
          <li>
            <ThemeToggle className={ICON_BUTTON} />
          </li>
        </ul>
      </nav>
    </header>
  )
}

function Back({ route }: { route: Route }) {
  if (route.view === 'home') return null
  const href = route.view === 'sites' && route.site !== null ? routeHash({ ...route, site: null }) : routeHash({ view: 'home', run: runParamOf(route) })
  const label = route.view === 'sites' && route.site !== null ? 'all sites' : 'agentcanuse'
  return (
    <a href={href} className="-mb-4 inline-flex items-center gap-1 self-start text-[13px] text-fg-muted hover:text-fg">
      <ArrowLeft className="size-3.5" /> {label}
    </a>
  )
}

interface BodyProps {
  route: Route
  runs: RunSummary[]
  run: Run
  navigate: (route: Route, options?: { replace?: boolean }) => void
  runPicker: React.ReactNode
}

function Body({ route, runs, run, navigate, runPicker }: BodyProps) {
  switch (route.view) {
    case 'home':
      return <HomeView run={run} runs={runs} runParam={route.run} runPicker={runPicker} />
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

function LoadingRows() {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-10 animate-pulse rounded-lg bg-hover" />
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
  const error = (index !== null && 'error' in index && index.error) || (run !== null && 'error' in run && run.error) || null
  const ready = runs !== null && run !== null && 'value' in run ? { runs, run: run.value } : null
  const runPicker = ready && <RunPicker runs={ready.runs} current={ready.run} onPick={(id) => navigate(withRun(route, id === ready.runs[0].id ? null : id))} />

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[720px] flex-col gap-10 px-5 pt-8 pb-24 sm:px-8 md:pt-14">
      <Header />
      <main key={route.view} className="enter flex flex-1 flex-col gap-12">
        <Back route={route} />
        {unknownRun && <p className="text-[13px] text-fg-muted">there's no run called “{runParam}”, so this shows the latest one.</p>}
        {error !== null && <p className="text-sm text-destructive">{error}</p>}
        {error === null && ready === null && <LoadingRows />}
        {ready !== null && <Body route={route} runs={ready.runs} run={ready.run} navigate={navigate} runPicker={runPicker} />}
      </main>
      <Footer latest={runs?.[0] ?? null} />
    </div>
  )
}
