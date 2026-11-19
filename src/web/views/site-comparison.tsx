import { useEffect, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { sitesWhereEnginesDisagree } from '../../core/agreement'
import type { EngineRun, Result, Run, Site } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { shotUrl } from '@/data'
import { CATEGORY_LABELS, ENGINE_INFO, seconds } from '@/labels'
import { resultFor } from '@/results'

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

function EngineCard({ engine, result, engineHref }: { engine: EngineRun; result: Result; engineHref: string }) {
  return (
    <Card size="sm" className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          <a href={engineHref} className="hover:underline">
            {ENGINE_INFO[engine.id].name}
          </a>{' '}
          <span className="font-mono text-xs font-normal text-muted-foreground">{engine.version}</span>
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
        {result.error !== null && <p className="text-xs text-rose-700 dark:text-rose-400">{result.error}</p>}
      </CardContent>
    </Card>
  )
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

const WIDGETS_WITH_ARROW_KEYS = '[role=listbox],[role=tablist],[role=menu],[role=dialog]'

function inWidget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(WIDGETS_WITH_ARROW_KEYS) !== null
}

function useArrowKeys(previous: string | null, next: string | null) {
  const targets = useRef({ previous, next })
  targets.current = { previous, next }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target) || inWidget(event.target)) return
      const href = event.key === 'ArrowLeft' ? targets.current.previous : event.key === 'ArrowRight' ? targets.current.next : null
      if (href !== null) window.location.hash = href
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

function StepLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  if (href === null) return <span className="inline-flex items-center gap-1 text-sm text-muted-foreground/40">{children}</span>
  return (
    <a href={href} aria-label={label} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      {children}
    </a>
  )
}

export interface ComparisonLinks {
  back: string
  previous: { href: string; name: string } | null
  next: { href: string; name: string } | null
  position: string | null
  engine: (engine: EngineRun) => string
}

export function SiteComparison({ run, site, links }: { run: Run; site: Site; links: ComparisonLinks }) {
  const results = run.results.filter((result) => result.site === site.id)
  const agreed = !sitesWhereEnginesDisagree(results).has(site.id)
  const noScreenshots = results.every((result) => result.shot === null)
  useArrowKeys(links.previous?.href ?? null, links.next?.href ?? null)
  return (
    <div className="space-y-4">
      <nav className="flex items-center justify-between gap-4">
        <a href={links.back} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All sites
        </a>
        <div className="flex items-center gap-3">
          <StepLink href={links.previous?.href ?? null} label={links.previous ? `Previous: ${links.previous.name}` : 'No previous site'}>
            <ChevronLeft className="size-4" /> Previous
          </StepLink>
          {links.position !== null && <span className="text-xs text-muted-foreground tabular-nums">{links.position}</span>}
          <StepLink href={links.next?.href ?? null} label={links.next ? `Next: ${links.next.name}` : 'No next site'}>
            Next <ChevronRight className="size-4" />
          </StepLink>
        </div>
      </nav>
      <div>
        <h2 className="text-xl font-semibold">{site.name}</h2>
        <a href={site.url} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          {site.url}
        </a>
        <p className="mt-1 text-sm text-muted-foreground">
          {CATEGORY_LABELS[site.category]} · Expects: {site.expect.map((phrase) => `“${phrase}”`).join(', ')}
        </p>
      </div>
      {agreed && noScreenshots && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Every engine got the same result here, so no screenshots are kept. Screenshots are kept only where engines disagree.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {run.engines.map((engine) => {
          const result = resultFor(run, site.id, engine.id)
          return result && <EngineCard key={engine.id} engine={engine} result={result} engineHref={links.engine(engine)} />
        })}
      </div>
      <p className="hidden text-xs text-muted-foreground sm:block">Tip: the left and right arrow keys step through the sites in this list.</p>
    </div>
  )
}
