import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  back?: { href: string; label: string }
  aside?: React.ReactNode
}

export function PageHeader({ title, description, back, aside }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {back && (
        <a href={back.href} className="inline-flex items-center gap-1.5 self-start text-label text-fg-muted hover:text-fg">
          <ArrowLeft className="size-3.5" />
          {back.label}
        </a>
      )}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-fg-secondary">{description}</p>}
        </div>
        {aside}
      </div>
    </div>
  )
}
