import { REFERENCE_ENGINE } from '../../core/agreement'
import { shownMargin } from '../../core/confidence'
import { leaderboard, trend, type Standing } from '../../core/leaderboard'
import { OUTCOMES, type Run, type RunSummary } from '../../core/model'
import { Card } from '@/components/card'
import { EngineDot } from '@/components/engine-dot'
import { TABLE_HEAD } from '@/components/table'
import { OutcomeKey } from '@/components/outcome-mark'
import { Tooltip } from '@/components/tooltip'
import { ENGINE_COLORS, ENGINE_INFO, OUTCOME_LABELS, percent, seconds } from '@/labels'
import { routeHash } from '@/route'
import { Sparkline } from '@/views/sparkline'

function OutcomeBar({ standing }: { standing: Standing }) {
  const total = Object.values(standing.counts).reduce((sum, count) => sum + count, 0)
  const shown = OUTCOMES.filter((outcome) => standing.counts[outcome] > 0)
  return (
    <div className="flex h-2.5 w-full gap-0.5" aria-label={shown.map((outcome) => `${standing.counts[outcome]} ${OUTCOME_LABELS[outcome].label.toLowerCase()}`).join(', ')}>
      {shown.map((outcome, index) => (
        <Tooltip
          key={outcome}
          className="h-full min-w-0.75 basis-0"
          style={{ flexGrow: standing.counts[outcome] }}
          content={
            <>
              <span className="font-medium">{OUTCOME_LABELS[outcome].label}</span> · {standing.counts[outcome]} of {total}
            </>
          }
        >
          <span
            tabIndex={0}
            className={`block h-full w-full ${index === 0 ? 'rounded-l-cell' : ''} ${index === shown.length - 1 ? 'rounded-r-cell' : ''}`}
            style={{ backgroundColor: OUTCOME_LABELS[outcome].color }}
          />
        </Tooltip>
      ))}
    </div>
  )
}


function Share({ part, whole }: { part: number; whole: number }) {
  const margin = shownMargin(part, whole)
  return (
    <span className="inline-flex flex-col items-end">
      <span className="text-sm font-semibold">
        {percent(whole === 0 ? 0 : part / whole)}
        {margin !== null && (
          <span className="ml-1 text-caption font-normal text-fg-muted" title="95% margin of error">
            ±{Math.round(margin * 100)}
          </span>
        )}
      </span>
      <span className="text-micro text-fg-muted">
        {part} of {whole}
      </span>
    </span>
  )
}
const CELL = 'px-3 py-3'

function HiddenShare({ standing }: { standing: Standing }) {
  if (standing.engine.id === REFERENCE_ENGINE) return <span className="text-label text-fg-muted">Reference</span>
  if (standing.hidden.judged === 0) return <span className="text-sm text-fg-muted">–</span>
  return <Share part={standing.hidden.reads} whole={standing.hidden.judged} />
}

function StackedEngines({ standings, href }: { standings: Standing[]; href: (standing: Standing) => string }) {
  return (
    <ul className="-mx-card -my-card md:hidden">
      {standings.map((standing) => (
        <li key={standing.engine.id} className="border-b border-line last:border-0">
          <a href={href(standing)} className="flex flex-col gap-2 px-card py-3 hover:bg-raised">
            <span className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm font-medium">
                <EngineDot engine={standing.engine.id} className="size-2.5" />
                {ENGINE_INFO[standing.engine.id].name}
                <span className="font-mono text-caption font-normal text-fg-muted">{seconds(standing.medianMs)}</span>
              </span>
              <Share part={standing.counts.passed} whole={standing.attempted} />
            </span>
            <OutcomeBar standing={standing} />
          </a>
        </li>
      ))}
    </ul>
  )
}

interface EnginesCardProps {
  run: Run
  runs: RunSummary[]
  runParam: string | null
  full?: boolean
}

export function EnginesCard({ run, runs, runParam, full = false }: EnginesCardProps) {
  const current = runs.find((summary) => summary.id === run.id)
  const standings = leaderboard(run)
  const anyTrend = current !== undefined && standings.some((standing) => trend(runs, current, standing.engine.id).length >= 2)
  return (
    <Card title="Engines" description="Every visit in this run, by outcome. ± is the 95% margin of error on the pass rate." action={<span className="hidden md:block"><OutcomeKey /></span>}>
      <StackedEngines standings={standings} href={(standing) => routeHash({ view: 'engines', run: runParam, engine: standing.engine.id })} />
      <div className="-mx-card -my-2 hidden overflow-x-auto md:block">
        <table className="w-full min-w-table border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className={`${TABLE_HEAD} pl-card`}>Engine</th>
              <th className={`${TABLE_HEAD} w-[38%]`}>Outcomes</th>
              <th className={`${TABLE_HEAD} text-right`}>Passed</th>
              {full && <th className={`${TABLE_HEAD} text-right`}>Blocked</th>}
              {full && (
                <th className={`${TABLE_HEAD} text-right`} title="Of the pages it passed, how many had an accessibility tree an agent could act on">
                  Usable tree
                </th>
              )}
              {full && (
                <th className={`${TABLE_HEAD} text-right`} title="Of the pages where both it and Chromium passed, how many it read text that Chromium hides from a person">
                  Reads hidden text
                </th>
              )}
              <th className={`${TABLE_HEAD} text-right`}>Median</th>
              {anyTrend && <th className={`${TABLE_HEAD} pr-card text-right`}>Trend</th>}
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.engine.id} className="border-b border-line last:border-0 hover:bg-raised">
                <td className={`${CELL} pl-card`}>
                  <a href={routeHash({ view: 'engines', run: runParam, engine: standing.engine.id })} className="flex items-center gap-2.5 text-sm font-medium hover:underline">
                    <EngineDot engine={standing.engine.id} className="size-2.5" />
                    {ENGINE_INFO[standing.engine.id].name}
                    {full && <span className="rounded border border-line px-1.5 py-px font-mono text-micro font-normal text-fg-muted">{standing.engine.version}</span>}
                  </a>
                </td>
                <td className={CELL}>
                  <OutcomeBar standing={standing} />
                </td>
                <td className={`${CELL} text-right tabular-nums`}>
                  <Share part={standing.counts.passed} whole={standing.attempted} />
                </td>
                {full && <td className={`${CELL} text-right text-sm text-fg-secondary tabular-nums`}>{percent(standing.blockedRate)}</td>}
                {full && (
                  <td className={`${CELL} text-right tabular-nums`}>
                    {standing.trees.checked === 0 ? <span className="text-sm text-fg-muted">–</span> : <Share part={standing.trees.usable} whole={standing.trees.checked} />}
                  </td>
                )}
                {full && (
                  <td className={`${CELL} text-right tabular-nums`}>
                    <HiddenShare standing={standing} />
                  </td>
                )}
                <td className={`${CELL} text-right font-mono text-label text-fg-secondary`}>{seconds(standing.medianMs)}</td>
                {anyTrend && current && (
                  <td className={`${CELL} pr-card text-right`}>
                    <Sparkline points={trend(runs, current, standing.engine.id)} color={ENGINE_COLORS[standing.engine.id]} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
