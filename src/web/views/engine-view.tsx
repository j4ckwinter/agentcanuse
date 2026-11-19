import { sitesWhereOnlyEngineDiffers } from '../../core/agreement'
import { BLOCKING_STATUSES } from '../../core/judge'
import { leaderboard } from '../../core/leaderboard'
import { OUTCOMES, type EngineId, type Outcome, type Result, type Run } from '../../core/model'
import { OutcomeLabel } from '@/components/outcome-mark'
import { Section } from '@/components/section'
import { Tile } from '@/components/tile'
import { shotUrl } from '@/data'
import { CATEGORY_LABELS, ENGINE_INFO, OUTCOME_LABELS, percent, releaseNotesUrl, seconds } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const NOT_PASSED: Outcome[] = OUTCOMES.filter((outcome) => outcome !== 'passed')
const LINK = 'underline decoration-faint underline-offset-4 hover:decoration-fg-muted'

function detail(result: Result): string {
  if (result.error !== null) return result.error
  switch (result.outcome) {
    case 'blocked':
      return result.status !== null && BLOCKING_STATUSES.includes(result.status) ? `answered ${result.status}` : 'showed a bot check'
    case 'incomplete':
    case 'empty':
      return result.missing.length > 0 ? `missing ${result.missing.map((phrase) => `“${phrase}”`).join(', ')}` : `status ${result.status ?? '–'}`
    case 'passed':
    case 'failed':
    case 'skipped':
      return `status ${result.status ?? '–'}`
  }
}

function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-[12px] text-fg-muted">{label}</dt>
      <dd className="text-2xl font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function ResultRow({ run, result, alone, runParam }: { run: Run; result: Result; alone: boolean; runParam: string | null }) {
  const site = run.sites.find((entry) => entry.id === result.site)
  if (site === undefined) return null
  return (
    <li>
      <a
        href={routeHash({ view: 'sites', run: runParam, site: site.id, filter: NO_FILTER })}
        className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-raised sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]"
      >
        {result.shot !== null ? (
          <img src={shotUrl(result.shot)} alt="" className="hidden aspect-[8/5] w-full rounded border border-line object-cover object-top sm:block" />
        ) : (
          <span className="hidden aspect-[8/5] w-full rounded border border-line bg-raised sm:block" />
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm">{site.name}</span>
          <span className="block truncate text-[12px] text-fg-muted">
            {CATEGORY_LABELS[site.category]} · {detail(result)}
          </span>
        </span>
        {alone && <span className="text-[12px] whitespace-nowrap text-fg-muted">only {ENGINE_INFO[result.engine].name.toLowerCase()}</span>}
      </a>
    </li>
  )
}

export function EngineView({ run, engine, runParam }: { run: Run; engine: EngineId; runParam: string | null }) {
  const info = ENGINE_INFO[engine]
  const standing = leaderboard(run).find((entry) => entry.engine.id === engine)
  if (standing === undefined) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium">{info.name}</h2>
        <p className="text-fg-secondary">{info.name.toLowerCase()} wasn't part of this run.</p>
      </div>
    )
  }
  const results = run.results.filter((result) => result.engine === engine)
  const alone = sitesWhereOnlyEngineDiffers(run.results, engine)
  const notes = releaseNotesUrl(engine, standing.engine.version)
  return (
    <>
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Tile text={info.name[0]} className="size-10 text-base" />
          <h2 className="text-2xl font-medium">
            {info.name} <span className="font-mono text-base text-fg-muted">{standing.engine.version}</span>
          </h2>
        </div>
        <p className="leading-relaxed text-fg-secondary">{info.about}</p>
        <p className="flex gap-4 text-[13px] text-fg-secondary">
          <a href={info.homepage} className={LINK}>
            homepage
          </a>
          {notes !== null && (
            <a href={notes} className={LINK}>
              release notes
            </a>
          )}
        </p>
        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          <Stat label="passed" value={percent(standing.passRate)} />
          <Stat label="blocked" value={percent(standing.blockedRate)} />
          <Stat label="median time" value={seconds(standing.medianMs)} />
          <Stat label="sites visited" value={String(standing.attempted)} />
        </dl>
      </header>
      {NOT_PASSED.map((outcome) => {
        const group = results.filter((result) => result.outcome === outcome)
        if (group.length === 0) return null
        return (
          <Section key={outcome} id={`outcome-${outcome}`} title={`${capitalised(OUTCOME_LABELS[outcome].label)} · ${group.length}`} action={<OutcomeLabel outcome={outcome} />}>
            <p className="-mt-2 text-[13px] text-fg-muted">{OUTCOME_LABELS[outcome].meaning}.</p>
            <ul className="flex flex-col">
              {group.map((result) => (
                <ResultRow key={result.site} run={run} result={result} alone={alone.has(result.site)} runParam={runParam} />
              ))}
            </ul>
          </Section>
        )
      })}
      {standing.counts.passed === standing.attempted && <p className="text-fg-secondary">{info.name.toLowerCase()} passed every site it visited.</p>}
    </>
  )
}
