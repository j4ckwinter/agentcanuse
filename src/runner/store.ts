import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'
import type { EngineId, Run, RunSummary } from '../core/model'

export const THUMBNAIL_WIDTH = 480

export interface RunIndex {
  runs: RunSummary[]
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 1) + '\n')
}

export async function saveThumbnail(dataDir: string, runId: string, engine: EngineId, site: string, png: Uint8Array): Promise<string> {
  const relative = `shots/${runId}/${engine}/${site}.webp`
  const path = join(dataDir, relative)
  await mkdir(dirname(path), { recursive: true })
  await sharp(png).resize({ width: THUMBNAIL_WIDTH }).webp({ quality: 70 }).toFile(path)
  return relative
}

export async function readIndex(dataDir: string): Promise<RunIndex> {
  try {
    return JSON.parse(await readFile(join(dataDir, 'index.json'), 'utf8')) as RunIndex
  } catch {
    return { runs: [] }
  }
}

export async function saveRun(dataDir: string, run: Run): Promise<void> {
  await writeJson(join(dataDir, 'runs', `${run.id}.json`), run)
  const index = await readIndex(dataDir)
  const summary: RunSummary = { id: run.id, startedAt: run.startedAt, engines: run.engines }
  const runs = [summary, ...index.runs.filter((entry) => entry.id !== run.id)].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  await writeJson(join(dataDir, 'index.json'), { runs })
}
