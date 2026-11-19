import { repository } from '../../../package.json'

const LINK = 'hover:text-fg'

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-5 gap-y-1 px-4 py-card text-label text-fg-muted sm:px-6">
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
