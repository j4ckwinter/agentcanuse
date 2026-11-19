import type { Run, RunSummary } from '../core/model'

const runs = new Map<string, Promise<Run>>()

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`)
  return (await response.json()) as T
}

export async function loadIndex(): Promise<RunSummary[]> {
  const index = await getJson<{ runs: RunSummary[] }>('data/index.json')
  return index.runs
}

export function loadRun(id: string): Promise<Run> {
  let run = runs.get(id)
  if (run === undefined) {
    run = getJson<Run>(`data/runs/${id}.json`)
    runs.set(id, run)
  }
  return run
}

export function shotUrl(path: string): string {
  return `data/${path}`
}
