import { Search, X } from 'lucide-react'
import { CATEGORIES, type Run, type Site } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { OutcomeKey, OutcomeMark } from '@/components/outcome-mark'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VerdictLabel } from '@/components/verdict-label'
import { CATEGORY_LABELS, ENGINE_INFO } from '@/labels'
import { cn } from '@/lib/utils'
import { resultFor } from '@/results'
import { NO_FILTER, type Blocking, type SiteFilter } from '@/site-filter'

const BLOCKING_LABELS: Record<Exclude<Blocking, 'any'>, string> = {
  'only-chromium': 'blocked chromium, let a lighter engine in',
  'only-others': 'let chromium in, blocked a lighter engine',
}

const PILL = 'inline-flex h-8 items-center rounded-lg border px-3 text-[13px] transition-colors'

interface ToolbarProps {
  filter: SiteFilter
  onChange: (filter: SiteFilter) => void
  disagreeing: number
  total: number
}

function Toolbar({ filter, onChange, disagreeing, total }: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
        <input
          value={filter.query}
          onChange={(event) => onChange({ ...filter, query: event.target.value })}
          placeholder="search sites"
          aria-label="Search sites"
          className="h-9 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm shadow-xs outline-none placeholder:text-fg-muted focus-visible:border-fg-muted"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={!filter.disagreeingOnly}
          onClick={() => onChange({ ...filter, disagreeingOnly: false })}
          className={cn(PILL, !filter.disagreeingOnly ? 'border-fg bg-fg text-surface' : 'border-line text-fg-secondary hover:bg-hover')}
        >
          all {total}
        </button>
        <button
          type="button"
          aria-pressed={filter.disagreeingOnly}
          onClick={() => onChange({ ...filter, disagreeingOnly: true })}
          className={cn(PILL, filter.disagreeingOnly ? 'border-fg bg-fg text-surface' : 'border-line text-fg-secondary hover:bg-hover')}
        >
          engines disagree {disagreeing}
        </button>
        <Select value={filter.category} onValueChange={(category) => onChange({ ...filter, category: category as SiteFilter['category'] })}>
          <SelectTrigger className="h-8 rounded-lg text-[13px]" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">every category</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filter.blocking !== 'any' && (
          <button type="button" onClick={() => onChange({ ...filter, blocking: 'any' })} className={cn(PILL, 'gap-1.5 border-line text-fg-secondary hover:bg-hover')}>
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
  const columns = { '--engines': run.engines.length } as React.CSSProperties
  return (
    <section className="flex flex-col gap-5" aria-labelledby="sites-title">
      <div className="flex flex-col gap-1">
        <h2 id="sites-title">Sites</h2>
        <p className="text-[13px] text-fg-muted">
          showing {sites.length} of {run.sites.length}. pick one to see every engine side by side.
        </p>
      </div>
      <Toolbar filter={filter} onChange={onFilter} disagreeing={disagreeing} total={run.sites.length} />
      <ul className="flex flex-col">
        <li className="grid grid-cols-[minmax(0,1fr)_auto_repeat(var(--engines),1.25rem)] items-center gap-x-3 pb-2 text-[12px] text-fg-muted" style={columns} aria-hidden="true">
          <span />
          <span />
          {run.engines.map((engine) => (
            <span key={engine.id} className="text-center" title={ENGINE_INFO[engine.id].name}>
              {ENGINE_INFO[engine.id].name[0].toLowerCase()}
            </span>
          ))}
        </li>
        {sites.map((site) => (
          <li key={site.id}>
            <a
              href={siteHref(site.id)}
              className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto_repeat(var(--engines),1.25rem)] items-center gap-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-raised"
              style={columns}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{site.name}</span>
                <span className="block truncate text-[12px] text-fg-muted">
                  {new URL(site.url).hostname.replace(/^www\./, '')} · {CATEGORY_LABELS[site.category]}
                </span>
              </span>
              <VerdictLabel verdict={verdicts.get(site.id) ?? 'mixed'} className="hidden sm:inline-flex" />
              {run.engines.map((engine) => {
                const result = resultFor(run, site.id, engine.id)
                return (
                  <span key={engine.id} className="flex justify-center">
                    {result && <OutcomeMark outcome={result.outcome} />}
                  </span>
                )
              })}
            </a>
          </li>
        ))}
      </ul>
      {sites.length === 0 && (
        <p className="py-6 text-center text-sm text-fg-muted">
          no sites match.{' '}
          <button type="button" className="underline underline-offset-4" onClick={() => onFilter(NO_FILTER)}>
            clear the filters
          </button>
        </p>
      )}
      <OutcomeKey />
    </section>
  )
}
