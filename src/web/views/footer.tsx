import type { RunSummary } from '../../core/model'
import { repository } from '../../../package.json'
import { shortDate } from '@/labels'

export function Footer({ latest }: { latest: RunSummary | null }) {
  return (
    <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-xs text-muted-foreground">
      {latest !== null && <span>Updated {shortDate(latest.startedAt)}</span>}
      <a className="hover:text-foreground" href="#method">
        How it works
      </a>
      <a className="hover:text-foreground" href="data/index.json">
        Raw data
      </a>
      <a className="hover:text-foreground" href={repository.url}>
        Source
      </a>
    </footer>
  )
}
