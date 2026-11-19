import robotsParser from 'robots-parser'

export const USER_AGENT = 'agentcanuse/0.1 (browser engine compatibility survey)'
export const ROBOTS_AGENT = 'agentcanuse'
const ATTEMPTS = 2
const NO_ROBOTS_FILE: readonly number[] = [404, 410]

async function fetchRobots(robotsUrl: string): Promise<Response> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fetch(robotsUrl, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) })
    } catch (error) {
      if (attempt >= ATTEMPTS) throw error
    }
  }
}

export async function robotsAllows(url: string): Promise<boolean> {
  const robotsUrl = new URL('/robots.txt', url).toString()
  try {
    const response = await fetchRobots(robotsUrl)
    if (NO_ROBOTS_FILE.includes(response.status)) return true
    if (!response.ok) return false
    return robotsParser(robotsUrl, await response.text()).isAllowed(url, ROBOTS_AGENT) !== false
  } catch {
    return false
  }
}
