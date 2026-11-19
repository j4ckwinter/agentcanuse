import { REFERENCE_ENGINE } from './agreement'
import type { EngineId, Result } from './model'

export interface HiddenReads {
  sampled: number
  read: number
}

export const HIDDEN_SAMPLE_SIZE = 20
export const MIN_HIDDEN_LENGTH = 24
export const HIDDEN_PROBE_LENGTH = 80
export const MIN_HIDDEN_SAMPLE = 5
export const READS_HIDDEN_SHARE = 0.5

function squash(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '')
}

function probesOf(text: string): string[] {
  const probes: string[] = []
  for (let start = 0; start < text.length; start += HIDDEN_PROBE_LENGTH) {
    const probe = text.slice(start, start + HIDDEN_PROBE_LENGTH)
    if (probe.length >= MIN_HIDDEN_LENGTH) probes.push(probe)
  }
  return probes
}

export function hiddenSample(candidates: string[], visibleText: string): string[] {
  const visible = squash(visibleText)
  const probes = [...new Set(candidates.flatMap((candidate) => probesOf(squash(candidate))).filter((probe) => !visible.includes(probe)))]
  if (probes.length <= HIDDEN_SAMPLE_SIZE) return probes
  return Array.from({ length: HIDDEN_SAMPLE_SIZE }, (_, index) => probes[Math.floor((index * probes.length) / HIDDEN_SAMPLE_SIZE)])
}

export function hiddenReads(sample: string[], text: string): HiddenReads | null {
  if (sample.length < MIN_HIDDEN_SAMPLE) return null
  const read = squash(text)
  return { sampled: sample.length, read: sample.filter((probe) => read.includes(probe)).length }
}

export function readsHidden(hidden: HiddenReads): boolean {
  return hidden.read / hidden.sampled >= READS_HIDDEN_SHARE
}

export interface HiddenEvidence {
  samples: Map<string, string[]>
  texts: Map<string, string>
}

export function textKey(site: string, engine: EngineId): string {
  return `${site}\u0000${engine}`
}

export function withHiddenReads(results: Result[], evidence: HiddenEvidence): Result[] {
  const referencePassed = new Set(results.filter((result) => result.engine === REFERENCE_ENGINE && result.outcome === 'passed').map((result) => result.site))
  return results.map((result) => {
    const judged = result.engine !== REFERENCE_ENGINE && result.outcome === 'passed' && referencePassed.has(result.site)
    const sample = evidence.samples.get(result.site)
    const text = evidence.texts.get(textKey(result.site, result.engine))
    return { ...result, hidden: judged && sample !== undefined && text !== undefined ? hiddenReads(sample, text) : null }
  })
}
