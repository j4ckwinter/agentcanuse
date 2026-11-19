import type { EngineId } from '../../core/model'
import { ENGINE_COLORS } from '@/labels'
import { cn } from '@/lib/utils'

export function EngineDot({ engine, className }: { engine: EngineId; className?: string }) {
  return <span className={cn('size-2 shrink-0 rounded-full', className)} style={{ backgroundColor: ENGINE_COLORS[engine] }} aria-hidden="true" />
}
