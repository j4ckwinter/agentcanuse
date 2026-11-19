import type { Outcome } from '../../core/model'
import { OUTCOME_LABELS } from '@/labels'
import { cn } from '@/lib/utils'

export function OutcomeBadge({ outcome, className, dotOnPhones = false }: { outcome: Outcome; className?: string; dotOnPhones?: boolean }) {
  const { label, meaning, tone, bar } = OUTCOME_LABELS[outcome]
  if (dotOnPhones) {
    return (
      <>
        <span role="img" aria-label={label} title={`${label}: ${meaning}`} className={cn('inline-block size-3 rounded-full sm:hidden', bar)} />
        <OutcomeBadge outcome={outcome} className={cn('hidden sm:inline-flex', className)} />
      </>
    )
  }
  return (
    <span title={meaning} className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', tone, className)}>
      {label}
    </span>
  )
}
