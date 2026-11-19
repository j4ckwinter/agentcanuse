import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'
import { sitesWhereEnginesDisagree } from '../core/agreement'
import { fromStored, type StoredRun } from '../core/stored'
import { summarise } from '../core/leaderboard'
import type { EngineId, Run, RunSummary } from '../core/model'

export const THUMBNAIL_WIDTH = 480
export const RUNS_WITH_SCREENSHOTS = 1

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

async function readRuns(dataDir: string): Promise<Run[]> {
  const directory = join(dataDir, 'runs')
  const files = (await readdir(directory).catch(() => [])).filter((name) => name.endsWith('.json'))
  const runs = await Promise.all(files.map(async (name) => fromStored(JSON.parse(await readFile(join(directory, name), 'utf8')) as StoredRun)))
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

async function dropScreenshots(dataDir: string, run: Run): Promise<void> {
  await rm(join(dataDir, 'shots', run.id), { recursive: true, force: true })
  if (run.results.every((result) => result.shot === null)) return
  const results = run.results.map((result) => ({ ...result, shot: null }))
  await writeJson(join(dataDir, 'runs', `${run.id}.json`), { ...run, results })
}

export async function tidyData(dataDir: string): Promise<RunSummary[]> {
  const runs = await readRuns(dataDir)
  for (const run of runs.slice(RUNS_WITH_SCREENSHOTS)) await dropScreenshots(dataDir, run)
  const summaries = runs.map(summarise)
  await writeJson(join(dataDir, 'index.json'), { runs: summaries })
  return summaries
}

async function keepScreenshotsWhereEnginesDisagree(dataDir: string, run: Run): Promise<Run> {
  const disagreeing = sitesWhereEnginesDisagree(run.results)
  const results = await Promise.all(
    run.results.map(async (result) => {
      if (result.shot === null || disagreeing.has(result.site)) return result
      await rm(join(dataDir, result.shot), { force: true })
      return { ...result, shot: null }
    }),
  )
  return { ...run, results }
}

export async function saveRun(dataDir: string, run: Run): Promise<void> {
  await writeJson(join(dataDir, 'runs', `${run.id}.json`), await keepScreenshotsWhereEnginesDisagree(dataDir, run))
  await tidyData(dataDir)
}
