import { parseArgs } from 'node:util'
import type { Browser } from 'puppeteer-core'
import { judge, skipped } from '../core/judge'
import { ENGINE_IDS, ORIGINS, type EngineId, type EngineRun, type Origin, type Result, type Site } from '../core/model'
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
  origin: Origin
  dataDir: string
  cacheDir: string
  port: number
}

function list(value: string | undefined): string[] | null {
  return value === undefined ? null : value.split(',').map((item) => item.trim()).filter(Boolean)
}

function isOrigin(value: string): value is Origin {
  return (ORIGINS as readonly string[]).includes(value)
}

async function readOptions(): Promise<Options> {
  const { values } = parseArgs({
    options: {
      engines: { type: 'string' },
      sites: { type: 'string' },
      pin: { type: 'string', multiple: true },
      origin: { type: 'string', default: 'home' },
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
  if (!isOrigin(values.origin)) throw new Error(`--origin is one of ${ORIGINS.join(', ')}, got ${values.origin}`)
  return {
    engines: engines as EngineId[],
    origin: values.origin,
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

type Session = { engine: RunningEngine; browser: Browser }

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

type Refusal = { reason: string; expected: boolean }

function isSession(opened: Session | Refusal): opened is Session {
  return 'browser' in opened
}

async function open(id: EngineId, options: Options): Promise<Session | Refusal> {
  let launch
  try {
    launch = await launchEngine(id, options.pins, options.cacheDir, options.port)
  } catch (error) {
    return { reason: `Could not start: ${messageOf(error)}`, expected: false }
  }
  if ('unavailable' in launch) return { reason: launch.unavailable, expected: true }
  try {
    return { engine: launch.engine, browser: await connect(launch.engine.endpoint) }
  } catch (error) {
    await launch.engine.stop()
    return { reason: `Could not connect: ${messageOf(error)}`, expected: false }
  }
}

async function close(session: Session): Promise<void> {
  await session.browser.disconnect().catch(() => undefined)
  await session.engine.stop()
}

async function thumbnail(options: Options, runId: string, id: EngineId, site: Site, png: Uint8Array | null): Promise<string | null> {
  if (png === null) return null
  try {
    return await saveThumbnail(options.dataDir, runId, id, site.id, png)
  } catch (error) {
    console.log(`  could not save the ${site.id} screenshot: ${messageOf(error)}`)
    return null
  }
}

async function surveyEngine(id: EngineId, sites: Site[], permitted: Set<string>, runId: string, options: Options) {
  let session = await open(id, options)
  if (!isSession(session)) {
    console.log(`${id}: not run (${session.reason})`)
    return session
  }
  const engine: EngineRun = { id, version: session.engine.version }
  console.log(`${id} ${engine.version}`)
  const results: Result[] = []
  let needsRestart = false
  try {
    for (const site of sites) {
      if (!permitted.has(site.id)) {
        results.push(skipped(site, id, ROBOTS_REFUSAL))
        continue
      }
      if (!isSession(session) || needsRestart || !session.browser.connected) {
        if (isSession(session)) await close(session)
        session = await open(id, options)
        needsRestart = false
      }
      if (!isSession(session)) {
        results.push(skipped(site, id, `Engine could not restart: ${session.reason}`))
        continue
      }
      const capture = await visitPage(session.browser, site.url)
      needsRestart = capture.stalled
      const result = judge(site, id, capture.visit, await thumbnail(options, runId, id, site, capture.screenshot))
      results.push(result)
      console.log(`  ${result.outcome.padEnd(10)} ${site.id} ${result.error ?? ''}`)
    }
  } finally {
    if (isSession(session)) await close(session)
  }
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
  const failures: string[] = []
  for (const id of options.engines) {
    const survey = await surveyEngine(id, sites, permitted, runId, options)
    if ('reason' in survey) {
      if (!survey.expected) failures.push(`${id}: ${survey.reason}`)
      continue
    }
    engines.push(survey.engine)
    results.push(...survey.results)
  }
  if (failures.length > 0) throw new Error(`Not saving a run with missing engines.\n${failures.join('\n')}`)
  if (engines.length === 0) throw new Error('No engine ran')
  await saveRun(options.dataDir, { id: runId, startedAt: startedAt.toISOString(), origin: options.origin, engines, sites, results })
  console.log(`Saved run ${runId}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
