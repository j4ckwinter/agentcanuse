import { categoryStandings } from '../../core/leaderboard'
import type { Run } from '../../core/model'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CATEGORY_LABELS, ENGINE_NAMES, percent } from '@/labels'
import { cn } from '@/lib/utils'

export function CategoryTable({ run }: { run: Run }) {
  const rows = categoryStandings(run)
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">By category</h2>
      <p className="text-sm text-muted-foreground">Pass rate for each kind of site. The best engine in each row is in bold.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Sites</TableHead>
            {run.engines.map((engine) => (
              <TableHead key={engine.id} className="px-1 text-right text-[11px] sm:px-2 sm:text-sm">
                {ENGINE_NAMES[engine.id]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const best = Math.max(...Object.values(row.passRates))
            return (
              <TableRow key={row.category}>
                <TableCell className="font-medium whitespace-normal">{CATEGORY_LABELS[row.category]}</TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">{row.sites}</TableCell>
                {run.engines.map((engine) => {
                  const rate = row.passRates[engine.id] ?? 0
                  return (
                    <TableCell key={engine.id} className={cn('px-1 text-right tabular-nums sm:px-2', rate === best && 'font-semibold')}>
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
