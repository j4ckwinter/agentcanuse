# agent can use

**caniuse, but for the browsers ai agents use.** see it at [agentcanuse.com](https://agentcanuse.com).

![Agent Can Use: the overview's answer and category guide, the engines table with usable trees, Zillow read side by side by Chromium, Lightpanda and Obscura, then Obscura's release diff with two sites now passing](docs/demo.gif)

if you're building an agent, you have to pick a browser for it. chromium is the safe choice. [Lightpanda](https://github.com/lightpanda-io/browser) and [Obscura](https://github.com/h4ckf0r0day/obscura) are lighter engines built for agents, and Cloudflare open-sourced [Kitesurf](https://github.com/cloudflare/kitesurf) on 13 november. the lighter ones promise less memory and quicker pages, and they break on some real sites. which ones, and how often? every comparison so far is a one-off, mostly run by whoever makes the engine.

agent can use runs every engine against the same 124 real sites every night, scores each visit the same way, and keeps the history. so you can see which engine gets let in, finds the content, and leaves an agent something to act on, and what changed when an engine shipped a release.

## check your own site

no need to clone anything. with Node 22.12 or newer:

```sh
npx --allow-git=root github:j4ckwinter/agentcanuse check https://your-site.com
```

`--allow-git=root` is there because npm 12 won't install from git unless you ask, and it only allows this one package. the first run downloads each engine into `~/.cache/agentcanuse`. then it visits the page once with each and prints what happened:

```
https://www.gov.uk/bank-holidays

engine      version        outcome  status  time  tree    detail
chromium    158.0.8127.36  passed   200     2.0s  usable  5,994 characters read
lightpanda  1.0.4          passed   200     1.8s  usable  16,132 characters read
obscura     v0.2.7         passed   200     2.3s  usable  16,137 characters read

Works everywhere. Every engine could read gov.uk.
```

add `--expect "some text"` (as many as you like) to check the page shows what it should, `--engine lightpanda` to try one engine, or `--json` for the raw results. every site page on agentcanuse.com has the exact command for that site.

## what it checks

each site in [`sites.json`](sites.json) comes with a couple of phrases a person would look for on it, like "Christmas Day" on the gov.uk bank holidays page. every engine visits the page once, waits for it to load, and reads the text. the visit gets one outcome:

| outcome | means |
| --- | --- |
| passed | every expected phrase was on the page |
| incomplete | the page loaded, but some expected content was missing |
| empty | almost no text came back |
| blocked | the site answered 401, 403, 429 or 503, or showed a bot check |
| failed | the engine errored or timed out |
| skipped | not visited, because `robots.txt` asks us not to |

it also asks each engine for the page's accessibility tree: the outline of headings, links, buttons and fields that screen readers use and plenty of agents act on. a tree counts as usable when the page has controls, at least 90% of them have a name, and there's a heading or landmark to find your way by. it's only judged on pages the engine passed, since a blocked page's tree is just the bot check, and it doesn't change the outcome.

the site leads with whether any engine is clearly ahead, then which engine does best on each kind of site. every pass rate shows its margin of error, so a tie is called a tie. each site gets a page with what every engine read, its accessibility tree and recent history, and the releases tab shows which sites started or stopped passing when an engine shipped a new version.

## what it's found so far

from the 124-site run on 19 november, from a home connection in the uk:

- **no engine is clearly ahead.** lightpanda passed 103 of the 122 sites it could visit, obscura 98 and chromium 97, all within each other's margin of error.
- **the difference is bot checks.** 12 sites blocked only chromium. 1 blocked only the lighter engines.
- **accessibility trees are mostly fine.** they were usable on 93 to 97 of the pages each engine passed. most of the unusable ones are the site's own doing, like Hacker News's unnamed vote links, but lightpanda left more controls unnamed on Node.js, OpenStreetMap and Stripe.
- **releases matter.** going from Obscura v0.2.4 to v0.2.7 fixed the New York Times and React docs.

the live numbers on [agentcanuse.com](https://agentcanuse.com) move with each run.

## what it can't tell you yet

- **it only reads the page.** nothing clicks, types or fills in a form, so it measures what an agent can see, not what it can do. a usable tree means an agent could find what to act on, not that acting on it works.
- **"blocked" depends on where it runs.** the nightly survey runs on GitHub Actions from a data centre, which sites block more than a home connection. every run is labelled, and comparisons stick to runs from the same kind of network.
- **kitesurf isn't in the results yet.** it runs on Cloudflare Workers, its README warns against opening untrusted sites with a local copy, and hosting it needs a paid Workers plan. the runner drives it as soon as `KITESURF_ENDPOINT` points at a deployed instance.
- **agent-browser isn't here because it isn't an engine.** it drives chromium or lightpanda, which are both measured.
- **124 sites is a sample, not a census.** one site is a hint; the totals are the signal.

## run it yourself

you need Node 22.12 or newer.

```sh
git clone https://github.com/j4ckwinter/agentcanuse.git
cd agentcanuse
npm ci
npm run dev
```

that opens the site on the runs already in `public/data`. to run a survey of your own:

```sh
npm run bench                                          # every engine, every site
npm run bench -- --engines lightpanda --sites gov-uk   # just one
npm run bench -- --pin lightpanda=1.0.1                # an older release
npm run bench -- --origin data-centre                  # label a run from a server
```

engines download into `.cache/engines` the first time. a run writes `public/data/runs/<id>.json`, adds itself to `public/data/index.json`, and keeps screenshots only where the engines disagreed. a new Lightpanda or Obscura release gets its own survey within six hours. `npm run check` runs the type check, the tests and the build.

## being polite

every engine visits each site once per run, one page at a time. before any of that, the runner asks `robots.txt` whether `agentcanuse` may visit, and skips the site if not, or if it can't tell. the engines run their standard builds, never a stealth mode: getting blocked is one of the things it measures.
