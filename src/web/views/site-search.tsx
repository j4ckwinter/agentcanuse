import { useId, useState } from 'react'
import { Search } from 'lucide-react'
import type { Run } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { VerdictLabel } from '@/components/verdict-label'
import { cn } from '@/lib/utils'
import { searchSites } from '@/site-filter'

interface SiteSearchProps {
  run: Run
  verdicts: Map<string, Verdict>
  siteHref: (site: string) => string
}

export function SiteSearch({ run, verdicts, siteHref }: SiteSearchProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const matches = searchSites(run.sites, query)
  const open = (site: string) => (window.location.hash = siteHref(site))
  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (matches.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => (index + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => (index - 1 + matches.length) % matches.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      open(matches[Math.min(active, matches.length - 1)].id)
    }
  }
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
        }}
        onKeyDown={onKey}
        placeholder="can agents use… try zillow or github"
        aria-label="Search the sites"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-activedescendant={matches.length > 0 ? `${listId}-${active}` : undefined}
        className="h-10 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm shadow-xs outline-none placeholder:text-fg-muted focus-visible:border-fg-muted"
      />
      {matches.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-lg">
          {matches.map((site, index) => (
            <li key={site.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <a
                href={siteHref(site.id)}
                onMouseEnter={() => setActive(index)}
                className={cn('flex items-center justify-between gap-3 rounded-md px-2.5 py-2', index === active && 'bg-hover')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{site.name}</span>
                  <span className="block truncate text-[12px] text-fg-muted">{new URL(site.url).hostname.replace(/^www\./, '')}</span>
                </span>
                {verdicts.has(site.id) && <VerdictLabel verdict={verdicts.get(site.id)!} />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
