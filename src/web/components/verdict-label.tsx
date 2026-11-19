import type { Verdict } from '../../core/verdict'
import { VERDICT_LABELS } from '@/labels'
import { cn } from '@/lib/utils'

export function VerdictLabel({ verdict, className }: { verdict: Verdict; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-md border border-line px-1.5 py-0.5 text-[12px] whitespace-nowrap text-fg-secondary', className)}>{VERDICT_LABELS[verdict].label}</span>
}
