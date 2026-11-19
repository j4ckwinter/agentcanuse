import { categoryStandings } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { Card } from '@/components/card'
import { CATEGORY_LABELS, ENGINE_COLORS, ENGINE_INFO, percent } from '@/labels'
import { cn } from '@/lib/utils'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const SMALL_SAMPLE = 10
const HEAD = 'px-3 py-2 text-left text-caption font-medium text-fg-muted'

function Leader({ engines }: { engines: string[] }) {
  return <span>{engines.join(' and ')}</span>
}

export function CategoryGuide({ run, runParam }: { run: Run; runParam: string | null }) {
  const rows = categoryStandings(run)
  return (
    <Card title="Which engine for which kind of site" description="Pass rate by category. The leader is named, a tie is called a tie, and small categories are flagged.">
      <div className="-mx-card -my-card overflow-x-auto">
        <table className="w-full min-w-table border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className={`${HEAD} pl-card`}>Category</th>
              <th className={`${HEAD} text-right`}>Sites</th>
              {run.engines.map((engine) => (
                <th key={engine.id} className={`${HEAD} text-right`}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: ENGINE_COLORS[engine.id] }} aria-hidden="true" />
                    {ENGINE_INFO[engine.id].name}
                  </span>
                </th>
              ))}
              <th className={`${HEAD} pr-card`}>Best for this</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tie = row.leaders.length > 1
              return (
                <tr key={row.category} className="relative border-b border-line last:border-0 hover:bg-raised">
                  <td className="px-3 py-2.5 pl-card">
                    <a href={routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, category: row.category } })} className="text-sm font-medium after:absolute after:inset-0 hover:underline">
                      {CATEGORY_LABELS[row.category]}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-caption text-fg-muted">
                    {row.sites}
                    {row.sites < SMALL_SAMPLE && (
                      <span className="ml-1.5 rounded border border-line px-1 font-sans text-micro" title="Fewer than ten sites, so read this row as a hint">
                        small
                      </span>
                    )}
                  </td>
                  {run.engines.map((engine) => {
                    const rate = row.passRates[engine.id] ?? 0
                    return (
                      <td key={engine.id} className={cn('px-3 py-2.5 text-right text-sm tabular-nums', row.leaders.includes(engine.id) ? 'font-semibold text-fg' : 'text-fg-secondary')}>
                        {percent(rate)}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2.5 pr-card text-label">
                    {tie && row.leaders.length === run.engines.length ? (
                      <span className="text-fg-muted">All tied</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        {!tie && <span className="size-2 rounded-full" style={{ backgroundColor: ENGINE_COLORS[row.leaders[0]] }} aria-hidden="true" />}
                        {tie && <span className="text-fg-muted">Tie:</span>}
                        <Leader engines={row.leaders.map((id) => ENGINE_INFO[id].name)} />
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
