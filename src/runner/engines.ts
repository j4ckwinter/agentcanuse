import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import type { EngineId } from '../core/model'
import type { Pins } from './config'
import { installChromium, installLightpanda, installObscura } from './install'

export interface RunningEngine {
  id: EngineId
  version: string
  endpoint: string
  headers: Record<string, string>
  hosted: boolean
  stop(): Promise<void>
}

export type Launch = { engine: RunningEngine } | { unavailable: string }

const STARTUP_ATTEMPTS = 60
const STARTUP_POLL_MS = 250
const HOST = '127.0.0.1'

interface Started {
  child: ChildProcess
  output: string[]
  failure: () => Error | null
}

function start(binary: string, args: string[], env: Record<string, string> = {}): Started {
  const child = spawn(binary, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
  const output: string[] = []
  const keep = (chunk: Buffer) => {
    output.push(chunk.toString())
    if (output.length > 40) output.shift()
  }
  child.stdout?.on('data', keep)
  child.stderr?.on('data', keep)
  let failed: Error | null = null
  child.once('error', (error) => {
    failed = error
  })
  return { child, output, failure: () => failed }
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))
  child.kill('SIGTERM')
  const finished = await Promise.race([exited.then(() => true), delay(5000).then(() => false)])
  if (finished) return
  child.kill('SIGKILL')
  await Promise.race([exited, delay(5000)])
}

async function debuggerUrl(port: number): Promise<string | null> {
  try {
    const response = await fetch(`http://${HOST}:${port}/json/version`)
    if (!response.ok) return null
    const body = (await response.json()) as { webSocketDebuggerUrl?: string }
    return body.webSocketDebuggerUrl ?? null
  } catch {
    return null
  }
}

async function waitForEndpoint({ child, output, failure }: Started, port: number, fallback: string): Promise<string> {
  for (let attempt = 0; attempt < STARTUP_ATTEMPTS; attempt += 1) {
    const failed = failure()
    if (failed !== null) throw new Error(`Engine could not start: ${failed.message}`)
    if (child.exitCode !== null) throw new Error(`Engine exited during startup: ${output.join('').slice(-500)}`)
    const url = await debuggerUrl(port)
    if (url !== null) return url
    const reachable = await fetch(`http://${HOST}:${port}/`).then(
      () => true,
      () => false,
    )
    if (reachable && attempt > 4) return fallback
    await delay(STARTUP_POLL_MS)
  }
  await stopProcess(child)
  throw new Error(`Engine did not open port ${port}: ${output.join('').slice(-500)}`)
}

async function serve(id: EngineId, version: string, started: Started, port: number, fallback: string): Promise<RunningEngine> {
  const endpoint = await waitForEndpoint(started, port, fallback)
  return { id, version, endpoint, headers: {}, hosted: false, stop: () => stopProcess(started.child) }
}

type Launcher = (cacheDir: string, version: string, port: number) => Promise<Launch>

const launchers: Record<EngineId, Launcher> = {
  async chromium(cacheDir, version, port) {
    const { binary, buildId } = await installChromium(cacheDir, version)
    const started = start(binary, [`--remote-debugging-port=${port}`, `--remote-debugging-address=${HOST}`, '--no-first-run', 'about:blank'])
    return { engine: await serve('chromium', buildId, started, port, `ws://${HOST}:${port}`) }
  },
  async lightpanda(cacheDir, version, port) {
    const binary = await installLightpanda(cacheDir, version)
    const started = start(binary, ['serve', '--host', HOST, '--port', String(port)], { LIGHTPANDA_DISABLE_TELEMETRY: 'true' })
    return { engine: await serve('lightpanda', version, started, port, `ws://${HOST}:${port}`) }
  },
  async obscura(cacheDir, version, port) {
    const binary = await installObscura(cacheDir, version)
    const started = start(binary, ['serve', '--port', String(port)])
    return { engine: await serve('obscura', version, started, port, `ws://${HOST}:${port}/devtools/browser`) }
  },
  async kitesurf() {
    return kitesurfLaunch(process.env)
  },
}

export function kitesurfLaunch(env: Record<string, string | undefined>): Launch {
  const endpoint = env.KITESURF_ENDPOINT
  if (endpoint === undefined || endpoint === '') {
    return { unavailable: 'KITESURF_ENDPOINT is not set; Kitesurf runs on Cloudflare, not on this machine' }
  }
  const token = env.KITESURF_TOKEN
  const headers: Record<string, string> = token === undefined || token === '' ? {} : { Authorization: `Bearer ${token}` }
  return { engine: { id: 'kitesurf', version: env.KITESURF_VERSION ?? 'deployed', endpoint, headers, hosted: true, stop: async () => {} } }
}

async function portAnswers(port: number): Promise<boolean> {
  return fetch(`http://${HOST}:${port}/`, { signal: AbortSignal.timeout(1000) }).then(
    () => true,
    () => false,
  )
}

export async function launchEngine(id: EngineId, pins: Pins, cacheDir: string, port: number): Promise<Launch> {
  if (id !== 'kitesurf' && (await portAnswers(port))) throw new Error(`Something is already listening on port ${port}`)
  return launchers[id](cacheDir, pins[id], port)
}

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const address = server.address()
      server.close(() => (typeof address === 'object' && address !== null ? resolve(address.port) : reject(new Error('No free port'))))
    })
  })
}
