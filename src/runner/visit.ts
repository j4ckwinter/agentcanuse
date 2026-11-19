import { setTimeout as delay } from 'node:timers/promises'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import type { Visit } from '../core/model'
import { NAVIGATION_TIMEOUT_MS, SETTLE_MS, VISIT_DEADLINE_MS } from './timing'

export const VIEWPORT = { width: 1280, height: 800 }

export interface Capture {
  visit: Visit
  screenshot: Uint8Array | null
  stalled: boolean
}

interface PageContent {
  title: string
  text: string
  linkCount: number
}

export function connect(endpoint: string): Promise<Browser> {
  return puppeteer.connect({ browserWSEndpoint: endpoint, defaultViewport: null, protocolTimeout: VISIT_DEADLINE_MS })
}

function messageOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error)
  return text.split('\n')[0].slice(0, 300)
}

async function readContent(page: Page): Promise<PageContent> {
  return page.evaluate(() => {
    const body = document.body
    const text = body === null ? '' : body.innerText || body.textContent || ''
    return { title: document.title, text, linkCount: document.links.length }
  })
}

async function screenshotOf(page: Page): Promise<Uint8Array | null> {
  try {
    return await page.screenshot({ type: 'png' })
  } catch {
    return null
  }
}

async function capture(page: Page, url: string): Promise<Capture> {
  const started = performance.now()
  try {
    await page.setViewport(VIEWPORT).catch(() => undefined)
    const response = await page.goto(url, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS })
    await delay(SETTLE_MS)
    const content = await readContent(page)
    const durationMs = Math.round(performance.now() - started)
    return {
      visit: { status: response?.status() ?? null, ...content, durationMs, error: null },
      screenshot: await screenshotOf(page),
      stalled: false,
    }
  } catch (error) {
    const durationMs = Math.round(performance.now() - started)
    return {
      visit: { status: null, title: '', text: '', linkCount: 0, durationMs, error: messageOf(error) },
      screenshot: null,
      stalled: false,
    }
  }
}

async function deadline(ms: number, signal: AbortSignal): Promise<Capture> {
  await delay(ms, undefined, { signal })
  return {
    visit: { status: null, title: '', text: '', linkCount: 0, durationMs: ms, error: `No answer within ${ms / 1000}s` },
    screenshot: null,
    stalled: true,
  }
}

export async function visitPage(browser: Browser, url: string): Promise<Capture> {
  let close: () => Promise<unknown> = async () => {}
  const timers = new AbortController()
  try {
    const context = await browser.createBrowserContext()
    close = () => context.close()
    const page = await context.newPage()
    return await Promise.race([capture(page, url), deadline(VISIT_DEADLINE_MS, timers.signal)])
  } catch (error) {
    return {
      visit: { status: null, title: '', text: '', linkCount: 0, durationMs: 0, error: messageOf(error) },
      screenshot: null,
      stalled: true,
    }
  } finally {
    timers.abort()
    await Promise.race([close().catch(() => undefined), delay(5_000)])
  }
}
