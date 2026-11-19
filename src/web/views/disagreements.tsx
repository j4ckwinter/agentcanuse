import { sitesWhereEnginesDisagree } from '../../core/agreement'
import type { Run } from '../../core/model'
import type { Verdict } from '../../core/verdict'
import { OutcomeMark } from '@/components/outcome-mark'
import { Section } from '@/components/section'
import { VerdictLabel } from '@/components/verdict-label'
import { ENGINE_INFO } from '@/labels'
import { resultFor } from '@/results'
import { routeHash } from '@/route'
import { NO_FILTER } from '@/site-filter'

const SHOWN = 8

export function Disagreements({ run, verdicts, runParam }: { run: Run; verdicts: Map<string, Verdict>; runParam: string | null }) {
  const disagreeing = sitesWhereEnginesDisagree(run.results)
  const sites = run.sites.filter((site) => disagreeing.has(site.id))
  const filter = { ...NO_FILTER, disagreeingOnly: true }
  const all = routeHash({ view: 'sites', run: runParam, site: null, filter })
  return (
    <Section
      id="disagreements"
      title="Where engines disagree"
      action={
        <a href={all} className="text-[0.8rem] font-medium text-fg-secondary hover:text-fg">
          see all {sites.length}
        </a>
      }
    >
      <ul className="flex flex-col">
        <li className="grid grid-cols-[minmax(0,1fr)_auto_repeat(var(--engines),1.25rem)] items-center gap-x-3 pb-2 text-[12px] text-fg-muted" style={{ '--engines': run.engines.length } as React.CSSProperties} aria-hidden="true">
          <span />
          <span />
          {run.engines.map((engine) => (
            <span key={engine.id} className="text-center" title={ENGINE_INFO[engine.id].name}>
              {ENGINE_INFO[engine.id].name[0].toLowerCase()}
            </span>
          ))}
        </li>
        {sites.slice(0, SHOWN).map((site) => (
          <li key={site.id}>
            <a
              href={routeHash({ view: 'sites', run: runParam, site: site.id, filter })}
              className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto_repeat(var(--engines),1.25rem)] items-center gap-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-raised"
              style={{ '--engines': run.engines.length } as React.CSSProperties}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{site.name}</span>
                <span className="block truncate text-[12px] text-fg-muted">{new URL(site.url).hostname.replace(/^www\./, '')}</span>
              </span>
              <VerdictLabel verdict={verdicts.get(site.id) ?? 'mixed'} className="hidden sm:inline-flex" />
              {run.engines.map((engine) => {
                const result = resultFor(run, site.id, engine.id)
                return <span key={engine.id} className="flex justify-center">{result && <OutcomeMark outcome={result.outcome} />}</span>
              })}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
