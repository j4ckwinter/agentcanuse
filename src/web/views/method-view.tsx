import { BLOCKING_STATUSES, CHALLENGE_PHRASES, MIN_TEXT_LENGTH } from '../../core/judge'
import { OUTCOMES } from '../../core/model'
import { NAVIGATION_TIMEOUT_MS, SETTLE_MS, VISIT_DEADLINE_MS } from '../../runner/timing'
import { repository } from '../../../package.json'
import { OutcomeMark } from '@/components/outcome-mark'
import { Section } from '@/components/section'
import { OUTCOME_LABELS } from '@/labels'

const LINK = 'underline decoration-faint underline-offset-4 hover:decoration-fg-muted'

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 leading-relaxed text-fg-secondary">{children}</div>
}

export function MethodView() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium">How it works</h2>
        <p className="leading-relaxed text-fg-secondary">what a visit is, how it's scored, and what the numbers can't tell you.</p>
      </div>
      <Section id="visit" title="A visit">
        <Prose>
          <p>
            each engine runs as a local devtools server and is driven the same way, with puppeteer-core. it opens the page, waits for the load
            event and another {SETTLE_MS / 1000} seconds, then reads the visible text, title and links, and takes a screenshot if it can. a visit
            gets {NAVIGATION_TIMEOUT_MS / 1000} seconds to load and {VISIT_DEADLINE_MS / 1000} seconds in all.
          </p>
          <p>
            every site lists a couple of phrases a person would look for there. they were checked against what chromium showed when the site was
            added. sites that block chromium only list their own name.
          </p>
        </Prose>
      </Section>
      <Section id="scoring" title="Scoring">
        <ul className="flex flex-col gap-2">
          {OUTCOMES.map((outcome) => (
            <li key={outcome} className="grid grid-cols-[auto_6rem_minmax(0,1fr)] items-baseline gap-x-2 text-fg-secondary">
              <OutcomeMark outcome={outcome} className="translate-y-0.5" />
              <span className="text-fg">{OUTCOME_LABELS[outcome].label}</span>
              <span>{OUTCOME_LABELS[outcome].meaning}.</span>
            </li>
          ))}
        </ul>
        <Prose>
          <p>
            blocked means the site answered {BLOCKING_STATUSES.join(', ')}, or a short page or its title showed a bot check like “{CHALLENGE_PHRASES[0]}”.
            empty means fewer than {MIN_TEXT_LENGTH} characters of text. the checks run in that order, so an engine error counts as failed even if
            some text came back.
          </p>
        </Prose>
      </Section>
      <Section id="polite" title="Being polite">
        <Prose>
          <p>
            before a run, each site's robots.txt is asked whether <code className="font-mono text-[13px]">agentcanuse</code> may visit. a site that
            says no, or whose robots.txt can't be read, is skipped. each engine visits each site once per run, one page at a time. engines run their
            standard builds, never a stealth mode, because getting blocked is one of the things measured.
          </p>
        </Prose>
      </Section>
      <Section id="runs" title="Where runs come from">
        <Prose>
          <p>
            a survey runs every night on github actions, from a data centre, and again within six hours of a new lightpanda or obscura release.
            some runs come from a home connection. sites tend to block data centres more, so every run is labelled, and comparisons stick to runs
            from the same kind of network when they can.
          </p>
        </Prose>
      </Section>
      <Section id="limits" title="What it can't tell you">
        <Prose>
          <p>
            it only reads pages: nothing clicks, types or fills in a form. kitesurf isn't measured yet. the sites are a sample chosen by hand, and
            some results move between runs with no change to the engine, so read one site as a hint and the totals as the signal.
          </p>
        </Prose>
      </Section>
      <Section id="data" title="The data">
        <Prose>
          <p>
            every run is published as json:{' '}
            <a className={LINK} href="data/index.json">
              the list of runs
            </a>
            , each linking to <code className="font-mono text-[13px]">data/runs/&lt;id&gt;.json</code>. the sites, phrases, scoring and engine
            versions are in{' '}
            <a className={LINK} href={repository.url}>
              the repository
            </a>
            .
          </p>
        </Prose>
      </Section>
    </>
  )
}
