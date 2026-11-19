export function displayHost(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}
