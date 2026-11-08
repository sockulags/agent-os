#!/usr/bin/env node
// Renders a sketch to one PNG per width with a Chrome or Edge already on the machine, and reports the
// page's errors. It speaks the DevTools protocol over --remote-debugging-pipe, so it has no dependency.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DEFAULT_WIDTHS = [390, 768, 1280]
const VIEWPORT_HEIGHT = 900
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const USAGE = 'Usage: render-sketch <file or local URL> --out <dir> [--widths 390,768,1280] [--name <name>] [--browser <path>]'

export class RenderError extends Error {}

export function parseArgs(argv) {
  const options = { widths: DEFAULT_WIDTHS }
  const positional = []
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) {
      positional.push(argument)
      continue
    }
    const key = argument.slice(2)
    if (!['out', 'widths', 'name', 'browser'].includes(key)) throw new RenderError(`Unknown option ${argument}. ${USAGE}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new RenderError(`${argument} needs a value. ${USAGE}`)
    index += 1
    options[key] = key === 'widths' ? value.split(',').map(Number) : value
  }
  if (positional.length !== 1 || !options.out) throw new RenderError(USAGE)
  if (!options.widths.length || !options.widths.every((width) => Number.isInteger(width) && width > 0)) {
    throw new RenderError('--widths must be positive whole numbers separated by commas.')
  }
  return { ...options, target: positional[0] }
}

// A sketch is a local file or a local workshop. Anything else is not this script's to open.
export function resolveTarget(target) {
  if (/^https?:\/\//i.test(target)) {
    if (!LOCAL_HOSTS.has(new URL(target).hostname)) throw new RenderError(`Only local addresses are rendered, not ${target}.`)
    return target
  }
  const file = path.resolve(target)
  if (!fs.existsSync(file)) throw new RenderError(`No such file: ${file}`)
  return pathToFileURL(file).href
}

export function browserCandidates(platform = process.platform, env = process.env) {
  if (platform === 'win32') {
    const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter(Boolean)
    return roots.flatMap((root) => [
      path.win32.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.win32.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    ])
  }
  if (platform === 'darwin') {
    return ['Google Chrome', 'Microsoft Edge', 'Chromium'].map((app) => `/Applications/${app}.app/Contents/MacOS/${app}`)
  }
  const names = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']
  return (env.PATH ?? '').split(':').filter(Boolean).flatMap((dir) => names.map((name) => path.posix.join(dir, name)))
}

export function findBrowser(candidates = browserCandidates()) {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

function withTimeout(promise, ms, message) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new RenderError(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function connect(child) {
  const [input, output] = [child.stdio[3], child.stdio[4]]
  const pending = new Map()
  const listeners = new Set()
  let buffer = Buffer.alloc(0)
  let nextId = 1

  const failAll = (message) => {
    for (const { reject } of pending.values()) reject(new RenderError(message))
    pending.clear()
  }
  input.on('error', () => failAll('The browser closed its connection.'))
  child.on('error', (error) => failAll(`The browser could not start: ${error.message}`))
  child.on('exit', () => failAll('The browser exited before rendering finished.'))
  output.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk])
    for (let end = buffer.indexOf(0); end >= 0; end = buffer.indexOf(0)) {
      const message = JSON.parse(buffer.subarray(0, end).toString('utf8'))
      buffer = buffer.subarray(end + 1)
      const call = pending.get(message.id)
      if (!call) {
        for (const listener of listeners) listener(message)
      } else {
        pending.delete(message.id)
        if (message.error) call.reject(new RenderError(`${call.method}: ${message.error.message}`))
        else call.resolve(message.result)
      }
    }
  })

  return {
    listeners,
    send(method, params = {}, sessionId) {
      return new Promise((resolve, reject) => {
        const id = nextId
        nextId += 1
        pending.set(id, { resolve, reject, method })
        input.write(`${JSON.stringify({ id, method, params, sessionId })}\0`)
      })
    }
  }
}

function pageError({ method, params }) {
  if (method === 'Runtime.exceptionThrown') {
    const details = params.exceptionDetails
    return details.exception?.description ?? details.text
  }
  if (method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(params.type)) {
    return params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ')
  }
  if (method === 'Log.entryAdded' && params.entry.level === 'error' && !params.entry.url?.endsWith('/favicon.ico')) {
    return params.entry.url ? `${params.entry.text} (${params.entry.url})` : params.entry.text
  }
  return null
}

async function renderWidth(pipe, sessionId, url, width, file, timeoutMs) {
  const send = (method, params) => pipe.send(method, params, sessionId)
  const errors = []
  let loaded
  const load = new Promise((resolve) => {
    loaded = resolve
  })
  const listener = (message) => {
    if (message.sessionId !== sessionId) return
    if (message.method === 'Page.loadEventFired') loaded()
    const error = pageError(message)
    if (error) errors.push(error)
  }
  pipe.listeners.add(listener)
  try {
    await send('Emulation.setDeviceMetricsOverride', { width, height: VIEWPORT_HEIGHT, deviceScaleFactor: 1, mobile: false })
    const navigation = await send('Page.navigate', { url })
    if (navigation.errorText) throw new RenderError(`Could not open ${url}: ${navigation.errorText}`)
    await withTimeout(load, timeoutMs, `${url} did not finish loading within ${timeoutMs} ms.`)
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true })
    await delay(150)
    const { cssContentSize: size } = await send('Page.getLayoutMetrics')
    const height = Math.max(1, Math.ceil(size.height))
    // Side-by-side alternatives can be wider than the width under test, and must not be cut off.
    const contentWidth = Math.max(width, Math.ceil(size.width))
    const { data } = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: contentWidth, height, scale: 1 }
    })
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
    return { width, height, file, errors, contentWidth }
  } finally {
    pipe.listeners.delete(listener)
  }
}

export async function renderSketch({ target, out, widths = DEFAULT_WIDTHS, name, browser, timeoutMs = 30000 }) {
  const url = resolveTarget(target)
  const executable = browser ?? findBrowser()
  if (!executable) throw new RenderError('No Chrome or Edge was found. Pass one with --browser <path>.')
  const stem = name ?? (url.startsWith('file:') ? path.parse(target).name : 'sketch')
  fs.mkdirSync(out, { recursive: true })
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-render-'))
  const flags = [
    '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    // Chrome refuses to start as root with its sandbox on, which is how many CI containers run.
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])
  ]
  const child = spawn(executable, [...flags, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })
  const exited = new Promise((resolve) => {
    child.once('exit', resolve)
    child.once('error', resolve)
  })
  const pipe = connect(child)
  try {
    const { targetId } = await withTimeout(pipe.send('Target.createTarget', { url: 'about:blank' }), timeoutMs, 'The browser did not respond.')
    const { sessionId } = await pipe.send('Target.attachToTarget', { targetId, flatten: true })
    for (const domain of ['Page', 'Runtime', 'Log']) await pipe.send(`${domain}.enable`, {}, sessionId)
    const results = []
    for (const width of widths) {
      results.push(await renderWidth(pipe, sessionId, url, width, path.join(out, `${stem}-${width}.png`), timeoutMs))
    }
    return results
  } finally {
    await withTimeout(pipe.send('Browser.close'), 3000, 'close').catch(() => {})
    await withTimeout(exited, 3000, 'exit').catch(() => child.kill())
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    } catch {
      // A leftover profile in the temp directory does not affect the result.
    }
  }
}

// Exit 0: rendered with no page errors. Exit 1: rendered, with page errors. Exit 2: could not render.
export async function main(argv, output = process.stdout) {
  try {
    const results = await renderSketch(parseArgs(argv))
    for (const { width, height, file, errors, contentWidth } of results) {
      output.write(`RENDERED ${width}x${height} ${file}\n`)
      if (contentWidth > width) output.write(`WARN ${width}: the content is ${contentWidth} px wide and overflows this width\n`)
      for (const error of errors) output.write(`ERROR ${width}: ${error}\n`)
    }
    return results.some((result) => result.errors.length > 0) ? 1 : 0
  } catch (error) {
    if (!(error instanceof RenderError)) throw error
    output.write(`CANNOT RENDER: ${error.message}\n`)
    return 2
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2))
}
