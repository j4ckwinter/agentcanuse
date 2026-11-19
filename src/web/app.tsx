import { useEffect, useState } from 'react'
import type { Run, RunSummary } from '../core/model'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { loadIndex, loadRun } from '@/data'
import { ORIGIN_LABELS, shortDate } from '@/labels'
import { useRoute, type Route } from '@/route'
import { LeaderboardView } from '@/views/leaderboard-view'
import { MethodView } from '@/views/method-view'
import { ReleasesView } from '@/views/releases-view'
import { SitesView } from '@/views/sites-view'

type Loaded = { runs: RunSummary[]; latest: Run } | { error: string } | null

function useLatest(): Loaded {
  const [loaded, setLoaded] = useState<Loaded>(null)
  useEffect(() => {
    loadIndex()
      .then(async (runs) => {
        if (runs.length === 0) throw new Error('No runs have been recorded yet.')
        setLoaded({ runs, latest: await loadRun(runs[0].id) })
      })
      .catch((error: unknown) => setLoaded({ error: error instanceof Error ? error.message : String(error) }))
  }, [])
  return loaded
}

function Body({ route, runs, latest, navigate }: { route: Route; runs: RunSummary[]; latest: Run; navigate: (route: Route) => void }) {
  switch (route.view) {
    case 'leaderboard':
      return <LeaderboardView run={latest} />
    case 'sites':
      return <SitesView run={latest} site={route.site} onOpen={(site) => navigate({ view: 'sites', site })} />
    case 'releases':
      return <ReleasesView runs={runs} />
    case 'method':
      return <MethodView />
  }
}

export function App() {
  const loaded = useLatest()
  const [route, navigate] = useRoute()
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">agentcanuse</h1>
        <p className="text-muted-foreground">
          The browser engines AI agents use, run against real sites. Which ones render the page, find the content, and get let in.
        </p>
        {loaded !== null && 'latest' in loaded && (
          <p className="text-xs text-muted-foreground">
            Latest run {shortDate(loaded.latest.startedAt)} from {ORIGIN_LABELS[loaded.latest.origin].label} · {loaded.latest.sites.length} sites · {loaded.runs.length} runs recorded
          </p>
        )}
      </header>
      <Tabs value={route.view} onValueChange={(view) => navigate(view === 'sites' ? { view, site: null } : { view: view as 'leaderboard' | 'releases' | 'method' })}>
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="method">Method</TabsTrigger>
        </TabsList>
      </Tabs>
      {loaded === null && <p className="text-sm text-muted-foreground">Loading…</p>}
      {loaded !== null && 'error' in loaded && <p className="text-sm text-rose-700">{loaded.error}</p>}
      {loaded !== null && 'latest' in loaded && <Body route={route} runs={loaded.runs} latest={loaded.latest} navigate={navigate} />}
    </div>
  )
}
