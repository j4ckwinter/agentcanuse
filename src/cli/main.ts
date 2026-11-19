import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { judge } from '../core/judge'
import { ENGINE_IDS, type EngineId, type Site } from '../core/model'
import { REFERENCE_ENGINE } from '../core/agreement'
import { hiddenSample, textKey, withHiddenReads, type HiddenEvidence } from '../core/hidden'
import { comparedVerdict } from '../core/verdict'
import enginePins from '../../engines.json'
import { isEngineId, pinsFrom } from '../runner/config'
import { freePort, launchEngine } from '../runner/engines'
import { connect, visitPage } from '../runner/visit'
import { formatReport, type CheckedEngine, type SkippedEngine } from './report'

const PINS = pinsFrom(enginePins, 'engines.json')
const USAGE = `Usage: agentcanuse check <url> [--engine <id>]... [--expect <phrase>]... [--json]

Visits the page once with each engine and prints how each did.
  --engine   only these engines (${ENGINE_IDS.join(', ')}); defaults to all
  --expect   a phrase the page should show; without one, a page passes when it loads readable text
  --json     print the results as JSON

Exits 1 when no engine could run, 2 on a usage error.`

function fail(message: string): never {
  console.error(`${message}\n\n${USAGE}`)
  process.exit(2)
}

function readArguments() {
  let parsed
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        engine: { type: 'string', multiple: true },
        expect: { type: 'string', multiple: true },
        json: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
    })
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
  const { values, positionals } = parsed
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

async function check(id: EngineId, site: Site, cacheDir: string, evidence: HiddenEvidence): Promise<Checked> {
  const launch = await launchEngine(id, PINS, cacheDir, await freePort())
  if ('unavailable' in launch) return { skipped: launch.unavailable }
  try {
    const browser = await connect(launch.engine.endpoint)
    try {
      const capture = await visitPage(browser, site.url, { collectHidden: id === REFERENCE_ENGINE })
      const result = judge(site, id, capture.visit, null)
      if (result.outcome === 'passed') {
        evidence.texts.set(textKey(site.id, id), capture.visit.text)
        if (capture.visit.hiddenText !== null) evidence.samples.set(site.id, hiddenSample(capture.visit.hiddenText, capture.visit.text))
      }
      return { checked: { engine: id, version: launch.engine.version, result } }
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
  const ran: CheckedEngine[] = []
  const skipped: SkippedEngine[] = []
  const evidence: HiddenEvidence = { samples: new Map(), texts: new Map() }
  for (const engine of engines) {
    if (!json) process.stderr.write(`Checking with ${engine}…\n`)
    try {
      const outcome = await check(engine, site, cacheDir, evidence)
      if ('checked' in outcome) ran.push(outcome.checked)
      else skipped.push({ engine, reason: outcome.skipped, failed: false })
    } catch (error) {
      skipped.push({ engine, reason: error instanceof Error ? error.message.split('\n')[0] : String(error), failed: true })
    }
  }
  const results = withHiddenReads(ran.map((entry) => entry.result), evidence)
  const checked = ran.map((entry, index) => ({ ...entry, result: results[index] }))
  const verdict = comparedVerdict(checked.map((entry) => entry.result))
  if (json) console.log(JSON.stringify({ url, verdict, checked, skipped }, null, 2))
  else console.log(`\n${formatReport(url, checked, skipped, verdict)}`)
  if (checked.length === 0) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
