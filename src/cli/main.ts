import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { judge } from '../core/judge'
import { ENGINE_IDS, type EngineId, type Site } from '../core/model'
import { verdictFor } from '../core/verdict'
import { isEngineId, loadPins } from '../runner/config'
import { launchEngine } from '../runner/engines'
import { connect, visitPage } from '../runner/visit'
import { formatReport, type CheckedEngine } from './report'

const PINS = fileURLToPath(new URL('../../engines.json', import.meta.url))
const DEFAULT_PORT = 9555
const USAGE = `Usage: agentcanuse check <url> [--engine <id>]... [--expect <phrase>]... [--json]

Visits the page once with each engine and prints how each did.
  --engine   only these engines (${ENGINE_IDS.join(', ')}); defaults to all
  --expect   a phrase the page should show; without one, a page passes when it loads readable text
  --json     print the results as JSON`

function fail(message: string): never {
  console.error(`${message}\n\n${USAGE}`)
  process.exit(2)
}

function readArguments() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      engine: { type: 'string', multiple: true },
      expect: { type: 'string', multiple: true },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help) {
    console.log(USAGE)
    process.exit(0)
  }
  const [command, url] = positionals
  if (command !== 'check' || url === undefined) fail('Tell me which page to check.')
  try {
    new URL(url)
  } catch {
    fail(`That isn't a full web address: ${url}`)
  }
  const engines = values.engine ?? ENGINE_IDS.filter((id) => id !== 'kitesurf' || process.env.KITESURF_ENDPOINT)
  const unknown = engines.filter((engine) => !isEngineId(engine))
  if (unknown.length > 0) fail(`Unknown engine: ${unknown.join(', ')}`)
  return { url, engines: engines as EngineId[], expect: values.expect ?? [], json: values.json }
}

type Checked = { checked: CheckedEngine } | { skipped: string }

async function check(id: EngineId, site: Site, cacheDir: string): Promise<Checked> {
  const launch = await launchEngine(id, await loadPins(PINS), cacheDir, DEFAULT_PORT)
  if ('unavailable' in launch) return { skipped: launch.unavailable }
  try {
    const browser = await connect(launch.engine.endpoint)
    try {
      const capture = await visitPage(browser, site.url)
      return { checked: { engine: id, version: launch.engine.version, result: judge(site, id, capture.visit, null) } }
    } finally {
      await browser.disconnect().catch(() => undefined)
    }
  } finally {
    await launch.engine.stop()
  }
}

async function main(): Promise<void> {
  const { url, engines, expect, json } = readArguments()
  const site: Site = { id: 'check', name: new URL(url).hostname, category: 'reference', url, expect }
  const cacheDir = process.env.AGENTCANUSE_CACHE ?? join(homedir(), '.cache', 'agentcanuse', 'engines')
  const checked: CheckedEngine[] = []
  const skipped: { engine: EngineId; reason: string }[] = []
  for (const engine of engines) {
    if (!json) process.stderr.write(`Checking with ${engine}…\n`)
    try {
      const outcome = await check(engine, site, cacheDir)
      if ('checked' in outcome) checked.push(outcome.checked)
      else skipped.push({ engine, reason: outcome.skipped })
    } catch (error) {
      skipped.push({ engine, reason: error instanceof Error ? error.message.split('\n')[0] : String(error) })
    }
  }
  const verdict = verdictFor(checked.map((entry) => entry.result))
  if (json) console.log(JSON.stringify({ url, verdict, checked, skipped }, null, 2))
  else console.log(`\n${formatReport(url, checked, skipped, verdict)}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
