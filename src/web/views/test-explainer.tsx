import { ClipboardCheck, Globe, ScanSearch } from 'lucide-react'
import { OutcomeMark } from '@/components/outcome-mark'
import { OUTCOME_LABELS } from '@/labels'

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

const SHOWN = ['passed', 'incomplete', 'blocked', 'failed'] as const

export function TestExplainer({ sites }: { sites: number }) {
  return (
    <section aria-labelledby="how-it-works" className="rounded-xl border border-line bg-surface">
      <h2 id="how-it-works" className="sr-only">
        How a test works
      </h2>
      <ol className="grid divide-line md:grid-cols-3 md:divide-x">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="flex gap-3 border-b border-line p-5 last:border-0 md:border-b-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-fg-secondary">
              <Icon className="size-4" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                <span className="mr-1.5 font-mono text-[12px] text-fg-muted">{index + 1}</span>
                {title}
              </span>
              <p className="text-[13px] leading-relaxed text-fg-secondary">{body}</p>
              {title === 'Score' && (
                <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                  {SHOWN.map((outcome) => (
                    <li key={outcome} className="inline-flex items-center gap-1.5 text-[12px] text-fg-secondary" title={OUTCOME_LABELS[outcome].meaning}>
                      <OutcomeMark outcome={outcome} className="size-3.5" />
                      {OUTCOME_LABELS[outcome].label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-line px-5 py-3 text-[13px] text-fg-muted">
        {sites} sites across docs, news, shopping, government and more. Same sites, same checks, every engine.{' '}
        <a href="#method" className="font-medium text-accent-blue hover:underline">
          Read the method
        </a>
      </p>
    </section>
  )
}
