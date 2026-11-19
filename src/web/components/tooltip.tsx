import { cn } from '@/lib/utils'

export function Tooltip({ content, children, className, style }: { content: React.ReactNode; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={cn('group/tip relative inline-flex', className)} style={style}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] whitespace-nowrap text-fg opacity-0 shadow-lg transition-opacity duration-100 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}
