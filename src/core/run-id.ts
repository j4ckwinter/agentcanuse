export function runIdAt(time: Date): string {
  return time.toISOString().slice(0, 16).replace(':', '-') + 'Z'
}
