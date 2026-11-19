import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { Run } from '../../core/model'
import { verdictsBySite } from '../../core/verdict'
import { VerdictLabel } from '@/components/verdict-label'
import { cn } from '@/lib/utils'
import { searchSites } from '@/site-filter'

const FOCUS_KEY = '/'

function useFocusShortcut(input: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (event.key !== FOCUS_KEY || typing || event.metaKey || event.ctrlKey || event.altKey) return
      event.preventDefault()
      input.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [input])
}

export function SiteSearch({ run, siteHref }: { run: Run; siteHref: (site: string) => string }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const verdicts = useMemo(() => verdictsBySite(run.results), [run])
  const matches = searchSites(run.sites, query)
  useFocusShortcut(input)
  const open = (site: string) => {
    window.location.hash = siteHref(site)
    setQuery('')
    input.current?.blur()
  }
  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setQuery('')
      return
    }
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
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-muted" />
      <input
        ref={input}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
        }}
        onKeyDown={onKey}
        placeholder="Can agents use…"
        aria-label="Search sites"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-activedescendant={matches.length > 0 ? `${listId}-${active}` : undefined}
        className="h-8 w-full rounded-md border border-line bg-surface pr-8 pl-8 text-[13px] outline-none placeholder:text-fg-muted focus-visible:border-accent-blue focus-visible:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] text-fg-muted">{FOCUS_KEY}</kbd>
      {matches.length > 0 && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 z-50 mt-1.5 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl">
          {matches.map((site, index) => (
            <li key={site.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <a
                href={siteHref(site.id)}
                onClick={() => setQuery('')}
                onMouseEnter={() => setActive(index)}
                className={cn('flex items-center justify-between gap-3 rounded-lg px-2.5 py-2', index === active && 'bg-hover')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{site.name}</span>
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
