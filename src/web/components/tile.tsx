import { cn } from '@/lib/utils'

export function Tile({ text, className }: { text: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-[13px] font-medium text-fg-secondary shadow-xs', className)}
    >
      {text}
    </span>
  )
}
