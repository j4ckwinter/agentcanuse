import { cn } from '@/lib/utils'

export function Tooltip({ content, children, className, style }: { content: React.ReactNode; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={cn('group/tip relative inline-flex', className)} style={style}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-caption whitespace-nowrap text-fg hidden shadow-lg group-focus-within/tip:block group-hover/tip:block"
      >
        {content}
      </span>
    </span>
  )
}
