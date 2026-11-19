import type { RunSummary } from '../../core/model'
import { repository } from '../../../package.json'
import { shortDate } from '@/labels'

const LINK = 'hover:text-fg'

export function Footer({ latest }: { latest: RunSummary | null }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-5 gap-y-1 px-4 py-card text-label text-fg-muted sm:px-6">
        {latest !== null && <span>Updated {shortDate(latest.startedAt)}</span>}
        <a className={LINK} href="data/index.json">
          Raw data
        </a>
        <a className={LINK} href={repository.url}>
          Source
        </a>
      </div>
    </footer>
  )
}
