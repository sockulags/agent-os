#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validate } from './validate-agent-os.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoots = []

function fixture() {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-validator-'))
  temporaryRoots.push(target)
  for (const item of [
    '.agents', '.claude-plugin', '.codex-plugin', '.github', 'cli', 'docs-site', 'evals', 'scripts',
    'skills', 'AGENTS.md', 'CLAUDE.md', 'README.md', 'package.json', 'policy.md'
  ]) {
    fs.cpSync(path.join(root, item), path.join(target, item), {
      recursive: true,
      filter: (source) => ![
        `${path.sep}node_modules${path.sep}`,
        `${path.sep}.vitepress${path.sep}cache${path.sep}`,
        `${path.sep}.vitepress${path.sep}dist${path.sep}`,
        `${path.sep}evals${path.sep}runs${path.sep}`
      ].some((segment) => `${source}${path.sep}`.includes(segment))
    })
  }
  return target
}

function rewrite(file, transform) {
  fs.writeFileSync(file, transform(fs.readFileSync(file, 'utf8')))
}

function expectFailure(name, mutate, expectedCode) {
  const target = fixture()
  mutate(target)
  const codes = validate(target).map((diagnostic) => diagnostic.code)
  assert(codes.includes(expectedCode), `${name}: expected ${expectedCode}, got ${codes.join(', ')}`)
  console.log(`PASS red case: ${name} -> ${expectedCode}`)
}

try {
  assert.deepEqual(validate(root), [], 'repository baseline must pass before red cases')
  console.log('PASS baseline')

  expectFailure('frontmatter name mismatch', (target) => {
    rewrite(path.join(target, 'skills/scope-guard/SKILL.md'), (text) => text.replace('name: scope-guard', 'name: wrong-name'))
  }, 'SKILL_NAME')

  expectFailure('missing Codex manual gate', (target) => {
    fs.rmSync(path.join(target, 'skills/shape-work/agents/openai.yaml'))
  }, 'SKILL_MANUAL_GATE')

  expectFailure('overridden Codex manual gate', (target) => {
    fs.appendFileSync(path.join(target, 'skills/shape-work/agents/openai.yaml'), '\nallow_implicit_invocation: true\n')
  }, 'SKILL_MANUAL_GATE')

  expectFailure('manifest version mismatch', (target) => {
    const file = path.join(target, '.codex-plugin/plugin.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    manifest.version = '9.9.9'
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  }, 'MANIFEST_PARITY')

  expectFailure('npm package version mismatch', (target) => {
    const file = path.join(target, 'package.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    manifest.version = '9.9.9'
    fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')
  }, 'MANIFEST_NPM_VERSION')

  expectFailure('npm package name mismatch', (target) => {
    const file = path.join(target, 'package.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    manifest.name = 'agent-os'
    fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')
  }, 'MANIFEST_NPM_NAME')

  expectFailure('npm package omits skills', (target) => {
    const file = path.join(target, 'package.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    manifest.files = manifest.files.filter((entry) => entry !== 'skills/')
    fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')
  }, 'MANIFEST_NPM_SKILLS')

  expectFailure('project policy surfaces drift', (target) => {
    fs.appendFileSync(path.join(target, 'CLAUDE.md'), '\nClaude-only release rule.\n')
  }, 'PROJECT_POLICY_PARITY')

  expectFailure('missing release verifier', (target) => {
    fs.rmSync(path.join(target, 'scripts/verify-release.mjs'))
  }, 'RELEASE_VERIFY_SCRIPT')

  expectFailure('missing current changelog heading', (target) => {
    const version = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8')).version
    rewrite(path.join(target, 'docs-site/changelog.md'), (text) =>
      text.replace(`## ${version}`, `### ${version}`))
  }, 'CHANGELOG_RELEASE_HEADING')

  expectFailure('missing skill documentation', (target) => {
    fs.rmSync(path.join(target, 'docs-site/skills/dispatch-next.md'))
  }, 'SKILL_DOC_MISSING')

  expectFailure('skill documentation description drift', (target) => {
    rewrite(path.join(target, 'docs-site/skills/scope-guard.md'), (text) =>
      text.replace('skill-description: Detects and contains task drift', 'skill-description: Contains any drift'))
  }, 'SKILL_DOC_DESCRIPTION')

  expectFailure('skills overview summary drift', (target) => {
    rewrite(path.join(target, 'docs-site/skills/index.md'), (text) =>
      text.replace('Fresh evidence before any completion claim', 'Evidence eventually'))
  }, 'SKILL_OVERVIEW_DRIFT')

  expectFailure('broken relative link', (target) => {
    fs.appendFileSync(path.join(target, 'README.md'), '\n[broken](missing-contract.md)\n')
  }, 'LINK_BROKEN')

  expectFailure('insufficient eval cases', (target) => {
    const file = path.join(target, 'evals/cases/manifest.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    manifest.skills['verify-before-done'].positive = manifest.skills['verify-before-done'].positive.slice(0, 1)
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  }, 'EVAL_CASE_COUNT')

  expectFailure('cross-skill eval reference', (target) => {
    const file = path.join(target, 'evals/cases/manifest.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    manifest.skills['init-agent-os'].positive[0] = 'shape-work.md#SW-P1'
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  }, 'EVAL_CASE_OWNER')

  expectFailure('wrong eval polarity', (target) => {
    const file = path.join(target, 'evals/cases/manifest.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    manifest.skills['scope-guard'].positive[0] = 'scope-guard.md#Negative 1'
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  }, 'EVAL_CASE_POLARITY')

  expectFailure('missing delivery ground truth', (target) => {
    rewrite(path.join(target, 'skills/deliver-work/workflow.md'), (text) =>
      text.replace('**Ground truth:**', '**Checks:**'))
  }, 'DELIVER_CONTRACT')

  expectFailure('missing independent review default', (target) => {
    rewrite(path.join(target, 'skills/deliver-work/workflow.md'), (text) =>
      text.replace('Independent review is required unless', 'Independent review may be useful unless'))
  }, 'DELIVER_CONTRACT')

  expectFailure('missing pre-mutation review mechanism gate', (target) => {
    rewrite(path.join(target, 'skills/deliver-work/workflow.md'), (text) =>
      text.replace('A wait tool alone is not a launch mechanism.', 'Use any available review tool.'))
  }, 'DELIVER_CONTRACT')

  expectFailure('missing independent review isolation', (target) => {
    rewrite(path.join(target, 'skills/deliver-work/workflow.md'), (text) =>
      text.replace('the next review tool action after freezing the candidate must be',
        'the review tool action may be'))
  }, 'DELIVER_CONTRACT')

  expectFailure('missing empty-review rejection', (target) => {
    rewrite(path.join(target, 'skills/deliver-work/workflow.md'), (text) =>
      text.replace('Never call a wait tool with empty', 'A wait tool may use empty'))
  }, 'DELIVER_CONTRACT')

  expectFailure('missing handoff identity field', (target) => {
    rewrite(path.join(target, 'skills/chart-work/references/map.md'), (text) =>
      text.replace('Branch key:', 'Branch identity:'))
  }, 'CHART_HANDOFF_CONTRACT')

  expectFailure('shape-work may complete without implementation issues', (target) => {
    rewrite(path.join(target, 'skills/shape-work/SKILL.md'), (text) =>
      text.replace('Shape-work is complete only when', 'Shape-work should usually continue until'))
  }, 'SHAPE_IMPLEMENTATION_ISSUES')

  expectFailure('implementation issue identity missing', (target) => {
    rewrite(path.join(target, 'skills/shape-work/references/implementation-issues.md'), (text) =>
      text.replace('Identity is `(origin, unit key)`', 'Use a descriptive issue title'))
  }, 'IMPLEMENTATION_ISSUE_CONTRACT')

  expectFailure('multiple issues imply batch execution', (target) => {
    rewrite(path.join(target, 'skills/shape-work/references/implementation-issues.md'), (text) =>
      text.replace('the existence of several issues never invokes or recommends batch-work by itself',
        'several issues should be routed to batch-work'))
  }, 'IMPLEMENTATION_ISSUE_CONTRACT')

  expectFailure('deliver-work accepts an undecomposed target', (target) => {
    rewrite(path.join(target, 'skills/deliver-work/workflow.md'), (text) =>
      text.replace('## Confirm one delivery unit', '## Confirm the broad request'))
  }, 'DELIVER_UNIT_CONTRACT')

  expectFailure('dispatch-next infers batch from issue count', (target) => {
    rewrite(path.join(target, 'skills/dispatch-next/SKILL.md'), (text) =>
      text.replace('issue count alone', 'multiple issues'))
  }, 'DISPATCH_ROUTE_CONTRACT')

  expectFailure('missing batch manifest hash', (target) => {
    rewrite(path.join(target, 'skills/batch-work/references/manifest.md'), (text) =>
      text.replace('manifest_hash: ""', 'definition_digest: ""'))
  }, 'BATCH_MANIFEST_CONTRACT')

  expectFailure('missing batch worker delivery boundary', (target) => {
    rewrite(path.join(target, 'skills/deliver-work/workflow.md'), (text) =>
      text.replace(/The coordinator owns integration, aggregate review, and aggregate\r?\nverification\./,
        'Return to the coordinator.'))
  }, 'BATCH_DELIVERY_BOUNDARY')

  expectFailure('missing aggregate review gate', (target) => {
    rewrite(path.join(target, 'skills/batch-work/SKILL.md'), (text) =>
      text.replace('Treat the integrated batch as material.', 'Inspect the integrated batch.'))
  }, 'BATCH_REVIEW_GATE')

  expectFailure('missing batch runtime block', (target) => {
    rewrite(path.join(target, 'skills/batch-work/references/manifest.md'), (text) =>
      text.replace('```json batch-runtime', '```json runtime-state'))
  }, 'BATCH_MANIFEST_CONTRACT')

  expectFailure('missing deterministic batch hash script', (target) => {
    fs.rmSync(path.join(target, 'skills/batch-work/scripts/manifest-hash.mjs'))
  }, 'BATCH_HASH_SCRIPT')

  expectFailure('hardcoded skill count in docs prose', (target) => {
    rewrite(path.join(target, 'docs-site/skills/index.md'), (text) =>
      text.replace('agent-os ships its skills in three buckets.', 'agent-os ships sixteen skills in three buckets.'))
  }, 'DOCS_SKILL_COUNT')

  expectFailure('leading-zero release version', (target) => {
    const currentVersion = JSON.parse(fs.readFileSync(path.join(target, '.claude-plugin/plugin.json'), 'utf8')).version
    for (const manifestPath of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
      const file = path.join(target, manifestPath)
      const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
      manifest.version = '01.4.2'
      fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
    }
    rewrite(path.join(target, 'docs-site/.vitepress/config.mjs'), (text) => text.replace(`text: 'v${currentVersion}'`, "text: 'v01.4.2'"))
    rewrite(path.join(target, 'docs-site/reference/plugin-manifests.md'), (text) => text.replaceAll(`"version": "${currentVersion}"`, '"version": "01.4.2"'))
  }, 'MANIFEST_VERSION')
} finally {
  for (const target of temporaryRoots) fs.rmSync(target, { recursive: true, force: true })
}

console.log('validator red-case suite passed.')
