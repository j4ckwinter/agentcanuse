import { categoryStandings } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CATEGORY_LABELS, ENGINE_INFO, percent } from '@/labels'
import { cn } from '@/lib/utils'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const HEAT_STRENGTH = 45

function heat(rate: number): React.CSSProperties {
  return { backgroundColor: `color-mix(in oklab, var(--color-emerald-500) ${Math.round(rate * HEAT_STRENGTH)}%, transparent)` }
}

export function CategoryTable({ run, runParam }: { run: Run; runParam: string | null }) {
  const rows = categoryStandings(run)
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">By category</h2>
      <p className="text-sm text-muted-foreground">Pass rate for each kind of site. Greener is higher, and the best engine in each row is in bold.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Sites</TableHead>
            {run.engines.map((engine) => (
              <TableHead key={engine.id} className="px-1 text-right text-[11px] sm:px-2 sm:text-sm">
                {ENGINE_INFO[engine.id].name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const best = Math.max(...Object.values(row.passRates))
            const href = routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, category: row.category } })
            return (
              <TableRow key={row.category} className="relative">
                <TableCell className="font-medium whitespace-normal">
                  <a href={href} className="after:absolute after:inset-0 hover:underline focus-visible:underline">
                    {CATEGORY_LABELS[row.category]}
                  </a>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">{row.sites}</TableCell>
                {run.engines.map((engine) => {
                  const rate = row.passRates[engine.id] ?? 0
                  return (
                    <TableCell key={engine.id} className={cn('px-1 text-right tabular-nums sm:px-2', rate === best && 'font-semibold')} style={heat(rate)}>
                      {percent(rate)}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
