import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { browserCandidates, findBrowser, main, parseArgs, RenderError, resolveTarget } from './render-sketch.mjs'

const browser = findBrowser()
const needsBrowser = { skip: browser ? false : 'no Chrome or Edge on this machine' }

function workspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-sketch-')))
}

async function run(argv) {
  let text = ''
  const code = await main(argv, { write(chunk) { text += chunk } })
  return { code, text }
}

function pngSize(file) {
  const bytes = fs.readFileSync(file)
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

test('arguments need a target and an output folder, and widths must be whole numbers', () => {
  assert.deepEqual(parseArgs(['a.html', '--out', 'x', '--widths', '390,1280']).widths, [390, 1280])
  assert.throws(() => parseArgs(['a.html']), RenderError)
  assert.throws(() => parseArgs(['a.html', '--out', 'x', '--widths', '390,wide']), /positive whole numbers/)
  assert.throws(() => parseArgs(['a.html', '--out', 'x', '--bogus', '1']), /Unknown option/)
})

test('only local files and local addresses are opened', () => {
  assert.equal(resolveTarget('http://localhost:6006/iframe.html'), 'http://localhost:6006/iframe.html')
  assert.throws(() => resolveTarget('https://example.com/'), /Only local addresses/)
  assert.throws(() => resolveTarget(path.join(os.tmpdir(), 'agent-os-no-such-sketch.html')), /No such file/)
})

test('browser candidates follow the platform', () => {
  assert.ok(browserCandidates('win32', { ProgramFiles: 'C:\\PF' }).includes('C:\\PF\\Google\\Chrome\\Application\\chrome.exe'))
  assert.ok(browserCandidates('darwin', {}).some((candidate) => candidate.includes('Microsoft Edge.app')))
  assert.ok(browserCandidates('linux', { PATH: '/usr/bin' }).includes('/usr/bin/chromium'))
  assert.equal(findBrowser([path.join(os.tmpdir(), 'agent-os-no-such-browser')]), null)
})

test('a missing browser cannot render and says so', async () => {
  const dir = workspace()
  fs.writeFileSync(path.join(dir, 'a.html'), '<p>x</p>')
  const { code, text } = await run([path.join(dir, 'a.html'), '--out', dir, '--browser', path.join(dir, 'no-browser.exe')])
  assert.equal(code, 2, text)
  assert.match(text, /CANNOT RENDER/)
})

test('a clean sketch renders the full page at each width', needsBrowser, async () => {
  const dir = workspace()
  fs.writeFileSync(path.join(dir, 'tall.html'), '<!doctype html><body style="margin:0"><div style="height:2000px">x</div>')
  const { code, text } = await run([path.join(dir, 'tall.html'), '--out', path.join(dir, 'out'), '--widths', '390,1280'])
  assert.equal(code, 0, text)
  assert.deepEqual(pngSize(path.join(dir, 'out', 'tall-390.png')), { width: 390, height: 2000 })
  assert.deepEqual(pngSize(path.join(dir, 'out', 'tall-1280.png')), { width: 1280, height: 2000 })
})

test('console errors, uncaught exceptions, and overflow are reported', needsBrowser, async () => {
  const dir = workspace()
  fs.writeFileSync(path.join(dir, 'bad.html'), '<!doctype html><body style="margin:0"><div style="width:800px">x</div><script>console.error("boom"); missingFunction()</script>')
  const { code, text } = await run([path.join(dir, 'bad.html'), '--out', dir, '--widths', '390'])
  assert.equal(code, 1, text)
  assert.match(text, /ERROR 390: boom/)
  assert.match(text, /ERROR 390: ReferenceError: missingFunction is not defined/)
  assert.match(text, /WARN 390: the content is 800 px wide/)
  assert.equal(pngSize(path.join(dir, 'bad-390.png')).width, 800)
})
