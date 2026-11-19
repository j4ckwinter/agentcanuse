import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import type { EngineRun, Result, Run, Site } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { OutcomeLabel } from '@/components/outcome-mark'
import { PageHeader } from '@/components/page-header'
import { VerdictLabel } from '@/components/verdict-label'
import { shotUrl } from '@/data'
import { CATEGORY_LABELS, ENGINE_COLORS, ENGINE_INFO, seconds, VERDICT_LABELS } from '@/labels'
import { resultFor } from '@/results'

function hostOf(site: Site): string {
  return new URL(site.url).hostname.replace(/^www\./, '')
}

function Screenshot({ result }: { result: Result }) {
  if (result.shot !== null) {
    return <img src={shotUrl(result.shot)} alt="" className="aspect-[8/5] w-full border-b border-line object-cover object-top" />
  }
  return (
    <div className="flex aspect-[8/5] w-full flex-col items-center justify-center gap-2 border-b border-line bg-raised p-4 text-center text-[12px] text-fg-muted">
      <ImageOff className="size-4" />
      {result.excerpt === '' ? 'No screenshot or text' : <p className="line-clamp-5 text-left">{result.excerpt}</p>}
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line py-2 first:border-0">
      <dt className="text-[12px] text-fg-muted">{label}</dt>
      <dd className="text-right text-[13px] tabular-nums">{children}</dd>
    </div>
  )
}

function EngineColumn({ engine, result, engineHref }: { engine: EngineRun; result: Result; engineHref: string }) {
  const missing = result.outcome === 'skipped' ? [] : result.missing
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <a href={engineHref} className="flex min-w-0 items-center gap-2 text-sm font-medium hover:underline">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ENGINE_COLORS[engine.id] }} aria-hidden="true" />
          <span className="truncate">{ENGINE_INFO[engine.id].name}</span>
        </a>
        <OutcomeLabel outcome={result.outcome} />
      </header>
      <Screenshot result={result} />
      <dl className="px-4 py-2">
        <Fact label="Version">
          <span className="font-mono text-[12px]">{engine.version}</span>
        </Fact>
        <Fact label="HTTP status">{result.status ?? '–'}</Fact>
        <Fact label="Time">{seconds(result.durationMs || null)}</Fact>
        <Fact label="Text read">{result.textLength.toLocaleString('en-GB')} characters</Fact>
        <Fact label="Missing">{missing.length === 0 ? 'Nothing' : missing.map((phrase) => `“${phrase}”`).join(', ')}</Fact>
        {result.error !== null && <Fact label="Error">{result.error}</Fact>}
      </dl>
    </section>
  )
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

const WIDGETS_WITH_ARROW_KEYS = '[role=listbox],[role=tablist],[role=menu],[role=dialog],[role=combobox]'

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
  const style = 'inline-flex h-8 items-center gap-1 rounded-md border border-line bg-surface px-2.5 text-[13px]'
  if (href === null) return <span className={`${style} text-faint`}>{children}</span>
  return (
    <a href={href} aria-label={label} title={label} className={`${style} text-fg-secondary hover:bg-hover hover:text-fg`}>
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

export function SiteComparison({ run, site, verdict, links }: { run: Run; site: Site; verdict: Verdict; links: ComparisonLinks }) {
  useArrowKeys(links.previous?.href ?? null, links.next?.href ?? null)
  return (
    <>
      <PageHeader
        back={{ href: links.back, label: 'All sites' }}
        title={site.name}
        description={
          <a href={site.url} className="hover:underline">
            {hostOf(site)}
          </a>
        }
        aside={
          <nav aria-label="Other sites" className="flex shrink-0 items-center gap-2">
            <StepLink href={links.previous?.href ?? null} label={links.previous ? `Previous: ${links.previous.name}` : 'No previous site'}>
              <ChevronLeft className="size-4" /> Previous
            </StepLink>
            {links.position !== null && <span className="font-mono text-[12px] text-fg-muted">{links.position}</span>}
            <StepLink href={links.next?.href ?? null} label={links.next ? `Next: ${links.next.name}` : 'No next site'}>
              Next <ChevronRight className="size-4" />
            </StepLink>
          </nav>
        }
      />
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Verdict">
        <div className="flex flex-col gap-2">
          <VerdictLabel verdict={verdict} className="self-start" />
          <p className="text-lg font-medium tracking-tight">{VERDICT_LABELS[verdict].sentence(site.name)}</p>
        </div>
        <dl className="flex shrink-0 gap-6 text-[13px]">
          <div>
            <dt className="text-fg-muted">Category</dt>
            <dd>{CATEGORY_LABELS[site.category]}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Looks for</dt>
            <dd>{site.expect.map((phrase) => `“${phrase}”`).join(', ')}</dd>
          </div>
        </dl>
      </section>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="grid auto-cols-[minmax(15rem,1fr)] grid-flow-col gap-4">
          {run.engines.map((engine) => {
            const result = resultFor(run, site.id, engine.id)
            return result && <EngineColumn key={engine.id} engine={engine} result={result} engineHref={links.engine(engine)} />
          })}
        </div>
      </div>
      <p className="hidden text-[12px] text-fg-muted sm:block">
        Use the ← and → keys to step through the sites in this list. Screenshots are kept only where the engines disagreed.
      </p>
    </>
  )
}
