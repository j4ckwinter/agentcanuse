import { ArrowUpRight } from 'lucide-react'
import { leaderboard, trend } from '../../core/leaderboard'
import type { Run, RunSummary } from '../../core/model'
import { Section } from '@/components/section'
import { Tile } from '@/components/tile'
import { ENGINE_INFO, percent, seconds } from '@/labels'
import { routeHash } from '@/route'
import { Sparkline } from '@/views/sparkline'

export function EngineList({ run, runs, runParam }: { run: Run; runs: RunSummary[]; runParam: string | null }) {
  const current = runs.find((summary) => summary.id === run.id)
  return (
    <Section id="engines" title="Engines">
      <ul className="flex flex-col gap-2">
        {leaderboard(run).map((standing, rank) => {
          const info = ENGINE_INFO[standing.engine.id]
          const points = current ? trend(runs, current, standing.engine.id) : []
          return (
            <li key={standing.engine.id}>
              <a
                href={routeHash({ view: 'engine', run: runParam, engine: standing.engine.id })}
                className="group/engine -mx-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-raised"
              >
                <Tile text={info.name[0]} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-sm">
                    {info.name}
                    <span className="font-mono text-[12px] text-fg-muted">{standing.engine.version}</span>
                    {rank === 0 && <span className="text-[12px] text-fg-muted">· most passed</span>}
                    <ArrowUpRight className="size-3.5 -translate-x-1 text-fg-muted opacity-0 transition duration-200 group-hover/engine:translate-x-0 group-hover/engine:opacity-100 motion-reduce:transition-none" />
                  </span>
                  <span className="text-[13px] text-fg-secondary">{info.about}</span>
                  <span className="text-[12px] text-fg-muted tabular-nums">
                    {percent(standing.blockedRate)} blocked · {seconds(standing.medianMs)} median
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-medium tabular-nums">{percent(standing.passRate)}</span>
                  {points.length >= 2 ? <Sparkline points={points} /> : <span className="text-[12px] text-fg-muted">passed</span>}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
