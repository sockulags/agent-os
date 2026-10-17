#!/usr/bin/env node
// Manages the AGENT OS block in global instruction files.
//
// Semantics:
//   - No block in target      -> append exactly one block, preserve everything else.
//   - Empty or missing target -> the block becomes the whole file.
//   - Exactly one well-formed -> replace only the content between the markers.
//   - Duplicated, crossed, or half-open markers -> abort without mutation, exit 2.
//   - --check                 -> read-only; exit 0 in sync, exit 1 on drift or missing, never writes.
//   - Text outside the block is never touched or normalized.
//
// Policy source, first match wins: --source <file>, the copy the installer places next to this
// skill, then policy.md at the plugin or checkout root.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const BEGIN_MARKER = '<!-- BEGIN AGENT OS -->'
export const END_MARKER = '<!-- END AGENT OS -->'
export const PLATFORM_FILES = {
  claude: ['.claude', 'CLAUDE.md'],
  codex: ['.codex', 'AGENTS.md']
}

export class PolicyBlockError extends Error {}

function countOccurrences(content, value) {
  return content.split(value).length - 1
}

const VERSION_LINE = /^<!-- agent-os version ([0-9A-Za-z.+-]+) -->$/m

// The installed block names its Agent OS version so drift between teammates is visible in the file.
export function policyBlockVersion(content) {
  const start = content.indexOf(BEGIN_MARKER)
  const end = content.indexOf(END_MARKER)
  if (start < 0 || end < start) return null
  return content.slice(start, end).match(VERSION_LINE)?.[1] ?? null
}

export function planPolicyUpdate(content, policy, version = null) {
  const versionLine = version ? '<!-- agent-os version ' + version + ' -->\n' : ''
  const block = BEGIN_MARKER + '\n' + versionLine + policy.trimEnd() + '\n' + END_MARKER
  const beginCount = countOccurrences(content, BEGIN_MARKER)
  const endCount = countOccurrences(content, END_MARKER)

  if (beginCount === 0 && endCount === 0) {
    const separator = content.length === 0 ? '' : content.endsWith('\n') ? '\n' : '\n\n'
    return { changed: true, status: 'ADDED', content: content + separator + block + '\n' }
  }

  const start = content.indexOf(BEGIN_MARKER)
  const endStart = content.indexOf(END_MARKER)
  if (beginCount !== 1 || endCount !== 1 || start >= endStart) {
    throw new PolicyBlockError(
      'Malformed Agent OS policy markers (begin=' + beginCount + ' end=' + endCount + '); no files were changed.'
    )
  }

  const end = endStart + END_MARKER.length
  if (content.slice(start, end) === block) return { changed: false, status: 'OK', content }
  return { changed: true, status: 'UPDATED', content: content.slice(0, start) + block + content.slice(end) }
}

export function policyTargets(platforms, homeDir = os.homedir()) {
  return platforms.map((platform) => path.join(homeDir, ...PLATFORM_FILES[platform]))
}

// Without an explicit platform, sync only the hosts present on this machine.
export function detectPlatforms(homeDir = os.homedir(), fsImpl = fs) {
  const present = Object.keys(PLATFORM_FILES)
    .filter((platform) => fsImpl.existsSync(path.join(homeDir, PLATFORM_FILES[platform][0])))
  return present.length ? present : Object.keys(PLATFORM_FILES)
}

export function resolvePolicySource(source, scriptDir = path.dirname(fileURLToPath(import.meta.url)), fsImpl = fs) {
  const candidates = source
    ? [path.resolve(source)]
    : [path.join(scriptDir, '..', 'policy.md'), path.join(scriptDir, '..', '..', '..', 'policy.md')]
  const found = candidates.find((candidate) => fsImpl.existsSync(candidate))
  if (!found) throw new PolicyBlockError('Agent OS policy source not found; looked in: ' + candidates.join(', '))
  return found
}

// The version comes from the direct-install manifest in the skills root, or from package.json at a
// plugin or checkout root. Without either, the block carries no version line.
export function resolvePolicyVersion(scriptDir = path.dirname(fileURLToPath(import.meta.url)), fsImpl = fs) {
  const candidates = [
    path.join(scriptDir, '..', '..', '.agent-os-install.json'),
    path.join(scriptDir, '..', '..', '..', 'package.json')
  ]
  for (const candidate of candidates) {
    try {
      const value = JSON.parse(fsImpl.readFileSync(candidate, 'utf8'))
      const version = candidate.endsWith('package.json')
        ? (value.name === '@sockulags/agent-os' ? value.version : null)
        : value.version
      if (typeof version === 'string' && /^[0-9A-Za-z.+-]+$/.test(version)) return version
    } catch {
      // Try the next location.
    }
  }
  return null
}

export function syncPolicy({ check = false, targets, policyFile, version = null, fsImpl = fs }) {
  const policy = fsImpl.readFileSync(policyFile, 'utf8')
  const plans = targets.map((target) => {
    const content = fsImpl.existsSync(target) ? fsImpl.readFileSync(target, 'utf8') : ''
    return { target, missing: !fsImpl.existsSync(target), ...planPolicyUpdate(content, policy, version) }
  })
  if (!check) {
    for (const plan of plans) {
      if (!plan.changed) continue
      fsImpl.mkdirSync(path.dirname(plan.target), { recursive: true })
      fsImpl.writeFileSync(plan.target, plan.content)
    }
  }
  return plans
}

function parseArguments(args) {
  const options = { check: false, platforms: null, source: null, targets: [] }
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    const value = () => {
      const next = args[++index]
      if (!next || next.startsWith('--')) throw new PolicyBlockError(argument + ' requires a value.')
      return next
    }
    if (argument === '--check') options.check = true
    else if (argument === '--source') options.source = value()
    else if (argument === '--target') options.targets.push(value())
    else if (argument === '--platform') {
      const platform = value()
      if (platform === 'both') options.platforms = Object.keys(PLATFORM_FILES)
      else if (PLATFORM_FILES[platform]) options.platforms = [platform]
      else throw new PolicyBlockError('--platform must be claude, codex, or both.')
    } else throw new PolicyBlockError('Unknown option "' + argument + '".')
  }
  return options
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2))
    const targets = options.targets.length
      ? options.targets.map((target) => path.resolve(target))
      : policyTargets(options.platforms || detectPlatforms())
    const policyFile = resolvePolicySource(options.source)
    const version = resolvePolicyVersion()
    const plans = syncPolicy({ check: options.check, targets, policyFile, version })
    let drift = false
    for (const plan of plans) {
      const status = options.check && plan.changed ? 'DRIFT' : plan.status
      if (status === 'DRIFT') drift = true
      const detail = options.check && plan.missing ? ' (file missing)' : ''
      console.log(status.padEnd(8) + plan.target + detail)
    }
    console.log('Policy source: ' + policyFile + (version ? ' (agent-os ' + version + ')' : ''))
    if (drift) process.exitCode = 1
  } catch (cause) {
    console.error('policy-block: ' + cause.message)
    process.exitCode = 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
