# Working on agentcanuse

agentcanuse runs the browser engines AI agents use against a fixed list of real sites, scores each visit, and publishes the results as a static site with a leaderboard, a side-by-side view per site, and a diff between engine releases. The [README](README.md) says what it measures and what it can't.

## Build and check

Run commands from the repository root with Node 22.12 or newer.

```sh
npm ci
npm run check                 # tsc, vitest, vite build
npm run dev                   # the site, reading public/data
npm run bench -- --sites wikipedia,quotes-js --data /tmp/agentcanuse
```

`npm run bench` visits real sites. Point `--data` somewhere outside `public/data` while trying things, so a trial doesn't become a published run. Engines download into `.cache/engines` on first use.

## Where things live

Each decision has one owner. Put new code with the owner of the decision it makes.

| Decision | Owner |
| --- | --- |
| Engine ids, outcome names, and the shape of a run | `src/core/model.ts` |
| How a visit becomes an outcome: the text threshold, blocking statuses and bot-check phrases | `src/core/judge.ts` |
| What an accessibility tree is summarised to, when it counts as usable, and which visits' trees are judged | `src/core/tree.ts` |
| What counts as hidden text, how it's sampled from Chromium's visit, and when an engine reads it | `src/core/hidden.ts`, collected in `src/runner/visit.ts` |
| Reading a run saved by an older version, filling in fields it predates | `src/core/stored.ts` |
| How engines are ranked | `src/core/leaderboard.ts` |
| What changed between two runs, and which runs a release diff compares | `src/core/diff.ts` |
| How a run is named | `src/core/run-id.ts` |
| Which sites are surveyed and what each must show | `sites.json` |
| Which engine versions run by default | `engines.json` |
| Which engines are pinned to a GitHub release, and when a pin moves | `src/core/releases.ts` |
| Checking for new engine releases and bumping pins | `src/runner/watch.ts` |
| Downloading engine builds | `src/runner/install.ts` |
| Starting each engine and finding its DevTools endpoint | `src/runner/engines.ts` |
| Visiting a page: connecting to an engine, what is read, screenshots, and ending the session | `src/runner/visit.ts` |
| How long a visit waits: the load timeout, the settle wait, the overall deadline, how long to wait for the accessibility tree, and how long connecting and ending a session may take | `src/runner/timing.ts` |
| Which sites keep screenshots, where blocking differs between Chromium and the other engines, and where one engine alone differs | `src/core/agreement.ts` |
| Which runs can be compared: same network, same site list | `src/core/comparable.ts` |
| The margin of error on a pass rate | `src/core/confidence.ts` |
| A site's history across runs, and when it counts as flaky | `src/core/history.ts` |
| A site's verdict (works everywhere, blocks headless Chrome, …) | `src/core/verdict.ts` |
| The overview's answer: whether an engine is clearly ahead, and the bot-check split | `src/core/findings.ts`, worded in `src/web/views/overall-answer.tsx` |
| Copying text to the clipboard, with its confirmation | `src/web/components/copy-button.tsx` |
| A run's summary for the index, and which runs a trend line follows | `src/core/leaderboard.ts` |
| Site categories and per-category pass rates | `src/core/model.ts`, `src/core/leaderboard.ts` |
| Whether a page may be visited, and the user agent that asks | `src/runner/robots.ts` |
| Where runs, the index and thumbnails are written, and which runs keep their thumbnails | `src/runner/store.ts` |
| Which engines a run can be published without when they fail, and when to give up on one mid-run | `src/core/publishing.ts` |
| Command-line options and the order of a run | `src/runner/main.ts` |
| The `agentcanuse check` command: its options and the order of a check | `src/cli/main.ts`, bundled into `cli/agentcanuse.mjs` by `npm run build:cli` |
| How a check's results are printed | `src/cli/report.ts` |
| Loading runs in the page | `src/web/data.ts` |
| What a page view records: one view per page, by pattern and path, without the run or filters | `src/web/analytics.ts` |
| Wording for engines, outcomes, verdicts, categories and changes; each outcome's mark and status colour; each engine's series colour | `src/web/labels.ts` |
| How each outcome mark is drawn | `src/web/components/outcome-mark.tsx` |
| Design tokens: the palette (surfaces, text, series, status, sequential ramp), type scale, card spacing, cell radius, page and table widths, screenshot ratio, light and dark, high contrast and motion | `src/web/index.css` |
| The mark (pointer and three-engine trail), its colours, the name and tagline | `src/web/brand.ts` |
| The favicon, PNG icons, Apple touch icon and social image, generated from the brand | `scripts/brand-assets.ts` (`npm run brand`) |
| Light and dark: the stored choice and the toggle | `src/web/theme.ts`, `src/web/components/theme-toggle.tsx`, and the boot script in `index.html` |
| Page addresses, the sections they belong to, filters and the selected run | `src/web/route.ts` |
| Which runs a site page loads for its history | `src/web/use-history.ts` |
| How the run picker groups runs by day | `src/web/run-days.ts` |
| The reproduce command shown on a site page | `src/web/reproduce.ts` |
| How a site filter is described, for the list a site page steps through | `src/web/site-filter.ts` |
| Which run is shown, and what happens for a run id the index doesn't list | `src/web/app.tsx` |
| What each engine is, its homepage and its release notes link | `src/web/labels.ts` |
| How a site's address is shown | `src/web/host.ts` |
| An engine's colour dot, and the style of a table header | `src/web/components/engine-dot.tsx`, `src/web/components/table.ts` |
| Which sites the Sites tab shows for a search, category, the disagreement switch or a blocking split, and their order for next and previous | `src/web/site-filter.ts` |
| What the Method tab says about scoring | `src/web/views/method-view.tsx`, reading the rules from their owners |

`src/web/components/ui` is generated by shadcn. Change it with `npx shadcn add`, not by hand.

## Rules that matter here

- `src/core` takes values and returns values. It imports nothing from the runner, the web app or a vendor library. The clock, the network, processes and files stay in `src/runner`.
- Every engine is driven the same way: visited with `puppeteer-core` over its DevTools endpoint. Chromium, Lightpanda and Obscura start as local DevTools servers; Kitesurf is hosted. A difference in the results should come from the engine, not from how we drove it.
- Ask `robots.txt` before visiting. A site that disallows `agentcanuse`, or whose `robots.txt` can't be read, is skipped. Only a 404 or 410 counts as having no `robots.txt`; a 401, 403 or 429 counts as unreadable. Visit each site once per engine per run, one at a time.
- Use the engines' standard builds. Never their stealth builds or anything else meant to get past a bot check: being blocked is one of the things measured.
- `agentcanuse check` visits only the page a person asks for, once per engine, so it skips the `robots.txt` check the survey makes. It shares the survey's launcher, visit and judge, so a check scores a page the same way. Without `--expect`, a page passes when it loads readable text. It ships to npm as `agentcanuse`, bundled into one file with the engine pins baked in, so its only runtime dependencies are `puppeteer-core` and `@puppeteer/browsers`; everything the site and the survey need is a dev dependency. `prepublishOnly` runs the checks and the bundle. Jack runs `npm publish` himself, and a new version needs his request.
- Kitesurf runs only when `KITESURF_ENDPOINT` is set, normally to Cloudflare's hosted Browser Run endpoint with `?browser=kitesurf`, authorised by `KITESURF_TOKEN` as a bearer token. A hosted session is closed, not just disconnected, so it stops using browser time. Its README warns against opening untrusted sites with a local Kitesurf, so don't run it locally. Its visits travel to Cloudflare and back, so its load times include that trip.
- An expected phrase should be content a person would look for, and should show in Chromium today. When a phrase stops matching in Chromium too, the site changed, so update `sites.json` rather than the scoring. A site that blocks Chromium can't have its phrases checked, so it lists only the site's name.
- Tests cover `src/core` and `src/web/route.ts` through their exported functions. No network, clock or sleeping in tests.
- Write code that needs no comments. Name things for what they mean to the reader of the scoreboard.

## Conventions

- Every site in `sites.json` has a `category` from `CATEGORIES` in `src/core/model.ts`; the runner refuses an unknown one.
- The look is a professional analytics dashboard in the Linear and Vercel mould: a sticky top bar with nav tabs, KPI tiles, bordered cards, dense tables, Geist and Geist Mono, sentence-case copy. Engines are categorical series (blue, orange, aqua, magenta, validated as a set); outcomes use the status palette and keep a distinct mark shape, so colour never carries meaning alone; magnitude uses the one-hue blue ramp. All of it is defined in `src/web/index.css`.
- Style with tokens from `src/web/index.css`, never one-off values: `text-micro` (11px), `text-caption` (12px), `text-label` (13px) and `text-display` (28px) alongside Tailwind's own sizes; `p-card` and `-mx-card` for card padding; `rounded-cell` for chart cells and bar ends; `max-w-page`, `min-w-table` and `min-w-table-narrow` for layout; `aspect-screenshot`; and colour utilities such as `bg-surface`, `text-fg-muted`, `border-line` and `bg-status-good`. Add a token there before reaching for a new value; a new text size also goes in `FONT_SIZE_TOKENS` in `src/web/lib/utils.ts`, so `cn` treats it as a size rather than a colour, and a test fails until it does. `src/web/tokens.test.ts` fails on one-off pixel or rem sizes, raw hex colours and hard-coded SVG font sizes in components; shadcn's generated `components/ui` and `brand.ts`, which feeds generated images, are exempt.
- The overview answers one question and links out for the rest: the answer, the engines, the category guide, and a link to the sites where engines disagree. Detail belongs on the Engines, Sites and Method tabs. On phones, tables people need to read whole become stacked lists rather than scrolling sideways.
- Show each fact once per page. Which run you're looking at, when it ran, from which network and over how many sites belongs to the run picker in the top bar; pages don't restate it. A date elsewhere is always another run's.
- The icons in `public` and `public/og.png` are generated by `npm run brand` from `src/web/brand.ts`. Change the brand there and rerun it; don't edit the images by hand.
- A visit's time stops before its accessibility tree is read, so adding the tree didn't change load times. A field added to `Result` gets a default in `src/core/stored.ts`, so runs saved before it still load.
- Scripts passed to `page.evaluate` must not define named inner functions: tsx wraps them with a `__name` helper the page doesn't have, and the call fails. Use loops and inline callbacks.
- Durations are milliseconds. Rates are fractions from 0 to 1, shown as percentages.
- `index.json` holds a summary per run: its origin, engines, site count, a fingerprint of its site list, and each engine's pass rate. The site reads trends from it without loading every run. `npm run tidy` rebuilds it.
- A run id is its UTC start minute, `2026-11-19T21-07Z`. `public/data/index.json` lists runs newest first, and each run lives in `public/data/runs/<id>.json`.
- Thumbnails are 480-pixel-wide WebP files under `public/data/shots/<run>/<engine>/<site>.webp`. Only the latest run keeps them, since the site shows no others, and only for sites where the engines disagree; older runs keep their scores with `shot` set to `null`. `npm run tidy` rebuilds `index.json` from the run files and applies that rule, and every saved run runs it.
- A run records where it came from: `home` for a run on a home connection, the default, and `data-centre` for the nightly GitHub Actions run. Sites treat the two differently, so a release diff compares runs from the same kind of network when it can.
- Chromium's version is the headless-shell build that `@puppeteer/browsers` resolves for the `stable` channel.

## Deploy

The site is the Vercel project `agentcanuse`, served at https://agentcanuse.com. Vercel builds it with `npm run build` and serves `dist`, which includes `public/data`. `npx vercel deploy --prod` from a linked checkout deploys the working tree, so deploy only a clean, pushed `main`.

## Commits

Use Conventional Commits, one logical change each, with no AI attribution lines. Committing and pushing to `main` is expected. The survey workflow runs nightly at 03:17 UTC and commits its run to `main`, which Vercel deploys. The release watcher runs every six hours; when Lightpanda or Obscura publishes a new stable release it bumps `engines.json` and starts a survey, so the release diff picks up the new version the same day. Deploying by hand, or changing the schedule, needs Jack's request.
