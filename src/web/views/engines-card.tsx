import { shownMargin } from '../../core/confidence'
import { leaderboard, trend, type Standing } from '../../core/leaderboard'
import { OUTCOMES, type Run, type RunSummary } from '../../core/model'
import { Card } from '@/components/card'
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

const HEAD = 'px-3 py-2 text-left text-caption font-medium text-fg-muted'

function PassRate({ passed, attempted }: { passed: number; attempted: number }) {
  const margin = shownMargin(passed, attempted)
  return (
    <span className="inline-flex flex-col items-end">
      <span className="text-sm font-semibold">
        {percent(attempted === 0 ? 0 : passed / attempted)}
        {margin !== null && (
          <span className="ml-1 text-caption font-normal text-fg-muted" title="95% margin of error">
            ±{Math.round(margin * 100)}
          </span>
        )}
      </span>
      <span className="text-micro text-fg-muted">
        {passed} of {attempted}
      </span>
    </span>
  )
}
const CELL = 'px-3 py-3'

export function EnginesCard({ run, runs, runParam }: { run: Run; runs: RunSummary[]; runParam: string | null }) {
  const current = runs.find((summary) => summary.id === run.id)
  const standings = leaderboard(run)
  const anyTrend = current !== undefined && standings.some((standing) => trend(runs, current, standing.engine.id).length >= 2)
  return (
    <Card title="Engines" description="Every visit in this run, by outcome. ± is the 95% margin of error on the pass rate." action={<span className="hidden md:block"><OutcomeKey /></span>}>
      <div className="-mx-card -my-2 overflow-x-auto">
        <table className="w-full min-w-table border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className={`${HEAD} pl-card`}>Engine</th>
              <th className={`${HEAD} w-[38%]`}>Outcomes</th>
              <th className={`${HEAD} text-right`}>Passed</th>
              <th className={`${HEAD} text-right`}>Blocked</th>
              <th className={`${HEAD} text-right`}>Median</th>
              {anyTrend && <th className={`${HEAD} pr-card text-right`}>Trend</th>}
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.engine.id} className="border-b border-line last:border-0 hover:bg-raised">
                <td className={`${CELL} pl-card`}>
                  <a href={routeHash({ view: 'engines', run: runParam, engine: standing.engine.id })} className="flex items-center gap-2.5 text-sm font-medium hover:underline">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ENGINE_COLORS[standing.engine.id] }} aria-hidden="true" />
                    {ENGINE_INFO[standing.engine.id].name}
                    <span className="rounded border border-line px-1.5 py-px font-mono text-micro font-normal text-fg-muted">{standing.engine.version}</span>
                  </a>
                </td>
                <td className={CELL}>
                  <OutcomeBar standing={standing} />
                </td>
                <td className={`${CELL} text-right tabular-nums`}>
                  <PassRate passed={standing.counts.passed} attempted={standing.attempted} />
                </td>
                <td className={`${CELL} text-right text-sm text-fg-secondary tabular-nums`}>{percent(standing.blockedRate)}</td>
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
