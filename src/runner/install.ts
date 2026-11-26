import { execFile } from 'node:child_process'
import { access, chmod, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { Browser, detectBrowserPlatform, install, resolveBuildId } from '@puppeteer/browsers'
import { RELEASE_REPOS } from '../core/releases'

const run = promisify(execFile)

function releasePlatform(): { arch: string; os: string } {
  const arch = { arm64: 'aarch64', x64: 'x86_64' }[process.arch as string]
  const os = { darwin: 'macos', linux: 'linux' }[process.platform as string]
  if (arch === undefined || os === undefined) throw new Error(`No engine builds for ${process.platform}/${process.arch}`)
  return { arch, os }
}

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  )
}

async function download(url: string, destination: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`)
  await writeFile(destination, new Uint8Array(await response.arrayBuffer()))
}

async function findFile(directory: string, name: string): Promise<string> {
  for (const entry of await readdir(directory, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name === name) return join(entry.parentPath, entry.name)
  }
  throw new Error(`No ${name} binary under ${directory}`)
}

export async function installLightpanda(cacheDir: string, version: string): Promise<string> {
  const { arch, os } = releasePlatform()
  const directory = join(cacheDir, 'lightpanda', version)
  const binary = join(directory, 'lightpanda')
  if (await exists(binary)) return binary
  await mkdir(directory, { recursive: true })
  await download(`https://github.com/${RELEASE_REPOS.lightpanda}/releases/download/${version}/lightpanda-${arch}-${os}`, binary)
  await chmod(binary, 0o755)
  return binary
}

export async function installObscura(cacheDir: string, version: string): Promise<string> {
  const { arch, os } = releasePlatform()
  const directory = join(cacheDir, 'obscura', version)
  if (await exists(directory)) return findFile(directory, 'obscura')
  await mkdir(directory, { recursive: true })
  const archive = join(directory, 'obscura.tar.gz')
  try {
    await download(`https://github.com/${RELEASE_REPOS.obscura}/releases/download/${version}/obscura-${arch}-${os}.tar.gz`, archive)
    await run('tar', ['-xzf', archive, '-C', directory])
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
  await rm(archive)
  const binary = await findFile(directory, 'obscura')
  await chmod(binary, 0o755)
  return binary
}

export async function installMoli(cacheDir: string, version: string): Promise<string> {
  const { arch, os } = releasePlatform()
  const target = { macos: 'apple-darwin', linux: 'unknown-linux-gnu' }[os]
  const directory = join(cacheDir, 'moli', version)
  if (await exists(directory)) return findFile(directory, 'moli')
  await mkdir(directory, { recursive: true })
  const archive = join(directory, 'moli.tar.gz')
  try {
    await download(`https://github.com/${RELEASE_REPOS.moli}/releases/download/${version}/moli-${arch}-${target}.tar.gz`, archive)
    await run('tar', ['-xzf', archive, '-C', directory])
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
  await rm(archive)
  const binary = await findFile(directory, 'moli')
  await chmod(binary, 0o755)
  return binary
}

export async function installChromium(cacheDir: string, version: string): Promise<{ binary: string; buildId: string }> {
  const platform = detectBrowserPlatform()
  if (platform === undefined) throw new Error(`No Chromium builds for ${process.platform}/${process.arch}`)
  const buildId = await resolveBuildId(Browser.CHROMEHEADLESSSHELL, platform, version)
  const installed = await install({ browser: Browser.CHROMEHEADLESSSHELL, buildId, cacheDir: join(cacheDir, 'chromium') })
  return { binary: installed.executablePath, buildId }
}
