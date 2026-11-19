import type { Verdict } from '../../core/verdict'
import { VERDICT_LABELS, type Tone } from '@/labels'
import { cn } from '@/lib/utils'

const TONES: Record<Tone, string> = {
  good: 'var(--status-good)',
  info: 'var(--palette-accent)',
  warning: 'var(--status-warning)',
  critical: 'var(--status-critical)',
  neutral: 'var(--status-neutral)',
}

export function VerdictLabel({ verdict, className }: { verdict: Verdict; className?: string }) {
  const { label, tone } = VERDICT_LABELS[verdict]
  const color = TONES[tone]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-caption font-medium whitespace-nowrap text-fg', className)}
      style={{ borderColor: `color-mix(in oklab, ${color} 35%, transparent)`, backgroundColor: `color-mix(in oklab, ${color} 10%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  )
}
