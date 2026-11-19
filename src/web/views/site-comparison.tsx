import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import type { EngineRun, Result, Run, Site } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { OutcomeLabel } from '@/components/outcome-mark'
import { VerdictLabel } from '@/components/verdict-label'
import { shotUrl } from '@/data'
import { CATEGORY_LABELS, ENGINE_INFO, seconds, VERDICT_LABELS } from '@/labels'
import { resultFor } from '@/results'

function hostOf(site: Site): string {
  return new URL(site.url).hostname.replace(/^www\./, '')
}

function Screenshot({ result }: { result: Result }) {
  if (result.shot !== null) {
    return <img src={shotUrl(result.shot)} alt="" className="aspect-[8/5] w-full rounded-lg border border-line object-cover object-top" />
  }
  return (
    <div className="flex aspect-[8/5] w-full flex-col items-center justify-center gap-2 rounded-lg border border-line bg-raised p-3 text-center text-[12px] text-fg-muted">
      <ImageOff className="size-4" />
      {result.excerpt === '' ? 'nothing to show' : <p className="line-clamp-5 text-left">{result.excerpt}</p>}
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-line pt-2">
      <dt className="text-[11px] text-fg-muted">{label}</dt>
      <dd className="text-[13px] tabular-nums">{children}</dd>
    </div>
  )
}

function EngineColumn({ engine, result, engineHref }: { engine: EngineRun; result: Result; engineHref: string }) {
  const missing = result.outcome === 'skipped' ? [] : result.missing
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <a href={engineHref} className="truncate text-sm hover:underline">
        {ENGINE_INFO[engine.id].name} <span className="font-mono text-[12px] text-fg-muted">{engine.version}</span>
      </a>
      <Screenshot result={result} />
      <dl className="flex flex-col gap-2">
        <Fact label="result">
          <OutcomeLabel outcome={result.outcome} />
        </Fact>
        <Fact label="status">{result.status ?? '–'}</Fact>
        <Fact label="time">{seconds(result.durationMs || null)}</Fact>
        <Fact label="text">{result.textLength.toLocaleString('en-GB')} chars</Fact>
        <Fact label="missing">{missing.length === 0 ? '–' : missing.map((phrase) => `“${phrase}”`).join(', ')}</Fact>
        {result.error !== null && <Fact label="error">{result.error}</Fact>}
      </dl>
    </div>
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
  const style = 'inline-flex size-7 items-center justify-center rounded-md'
  if (href === null) return <span className={`${style} text-faint`}>{children}</span>
  return (
    <a href={href} aria-label={label} title={label} className={`${style} text-fg-secondary hover:bg-hover hover:text-fg`}>
      {children}
    </a>
  )
}

export interface ComparisonLinks {
  previous: { href: string; name: string } | null
  next: { href: string; name: string } | null
  position: string | null
  engine: (engine: EngineRun) => string
}

export function SiteComparison({ run, site, verdict, links }: { run: Run; site: Site; verdict: Verdict; links: ComparisonLinks }) {
  useArrowKeys(links.previous?.href ?? null, links.next?.href ?? null)
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-medium">{site.name}</h2>
            <a href={site.url} className="text-[13px] text-fg-muted underline-offset-4 hover:underline">
              {hostOf(site)}
            </a>
          </div>
          <nav aria-label="Other sites" className="flex shrink-0 items-center gap-1">
            <StepLink href={links.previous?.href ?? null} label={links.previous ? `previous: ${links.previous.name}` : 'no previous site'}>
              <ChevronLeft className="size-4" />
            </StepLink>
            {links.position !== null && <span className="text-[12px] text-fg-muted tabular-nums">{links.position}</span>}
            <StepLink href={links.next?.href ?? null} label={links.next ? `next: ${links.next.name}` : 'no next site'}>
              <ChevronRight className="size-4" />
            </StepLink>
          </nav>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-raised p-4">
          <VerdictLabel verdict={verdict} className="self-start bg-surface" />
          <p className="text-lg leading-snug">{VERDICT_LABELS[verdict].sentence(hostOf(site))}</p>
          <p className="text-[13px] text-fg-muted">
            {CATEGORY_LABELS[site.category]} · looks for {site.expect.map((phrase) => `“${phrase}”`).join(' and ')}
          </p>
        </div>
      </header>
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div className="grid auto-cols-[minmax(11rem,1fr)] grid-flow-col gap-4">
          {run.engines.map((engine) => {
            const result = resultFor(run, site.id, engine.id)
            return result && <EngineColumn key={engine.id} engine={engine} result={result} engineHref={links.engine(engine)} />
          })}
        </div>
      </div>
      <p className="hidden text-[12px] text-fg-muted sm:block">
        the arrow keys step through the sites in this list. screenshots are kept only where the engines disagreed.
      </p>
    </article>
  )
}
