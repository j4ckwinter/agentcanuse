import { ArrowLeft } from 'lucide-react'
import { sitesWhereOnlyEngineDiffers } from '../../core/agreement'
import { BLOCKING_STATUSES } from '../../core/judge'
import { leaderboard } from '../../core/leaderboard'
import { OUTCOMES, type EngineId, type Outcome, type Result, type Run } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { shotUrl } from '@/data'
import { CATEGORY_LABELS, ENGINE_INFO, OUTCOME_LABELS, percent, releaseNotesUrl, seconds } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const NOT_PASSED: Outcome[] = OUTCOMES.filter((outcome) => outcome !== 'passed')

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

function detail(result: Result): string {
  if (result.error !== null) return result.error
  switch (result.outcome) {
    case 'blocked':
      return result.status !== null && BLOCKING_STATUSES.includes(result.status) ? `Answered ${result.status}` : 'Showed a bot check'
    case 'incomplete':
    case 'empty':
      return result.missing.length > 0 ? `Missing: ${result.missing.map((phrase) => `“${phrase}”`).join(', ')}` : `Status ${result.status ?? '–'}`
    case 'passed':
    case 'failed':
    case 'skipped':
      return `Status ${result.status ?? '–'}`
  }
}

function ResultRow({ run, result, alone, runParam }: { run: Run; result: Result; alone: boolean; runParam: string | null }) {
  const site = run.sites.find((entry) => entry.id === result.site)
  if (site === undefined) return null
  const href = routeHash({ view: 'sites', run: runParam, site: site.id, filter: NO_FILTER })
  return (
    <li className="flex gap-3 rounded-lg border p-3">
      {result.shot !== null && <img src={shotUrl(result.shot)} alt="" className="hidden aspect-[8/5] w-32 shrink-0 rounded border object-cover object-top sm:block" />}
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <a href={href} className="font-medium hover:underline">
            {site.name}
          </a>
          <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[site.category]}</span>
          {alone && <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">only this engine</span>}
        </div>
        <p className="truncate text-xs text-muted-foreground">{detail(result)}</p>
      </div>
    </li>
  )
}

export function EngineView({ run, engine, runParam }: { run: Run; engine: EngineId; runParam: string | null }) {
  const info = ENGINE_INFO[engine]
  const standing = leaderboard(run).find((entry) => entry.engine.id === engine)
  const back = routeHash({ view: 'leaderboard', run: runParam })
  if (standing === undefined) {
    return (
      <div className="space-y-4">
        <a href={back} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Leaderboard
        </a>
        <h2 className="text-2xl font-semibold">{info.name}</h2>
        <p className="text-sm text-muted-foreground">{info.name} wasn't part of this run.</p>
      </div>
    )
  }
  const results = run.results.filter((result) => result.engine === engine)
  const alone = sitesWhereOnlyEngineDiffers(run.results, engine)
  const notes = releaseNotesUrl(engine, standing.engine.version)
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <a href={back} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Leaderboard
        </a>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">
            {info.name} <span className="font-mono text-base font-normal text-muted-foreground">{standing.engine.version}</span>
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{info.about}</p>
          <p className="flex gap-4 text-sm">
            <a href={info.homepage} className="underline underline-offset-4 hover:decoration-2">
              Homepage
            </a>
            {notes !== null && (
              <a href={notes} className="underline underline-offset-4 hover:decoration-2">
                Release notes
              </a>
            )}
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          <Stat label="Passed" value={percent(standing.passRate)} />
          <Stat label="Blocked" value={percent(standing.blockedRate)} />
          <Stat label="Median time" value={seconds(standing.medianMs)} />
          <Stat label="Sites visited" value={String(standing.attempted)} />
        </dl>
      </div>
      {NOT_PASSED.map((outcome) => {
        const group = results.filter((result) => result.outcome === outcome)
        if (group.length === 0) return null
        return (
          <section key={outcome} className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <OutcomeBadge outcome={outcome} /> {group.length} {group.length === 1 ? 'site' : 'sites'}
            </h3>
            <p className="text-sm text-muted-foreground">{OUTCOME_LABELS[outcome].meaning}.</p>
            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {group.map((result) => (
                <ResultRow key={result.site} run={run} result={result} alone={alone.has(result.site)} runParam={runParam} />
              ))}
            </ul>
          </section>
        )
      })}
      {standing.counts.passed === standing.attempted && <p className="text-sm text-muted-foreground">{info.name} passed every site it visited.</p>}
    </div>
  )
}
