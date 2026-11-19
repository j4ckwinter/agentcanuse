import { categoryStandings } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { Section } from '@/components/section'
import { CATEGORY_LABELS, ENGINE_INFO, percent } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const SHADE_FLOOR = 6
const SHADE_RANGE = 74
const INVERT_TEXT_ABOVE = 40

function shade(rate: number): React.CSSProperties {
  const strength = SHADE_FLOOR + Math.round(rate * rate * SHADE_RANGE)
  return {
    backgroundColor: `color-mix(in oklch, var(--palette-fg) ${strength}%, var(--palette-surface))`,
    color: strength > INVERT_TEXT_ABOVE ? 'var(--palette-surface)' : 'var(--palette-fg)',
  }
}

export function CategoryGrid({ run, runParam }: { run: Run; runParam: string | null }) {
  const rows = categoryStandings(run)
  return (
    <Section id="categories" title="By category">
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(var(--engines),4.25rem)] items-center gap-x-1.5 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_repeat(var(--engines),4.5rem)]" style={{ '--engines': run.engines.length } as React.CSSProperties}>
        <span />
        {run.engines.map((engine) => (
          <span key={engine.id} className="truncate text-center text-[12px] text-fg-muted">
            {ENGINE_INFO[engine.id].name.toLowerCase()}
          </span>
        ))}
        {rows.map((row) => (
          <div key={row.category} className="contents">
            <a
              href={routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, category: row.category } })}
              className="truncate text-[13px] text-fg-secondary hover:text-fg"
            >
              {CATEGORY_LABELS[row.category]} <span className="text-fg-muted">· {row.sites}</span>
            </a>
            {run.engines.map((engine) => {
              const rate = row.passRates[engine.id] ?? 0
              return (
                <span key={engine.id} className="rounded-[4px] py-1 text-center font-mono text-[11px] tabular-nums" style={shade(rate)} title={`${ENGINE_INFO[engine.id].name}: ${percent(rate)} passed`}>
                  {percent(rate)}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <p className="text-[12px] text-fg-muted">share of each kind of site an engine passed. a stronger shade means a higher pass rate.</p>
    </Section>
  )
}
