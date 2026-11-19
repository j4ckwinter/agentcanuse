export const CONFIDENCE_Z = 1.96

export interface Interval {
  low: number
  high: number
}

export function wilsonInterval(successes: number, trials: number, z = CONFIDENCE_Z): Interval | null {
  if (trials === 0) return null
  const share = successes / trials
  const zz = z * z
  const centre = (share + zz / (2 * trials)) / (1 + zz / trials)
  const spread = (z / (1 + zz / trials)) * Math.sqrt((share * (1 - share)) / trials + zz / (4 * trials * trials))
  return { low: Math.max(0, centre - spread), high: Math.min(1, centre + spread) }
}

export function marginOfError(successes: number, trials: number): number | null {
  const interval = wilsonInterval(successes, trials)
  return interval === null ? null : (interval.high - interval.low) / 2
}
