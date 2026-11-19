import { useState } from 'react'
import { leaderboard } from '../../core/leaderboard'
import type { EngineId, Run } from '../../core/model'
import { Card } from '@/components/card'
import { ENGINE_COLORS, ENGINE_INFO, percent, seconds } from '@/labels'

const WIDTH = 560
const HEIGHT = 260
const MARGIN = { top: 16, right: 24, bottom: 36, left: 44 }
const Y_STEP = 0.05
const LABEL_GAP = 14

interface Point {
  engine: EngineId
  ms: number
  rate: number
}

function niceCeiling(ms: number): number {
  return Math.max(1000, Math.ceil((ms * 1.2) / 1000) * 1000)
}

export function SpeedChart({ run }: { run: Run }) {
  const [hovered, setHovered] = useState<EngineId | null>(null)
  const points: Point[] = leaderboard(run).flatMap((standing) => (standing.medianMs === null ? [] : [{ engine: standing.engine.id, ms: standing.medianMs, rate: standing.passRate }]))
  if (points.length === 0) return null
  const xMax = niceCeiling(Math.max(...points.map((point) => point.ms)))
  const yMin = Math.max(0, Math.floor((Math.min(...points.map((point) => point.rate)) - Y_STEP) / Y_STEP) * Y_STEP)
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const x = (ms: number) => MARGIN.left + (ms / xMax) * plotWidth
  const y = (rate: number) => MARGIN.top + (1 - (rate - yMin) / (1 - yMin)) * plotHeight
  const yTicks = Array.from({ length: Math.round((1 - yMin) / Y_STEP) + 1 }, (_, index) => yMin + index * Y_STEP)
  const xTicks = Array.from({ length: xMax / 1000 + 1 }, (_, index) => index * 1000)
  const active = points.find((point) => point.engine === hovered)
  const labelY = new Map<EngineId, number>()
  for (const point of [...points].sort((a, b) => y(a.rate) - y(b.rate))) {
    const near = [...labelY.entries()].filter(([engine]) => Math.abs(x(points.find((other) => other.engine === engine)!.ms) - x(point.ms)) < 120)
    const lowest = Math.max(-Infinity, ...near.map(([, at]) => at))
    labelY.set(point.engine, Math.max(y(point.rate), lowest + LABEL_GAP))
  }

  return (
    <Card title="Speed and pass rate" description="Median time per page against the share of sites passed. Up and to the left is better.">
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Median time per page against pass rate, one point per engine">
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} stroke="var(--palette-line)" strokeWidth="1" />
              <text x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--palette-fg-muted)">
                {percent(tick)}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <text key={tick} x={x(tick)} y={HEIGHT - MARGIN.bottom + 18} textAnchor="middle" fontSize="11" fill="var(--palette-fg-muted)">
              {seconds(tick)}
            </text>
          ))}
          <text x={WIDTH - MARGIN.right} y={HEIGHT - 4} textAnchor="end" fontSize="11" fill="var(--palette-fg-muted)">
            median time per page
          </text>
          {points.map((point) => (
            <g
              key={point.engine}
              tabIndex={0}
              role="button"
              aria-label={`${ENGINE_INFO[point.engine].name}: ${percent(point.rate)} passed, ${seconds(point.ms)} median`}
              onMouseEnter={() => setHovered(point.engine)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(point.engine)}
              onBlur={() => setHovered(null)}
              className="cursor-default outline-none"
            >
              <circle cx={x(point.ms)} cy={y(point.rate)} r="16" fill="transparent" />
              <circle cx={x(point.ms)} cy={y(point.rate)} r={hovered === point.engine ? 8 : 6.5} fill={ENGINE_COLORS[point.engine]} stroke="var(--palette-surface)" strokeWidth="2" />
              <text x={x(point.ms) + 12} y={labelY.get(point.engine) ?? y(point.rate)} dy="0.32em" fontSize="12" fill="var(--palette-fg-secondary)">
                {ENGINE_INFO[point.engine].name}
              </text>
            </g>
          ))}
        </svg>
        {active && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow-lg"
            style={{ left: `${(x(active.ms) / WIDTH) * 100}%`, top: `calc(${(y(active.rate) / HEIGHT) * 100}% - 12px)` }}
          >
            <span className="font-medium">{ENGINE_INFO[active.engine].name}</span>
            <span className="text-fg-secondary">
              {' '}
              · {percent(active.rate)} passed · {seconds(active.ms)}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
