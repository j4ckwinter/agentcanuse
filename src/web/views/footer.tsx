import type { RunSummary } from '../../core/model'
import { repository } from '../../../package.json'
import { shortDate } from '@/labels'

const LINK = 'underline decoration-faint underline-offset-4 hover:text-fg hover:decoration-fg-muted'

export function Footer({ latest }: { latest: RunSummary | null }) {
  return (
    <footer className="text-[13px] text-fg-muted">
      {latest !== null && <>updated {shortDate(latest.startedAt)}. </>}
      <a className={LINK} href="data/index.json">
        raw data
      </a>
      {' · '}
      <a className={LINK} href={repository.url}>
        source
      </a>
    </footer>
  )
}
