import { BLOCKING_STATUSES, CHALLENGE_PHRASES, MIN_TEXT_LENGTH } from '../../core/judge'
import { OUTCOMES } from '../../core/model'
import { MIN_HIDDEN_SAMPLE, READS_HIDDEN_SHARE } from '../../core/hidden'
import { MIN_NAMED_CONTROLS } from '../../core/tree'
import { NAVIGATION_TIMEOUT_MS, SETTLE_MS, VISIT_DEADLINE_MS } from '../../runner/timing'
import { repository } from '../../../package.json'
import { Card } from '@/components/card'
import { OutcomeLabel } from '@/components/outcome-mark'
import { PageHeader } from '@/components/page-header'
import { OUTCOME_LABELS } from '@/labels'
import { TestExplainer } from '@/views/test-explainer'

const LINK = 'font-medium text-accent-blue hover:underline'
const CODE = 'rounded border border-line bg-raised px-1 py-px font-mono text-caption'

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 text-sm leading-relaxed text-fg-secondary">{children}</div>
}

export function MethodView() {
  return (
    <>
      <PageHeader title="Method" description="What a visit is, how it's scored, and what the numbers can't tell you." />
      <TestExplainer />
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
        <div className="-mx-card -mt-card overflow-x-auto border-b border-line">
          <table className="w-full min-w-table-narrow border-collapse">
            <tbody>
              {OUTCOMES.map((outcome) => (
                <tr key={outcome} className="border-b border-line last:border-0">
                  <td className="w-40 px-3 py-3 pl-card">
                    <OutcomeLabel outcome={outcome} />
                  </td>
                  <td className="px-3 py-3 pr-card text-sm text-fg-secondary">{OUTCOME_LABELS[outcome].meaning}.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-label leading-relaxed text-fg-muted">
          Blocked means the site answered {BLOCKING_STATUSES.join(', ')}, or a short page or its title showed a bot check such as “{CHALLENGE_PHRASES[0]}”. Empty means fewer
          than {MIN_TEXT_LENGTH} characters of text. An engine error counts as failed even if some text came back.
        </p>
      </Card>
      <Card title="The accessibility tree">
        <Prose>
          <p>
            After a page loads, each engine is asked for its accessibility tree: the outline of headings, links, buttons and fields that screen readers use, and that many
            agents act on instead of pixels.
          </p>
          <p>
            A tree counts as usable when the page has controls to act on, at least {Math.round(MIN_NAMED_CONTROLS * 100)}% of them have a name, and there is a heading or
            landmark to find your way by. It's judged only on pages the engine passed, since a blocked page's tree describes the bot check, and it doesn't change the outcome.
          </p>
        </Prose>
      </Card>
      <Card title="Hidden text">
        <Prose>
          <p>
            Chromium is the only engine here that lays a page out, so it decides what a person can't see: menus, collapsed sections, cookie notices that haven't opened. During
            its visit it samples text from elements it doesn't display, leaving out anything the page also shows elsewhere.
          </p>
          <p>
            Each lighter engine's text is then checked for those samples. It reads hidden text on a page when it read at least {Math.round(READS_HIDDEN_SHARE * 100)}% of them.
            It's judged only where both engines passed and Chromium found at least {MIN_HIDDEN_SAMPLE} samples. That cuts both ways for an agent: more to read, and things to
            act on that a person couldn't reach, but also collapsed content it gets without clicking. Hidden means hidden at Chromium's desktop size, so a mobile menu counts.
          </p>
        </Prose>
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
            <p>It only reads pages. Nothing clicks, types or fills in a form, and Kitesurf isn't measured yet. A usable tree means an agent could find what to act on, not that acting on it works.</p>
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
