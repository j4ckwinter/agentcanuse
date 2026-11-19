import { useMemo, useState } from 'react'
import { ArrowLeft, ImageOff, Search } from 'lucide-react'
import { sitesWhereEnginesDisagree } from '../../core/agreement'
import { CATEGORIES, OUTCOMES, type EngineRun, type Result, type Run, type Site } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { shotUrl } from '@/data'
import { CATEGORY_LABELS, ENGINE_NAMES, OUTCOME_LABELS, seconds } from '@/labels'
import { cn } from '@/lib/utils'
import { filterSites, NO_FILTER, type SiteFilter } from '@/site-filter'

const ENGINE_COLUMN = 'px-1 text-[11px] sm:px-2 sm:text-sm'

function resultFor(run: Run, site: string, engine: EngineRun): Result | undefined {
  return run.results.find((result) => result.site === site && result.engine === engine.id)
}

function Toolbar({ filter, onChange, disagreeing, total }: { filter: SiteFilter; onChange: (filter: SiteFilter) => void; disagreeing: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={filter.query} onChange={(event) => onChange({ ...filter, query: event.target.value })} placeholder="Search sites" className="pl-8" />
      </div>
      <Select value={filter.category} onValueChange={(category) => onChange({ ...filter, category: category as SiteFilter['category'] })}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tabs value={filter.disagreeingOnly ? 'disagree' : 'all'} onValueChange={(value) => onChange({ ...filter, disagreeingOnly: value === 'disagree' })}>
        <TabsList>
          <TabsTrigger value="all">All sites ({total})</TabsTrigger>
          <TabsTrigger value="disagree">Engines disagree ({disagreeing})</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

function DotLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground sm:hidden">
      {OUTCOMES.map((outcome) => (
        <span key={outcome} className="flex items-center gap-1">
          <span className={cn('inline-block size-2.5 rounded-full', OUTCOME_LABELS[outcome].bar)} />
          {OUTCOME_LABELS[outcome].label}
        </span>
      ))}
    </div>
  )
}

function SiteMatrix({ run, filter, setFilter, onOpen }: { run: Run; filter: SiteFilter; setFilter: (filter: SiteFilter) => void; onOpen: (site: string) => void }) {
  const disagreeing = useMemo(() => sitesWhereEnginesDisagree(run.results), [run])
  const sites = filterSites(run.sites, filter, disagreeing)
  return (
    <div className="space-y-4">
      <Toolbar filter={filter} onChange={setFilter} disagreeing={disagreeing.size} total={run.sites.length} />
      <DotLegend />
      <p className="text-xs text-muted-foreground">
        Showing {sites.length} of {run.sites.length} sites. Pick one to see each engine's result side by side.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Site</TableHead>
            {run.engines.map((engine) => (
              <TableHead key={engine.id} className={ENGINE_COLUMN}>
                {ENGINE_NAMES[engine.id]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site) => (
            <TableRow key={site.id} className="cursor-pointer" onClick={() => onOpen(site.id)}>
              <TableCell className="whitespace-normal">
                <div className="font-medium">{site.name}</div>
                <div className="text-xs text-muted-foreground">
                  {new URL(site.url).hostname} · {CATEGORY_LABELS[site.category]}
                </div>
              </TableCell>
              {run.engines.map((engine) => {
                const result = resultFor(run, site.id, engine)
                return (
                  <TableCell key={engine.id} className={ENGINE_COLUMN}>
                    {result && <OutcomeBadge outcome={result.outcome} dotOnPhones />}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sites.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No sites match.</p>}
    </div>
  )
}

function Screenshot({ result }: { result: Result }) {
  if (result.shot !== null) {
    return <img src={shotUrl(result.shot)} alt="" className="aspect-[8/5] w-full rounded-md border object-cover object-top" />
  }
  return (
    <div className="flex aspect-[8/5] w-full flex-col items-center justify-center gap-2 rounded-md border bg-muted p-4 text-center text-xs text-muted-foreground">
      <ImageOff className="size-5" />
      {result.excerpt === '' ? 'Nothing to show' : <p className="line-clamp-6 text-left">{result.excerpt}</p>}
    </div>
  )
}

function EngineCard({ engine, result }: { engine: EngineRun; result: Result }) {
  return (
    <Card size="sm" className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          {ENGINE_NAMES[engine.id]} <span className="font-mono text-xs font-normal text-muted-foreground">{engine.version}</span>
        </CardTitle>
        <OutcomeBadge outcome={result.outcome} />
      </CardHeader>
      <CardContent className="space-y-3">
        <Screenshot result={result} />
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="tabular-nums">{result.status ?? '–'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time</dt>
            <dd className="tabular-nums">{seconds(result.durationMs || null)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Text</dt>
            <dd className="tabular-nums">{result.textLength.toLocaleString('en-GB')} chars</dd>
          </div>
        </dl>
        {result.missing.length > 0 && result.outcome !== 'skipped' && (
          <p className="text-xs text-muted-foreground">Missing: {result.missing.map((phrase) => `“${phrase}”`).join(', ')}</p>
        )}
        {result.error !== null && <p className="text-xs text-rose-700">{result.error}</p>}
      </CardContent>
    </Card>
  )
}

function SiteComparison({ run, site, onBack }: { run: Run; site: Site; onBack: () => void }) {
  const results = run.results.filter((result) => result.site === site.id)
  const agreed = !sitesWhereEnginesDisagree(results).has(site.id)
  const noScreenshots = results.every((result) => result.shot === null)
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All sites
      </button>
      <div>
        <h2 className="text-xl font-semibold">{site.name}</h2>
        <a href={site.url} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          {site.url}
        </a>
        <p className="mt-1 text-sm text-muted-foreground">Expects: {site.expect.map((phrase) => `“${phrase}”`).join(', ')}</p>
      </div>
      {agreed && noScreenshots && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Every engine got the same result here, so no screenshots are kept. Screenshots are kept only where engines disagree.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {run.engines.map((engine) => {
          const result = resultFor(run, site.id, engine)
          return result && <EngineCard key={engine.id} engine={engine} result={result} />
        })}
      </div>
    </div>
  )
}

export function SitesView({ run, site, onOpen }: { run: Run; site: string | null; onOpen: (site: string | null) => void }) {
  const [filter, setFilter] = useState<SiteFilter>(NO_FILTER)
  const selected = run.sites.find((entry) => entry.id === site)
  if (selected === undefined) return <SiteMatrix run={run} filter={filter} setFilter={setFilter} onOpen={onOpen} />
  return <SiteComparison run={run} site={selected} onBack={() => onOpen(null)} />
}
