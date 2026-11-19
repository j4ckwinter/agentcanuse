import { BLOCKING_STATUSES, CHALLENGE_PHRASES, MIN_TEXT_LENGTH } from '../../core/judge'
import { OUTCOMES } from '../../core/model'
import { NAVIGATION_TIMEOUT_MS, SETTLE_MS, VISIT_DEADLINE_MS } from '../../runner/timing'
import { OutcomeBadge } from '@/components/outcome-badge'
import { OUTCOME_LABELS } from '@/labels'

const REPOSITORY = 'https://github.com/j4ckwinter/agentcanuse'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export function MethodView() {
  return (
    <div className="max-w-3xl space-y-8">
      <Section title="What a visit is">
        <p>
          Each engine runs as a local DevTools server and is driven the same way, with puppeteer-core. It opens the page, waits for the
          load event and another {SETTLE_MS / 1000} seconds, then reads the page's visible text, title and links, and takes a screenshot if it can. A visit
          gets {NAVIGATION_TIMEOUT_MS / 1000} seconds to load and {VISIT_DEADLINE_MS / 1000} seconds in all.
        </p>
        <p>
          Every site lists a couple of phrases a person would look for there. They were checked against what Chromium showed when the site
          was added, except on sites that block Chromium, which only list the site's name.
        </p>
      </Section>
      <Section title="How a visit is scored">
        <ul className="space-y-1.5">
          {OUTCOMES.map((outcome) => (
            <li key={outcome} className="flex items-start gap-2">
              <OutcomeBadge outcome={outcome} className="mt-0.5 shrink-0" />
              <span>{OUTCOME_LABELS[outcome].meaning}.</span>
            </li>
          ))}
        </ul>
        <p>
          Blocked means the site answered {BLOCKING_STATUSES.join(', ')}, or a short page or the title contained a bot check such as “
          {CHALLENGE_PHRASES[0]}”. Empty means fewer than {MIN_TEXT_LENGTH} characters of text. The checks run in that order, so an engine
          error counts as failed even if some text came back.
        </p>
      </Section>
      <Section title="Being polite">
        <p>
          Before a run, each site's robots.txt is asked whether <code>agentcanuse</code> may visit. A site that says no, or whose robots.txt
          can't be read, is skipped. Each engine visits each site once per run, one page at a time. Engines run their standard builds, never
          a stealth mode, because being blocked is one of the things measured.
        </p>
      </Section>
      <Section title="Where runs come from">
        <p>
          A survey runs every night on GitHub Actions, from a data centre, and again within six hours of a new Lightpanda or Obscura
          release. Some runs come from a home connection. Sites tend to block data-centre traffic more, so every run is labelled, and the
          release diff compares runs from the same kind of network when it can.
        </p>
      </Section>
      <Section title="What it can't tell you">
        <p>
          It only reads pages: nothing clicks, types or fills in a form. Kitesurf isn't measured yet. The sites are a sample chosen by hand,
          and some results move between runs with no change to the engine, so read one site's result as a hint and the leaderboard as the
          signal.
        </p>
      </Section>
      <Section title="The data">
        <p>
          Every run is published as JSON: <a className="underline underline-offset-4" href="data/index.json">the list of runs</a>, each
          linking to <code>data/runs/&lt;id&gt;.json</code>. The sites, phrases, scoring code and engine versions are in{' '}
          <a className="underline underline-offset-4" href={REPOSITORY}>
            the repository
          </a>
          .
        </p>
      </Section>
    </div>
  )
}
