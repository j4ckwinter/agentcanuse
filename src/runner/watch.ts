import { appendFile } from 'node:fs/promises'
import { pinUpdates, RELEASE_REPOS } from '../core/releases'
import { ENGINE_IDS, type EngineId } from '../core/model'
import { loadPins, savePins } from './config'

const PINS_PATH = 'engines.json'

async function latestRelease(repo: string): Promise<string | undefined> {
  const headers: Record<string, string> = { accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers, signal: AbortSignal.timeout(15_000) })
  if (!response.ok) {
    console.log(`${repo}: no latest release (${response.status})`)
    return undefined
  }
  return ((await response.json()) as { tag_name: string }).tag_name
}

async function main(): Promise<void> {
  const pins = await loadPins(PINS_PATH)
  const latest: Partial<Record<EngineId, string>> = {}
  for (const engine of ENGINE_IDS) {
    const repo = RELEASE_REPOS[engine]
    if (repo !== null) latest[engine] = await latestRelease(repo)
  }
  const updates = pinUpdates(pins, latest)
  for (const update of updates) {
    pins[update.engine] = update.to
    console.log(`${update.engine}: ${update.from} -> ${update.to}`)
  }
  if (updates.length > 0) await savePins(PINS_PATH, pins)
  else console.log('Every pinned engine is on its latest release')
  if (process.env.GITHUB_OUTPUT) {
    const summary = updates.map((update) => `${update.engine} ${update.to}`).join(', ')
    await appendFile(process.env.GITHUB_OUTPUT, `bumped=${updates.length > 0}\nsummary=${summary}\n`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
