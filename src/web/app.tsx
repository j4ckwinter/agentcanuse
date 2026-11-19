import { useEffect, useState } from 'react'
import type { Run, RunSummary } from '../core/model'
import { Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pageViewFor, recordView } from '@/analytics'
import { repository } from '../../package.json'
import { ThemeToggle } from '@/components/theme-toggle'
import { BRAND_NAME, MARK_POINTER, MARK_POINTER_COLOR, MARK_RADIUS, MARK_TRAIL, MARK_TRAIL_WIDTH, MARK_VIEWBOX } from '@/brand'
import { loadIndex, loadRun } from '@/data'
import { routeHash, sectionRoute, useRoute, type Route, type Section } from '@/route'
import { NO_FILTER } from '@/site-filter'
import { pageTitle } from '@/page-title'
import { EngineView } from '@/views/engine-view'
import { EnginesView } from '@/views/engines-view'
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

function withRun(route: Route, run: string | null): Route {
  return { ...route, run }
}

const ICON_BUTTON = 'inline-flex size-8 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-hover hover:text-fg'

const TABS: { section: Section; label: string }[] = [
  { section: 'home', label: 'Overview' },
  { section: 'engines', label: 'Engines' },
  { section: 'sites', label: 'Sites' },
  { section: 'releases', label: 'Releases' },
  { section: 'method', label: 'Method' },
]

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
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 px-4 sm:px-6">
        <a href={routeHash(sectionRoute('home', route.run))} className="flex shrink-0 items-center gap-2.5 rounded-md pr-1 text-sm font-semibold whitespace-nowrap">
          <Mark />
          {BRAND_NAME}
        </a>
        {ready && (
          <>
            <span className="hidden text-faint sm:inline" aria-hidden="true">
              /
            </span>
            <RunPicker runs={ready.runs} current={ready.run.id} onPick={(id) => navigate(withRun(route, id === ready.runs[0].id ? null : id))} />
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {ready && (
            <div className="mr-1 hidden w-64 md:block">
              <SiteSearch run={ready.run} siteHref={(site) => routeHash({ view: 'sites', run: route.run, site, filter: NO_FILTER })} />
            </div>
          )}
          <a href={repository.url} aria-label="Source on GitHub" title="Source on GitHub" className={cn(ICON_BUTTON, 'hidden sm:inline-flex')}>
            <Code className="size-4" />
          </a>
          <ThemeToggle className={ICON_BUTTON} />
        </div>
      </div>
      <nav aria-label="Sections" className="mx-auto flex max-w-page gap-0.5 overflow-x-auto px-2 [scrollbar-width:none] sm:gap-1 sm:px-4 [&::-webkit-scrollbar]:hidden">
        {TABS.map(({ section, label }) => (
          <a
            key={section}
            href={routeHash(sectionRoute(section, route.run))}
            aria-current={route.view === section ? 'page' : undefined}
            className="relative px-2 py-2.5 text-label whitespace-nowrap sm:px-2.5 text-fg-secondary transition-colors hover:text-fg aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-fg"
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
      return <SitesView run={run} runs={runs} route={route} navigate={navigate} />
    case 'engines':
      return route.engine === null ? <EnginesView run={run} runs={runs} runParam={route.run} /> : <EngineView run={run} engine={route.engine} runParam={route.run} />
    case 'releases':
      return <ReleasesView runs={runs} />
    case 'method':
      return <MethodView />
  }
}

function LoadingCards() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-3">
        <div className="h-8 w-2/3 max-w-md animate-pulse rounded-md bg-hover" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-hover" />
      </div>
      <div className="h-56 animate-pulse rounded-xl border border-line bg-surface" />
      <div className="h-96 animate-pulse rounded-xl border border-line bg-surface" />
    </div>
  )
}

export function App() {
  const index = useIndex()
  const [route, navigate] = useRoute()
  const runParam = route.run
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
  const view = pageViewFor(route)
  useEffect(() => {
    recordView({ route: view.route, path: view.path })
  }, [view.route, view.path])

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar route={route} ready={ready} navigate={navigate} />
      <main key={route.view} className="enter mx-auto flex w-full max-w-page flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {unknownRun && <p className="text-label text-fg-muted">There's no run called “{runParam}”, so this shows the latest one.</p>}
        {error !== null && <p className="text-sm text-destructive">{error}</p>}
        {error === null && ready === null && <LoadingCards />}
        {ready !== null && <Body route={route} runs={ready.runs} run={ready.run} navigate={navigate} />}
      </main>
      <Footer />
    </div>
  )
}
