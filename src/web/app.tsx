import { useEffect, useState } from 'react'
import type { Run, RunSummary } from '../core/model'
import { Code } from 'lucide-react'
import { repository } from '../../package.json'
import { ThemeToggle } from '@/components/theme-toggle'
import { BRAND_NAME, MARK_POINTER, MARK_POINTER_COLOR, MARK_RADIUS, MARK_TRAIL, MARK_TRAIL_WIDTH, MARK_VIEWBOX } from '@/brand'
import { loadIndex, loadRun } from '@/data'
import { routeHash, useRoute, type Route } from '@/route'
import { NO_FILTER } from '@/site-filter'
import { pageTitle } from '@/page-title'
import { EngineView } from '@/views/engine-view'
import { Footer } from '@/views/footer'
import { OverviewView } from '@/views/overview-view'
import { SiteSearch } from '@/views/site-search'
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

const ICON_BUTTON = 'inline-flex size-8 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-hover hover:text-fg'

type Tab = 'home' | 'sites' | 'releases' | 'method'

const TABS: { tab: Tab; label: string }[] = [
  { tab: 'home', label: 'Overview' },
  { tab: 'sites', label: 'Sites' },
  { tab: 'releases', label: 'Releases' },
  { tab: 'method', label: 'Method' },
]

function tabOf(route: Route): Tab {
  return route.view === 'engine' ? 'home' : route.view
}

function tabHref(tab: Tab, run: string | null): string {
  switch (tab) {
    case 'home':
      return routeHash({ view: 'home', run })
    case 'sites':
      return routeHash({ view: 'sites', run, site: null, filter: NO_FILTER })
    case 'releases':
    case 'method':
      return routeHash({ view: tab })
  }
}

function Mark() {
  return (
    <svg viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`} aria-hidden="true" className="size-6 shrink-0">
      <rect width={MARK_VIEWBOX} height={MARK_VIEWBOX} rx={MARK_RADIUS} className="fill-fg" />
      <path d={MARK_POINTER} fill={MARK_POINTER_COLOR} />
      {MARK_TRAIL.map(({ d, color }) => (
        <path key={d} d={d} stroke={color} strokeWidth={MARK_TRAIL_WIDTH} strokeLinecap="round" />
      ))}
    </svg>
  )
}

interface TopBarProps {
  route: Route
  ready: { runs: RunSummary[]; run: Run } | null
  navigate: (route: Route, options?: { replace?: boolean }) => void
}

function TopBar({ route, ready, navigate }: TopBarProps) {
  const runParam = runParamOf(route)
  const active = tabOf(route)
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 px-4 sm:px-6">
        <a href={tabHref('home', runParam)} className="flex items-center gap-2.5 rounded-md pr-1 text-sm font-semibold">
          <Mark />
          {BRAND_NAME}
        </a>
        {ready && (
          <>
            <span className="text-faint" aria-hidden="true">
              /
            </span>
            <RunPicker runs={ready.runs} current={ready.run.id} onPick={(id) => navigate(withRun(route, id === ready.runs[0].id ? null : id))} />
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {ready && (
            <div className="mr-1 hidden w-64 md:block">
              <SiteSearch run={ready.run} siteHref={(site) => routeHash({ view: 'sites', run: runParam, site, filter: NO_FILTER })} />
            </div>
          )}
          <a href={repository.url} aria-label="Source on GitHub" title="Source on GitHub" className={ICON_BUTTON}>
            <Code className="size-4" />
          </a>
          <ThemeToggle className={ICON_BUTTON} />
        </div>
      </div>
      <nav aria-label="Sections" className="mx-auto flex max-w-page gap-1 overflow-x-auto px-2 sm:px-4">
        {TABS.map(({ tab, label }) => (
          <a
            key={tab}
            href={tabHref(tab, runParam)}
            aria-current={active === tab ? 'page' : undefined}
            className="relative px-2.5 py-2.5 text-label whitespace-nowrap text-fg-secondary transition-colors hover:text-fg aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-fg"
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  )
}

interface BodyProps {
  route: Route
  runs: RunSummary[]
  run: Run
  navigate: (route: Route, options?: { replace?: boolean }) => void
}

function Body({ route, runs, run, navigate }: BodyProps) {
  switch (route.view) {
    case 'home':
      return <OverviewView run={run} runs={runs} runParam={route.run} />
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

function LoadingCards() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <div key={tile} className="h-26 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
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
  const title = pageTitle(route, ready?.run ?? null)
  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar route={route} ready={ready} navigate={navigate} />
      <main key={route.view} className="enter mx-auto flex w-full max-w-page flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {unknownRun && <p className="text-label text-fg-muted">There's no run called “{runParam}”, so this shows the latest one.</p>}
        {error !== null && <p className="text-sm text-destructive">{error}</p>}
        {error === null && ready === null && <LoadingCards />}
        {ready !== null && <Body route={route} runs={ready.runs} run={ready.run} navigate={navigate} />}
      </main>
      <Footer latest={runs?.[0] ?? null} />
    </div>
  )
}
