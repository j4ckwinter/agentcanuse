import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { BRAND_NAME, BRAND_TAGLINE, MARK_POINTER, MARK_POINTER_COLOR, MARK_RADIUS, MARK_TILE, MARK_TRAIL, MARK_TRAIL_WIDTH, MARK_VIEWBOX } from '../src/web/brand'

const PUBLIC = 'public'

function markBody(tile: string, radius = MARK_RADIUS): string {
  const trail = MARK_TRAIL.map(({ d, color }) => `<path d="${d}" stroke="${color}" stroke-width="${MARK_TRAIL_WIDTH}" stroke-linecap="round"/>`).join('')
  return `<rect width="${MARK_VIEWBOX}" height="${MARK_VIEWBOX}" rx="${radius}" fill="${tile}"/><path d="${MARK_POINTER}" fill="${MARK_POINTER_COLOR}"/>${trail}`
}

function adaptiveFavicon(): string {
  const trail = MARK_TRAIL.map(({ d, color }) => `<path d="${d}" stroke="${color}" stroke-width="${MARK_TRAIL_WIDTH}" stroke-linecap="round"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}"><style>.tile{fill:${MARK_TILE.light}}@media (prefers-color-scheme: dark){.tile{fill:${MARK_TILE.dark}}}</style><rect class="tile" width="${MARK_VIEWBOX}" height="${MARK_VIEWBOX}" rx="${MARK_RADIUS}"/><path d="${MARK_POINTER}" fill="${MARK_POINTER_COLOR}"/>${trail}</svg>\n`
}

function markSvg(size: number, tile: string, radius = MARK_RADIUS): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}">${markBody(tile, radius)}</svg>`)
}

function socialCard(): Buffer {
  const mark = `<g transform="translate(90 150) scale(4.5)">${markBody(MARK_TILE.light)}</g>`
  const CHIP_CHAR = 16.5
  const CHIP_PADDING = 80
  const CHIP_GAP = 20
  let x = 90
  const chips = [
    { color: '#3987e5', label: 'Chromium' },
    { color: '#eb6834', label: 'Lightpanda' },
    { color: '#1baf7a', label: 'Obscura' },
  ]
    .map(({ color, label }) => {
      const width = Math.round(label.length * CHIP_CHAR + CHIP_PADDING)
      const chip = `<rect x="${x}" y="430" width="${width}" height="60" rx="12" fill="#16171a" stroke="#26282d"/><circle cx="${x + 30}" cy="460" r="8" fill="${color}"/><text x="${x + 50}" y="470" font-size="28" fill="#ededed">${label}</text>`
      x += width + CHIP_GAP
      return chip
    })
    .join('')
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Geist, -apple-system, Helvetica Neue, Arial, sans-serif">
<rect width="1200" height="630" fill="#08090a"/>
<rect x="0.5" y="0.5" width="1199" height="629" fill="none" stroke="#26282d"/>
${mark}
<text x="260" y="232" font-size="92" font-weight="700" letter-spacing="-3" fill="#ededed">${BRAND_NAME}</text>
<text x="90" y="350" font-size="38" fill="#a1a1a1">${BRAND_TAGLINE}</text>
${chips}
<text x="90" y="575" font-size="26" fill="#7a7a7a">agentcanuse.com · real sites, every night</text>
</svg>`)
}

async function main(): Promise<void> {
  await writeFile(`${PUBLIC}/favicon.svg`, adaptiveFavicon())
  await sharp(markSvg(32, MARK_TILE.light)).resize(32, 32).png().toFile(`${PUBLIC}/favicon-32.png`)
  await sharp(markSvg(180, MARK_TILE.light, 0)).resize(180, 180).png().toFile(`${PUBLIC}/apple-touch-icon.png`)
  for (const size of [192, 512]) await sharp(markSvg(size, MARK_TILE.light)).resize(size, size).png().toFile(`${PUBLIC}/icon-${size}.png`)
  await sharp(socialCard()).png().toFile(`${PUBLIC}/og.png`)
  console.log('Wrote favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png and og.png')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
