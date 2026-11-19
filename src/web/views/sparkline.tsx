import type { TrendPoint } from '../../core/leaderboard'
import { percent } from '@/labels'

const WIDTH = 72
const HEIGHT = 22
const PADDING = 2

export function Sparkline({ points, color = 'currentColor' }: { points: TrendPoint[]; color?: string }) {
  if (points.length < 2) {
    return (
      <span className="text-xs text-fg-muted" title="A trend appears after two comparable runs">
        –
      </span>
    )
  }
  const rates = points.map((point) => point.passRate)
  const low = Math.min(...rates) - 0.02
  const high = Math.max(...rates) + 0.02
  const x = (index: number) => PADDING + (index / (points.length - 1)) * (WIDTH - PADDING * 2)
  const y = (rate: number) => HEIGHT - PADDING - ((rate - low) / (high - low)) * (HEIGHT - PADDING * 2)
  const path = points.map((point, index) => `${x(index)},${y(point.passRate)}`).join(' ')
  const last = points[points.length - 1]
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      role="img"
      aria-label={`Pass rate over ${points.length} runs, from ${percent(points[0].passRate)} to ${percent(last.passRate)}`}
      className="inline-block align-middle"
      style={{ color }}
    >
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.passRate)} r="2" fill="currentColor" />
    </svg>
  )
}
