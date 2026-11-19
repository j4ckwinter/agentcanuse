import { categoryStandings } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { Card } from '@/components/card'
import { Tooltip } from '@/components/tooltip'
import { CATEGORY_LABELS, ENGINE_COLORS, ENGINE_INFO, percent } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const STEPS = [
  { from: 0.9, fill: 'var(--seq-550)', ink: 'var(--seq-ink-on-strong)' },
  { from: 0.75, fill: 'var(--seq-400)', ink: 'var(--seq-ink-on-strong)' },
  { from: 0.6, fill: 'var(--seq-250)', ink: 'var(--seq-ink-on-soft)' },
  { from: 0, fill: 'var(--seq-100)', ink: 'var(--seq-ink-on-soft)' },
]

function step(rate: number) {
  return STEPS.find((entry) => rate >= entry.from) ?? STEPS[STEPS.length - 1]
}

export function CategoryHeatmap({ run, runParam }: { run: Run; runParam: string | null }) {
  const rows = categoryStandings(run)
  return (
    <Card
      title="Pass rate by category"
      description="Share of each kind of site an engine passed."
      action={
        <div className="hidden items-center gap-1.5 text-micro text-fg-muted sm:flex" aria-hidden="true">
          <span>Lower</span>
          {[...STEPS].reverse().map((entry) => (
            <span key={entry.from} className="h-2.5 w-4 rounded-cell" style={{ backgroundColor: entry.fill }} />
          ))}
          <span>Higher</span>
        </div>
      }
    >
      <div className="-mx-card -my-2 overflow-x-auto">
        <table className="w-full min-w-table-narrow border-separate border-spacing-0.5 px-card">
          <thead>
            <tr>
              <th className="py-2 pr-3 text-left text-caption font-medium text-fg-muted">Category</th>
              <th className="py-2 pr-3 text-right text-caption font-medium text-fg-muted">Sites</th>
              {run.engines.map((engine) => (
                <th key={engine.id} className="py-2 text-center text-caption font-medium text-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: ENGINE_COLORS[engine.id] }} aria-hidden="true" />
                    {ENGINE_INFO[engine.id].name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td className="py-1 pr-3 text-sm">
                  <a href={routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, category: row.category } })} className="hover:text-accent-blue hover:underline">
                    {CATEGORY_LABELS[row.category]}
                  </a>
                </td>
                <td className="py-1 pr-3 text-right font-mono text-caption text-fg-muted">{row.sites}</td>
                {run.engines.map((engine) => {
                  const rate = row.passRates[engine.id] ?? 0
                  const { fill, ink } = step(rate)
                  return (
                    <td key={engine.id} className="p-0">
                      <Tooltip className="flex w-full" content={`${ENGINE_INFO[engine.id].name} passed ${percent(rate)} of ${CATEGORY_LABELS[row.category].toLowerCase()}`}>
                        <span tabIndex={0} className="block w-full rounded-cell py-1.5 text-center font-mono text-caption font-medium" style={{ backgroundColor: fill, color: ink }}>
                          {percent(rate)}
                        </span>
                      </Tooltip>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
