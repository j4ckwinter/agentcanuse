import { ArrowRight } from 'lucide-react'
import { sitesWhereEnginesDisagree } from '../../core/agreement'
import type { Run } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { Card } from '@/components/card'
import { OutcomeMark } from '@/components/outcome-mark'
import { VerdictLabel } from '@/components/verdict-label'
import { CATEGORY_LABELS, ENGINE_COLORS, ENGINE_INFO } from '@/labels'
import { resultFor } from '@/results'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const SHOWN = 8
const HEAD = 'px-3 py-2 text-left text-[12px] font-medium text-fg-muted'

export function DisagreementsCard({ run, verdicts, runParam }: { run: Run; verdicts: Map<string, Verdict>; runParam: string | null }) {
  const disagreeing = sitesWhereEnginesDisagree(run.results)
  const sites = run.sites.filter((site) => disagreeing.has(site.id))
  const filter = { ...NO_FILTER, disagreeingOnly: true }
  return (
    <Card
      title="Where engines disagree"
      description={`${sites.length} sites got different results from different engines.`}
      action={
        <a href={routeHash({ view: 'sites', run: runParam, site: null, filter })} className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-secondary hover:text-fg">
          View all <ArrowRight className="size-3.5" />
        </a>
      }
    >
      <div className="-mx-5 -my-2 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className={`${HEAD} pl-5`}>Site</th>
              <th className={HEAD}>Category</th>
              <th className={HEAD}>Verdict</th>
              {run.engines.map((engine) => (
                <th key={engine.id} className={`${HEAD} text-center last:pr-5`}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: ENGINE_COLORS[engine.id] }} aria-hidden="true" />
                    {ENGINE_INFO[engine.id].name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites.slice(0, SHOWN).map((site) => (
              <tr key={site.id} className="relative border-b border-line last:border-0 hover:bg-raised">
                <td className="px-3 py-2.5 pl-5">
                  <a href={routeHash({ view: 'sites', run: runParam, site: site.id, filter })} className="text-sm font-medium after:absolute after:inset-0 hover:underline">
                    {site.name}
                  </a>
                  <div className="text-[12px] text-fg-muted">{new URL(site.url).hostname.replace(/^www\./, '')}</div>
                </td>
                <td className="px-3 py-2.5 text-[13px] text-fg-secondary">{CATEGORY_LABELS[site.category]}</td>
                <td className="px-3 py-2.5">
                  <VerdictLabel verdict={verdicts.get(site.id) ?? 'mixed'} />
                </td>
                {run.engines.map((engine) => {
                  const result = resultFor(run, site.id, engine.id)
                  return (
                    <td key={engine.id} className="px-3 py-2.5 text-center last:pr-5">
                      {result && <OutcomeMark outcome={result.outcome} />}
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
