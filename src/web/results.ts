import type { EngineId, Result, Run } from '../core/model'

export function resultFor(run: Run, site: string, engine: EngineId): Result | undefined {
  return run.results.find((result) => result.site === site && result.engine === engine)
}
