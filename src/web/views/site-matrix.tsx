import { Search, X } from 'lucide-react'
import { CATEGORIES, OUTCOMES, type Run, type Site } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CATEGORY_LABELS, ENGINE_INFO, OUTCOME_LABELS } from '@/labels'
import { cn } from '@/lib/utils'
import { resultFor } from '@/results'
import { NO_FILTER, type Blocking, type SiteFilter } from '@/site-filter'

const ENGINE_COLUMN = 'px-1 text-[11px] sm:px-2 sm:text-sm'

const BLOCKING_LABELS: Record<Exclude<Blocking, 'any'>, string> = {
  'only-chromium': 'Blocked Chromium, let a lighter engine in',
  'only-others': 'Let Chromium in, blocked a lighter engine',
}

interface ToolbarProps {
  filter: SiteFilter
  onChange: (filter: SiteFilter) => void
  disagreeing: number
  total: number
}

function Toolbar({ filter, onChange, disagreeing, total }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter.query}
          onChange={(event) => onChange({ ...filter, query: event.target.value })}
          placeholder="Search sites"
          aria-label="Search sites"
          className="pl-8"
        />
      </div>
      <Select value={filter.category} onValueChange={(category) => onChange({ ...filter, category: category as SiteFilter['category'] })}>
        <SelectTrigger className="w-48" aria-label="Category">
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
      {filter.blocking !== 'any' && (
        <button
          type="button"
          onClick={() => onChange({ ...filter, blocking: 'any' })}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:bg-muted"
        >
          {BLOCKING_LABELS[filter.blocking]}
          <X className="size-3" aria-label="Clear" />
        </button>
      )}
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

interface SiteMatrixProps {
  run: Run
  sites: Site[]
  filter: SiteFilter
  onFilter: (filter: SiteFilter) => void
  disagreeing: number
  siteHref: (site: string) => string
}

export function SiteMatrix({ run, sites, filter, onFilter, disagreeing, siteHref }: SiteMatrixProps) {
  return (
    <div className="space-y-4">
      <Toolbar filter={filter} onChange={onFilter} disagreeing={disagreeing} total={run.sites.length} />
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
                {ENGINE_INFO[engine.id].name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site) => (
            <TableRow key={site.id} className="relative">
              <TableCell className="whitespace-normal">
                <a href={siteHref(site.id)} className="font-medium after:absolute after:inset-0 hover:underline focus-visible:underline">
                  {site.name}
                </a>
                <div className="text-xs text-muted-foreground">
                  {new URL(site.url).hostname} · {CATEGORY_LABELS[site.category]}
                </div>
              </TableCell>
              {run.engines.map((engine) => {
                const result = resultFor(run, site.id, engine.id)
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
      {sites.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No sites match.{' '}
          <button type="button" className="underline underline-offset-4" onClick={() => onFilter(NO_FILTER)}>
            Clear the filters
          </button>
        </div>
      )}
    </div>
  )
}
