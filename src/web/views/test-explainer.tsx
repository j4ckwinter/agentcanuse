import { ClipboardCheck, Globe, ScanSearch } from 'lucide-react'

const STEPS = [
  {
    icon: Globe,
    title: 'Visit',
    body: 'Each engine opens a real page the way an AI agent would, once a night, from the same place.',
  },
  {
    icon: ScanSearch,
    title: 'Read',
    body: 'It reads what came back and looks for content a person would want there, like “Christmas Day” on GOV.UK’s bank holidays page.',
  },
  {
    icon: ClipboardCheck,
    title: 'Score',
    body: 'Every visit gets one outcome, so you can compare engines site by site.',
  },
] as const

export function TestExplainer() {
  return (
    <section aria-labelledby="how-it-works" className="rounded-xl border border-line bg-surface">
      <h2 id="how-it-works" className="sr-only">
        How a test works
      </h2>
      <ol className="grid divide-line md:grid-cols-3 md:divide-x">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="flex gap-3 border-b border-line p-card last:border-0 md:border-b-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-fg-secondary">
              <Icon className="size-4" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                <span className="mr-1.5 font-mono text-caption text-fg-muted">{index + 1}</span>
                {title}
              </span>
              <p className="text-label leading-relaxed text-fg-secondary">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
