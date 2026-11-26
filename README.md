<div align="center">

# agent can use

**caniuse, but for the browsers ai agents use.** see it at [agentcanuse.com](https://agentcanuse.com).

<img src="docs/demo.gif" alt="Agent Can Use: the overview's answer and category guide across Chromium, Lightpanda, Obscura and Kitesurf, the engines table and speed chart, Zillow read side by side by all four, then Chromium's release diff with three sites now passing" width="900">

</div>

if you're building an agent, you have to pick a browser for it. chromium is the safe choice. [Lightpanda](https://github.com/lightpanda-io/browser) and [Obscura](https://github.com/h4ckf0r0day/obscura) are lighter engines built for agents, and Cloudflare open-sourced [Kitesurf](https://github.com/cloudflare/kitesurf) on 13 november. the lighter ones promise less memory and quicker pages, and they break on some real sites. which ones, and how often? every comparison so far is a one-off, mostly run by whoever makes the engine.

agent can use runs every engine against the same [100+ real sites](sites.json) every night, scores each visit the same way, and keeps the history. the latest results, and what changed with each engine release, are on [agentcanuse.com](https://agentcanuse.com).

## check your own site

no need to clone anything. with Node 22.12 or newer:

```sh
npx agentcanuse check https://your-site.com
```

the first run downloads each engine into `~/.cache/agentcanuse`. then it visits the page once with each and prints what happened:

```
https://www.gov.uk/bank-holidays

engine      version        outcome  status  time  tree    hidden text  detail
chromium    158.0.8127.36  passed   200     1.8s  usable  reference    5,994 characters read
lightpanda  1.0.4          passed   200     1.8s  usable  reads it     16,132 characters read
obscura     v0.2.7         passed   200     2.3s  usable  reads it     16,137 characters read

Works everywhere. Every engine could read gov.uk.
```

add `--expect "some text"` (as many as you like) to check the page shows what it should, `--engine lightpanda` to try one engine, or `--json` for the raw results. every site page on agentcanuse.com has the exact command for that site.

kitesurf is the exception: it only runs on Cloudflare, so `check` leaves it out unless you bring your own Cloudflare account. create an API token with Browser Run edit (the free plan's 10 browser-minutes a day is plenty for checks), then:

```sh
export KITESURF_ENDPOINT='wss://api.cloudflare.com/client/v4/accounts/<your account id>/browser-run/devtools/browser?browser=kitesurf'
export KITESURF_TOKEN='<your token>'
npx agentcanuse check https://your-site.com
```

## reading the output

| column | says |
| --- | --- |
| outcome | `passed` if the page showed what it should, otherwise `incomplete`, `empty`, `blocked` (a bot check or a refusal), `failed` (an engine error or timeout) or `skipped` |
| tree | whether the page's accessibility tree, the outline of links, buttons and headings many agents act on, gives an agent something usable |
| hidden text | whether the engine read text a person can't see, like collapsed sections and closed menus. chromium lays the page out, so it's the reference for what's hidden. reading it cuts both ways: more noise, but content an agent gets without clicking |

the exact rules and thresholds are on the [method page](https://agentcanuse.com/#method), which reads them from the same code that scores every visit.

## what it can't tell you yet

- **it only reads the page.** nothing clicks, types or fills in a form, so it measures what an agent can see, not what it can do.
- **kitesurf runs on Cloudflare's network.** Cloudflare hosts it in beta through Browser Run, so its visits come from there whatever the run's label says, and its load times include the trip. to drive it yourself, bring your own Cloudflare account and set the same two variables as [checking your own site](#check-your-own-site).
- **agent-browser isn't here because it isn't an engine.** it drives chromium or lightpanda, which are both measured.

want a site in the survey? [suggest one](https://github.com/j4ckwinter/agentcanuse/issues/new?template=suggest-a-site.yml). it needs a public page and two phrases a person would look for on it.

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

engines download into `.cache/engines` the first time. a run writes `public/data/runs/<id>.json`, adds itself to `public/data/index.json`, and keeps screenshots only where the engines disagreed. `npm run check` runs the type check, the tests and the build.

## being polite

every engine visits each site once per run, one page at a time. before any of that, the runner asks `robots.txt` whether `agentcanuse` may visit, and skips the site if not, or if it can't tell. the engines run their standard builds, never a stealth mode: getting blocked is one of the things it measures.

the site itself counts page views with Vercel Web Analytics, which uses no cookies. it records which page was viewed, not which run or filters.
