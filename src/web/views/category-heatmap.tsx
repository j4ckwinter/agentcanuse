import { categoryStandings } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { Card } from '@/components/card'
import { Tooltip } from '@/components/tooltip'
import { CATEGORY_LABELS, ENGINE_COLORS, ENGINE_INFO, percent } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const STEPS = [
  { from: 0.9, fill: 'var(--seq-550)', ink: '#ffffff' },
  { from: 0.75, fill: 'var(--seq-400)', ink: '#ffffff' },
  { from: 0.6, fill: 'var(--seq-250)', ink: '#0b0b0b' },
  { from: 0, fill: 'var(--seq-100)', ink: '#0b0b0b' },
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
        <div className="hidden items-center gap-1.5 text-[11px] text-fg-muted sm:flex" aria-hidden="true">
          <span>Lower</span>
          {[...STEPS].reverse().map((entry) => (
            <span key={entry.from} className="h-2.5 w-4 rounded-[3px]" style={{ backgroundColor: entry.fill }} />
          ))}
          <span>Higher</span>
        </div>
      }
    >
      <div className="-mx-5 -my-2 overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-x-[2px] border-spacing-y-[2px] px-5">
          <thead>
            <tr>
              <th className="py-2 pr-3 text-left text-[12px] font-medium text-fg-muted">Category</th>
              <th className="py-2 pr-3 text-right text-[12px] font-medium text-fg-muted">Sites</th>
              {run.engines.map((engine) => (
                <th key={engine.id} className="py-2 text-center text-[12px] font-medium text-fg-muted">
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
                <td className="py-1 pr-3 text-right font-mono text-[12px] text-fg-muted">{row.sites}</td>
                {run.engines.map((engine) => {
                  const rate = row.passRates[engine.id] ?? 0
                  const { fill, ink } = step(rate)
                  return (
                    <td key={engine.id} className="p-0">
                      <Tooltip className="flex w-full" content={`${ENGINE_INFO[engine.id].name} passed ${percent(rate)} of ${CATEGORY_LABELS[row.category].toLowerCase()}`}>
                        <span tabIndex={0} className="block w-full rounded-[4px] py-1.5 text-center font-mono text-[12px] font-medium" style={{ backgroundColor: fill, color: ink }}>
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
