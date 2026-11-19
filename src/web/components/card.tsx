import { cn } from '@/lib/utils'

interface CardProps {
  title?: React.ReactNode
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Card({ title, description, action, className, children }: CardProps) {
  return (
    <section className={cn('flex flex-col rounded-xl border border-line bg-surface', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-medium">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </section>
  )
}

export function StatTile({ label, value, detail, accent }: { label: string; value: React.ReactNode; detail?: React.ReactNode; accent?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3.5 sm:px-5 sm:py-4">
      <span className="flex items-center gap-2 text-[13px] text-fg-secondary">
        {accent && <span className="size-2 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />}
        {label}
      </span>
      <span className="text-2xl leading-tight font-semibold tracking-tight tabular-nums sm:text-[28px]">{value}</span>
      {detail && <span className="text-[13px] text-fg-muted">{detail}</span>}
    </div>
  )
}
