import { ArrowUpRight } from 'lucide-react'
import { sitesWhereOnlyEngineDiffers } from '../../core/agreement'
import { BLOCKING_STATUSES } from '../../core/judge'
import { leaderboard } from '../../core/leaderboard'
import { OUTCOMES, type EngineId, type Outcome, type Result, type Run } from '../../core/model'
import { Card, StatTile } from '@/components/card'
import { OutcomeMark } from '@/components/outcome-mark'
import { PageHeader } from '@/components/page-header'
import { shotUrl } from '@/data'
import { CATEGORY_LABELS, ENGINE_COLORS, ENGINE_INFO, OUTCOME_LABELS, percent, releaseNotesUrl, seconds } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const NOT_PASSED: Outcome[] = OUTCOMES.filter((outcome) => outcome !== 'passed')
const BUTTON = 'inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-fg-secondary hover:bg-hover hover:text-fg'

function detail(result: Result): string {
  if (result.error !== null) return result.error
  switch (result.outcome) {
    case 'blocked':
      return result.status !== null && BLOCKING_STATUSES.includes(result.status) ? `Answered ${result.status}` : 'Showed a bot check'
    case 'incomplete':
    case 'empty':
      return result.missing.length > 0 ? `Missing ${result.missing.map((phrase) => `“${phrase}”`).join(', ')}` : `HTTP ${result.status ?? '–'}`
    case 'passed':
    case 'failed':
    case 'skipped':
      return `HTTP ${result.status ?? '–'}`
  }
}

function ResultRow({ run, result, alone, runParam }: { run: Run; result: Result; alone: boolean; runParam: string | null }) {
  const site = run.sites.find((entry) => entry.id === result.site)
  if (site === undefined) return null
  return (
    <tr className="relative border-b border-line last:border-0 hover:bg-raised">
      <td className="hidden w-28 py-2 pl-5 sm:table-cell">
        {result.shot !== null ? (
          <img src={shotUrl(result.shot)} alt="" className="aspect-[8/5] w-24 rounded border border-line object-cover object-top" />
        ) : (
          <span className="block aspect-[8/5] w-24 rounded border border-line bg-raised" />
        )}
      </td>
      <td className="px-3 py-2.5 pl-5 sm:pl-3">
        <a href={routeHash({ view: 'sites', run: runParam, site: site.id, filter: NO_FILTER })} className="text-sm font-medium after:absolute after:inset-0 hover:underline">
          {site.name}
        </a>
        <div className="text-[12px] text-fg-muted">{CATEGORY_LABELS[site.category]}</div>
      </td>
      <td className="px-3 py-2.5 text-[13px] text-fg-secondary">{detail(result)}</td>
      <td className="px-3 py-2.5 pr-5 text-right">
        {alone && <span className="rounded-full border border-line px-2 py-0.5 text-[11px] whitespace-nowrap text-fg-muted">Only {ENGINE_INFO[result.engine].name}</span>}
      </td>
    </tr>
  )
}

export function EngineView({ run, engine, runParam }: { run: Run; engine: EngineId; runParam: string | null }) {
  const info = ENGINE_INFO[engine]
  const back = { href: routeHash({ view: 'home', run: runParam }), label: 'Overview' }
  const standing = leaderboard(run).find((entry) => entry.engine.id === engine)
  if (standing === undefined) {
    return <PageHeader back={back} title={info.name} description={`${info.name} wasn’t part of this run.`} />
  }
  const results = run.results.filter((result) => result.engine === engine)
  const alone = sitesWhereOnlyEngineDiffers(run.results, engine)
  const notes = releaseNotesUrl(engine, standing.engine.version)
  return (
    <>
      <PageHeader
        back={back}
        title={
          <span className="flex items-center gap-3">
            <span className="size-3 rounded-full" style={{ backgroundColor: ENGINE_COLORS[engine] }} aria-hidden="true" />
            {info.name}
            <span className="rounded-md border border-line px-2 py-0.5 font-mono text-[13px] font-normal text-fg-muted">{standing.engine.version}</span>
          </span>
        }
        description={info.about}
        aside={
          <div className="flex shrink-0 gap-2">
            <a href={info.homepage} className={BUTTON}>
              Homepage <ArrowUpRight className="size-3.5" />
            </a>
            {notes !== null && (
              <a href={notes} className={BUTTON}>
                Release notes <ArrowUpRight className="size-3.5" />
              </a>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Passed" value={percent(standing.passRate)} detail={`${standing.counts.passed} of ${standing.attempted} sites`} accent="var(--status-good)" />
        <StatTile label="Blocked" value={percent(standing.blockedRate)} detail={`${standing.counts.blocked} sites`} accent="var(--status-critical)" />
        <StatTile label="Median time" value={seconds(standing.medianMs)} detail="Per page" />
        <StatTile label="Sites visited" value={standing.attempted} detail={`${standing.counts.skipped} skipped by robots.txt`} />
      </div>
      {NOT_PASSED.map((outcome) => {
        const group = results.filter((result) => result.outcome === outcome)
        if (group.length === 0) return null
        return (
          <Card
            key={outcome}
            title={
              <span className="flex items-center gap-2">
                <OutcomeMark outcome={outcome} />
                {OUTCOME_LABELS[outcome].label}
                <span className="font-mono text-[12px] font-normal text-fg-muted">{group.length}</span>
              </span>
            }
            description={`${OUTCOME_LABELS[outcome].meaning}.`}
          >
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <tbody>
                  {group.map((result) => (
                    <ResultRow key={result.site} run={run} result={result} alone={alone.has(result.site)} runParam={runParam} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      })}
      {standing.counts.passed === standing.attempted && <p className="text-sm text-fg-secondary">{info.name} passed every site it visited.</p>}
    </>
  )
}
