import { REFERENCE_ENGINE } from '../../core/agreement'
import { findings } from '../../core/findings'
import type { Run } from '../../core/model'
import { Section } from '@/components/section'
import { CATEGORY_LABELS, ENGINE_INFO, percent, seconds } from '@/labels'
import { routeHash } from '@/route'
import { NO_FILTER, type SiteFilter } from '@/site-filter'

const LINK = 'underline decoration-faint underline-offset-4 hover:decoration-fg-muted'

function sites(count: number): string {
  return `${count} ${count === 1 ? 'site' : 'sites'}`
}

export function FindingsList({ run, runParam }: { run: Run; runParam: string | null }) {
  const found = findings(run)
  const filtered = (filter: Partial<SiteFilter>) => routeHash({ view: 'sites', run: runParam, site: null, filter: { ...NO_FILTER, ...filter } })
  const chromium = ENGINE_INFO[REFERENCE_ENGINE].name.toLowerCase()
  const items: React.ReactNode[] = []
  if (found.blockedOnlyChromium > 0) {
    items.push(
      <>
        lighter engines got past the bot check on{' '}
        <a className={LINK} href={filtered({ blocking: 'only-chromium' })}>
          {sites(found.blockedOnlyChromium)}
        </a>{' '}
        that blocked {chromium}. the reverse happened on{' '}
        <a className={LINK} href={filtered({ blocking: 'only-others' })}>
          {sites(found.blockedOnlyOthers)}
        </a>
        .
      </>,
    )
  }
  if (found.hardestCategory !== null) {
    items.push(
      <>
        <a className={LINK} href={filtered({ category: found.hardestCategory.category })}>
          {CATEGORY_LABELS[found.hardestCategory.category]}
        </a>{' '}
        is the hardest kind of site: the engines passed {percent(found.hardestCategory.passRate)} of them on average.
      </>,
    )
  }
  if (found.fastest !== null && found.slowest !== null) {
    items.push(
      <>
        {ENGINE_INFO[found.fastest.engine].name.toLowerCase()} is quickest, at {seconds(found.fastest.medianMs)} a page. {ENGINE_INFO[found.slowest.engine].name.toLowerCase()} takes{' '}
        {seconds(found.slowest.medianMs)}.
      </>,
    )
  }
  if (items.length === 0) return null
  return (
    <Section id="findings" title="Findings">
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-[15px] leading-relaxed text-fg-secondary">
            <span className="mt-[0.7em] size-1 rounded-full bg-fg-muted" aria-hidden="true" />
            <p>{item}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
