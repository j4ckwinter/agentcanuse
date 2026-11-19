import type { Result, Run } from './model'
import type { TreeSummary } from './tree'

type StoredResult = Omit<Result, 'tree'> & { tree?: TreeSummary | null }

export type StoredRun = Omit<Run, 'results'> & { results: StoredResult[] }

export function fromStored(stored: StoredRun): Run {
  return { ...stored, results: stored.results.map((result) => ({ ...result, tree: result.tree ?? null })) }
}
