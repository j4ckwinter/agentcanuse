import { parseArgs } from 'node:util'
import type { Browser } from 'puppeteer-core'
import { judge, skipped } from '../core/judge'
import { ENGINE_IDS, type EngineId, type EngineRun, type Result, type Site } from '../core/model'
import { runIdAt } from '../core/run-id'
import { isEngineId, loadPins, loadSites, type Pins } from './config'
import { launchEngine, type RunningEngine } from './engines'
import { robotsAllows } from './robots'
import { saveRun, saveThumbnail } from './store'
import { connect, visitPage } from './visit'

const ROBOTS_REFUSAL = 'robots.txt does not allow this page, or could not be read'

interface Options {
  engines: EngineId[]
  siteIds: string[] | null
  pins: Pins
  dataDir: string
  cacheDir: string
  port: number
}

function list(value: string | undefined): string[] | null {
  return value === undefined ? null : value.split(',').map((item) => item.trim()).filter(Boolean)
}

async function readOptions(): Promise<Options> {
  const { values } = parseArgs({
    options: {
      engines: { type: 'string' },
      sites: { type: 'string' },
      pin: { type: 'string', multiple: true },
      data: { type: 'string', default: 'public/data' },
      cache: { type: 'string', default: '.cache/engines' },
      port: { type: 'string', default: '9333' },
    },
  })
  const engines = list(values.engines) ?? [...ENGINE_IDS]
  const unknown = engines.filter((engine) => !isEngineId(engine))
  if (unknown.length > 0) throw new Error(`Unknown engines: ${unknown.join(', ')}`)
  const pins = await loadPins('engines.json')
  for (const pin of values.pin ?? []) {
    const [engine, version] = pin.split('=')
    if (!isEngineId(engine) || !version) throw new Error(`Pins look like engine=version, got ${pin}`)
    pins[engine] = version
  }
  return {
    engines: engines as EngineId[],
    siteIds: list(values.sites),
    pins,
    dataDir: values.data,
    cacheDir: values.cache,
    port: Number(values.port),
  }
}

async function permittedSites(sites: Site[]): Promise<Set<string>> {
  const permitted = new Set<string>()
  for (const site of sites) {
    if (await robotsAllows(site.url)) permitted.add(site.id)
    else console.log(`robots: skipping ${site.id}`)
  }
  return permitted
}

async function open(id: EngineId, options: Options): Promise<{ engine: RunningEngine; browser: Browser } | string> {
  const launch = await launchEngine(id, options.pins, options.cacheDir, options.port)
  if ('unavailable' in launch) return launch.unavailable
  try {
    return { engine: launch.engine, browser: await connect(launch.engine.endpoint) }
  } catch (error) {
    await launch.engine.stop()
    return `Could not connect: ${error instanceof Error ? error.message : String(error)}`
  }
}

async function close(session: { engine: RunningEngine; browser: Browser }): Promise<void> {
  await session.browser.disconnect().catch(() => undefined)
  await session.engine.stop()
}

async function surveyEngine(id: EngineId, sites: Site[], permitted: Set<string>, runId: string, options: Options) {
  let session = await open(id, options)
  if (typeof session === 'string') {
    console.log(`${id}: not run (${session})`)
    return null
  }
  const engine: EngineRun = { id, version: session.engine.version }
  console.log(`${id} ${engine.version}`)
  const results: Result[] = []
  for (const site of sites) {
    if (!permitted.has(site.id)) {
      results.push(skipped(site, id, ROBOTS_REFUSAL))
      continue
    }
    if (typeof session === 'string' || !session.browser.connected) {
      if (typeof session !== 'string') await close(session)
      session = await open(id, options)
    }
    if (typeof session === 'string') {
      results.push(skipped(site, id, `Engine could not restart: ${session}`))
      continue
    }
    const capture = await visitPage(session.browser, site.url)
    const shot = capture.screenshot === null ? null : await saveThumbnail(options.dataDir, runId, id, site.id, capture.screenshot)
    const result = judge(site, id, capture.visit, shot)
    results.push(result)
    console.log(`  ${result.outcome.padEnd(10)} ${site.id} ${result.error ?? ''}`)
  }
  if (typeof session !== 'string') await close(session)
  return { engine, results }
}

async function main(): Promise<void> {
  const options = await readOptions()
  const startedAt = new Date()
  const runId = runIdAt(startedAt)
  const allSites = await loadSites('sites.json')
  const sites = options.siteIds === null ? allSites : allSites.filter((site) => options.siteIds?.includes(site.id))
  const permitted = await permittedSites(sites)
  const engines: EngineRun[] = []
  const results: Result[] = []
  for (const id of options.engines) {
    const survey = await surveyEngine(id, sites, permitted, runId, options)
    if (survey === null) continue
    engines.push(survey.engine)
    results.push(...survey.results)
  }
  if (engines.length === 0) throw new Error('No engine ran')
  await saveRun(options.dataDir, { id: runId, startedAt: startedAt.toISOString(), engines, sites, results })
  console.log(`Saved run ${runId}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
