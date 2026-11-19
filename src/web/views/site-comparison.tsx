import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, ImageOff } from 'lucide-react'
import { isFlaky, siteHistory } from '../../core/history'
import type { EngineRun, Result, Run, RunSummary, Site } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { Card } from '@/components/card'
import { OutcomeLabel, OutcomeMark } from '@/components/outcome-mark'
import { PageHeader } from '@/components/page-header'
import { VerdictLabel } from '@/components/verdict-label'
import { shotUrl } from '@/data'
import { Tooltip } from '@/components/tooltip'
import { CATEGORY_LABELS, ENGINE_COLORS, ENGINE_INFO, OUTCOME_LABELS, seconds, shortDate, VERDICT_LABELS } from '@/labels'
import { reproduceCommand } from '@/reproduce'
import { useHistory } from '@/use-history'
import { resultFor } from '@/results'

function hostOf(site: Site): string {
  return new URL(site.url).hostname.replace(/^www\./, '')
}

function Screenshot({ result }: { result: Result }) {
  if (result.shot !== null) {
    return <img src={shotUrl(result.shot)} alt="" className="aspect-screenshot w-full border-b border-line object-cover object-top" />
  }
  return (
    <div className="flex aspect-screenshot w-full flex-col items-center justify-center gap-2 border-b border-line bg-raised p-4 text-center text-caption text-fg-muted">
      <ImageOff className="size-4" />
      {result.excerpt === '' ? 'No screenshot or text' : <p className="line-clamp-5 text-left">{result.excerpt}</p>}
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line py-2 first:border-0">
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="text-right text-label tabular-nums">{children}</dd>
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
          <span className="font-mono text-caption">{engine.version}</span>
        </Fact>
        <Fact label="HTTP status">{result.status ?? '–'}</Fact>
        <Fact label="Time">{seconds(result.durationMs || null)}</Fact>
        <Fact label="Text read">{result.textLength.toLocaleString('en-GB')} characters</Fact>
        <Fact label="Missing">{missing.length === 0 ? 'Nothing' : missing.map((phrase) => `“${phrase}”`).join(', ')}</Fact>
        {result.error !== null && <Fact label="Error">{result.error}</Fact>}
      </dl>
      {result.excerpt !== '' && (
        <details className="group border-t border-line px-4 py-2.5">
          <summary className="cursor-pointer text-caption font-medium text-fg-secondary marker:text-fg-muted hover:text-fg">What it read</summary>
          <p className="mt-2 max-h-48 overflow-y-auto font-mono text-micro leading-relaxed whitespace-pre-wrap text-fg-secondary">{result.excerpt}
            {result.excerpt.length < result.textLength && '…'}
          </p>
        </details>
      )}
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
  const style = 'inline-flex h-8 items-center gap-1 rounded-md border border-line bg-surface px-2.5 text-label'
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
  list: string
  engine: (engine: EngineRun) => string
}

function HistoryCard({ site, history, engines }: { site: Site; history: Run[] | null; engines: EngineRun[] }) {
  return (
    <Card title="Recent runs" description="Each engine's outcome on this site over the latest comparable runs, oldest first.">
      {history === null ? (
        <div className="h-16 animate-pulse rounded-md bg-hover" />
      ) : (
        <ul className="flex flex-col gap-3">
          {engines.map((engine) => {
            const points = siteHistory(history, site.id, engine.id)
            return (
              <li key={engine.id} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex w-28 items-center gap-2 text-label">
                  <span className="size-2 rounded-full" style={{ backgroundColor: ENGINE_COLORS[engine.id] }} aria-hidden="true" />
                  {ENGINE_INFO[engine.id].name}
                </span>
                <span className="flex items-center gap-1.5">
                  {points.map((point) => (
                    <Tooltip key={point.run} content={`${shortDate(point.startedAt)} · ${point.version} · ${OUTCOME_LABELS[point.outcome].label}`}>
                      <span tabIndex={0} className="inline-flex">
                        <OutcomeMark outcome={point.outcome} />
                      </span>
                    </Tooltip>
                  ))}
                </span>
                {isFlaky(points) && (
                  <span className="rounded-full border border-status-warning/50 bg-status-warning/10 px-2 py-0.5 text-micro font-medium" title="The outcome changed between runs with no new engine release">
                    Flaky
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {history !== null && history.length < 2 && <p className="mt-3 text-caption text-fg-muted">History builds up with each nightly run.</p>}
    </Card>
  )
}

function ReproduceCard({ site }: { site: Site }) {
  const command = reproduceCommand(site)
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard
      ?.writeText(command)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), COPIED_MS)
      })
      .catch(() => setCopied(false))
  }
  return (
    <Card
      title="Reproduce this"
      description="Run the same check on your own machine. It downloads each engine, visits the page once, and prints the result."
      action={
        <button type="button" onClick={copy} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-label font-medium text-fg-secondary hover:bg-hover hover:text-fg">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      }
    >
      <pre className="rounded-md border border-line bg-raised px-3 py-2.5 font-mono text-caption break-all whitespace-pre-wrap">{command}</pre>
    </Card>
  )
}

const COPIED_MS = 1500

interface SiteComparisonProps {
  run: Run
  site: Site
  verdict: Verdict
  runs: RunSummary[]
  links: ComparisonLinks
}

export function SiteComparison({ run, site, verdict, runs, links }: SiteComparisonProps) {
  const history = useHistory(runs, run)
  useArrowKeys(links.previous?.href ?? null, links.next?.href ?? null)
  return (
    <>
      <PageHeader
        back={{ href: links.back, label: links.list === 'All sites' ? 'Sites' : `Sites · ${links.list}` }}
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
            {links.position !== null && (
              <span className="text-caption text-fg-muted" title={links.list}>
                <span className="font-mono">{links.position}</span>
                <span className="hidden sm:inline"> · {links.list}</span>
              </span>
            )}
            <StepLink href={links.next?.href ?? null} label={links.next ? `Next: ${links.next.name}` : 'No next site'}>
              Next <ChevronRight className="size-4" />
            </StepLink>
          </nav>
        }
      />
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-card sm:flex-row sm:items-center sm:justify-between" aria-label="Verdict">
        <div className="flex flex-col gap-2">
          <VerdictLabel verdict={verdict} className="self-start" />
          <p className="text-lg font-medium tracking-tight">{VERDICT_LABELS[verdict].sentence(site.name)}</p>
        </div>
        <dl className="flex shrink-0 gap-6 text-label">
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
      <div className="grid gap-4 lg:grid-cols-2">
        <HistoryCard site={site} history={history} engines={run.engines} />
        <ReproduceCard site={site} />
      </div>
      <p className="hidden text-caption text-fg-muted sm:block">
        Use the ← and → keys to step through the sites in this list. Screenshots are kept only where the engines disagreed.
      </p>
    </>
  )
}
