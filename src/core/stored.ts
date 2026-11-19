import type { Result, Run } from './model'
import type { HiddenReads } from './hidden'
import type { TreeSummary } from './tree'

type StoredResult = Omit<Result, 'tree' | 'hidden'> & { tree?: TreeSummary | null; hidden?: HiddenReads | null }

export type StoredRun = Omit<Run, 'results'> & { results: StoredResult[] }

export function fromStored(stored: StoredRun): Run {
  return { ...stored, results: stored.results.map((result) => ({ ...result, tree: result.tree ?? null, hidden: result.hidden ?? null })) }
}
