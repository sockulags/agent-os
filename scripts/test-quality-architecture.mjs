// Optional integration smoke: node scripts/test-quality-architecture.mjs /absolute/path/to/dependency-cruise.mjs
// Install dependency-cruiser 18.2.0 separately; ordinary npm test is offline and dependency-free.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { begin, check, hook } from '../skills/quality-ratchet/scripts/quality-delta.mjs'

const tool = process.argv[2]
if (!tool || !path.isAbsolute(tool) || !fs.existsSync(tool)) {
  throw new Error('Provide the absolute installed dependency-cruise.mjs path')
}
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-architecture-'))
const options = { detect: () => ({}) }
try {
  execFileSync('git', ['init', '-q', root])
  for (const dir of ['.agent-os', 'src/domain', 'src/ui']) fs.mkdirSync(path.join(root, dir), { recursive: true })
  fs.writeFileSync(path.join(root, '.agent-os/quality.json'), JSON.stringify({
    schema: 1, protectedFiles: ['.dependency-cruiser.cjs'], checks: [{
      id: 'architecture', command: ['node', tool, '--config', '.dependency-cruiser.cjs', 'src'], required: true
    }]
  }))
  fs.writeFileSync(path.join(root, '.dependency-cruiser.cjs'), `module.exports = {
    forbidden: [{ name: 'domain-does-not-import-ui', severity: 'error',
      from: { path: '^src/domain/' }, to: { path: '^src/ui/' } }],
    options: { doNotFollow: { path: 'node_modules' } }
  }`)
  fs.writeFileSync(path.join(root, 'src/ui/view.ts'), 'export const view: string = "view"\n')
  const source = path.join(root, 'src/domain/model.ts')
  fs.writeFileSync(source, 'export const model: string = "model"\n')
  begin(root, options)
  const clean = check(root, options)
  assert.equal(clean.status, 'ok', JSON.stringify(clean.controls))
  fs.writeFileSync(source, 'import { view } from "../ui/view"\nexport const model = view\n')
  const broken = check(root, options)
  assert.equal(broken.status, 'blocked', JSON.stringify(broken.controls))
  assert.match(broken.controls.results[0].output, /domain-does-not-import-ui/)
  assert.equal(hook(root).decision, 'block')
  fs.writeFileSync(source, 'export const model: string = "restored"\n')
  assert.equal(check(root, options).status, 'ok')
  assert.deepEqual(hook(root), {})
  console.log('dependency-cruiser: clean passes; forbidden TypeScript import blocks; restored candidate passes')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
