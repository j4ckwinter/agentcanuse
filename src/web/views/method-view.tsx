import { BLOCKING_STATUSES, CHALLENGE_PHRASES, MIN_TEXT_LENGTH } from '../../core/judge'
import { OUTCOMES } from '../../core/model'
import { NAVIGATION_TIMEOUT_MS, SETTLE_MS, VISIT_DEADLINE_MS } from '../../runner/timing'
import { repository } from '../../../package.json'
import { Card } from '@/components/card'
import { OutcomeLabel } from '@/components/outcome-mark'
import { PageHeader } from '@/components/page-header'
import { OUTCOME_LABELS } from '@/labels'

const LINK = 'font-medium text-accent-blue hover:underline'
const CODE = 'rounded border border-line bg-raised px-1 py-px font-mono text-[12px]'

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 text-sm leading-relaxed text-fg-secondary">{children}</div>
}

export function MethodView() {
  return (
    <>
      <PageHeader title="Method" description="What a visit is, how it's scored, and what the numbers can't tell you." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="A visit">
          <Prose>
            <p>
              Each engine runs as a local DevTools server and is driven the same way, with puppeteer-core. It opens the page, waits for the load event and another{' '}
              {SETTLE_MS / 1000} seconds, then reads the visible text, title and links, and takes a screenshot if it can.
            </p>
            <p>
              A visit gets {NAVIGATION_TIMEOUT_MS / 1000} seconds to load and {VISIT_DEADLINE_MS / 1000} seconds in all. Every site lists a couple of phrases a person would look
              for there, checked against what Chromium showed when the site was added. Sites that block Chromium only list their own name.
            </p>
          </Prose>
        </Card>
        <Card title="Being polite">
          <Prose>
            <p>
              Before a run, each site's robots.txt is asked whether <code className={CODE}>agentcanuse</code> may visit. A site that says no, or whose robots.txt can't be read,
              is skipped.
            </p>
            <p>
              Each engine visits each site once per run, one page at a time. Engines run their standard builds, never a stealth mode, because getting blocked is one of the
              things measured.
            </p>
          </Prose>
        </Card>
      </div>
      <Card title="Scoring" description="Every visit gets exactly one outcome. The checks run in this order.">
        <div className="-mx-5 -mt-5 overflow-x-auto border-b border-line">
          <table className="w-full min-w-[520px] border-collapse">
            <tbody>
              {OUTCOMES.map((outcome) => (
                <tr key={outcome} className="border-b border-line last:border-0">
                  <td className="w-40 px-3 py-3 pl-5">
                    <OutcomeLabel outcome={outcome} />
                  </td>
                  <td className="px-3 py-3 pr-5 text-sm text-fg-secondary">{OUTCOME_LABELS[outcome].meaning}.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">
          Blocked means the site answered {BLOCKING_STATUSES.join(', ')}, or a short page or its title showed a bot check such as “{CHALLENGE_PHRASES[0]}”. Empty means fewer
          than {MIN_TEXT_LENGTH} characters of text. An engine error counts as failed even if some text came back.
        </p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Where runs come from">
          <Prose>
            <p>
              A survey runs every night on GitHub Actions, from a data centre, and again within six hours of a new Lightpanda or Obscura release. Some runs come from a home
              connection.
            </p>
            <p>Sites tend to block data centres more, so every run is labelled, and comparisons stick to runs from the same kind of network when they can.</p>
          </Prose>
        </Card>
        <Card title="What it can't tell you">
          <Prose>
            <p>It only reads pages. Nothing clicks, types or fills in a form, and Kitesurf isn't measured yet.</p>
            <p>The sites are a sample chosen by hand, and some results move between runs with no change to the engine, so read one site as a hint and the totals as the signal.</p>
          </Prose>
        </Card>
      </div>
      <Card title="The data">
        <Prose>
          <p>
            Every run is published as JSON:{' '}
            <a className={LINK} href="data/index.json">
              the list of runs
            </a>
            , each linking to <code className={CODE}>data/runs/&lt;id&gt;.json</code>. The sites, phrases, scoring code and engine versions are all in{' '}
            <a className={LINK} href={repository.url}>
              the repository
            </a>
            .
          </p>
        </Prose>
      </Card>
    </>
  )
}
