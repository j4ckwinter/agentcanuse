import type { Outcome } from '../../core/model'
import { OUTCOME_LABELS } from '@/labels'
import { cn } from '@/lib/utils'

export function OutcomeBadge({ outcome, className }: { outcome: Outcome; className?: string }) {
  const { label, meaning, tone } = OUTCOME_LABELS[outcome]
  return (
    <span title={meaning} className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', tone, className)}>
      {label}
    </span>
  )
}
