import { categoryStandings, type CategoryStanding } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { Card } from '@/components/card'
import { EngineDot } from '@/components/engine-dot'
import { TABLE_HEAD } from '@/components/table'
import { CATEGORY_LABELS, ENGINE_INFO, percent } from '@/labels'
import { cn } from '@/lib/utils'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const SMALL_SAMPLE = 10

function Leader({ row, engineCount }: { row: CategoryStanding; engineCount: number }) {
  const tie = row.leaders.length > 1
  if (tie && row.leaders.length === engineCount) return <span className="text-fg-muted">All tied</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      {!tie && <EngineDot engine={row.leaders[0]} />}
      {tie && <span className="text-fg-muted">Tie:</span>}
      {row.leaders.map((id) => ENGINE_INFO[id].name).join(' and ')}
    </span>
  )
}

function SmallSample() {
  return (
    <span className="ml-1.5 rounded border border-line px-1 font-sans text-micro" title="Fewer than ten sites, so read this row as a hint">
      small
    </span>
  )
}

function Rate({ rate }: { rate: number | undefined }) {
  return rate === undefined ? <span className="text-fg-muted" title="No site in this category was visited">–</span> : <>{percent(rate)}</>
}

function StackedRows({ run, rows, href }: { run: Run; rows: CategoryStanding[]; href: (row: CategoryStanding) => string }) {
  return (
    <ul className="-mx-card -my-card md:hidden">
      {rows.map((row) => (
        <li key={row.category} className="border-b border-line last:border-0">
          <a href={href(row)} className="flex flex-col gap-1.5 px-card py-3 hover:bg-raised">
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">
                {CATEGORY_LABELS[row.category]}
                <span className="ml-1.5 font-mono text-caption text-fg-muted">{row.sites}</span>
                {row.sites < SMALL_SAMPLE && <SmallSample />}
              </span>
              <span className="text-label">
                <Leader row={row} engineCount={Object.keys(row.passRates).length} />
              </span>
            </span>
            <span className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-fg-secondary tabular-nums">
              {run.engines.map((engine) => (
                <span key={engine.id} className={cn('inline-flex items-center gap-1.5', row.leaders.includes(engine.id) && 'font-semibold text-fg')}>
                  <EngineDot engine={engine.id} />
                  <Rate rate={row.passRates[engine.id]} />
                </span>
              ))}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function CategoryGuide({ run, runParam }: { run: Run; runParam: string | null }) {
  const rows = categoryStandings(run)
  const href = (row: CategoryStanding) => routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, category: row.category } })
  return (
    <Card title="Which engine for which kind of site" description="Pass rate by category. The leader is named, a tie is called a tie, and small categories are flagged.">
      <StackedRows run={run} rows={rows} href={href} />
      <div className="-mx-card -my-card hidden overflow-x-auto md:block">
        <table className="w-full min-w-table border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className={`${TABLE_HEAD} pl-card`}>Category</th>
              <th className={`${TABLE_HEAD} text-right`}>Sites</th>
              {run.engines.map((engine) => (
                <th key={engine.id} className={`${TABLE_HEAD} text-right`}>
                  <span className="inline-flex items-center gap-1.5">
                    <EngineDot engine={engine.id} />
                    {ENGINE_INFO[engine.id].name}
                  </span>
                </th>
              ))}
              <th className={`${TABLE_HEAD} pr-card`}>Best for this</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
                <tr key={row.category} className="relative border-b border-line last:border-0 hover:bg-raised">
                  <td className="px-3 py-2.5 pl-card">
                    <a href={href(row)} className="text-sm font-medium after:absolute after:inset-0 hover:underline">
                      {CATEGORY_LABELS[row.category]}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-caption text-fg-muted">
                    {row.sites}
                    {row.sites < SMALL_SAMPLE && <SmallSample />}
                  </td>
                  {run.engines.map((engine) => {
                    return (
                      <td key={engine.id} className={cn('px-3 py-2.5 text-right text-sm tabular-nums', row.leaders.includes(engine.id) ? 'font-semibold text-fg' : 'text-fg-secondary')}>
                        <Rate rate={row.passRates[engine.id]} />
                      </td>
                    )
                  })}
                  <td className="px-3 py-2.5 pr-card text-label">
                    <Leader row={row} engineCount={Object.keys(row.passRates).length} />
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
