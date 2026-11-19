import { setTimeout as delay } from 'node:timers/promises'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import type { Visit } from '../core/model'
import type { TreeNode } from '../core/tree'
import { NAVIGATION_TIMEOUT_MS, SETTLE_MS, TREE_TIMEOUT_MS, VISIT_DEADLINE_MS } from './timing'

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

interface RawTreeNode {
  ignored?: boolean
  role?: { value?: unknown }
  name?: { value?: unknown }
}

async function readTree(page: Page): Promise<TreeNode[] | null> {
  const session = await page.createCDPSession().catch(() => null)
  if (session === null) return null
  try {
    const timeout = delay(TREE_TIMEOUT_MS).then(() => null)
    const tree = (await Promise.race([session.send('Accessibility.getFullAXTree'), timeout])) as { nodes: RawTreeNode[] } | null
    if (tree === null) return null
    return tree.nodes.map((node) => ({ role: String(node.role?.value ?? ''), name: String(node.name?.value ?? ''), ignored: node.ignored === true }))
  } catch {
    return null
  } finally {
    await session.detach().catch(() => undefined)
  }
}

const MAX_HIDDEN_CANDIDATES = 200

async function readHiddenText(page: Page): Promise<string[] | null> {
  try {
    return await page.evaluate((limit) => {
      const skipped = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'svg']
      const found: string[] = []
      const pending: Element[] = document.body === null ? [] : Array.from(document.body.children)
      while (pending.length > 0 && found.length < limit) {
        const element = pending.shift() as Element
        if (skipped.includes(element.tagName)) continue
        if (element.checkVisibility({ visibilityProperty: true })) {
          pending.push(...Array.from(element.children))
          continue
        }
        const text = element.textContent?.trim() ?? ''
        if (text !== '') found.push(text)
      }
      return found
    }, MAX_HIDDEN_CANDIDATES)
  } catch {
    return null
  }
}

async function screenshotOf(page: Page): Promise<Uint8Array | null> {
  try {
    return await page.screenshot({ type: 'png' })
  } catch {
    return null
  }
}

export interface VisitOptions {
  collectHidden: boolean
}

async function capture(page: Page, url: string, options: VisitOptions): Promise<Capture> {
  const started = performance.now()
  try {
    await page.setViewport(VIEWPORT).catch(() => undefined)
    const response = await page.goto(url, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS })
    await delay(SETTLE_MS)
    const content = await readContent(page)
    const durationMs = Math.round(performance.now() - started)
    return {
      visit: { status: response?.status() ?? null, ...content, durationMs, error: null, tree: await readTree(page), hiddenText: options.collectHidden ? await readHiddenText(page) : null },
      screenshot: await screenshotOf(page),
      stalled: false,
    }
  } catch (error) {
    const durationMs = Math.round(performance.now() - started)
    return {
      visit: { status: null, title: '', text: '', linkCount: 0, durationMs, error: messageOf(error), tree: null, hiddenText: null },
      screenshot: null,
      stalled: false,
    }
  }
}

async function deadline(ms: number, signal: AbortSignal): Promise<Capture> {
  await delay(ms, undefined, { signal })
  return {
    visit: { status: null, title: '', text: '', linkCount: 0, durationMs: ms, error: `No answer within ${ms / 1000}s`, tree: null, hiddenText: null },
    screenshot: null,
    stalled: true,
  }
}

export async function visitPage(browser: Browser, url: string, options: VisitOptions = { collectHidden: false }): Promise<Capture> {
  let close: () => Promise<unknown> = async () => {}
  const timers = new AbortController()
  try {
    const context = await browser.createBrowserContext()
    close = () => context.close()
    const page = await context.newPage()
    return await Promise.race([capture(page, url, options), deadline(VISIT_DEADLINE_MS, timers.signal)])
  } catch (error) {
    return {
      visit: { status: null, title: '', text: '', linkCount: 0, durationMs: 0, error: messageOf(error), tree: null, hiddenText: null },
      screenshot: null,
      stalled: true,
    }
  } finally {
    timers.abort()
    await Promise.race([close().catch(() => undefined), delay(5_000)])
  }
}
