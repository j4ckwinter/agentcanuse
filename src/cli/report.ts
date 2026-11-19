import type { EngineId, Result } from '../core/model'
import type { Verdict } from '../core/verdict'
import { judgedTree } from '../core/tree'
import { displayHost } from '../web/host'
import { treeLabel, VERDICT_LABELS } from '../web/labels'

export interface CheckedEngine {
  engine: EngineId
  version: string
  result: Result
}

function detail(result: Result): string {
  if (result.error !== null) return result.error
  if (result.missing.length > 0) return `missing ${result.missing.map((phrase) => `"${phrase}"`).join(', ')}`
  return `${result.textLength.toLocaleString('en-GB')} characters read`
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + ' '.repeat(width - text.length)
}

export function formatReport(url: string, checked: CheckedEngine[], skipped: { engine: EngineId; reason: string }[], verdict: Verdict): string {
  const rows = checked.map(({ engine, version, result }) => [engine, version, result.outcome, result.status === null ? '–' : String(result.status), `${(result.durationMs / 1000).toFixed(1)}s`, treeLabel(judgedTree(result)).toLowerCase(), detail(result)])
  const header = ['engine', 'version', 'outcome', 'status', 'time', 'tree', 'detail']
  const widths = header.map((title, column) => Math.max(title.length, ...rows.map((row) => row[column].length)))
  const line = (cells: string[]) => cells.map((cell, column) => (column === cells.length - 1 ? cell : pad(cell, widths[column]))).join('  ').trimEnd()
  return [
    url,
    '',
    line(header),
    ...rows.map(line),
    ...skipped.map(({ engine, reason }) => `${engine}: not run (${reason})`),
    '',
    `${VERDICT_LABELS[verdict].label}. ${VERDICT_LABELS[verdict].sentence(displayHost(url))}`,
  ].join('\n')
}
