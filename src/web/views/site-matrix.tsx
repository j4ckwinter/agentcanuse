import { Search, X } from 'lucide-react'
import { CATEGORIES, type Run, type Site } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { OutcomeKey, OutcomeMark } from '@/components/outcome-mark'
import { EngineDot } from '@/components/engine-dot'
import { displayHost } from '@/host'
import { TABLE_HEAD } from '@/components/table'
import { PageHeader } from '@/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VerdictLabel } from '@/components/verdict-label'
import { CATEGORY_LABELS, ENGINE_INFO } from '@/labels'
import { cn } from '@/lib/utils'
import { resultFor } from '@/results'
import { NO_FILTER, type Blocking, type SiteFilter } from '@/site-filter'

const BLOCKING_LABELS: Record<Exclude<Blocking, 'any'>, string> = {
  'only-chromium': 'Blocked Chromium, let a lighter engine in',
  'only-others': 'Let Chromium in, blocked a lighter engine',
}

const SEGMENT = 'inline-flex h-7 items-center rounded-sm px-2.5 text-label transition-colors'

interface ToolbarProps {
  filter: SiteFilter
  onChange: (filter: SiteFilter) => void
  disagreeing: number
  total: number
}

function Toolbar({ filter, onChange, disagreeing, total }: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
      <div className="relative lg:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-muted" />
        <input
          value={filter.query}
          onChange={(event) => onChange({ ...filter, query: event.target.value })}
          placeholder="Search by name or address"
          aria-label="Search sites"
          className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-label outline-none placeholder:text-fg-muted focus-visible:border-accent-blue"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-line bg-raised p-0.5" role="group" aria-label="Which sites">
          {[
            { value: false, label: `All sites`, count: total },
            { value: true, label: 'Engines disagree', count: disagreeing },
          ].map(({ value, label, count }) => (
            <button
              key={label}
              type="button"
              aria-pressed={filter.disagreeingOnly === value}
              onClick={() => onChange({ ...filter, disagreeingOnly: value })}
              className={cn(SEGMENT, filter.disagreeingOnly === value ? 'bg-surface font-medium text-fg shadow-xs' : 'text-fg-secondary hover:text-fg')}
            >
              {label}
              <span className="ml-1.5 font-mono text-micro text-fg-muted">{count}</span>
            </button>
          ))}
        </div>
        <Select value={filter.category} onValueChange={(category) => onChange({ ...filter, category: category as SiteFilter['category'] })}>
          <SelectTrigger size="sm" className="h-8 rounded-md text-label" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filter.blocking !== 'any' && (
          <button
            type="button"
            onClick={() => onChange({ ...filter, blocking: 'any' })}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-accent-blue/40 bg-accent-blue/10 px-2.5 text-label text-fg"
          >
            {BLOCKING_LABELS[filter.blocking]}
            <X className="size-3.5" aria-label="Clear" />
          </button>
        )}
      </div>
    </div>
  )
}

interface SiteMatrixProps {
  run: Run
  sites: Site[]
  verdicts: Map<string, Verdict>
  filter: SiteFilter
  onFilter: (filter: SiteFilter) => void
  disagreeing: number
  siteHref: (site: string) => string
}

export function SiteMatrix({ run, sites, verdicts, filter, onFilter, disagreeing, siteHref }: SiteMatrixProps) {
  return (
    <>
      <PageHeader title="Sites" description={`Every site in this run, its verdict, and how each engine did. Showing ${sites.length} of ${run.sites.length}.`} />
      <section className="rounded-xl border border-line bg-surface" aria-label="Sites">
        <Toolbar filter={filter} onChange={onFilter} disagreeing={disagreeing} total={run.sites.length} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-table border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={`${TABLE_HEAD} pl-card`}>Site</th>
                <th className={TABLE_HEAD}>Category</th>
                <th className={TABLE_HEAD}>Verdict</th>
                {run.engines.map((engine) => (
                  <th key={engine.id} className={`${TABLE_HEAD} text-center last:pr-card`}>
                    <span className="inline-flex items-center gap-1.5">
                      <EngineDot engine={engine.id} />
                      {ENGINE_INFO[engine.id].name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="relative border-b border-line last:border-0 hover:bg-raised">
                  <td className="px-3 py-2.5 pl-card">
                    <a href={siteHref(site.id)} className="text-sm font-medium after:absolute after:inset-0 hover:underline">
                      {site.name}
                    </a>
                    <div className="text-caption text-fg-muted">{displayHost(site.url)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-label text-fg-secondary">{CATEGORY_LABELS[site.category]}</td>
                  <td className="px-3 py-2.5">
                    <VerdictLabel verdict={verdicts.get(site.id) ?? 'mixed'} />
                  </td>
                  {run.engines.map((engine) => {
                    const result = resultFor(run, site.id, engine.id)
                    return (
                      <td key={engine.id} className="px-3 py-2.5 text-center last:pr-card">
                        {result && <OutcomeMark outcome={result.outcome} />}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sites.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-card py-12 text-center">
            <p className="text-sm font-medium">No sites match these filters</p>
            <button type="button" className="text-label font-medium text-accent-blue hover:underline" onClick={() => onFilter(NO_FILTER)}>
              Clear filters
            </button>
          </div>
        )}
        <div className="border-t border-line px-card py-3">
          <OutcomeKey />
        </div>
      </section>
    </>
  )
}
