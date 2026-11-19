import type { Outcome } from '../../core/model'
import { OUTCOME_LABELS, type OutcomeMark as Shape } from '@/labels'
import { cn } from '@/lib/utils'

const SHAPES: Record<Shape, React.ReactNode> = {
  dot: <circle cx="8" cy="8" r="5" fill="currentColor" />,
  half: (
    <>
      <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" />
    </>
  ),
  ring: <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.75" />,
  slash: (
    <>
      <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.8 11.2l6.4-6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  cross: <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
  dash: <path d="M5 8h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
}

export function OutcomeMark({ outcome, className }: { outcome: Outcome; className?: string }) {
  const { label, meaning, mark, color } = OUTCOME_LABELS[outcome]
  return (
    <svg viewBox="0 0 16 16" role="img" aria-label={label} className={cn('inline-block size-4 shrink-0', className)} style={{ color }}>
      <title>{`${label}: ${meaning}`}</title>
      {SHAPES[mark]}
    </svg>
  )
}

export function OutcomeLabel({ outcome }: { outcome: Outcome }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-label text-fg-secondary">
      <OutcomeMark outcome={outcome} />
      {OUTCOME_LABELS[outcome].label}
    </span>
  )
}

export function OutcomeKey() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {(Object.keys(OUTCOME_LABELS) as Outcome[]).map((outcome) => (
        <OutcomeLabel key={outcome} outcome={outcome} />
      ))}
    </div>
  )
}
