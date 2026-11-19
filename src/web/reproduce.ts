import type { EngineId, Site } from '../core/model'
import { repository } from '../../package.json'

export const CLI_PACKAGE = `github:${new URL(repository.url).pathname.replace(/^\//, '')}`

function quoted(value: string): string {
  return /^[\w./:@-]+$/.test(value) ? value : `'${value.replaceAll("'", `'\\''`)}'`
}

export function reproduceCommand(site: Pick<Site, 'url' | 'expect'>, engine?: EngineId): string {
  const parts = ['npx', CLI_PACKAGE, 'check', quoted(site.url)]
  if (engine) parts.push('--engine', engine)
  for (const phrase of site.expect) parts.push('--expect', quoted(phrase))
  return parts.join(' ')
}
