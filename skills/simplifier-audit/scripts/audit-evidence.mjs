#!/usr/bin/env node
// Collects deterministic simplification candidates for a repository-wide audit: the most complex
// functions (lizard), duplicated blocks (jscpd), and unused code (knip for JavaScript/TypeScript,
// vulture for Python). Each tool is optional and never installed here; a missing tool is reported
// as unavailable. The output is a ranked candidate list to verify, not a list of findings.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { findLizard, lizardFunctions } from '../../quality-ratchet/scripts/analyzers.mjs'
import { isSourcePath } from '../../quality-ratchet/scripts/quality-delta.mjs'

const TIMEOUT_MS = 300000
const LINE_LIMIT = 40

function run(command, args, cwd, spawn) {
  return spawn(command, args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32' && /\.(?:cmd|bat)$/i.test(command)
  })
}

function sourceFiles(root, spawn) {
  const result = run('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], root, spawn)
  if (result.status !== 0) throw new Error(`git ls-files failed: ${result.stderr?.trim()}`)
  return result.stdout.split('\0').filter(Boolean).map((file) => file.replaceAll('\\', '/')).filter(isSourcePath)
}

function localBin(root, name) {
  const base = path.join(root, 'node_modules', '.bin', name)
  return [base + (process.platform === 'win32' ? '.cmd' : ''), base].find((file) => fs.existsSync(file)) || null
}

// Resolves a command to its full path so Windows .cmd shims can be launched.
function onPath(command, spawn) {
  try {
    const result = run(process.platform === 'win32' ? 'where.exe' : 'which', [command], process.cwd(), spawn)
    if (result.status !== 0) return null
    const hits = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    // where.exe also lists extensionless shell shims that Windows cannot launch.
    return (process.platform === 'win32' ? hits.find((hit) => /\.(?:exe|cmd|bat)$/i.test(hit)) : hits[0]) || null
  } catch {
    return null
  }
}

function firstLines(text, limit = LINE_LIMIT) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  return { lines: lines.slice(0, limit), omitted: Math.max(0, lines.length - limit) }
}

export function complexitySection(root, files, { analyze, limit = 15 } = {}) {
  const functions = analyze(root, files)
  if (functions === null) return { status: 'unavailable', reason: 'lizard is not installed.' }
  const ranked = [...functions].sort((left, right) => right.ccn - left.ccn).slice(0, limit)
  return { status: 'available', functions: ranked, analyzed: functions.length }
}

export function summarizeJscpd(report, limit = 10) {
  const total = report.statistics?.total || {}
  const clones = (report.duplicates || [])
    .map((clone) => ({
      lines: clone.lines,
      first: `${clone.firstFile.name.replaceAll('\\', '/')}:${clone.firstFile.start}-${clone.firstFile.end}`,
      second: `${clone.secondFile.name.replaceAll('\\', '/')}:${clone.secondFile.start}-${clone.secondFile.end}`
    }))
    .sort((left, right) => right.lines - left.lines)
  return { status: 'available', percentage: total.percentage ?? 0, clones: clones.slice(0, limit), total: clones.length }
}

function duplicationSection(root, spawn) {
  const command = localBin(root, 'jscpd') || onPath('jscpd', spawn)
  if (!command) return { status: 'unavailable', reason: 'jscpd is not installed in node_modules/.bin or on PATH.' }
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-jscpd-'))
  try {
    run(command, ['--silent', '--reporters', 'json', '--output', output, '--gitignore',
      '--ignore', '**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/.git/**', '.'], root, spawn)
    const reportPath = path.join(output, 'jscpd-report.json')
    if (!fs.existsSync(reportPath)) return { status: 'unavailable', reason: 'jscpd produced no report.' }
    return summarizeJscpd(JSON.parse(fs.readFileSync(reportPath, 'utf8')))
  } finally {
    fs.rmSync(output, { recursive: true, force: true })
  }
}

function deadCodeSection(root, files, spawn) {
  const sections = []
  const knip = localBin(root, 'knip')
  if (knip) {
    const result = run(knip, ['--reporter', 'compact', '--no-progress'], root, spawn)
    sections.push({ tool: 'knip', status: 'available', ...firstLines(`${result.stdout}`) })
  } else if (files.some((file) => /\.(?:[cm]?[jt]sx?)$/.test(file))) {
    sections.push({ tool: 'knip', status: 'unavailable', reason: 'knip is not installed in node_modules/.bin.' })
  }
  const python = files.filter((file) => file.endsWith('.py'))
  if (python.length) {
    const vulture = onPath('vulture', spawn)
    if (vulture) {
      const result = run(vulture, ['--min-confidence', '80', ...python], root, spawn)
      sections.push({ tool: 'vulture', status: 'available', ...firstLines(`${result.stdout}`) })
    } else {
      sections.push({ tool: 'vulture', status: 'unavailable', reason: 'vulture is not on PATH.' })
    }
  }
  return sections
}

export function collectEvidence(root, { spawn = spawnSync, analyze } = {}) {
  const files = sourceFiles(root, spawn)
  const launcher = analyze ? undefined : findLizard({ spawn })
  const analyzer = analyze || ((cwd, list) => lizardFunctions(cwd, list, { launcher, spawn }))
  const safe = (fn) => {
    try { return fn() } catch (cause) { return { status: 'unavailable', reason: cause.message } }
  }
  return {
    root,
    sourceFiles: files.length,
    complexity: safe(() => complexitySection(root, files, { analyze: analyzer })),
    duplication: safe(() => duplicationSection(root, spawn)),
    deadCode: safe(() => deadCodeSection(root, files, spawn))
  }
}

export function formatEvidence(evidence) {
  const lines = [`Agent OS simplification evidence for ${evidence.root} (${evidence.sourceFiles} source files)`, '']
  const { complexity, duplication, deadCode } = evidence
  lines.push('Most complex functions (lizard, cyclomatic complexity):')
  if (complexity.status === 'available') {
    lines.push(...complexity.functions.map((fn) => `  ${fn.ccn}  ${fn.file}:${fn.line} ${fn.function}`))
  } else lines.push(`  unavailable: ${complexity.reason}`)
  lines.push('', 'Duplicated blocks (jscpd):')
  if (duplication.status === 'available') {
    lines.push(`  ${duplication.percentage}% duplicated lines, ${duplication.total} clones`)
    lines.push(...duplication.clones.map((clone) => `  ${clone.lines} lines  ${clone.first} = ${clone.second}`))
  } else lines.push(`  unavailable: ${duplication.reason}`)
  lines.push('', 'Unused code:')
  const dead = Array.isArray(deadCode) ? deadCode : [deadCode]
  if (!dead.length) lines.push('  no supported language detected')
  for (const section of dead) {
    if (section.status !== 'available') {
      lines.push(`  ${section.tool || 'dead-code'} unavailable: ${section.reason}`)
      continue
    }
    lines.push(`  ${section.tool}:`, ...section.lines.map((line) => `    ${line}`))
    if (section.omitted) lines.push(`    ... ${section.omitted} more lines`)
  }
  lines.push('', 'These are candidates. Verify usage and intent before reporting any of them as a finding.')
  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  const json = args.includes('--json')
  const rootArgument = args.find((arg) => !arg.startsWith('--'))
  try {
    const evidence = collectEvidence(path.resolve(rootArgument || process.cwd()))
    console.log(json ? JSON.stringify(evidence, null, 2) : formatEvidence(evidence))
  } catch (cause) {
    console.error(`audit-evidence: ${cause.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
