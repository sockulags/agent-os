#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  HOOK_TIMEOUT_SECONDS,
  QUALITY_HOOK_MARKER
} from '../plugins/agent-os-dev/skills/quality-ratchet/scripts/quality-delta.mjs'
import { GUARDS_HOOK_MARKER } from '../plugins/agent-os-dev/skills/quality-ratchet/scripts/guards.mjs'
import { lintIntents } from '../plugins/agent-os-dev/skills/quality-ratchet/scripts/intent-files.mjs'
import {
  composePolicy,
  planPolicyUpdate,
  policyBlockVersion,
  policyTargets
} from '../plugins/agent-os-dev/skills/init-agent-os/scripts/policy-block.mjs'
import { collectDoctorReport, formatDoctorReport, latestPublishedVersion } from './doctor.mjs'

export { planPolicyUpdate, policyBlockVersion }

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const packagePath = path.join(packageRoot, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

export const VERSION = packageJson.version
export const PACKAGE_NAME = packageJson.name
export const MARKETPLACE_SOURCE = 'sockulags/agent-os'
export const INSTALL_MANIFEST = '.agent-os-install.json'
export const QUALITY_HOOK_EVENT = 'Stop'
// Codex records hook trust against each hook's hash and skips new or changed hooks until trusted.
export const CODEX_HOOK_TRUST_NOTICE = 'Codex skips new or changed hooks until you trust them: open Codex, run /hooks, and trust the Agent OS quality-ratchet and guard hooks.'

const PLATFORM_VALUES = ['claude', 'codex', 'both']
const METHOD_VALUES = ['direct', 'plugin']
const SCOPE_VALUES = ['user', 'project', 'local']
const PACKAGE_VALUES = ['core', 'all']

// Each package is a plugin root in this repository; a direct install copies their skills side by side.
export const PACKAGES = Object.freeze({
  core: Object.freeze({ plugin: 'agent-os-core', skills: path.join('plugins', 'agent-os-core', 'skills') }),
  dev: Object.freeze({ plugin: 'agent-os-dev', skills: path.join('plugins', 'agent-os-dev', 'skills') })
})

export function selectedPackages(value = 'all') {
  return value === 'core' ? ['core'] : ['core', 'dev']
}

// Managed hook entries, one per marker. The dev package owns all of them.
export const PRE_TOOL_USE_MATCHER = 'Edit|Write|MultiEdit|NotebookEdit|Bash|apply_patch|shell|exec_command|local_shell'
export function managedHookEntries(skillsRoot, nodePath = process.execPath) {
  const scripts = path.join(skillsRoot, 'quality-ratchet', 'scripts')
  const guards = buildManagedHookCommand(path.join(scripts, 'guards.mjs'), nodePath, GUARDS_HOOK_MARKER)
  return [
    { event: 'Stop', marker: QUALITY_HOOK_MARKER, command: buildManagedHookCommand(path.join(scripts, 'quality-delta.mjs'), nodePath) },
    { event: 'SessionStart', marker: GUARDS_HOOK_MARKER, command: guards },
    { event: 'PreToolUse', marker: GUARDS_HOOK_MARKER, command: guards, matcher: PRE_TOOL_USE_MATCHER }
  ]
}

const pluginInstall = (packages, marketplace, extra = []) =>
  packages.map((name) => ['plugin', 'install', PACKAGES[name].plugin + '@' + marketplace, ...extra])

export const PLATFORM_CONFIG = Object.freeze({
  claude: Object.freeze({
    label: 'Claude Code',
    command: 'claude',
    marketplace: 'agent-os-marketplace',
    installArgs: ['plugin', 'marketplace', 'add', MARKETPLACE_SOURCE],
    refreshArgs: ['plugin', 'marketplace', 'update', 'agent-os-marketplace'],
    pluginArgs: (scope, packages = ['core', 'dev']) => pluginInstall(packages, 'agent-os-marketplace', ['--scope', scope]),
    nextStep: 'Restart Claude Code or run /reload-plugins.'
  }),
  codex: Object.freeze({
    label: 'Codex',
    command: 'codex',
    marketplace: 'agent-os',
    installArgs: ['plugin', 'marketplace', 'add', MARKETPLACE_SOURCE],
    refreshArgs: ['plugin', 'marketplace', 'upgrade', 'agent-os'],
    pluginArgs: (scope, packages = ['core', 'dev']) =>
      packages.map((name) => ['plugin', 'add', PACKAGES[name].plugin + '@agent-os']),
    nextStep: 'Start a new Codex session so the refreshed plugins are loaded. ' + CODEX_HOOK_TRUST_NOTICE
  })
})

export class CliError extends Error {}

function valueAfter(args, index, flag) {
  const value = args[index + 1]
  if (!value || value.startsWith('-')) throw new CliError(flag + ' requires a value.')
  return value
}

function normalizePlatform(value) {
  const normalized = value.toLowerCase()
  if (normalized === 'claude-code') return 'claude'
  if (!PLATFORM_VALUES.includes(normalized)) {
    throw new CliError('Platform must be claude, codex, or both.')
  }
  return normalized
}

function normalizeMethod(value) {
  const normalized = value.toLowerCase()
  if (!METHOD_VALUES.includes(normalized)) {
    throw new CliError('Method must be direct or plugin.')
  }
  return normalized
}

function normalizeScope(value) {
  const normalized = value.toLowerCase()
  if (!SCOPE_VALUES.includes(normalized)) {
    throw new CliError('Scope must be user, project, or local.')
  }
  return normalized
}

function normalizePackage(value) {
  const normalized = value.toLowerCase()
  if (!PACKAGE_VALUES.includes(normalized)) {
    throw new CliError('Package must be core or all.')
  }
  return normalized
}

function quoteCommandArg(value) {
  return '"' + String(value).replaceAll('"', '\\"') + '"'
}

export function buildManagedHookCommand(scriptPath, nodePath = process.execPath, marker = QUALITY_HOOK_MARKER) {
  return [quoteCommandArg(nodePath), quoteCommandArg(scriptPath), 'hook', marker].join(' ')
}

export function parseArgs(argv) {
  const result = {
    command: 'install',
    platform: null,
    method: null,
    scope: null,
    package: null,
    policy: null,
    yes: false,
    dryRun: false,
    help: false,
    version: false,
    offline: false
  }

  let index = 0
  if (argv[0] && !argv[0].startsWith('-')) {
    result.command = argv[0].toLowerCase()
    index = 1
  }

  if (result.command === 'upgrade') result.command = 'update'
  if (!['install', 'update', 'doctor', 'help'].includes(result.command)) {
    throw new CliError('Unknown command "' + result.command + '". Use install, update, doctor, or lint-intents.')
  }

  while (index < argv.length) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      result.help = true
    } else if (argument === '--version' || argument === '-v') {
      result.version = true
    } else if (argument === '--yes' || argument === '-y') {
      result.yes = true
    } else if (argument === '--offline') {
      result.offline = true
    } else if (argument === '--dry-run') {
      result.dryRun = true
    } else if (argument === '--policy') {
      if (result.policy === false) throw new CliError('Use only one of --policy and --no-policy.')
      result.policy = true
    } else if (argument === '--no-policy') {
      if (result.policy === true) throw new CliError('Use only one of --policy and --no-policy.')
      result.policy = false
    } else if (argument === '--platform' || argument === '-p') {
      result.platform = normalizePlatform(valueAfter(argv, index, argument))
      index += 1
    } else if (argument.startsWith('--platform=')) {
      result.platform = normalizePlatform(argument.slice('--platform='.length))
    } else if (argument === '--method' || argument === '-m') {
      result.method = normalizeMethod(valueAfter(argv, index, argument))
      index += 1
    } else if (argument.startsWith('--method=')) {
      result.method = normalizeMethod(argument.slice('--method='.length))
    } else if (argument === '--scope' || argument === '-s') {
      result.scope = normalizeScope(valueAfter(argv, index, argument))
      index += 1
    } else if (argument.startsWith('--scope=')) {
      result.scope = normalizeScope(argument.slice('--scope='.length))
    } else if (argument === '--package') {
      result.package = normalizePackage(valueAfter(argv, index, argument))
      index += 1
    } else if (argument.startsWith('--package=')) {
      result.package = normalizePackage(argument.slice('--package='.length))
    } else {
      throw new CliError('Unknown option "' + argument + '". Use --help for usage.')
    }
    index += 1
  }

  return result
}

export function selectedPlatforms(platform) {
  if (platform === 'both') return ['claude', 'codex']
  return [platform]
}

export function targetSkillRoot(platform, scope, {
  homeDir = os.homedir(),
  cwd = process.cwd()
} = {}) {
  if (scope === 'user') {
    return platform === 'codex'
      ? path.join(homeDir, '.codex', 'skills')
      : path.join(homeDir, '.claude', 'skills')
  }
  if (scope === 'project') {
    return platform === 'codex'
      ? path.join(cwd, '.agents', 'skills')
      : path.join(cwd, '.claude', 'skills')
  }
  throw new CliError('Local scope is available only with --method plugin.')
}

export function hookConfigPath(platform, scope, {
  homeDir = os.homedir(),
  cwd = process.cwd()
} = {}) {
  if (scope === 'user') {
    return platform === 'codex'
      ? path.join(homeDir, '.codex', 'hooks.json')
      : path.join(homeDir, '.claude', 'settings.json')
  }
  if (scope === 'project') {
    return platform === 'codex'
      ? path.join(cwd, '.codex', 'hooks.json')
      : path.join(cwd, '.claude', 'settings.json')
  }
  throw new CliError('Local scope is available only with --method plugin.')
}

export function buildPlan(options, pathOptions = {}) {
  const { command, platform, method = 'direct', scope = 'user', policy = true } = options
  const packages = selectedPackages(options.package ?? 'all')
  const steps = []
  for (const name of selectedPlatforms(platform)) {
    const config = PLATFORM_CONFIG[name]
    if (method === 'direct') {
      const root = targetSkillRoot(name, scope, pathOptions)
      steps.push({
        platform: name,
        kind: command === 'update' ? 'update-skills' : 'install-skills',
        command: 'filesystem',
        args: [root],
        description: (command === 'update' ? 'Update' : 'Install') +
          ' Agent OS managed skills (' + packages.map((key) => PACKAGES[key].plugin).join(', ') + ') for ' + config.label + '.'
      })
      steps.push({
        platform: name,
        kind: 'install-hooks',
        command: 'filesystem',
        args: [hookConfigPath(name, scope, pathOptions)],
        description: packages.includes('dev')
          ? 'Merge the Agent OS Stop, SessionStart, and PreToolUse hooks into the ' + config.label + ' configuration.'
          : 'Remove any Agent OS hooks from the ' + config.label + ' configuration; agent-os-core has none.'
      })
      continue
    }

    steps.push({
      platform: name,
      kind: 'ensure-marketplace',
      command: config.command,
      args: ['plugin', 'marketplace', 'list', '--json'],
      description: 'Check whether the ' + config.label + ' marketplace is registered.'
    })
    steps.push({
      platform: name,
      kind: 'add-marketplace-if-missing',
      command: config.command,
      args: config.installArgs,
      description: 'Register the Agent OS marketplace when it is not present.'
    })
    if (command === 'update') {
      steps.push({
        platform: name,
        kind: 'refresh-marketplace',
        command: config.command,
        args: config.refreshArgs,
        description: 'Refresh the Agent OS Git marketplace when applicable.'
      })
    }
    for (const args of config.pluginArgs(scope, packages)) {
      steps.push({
        platform: name,
        kind: 'install-plugin',
        command: config.command,
        args,
        description: command === 'update'
          ? 'Install the current Agent OS plugin snapshot.'
          : 'Install the Agent OS plugin.'
      })
    }
  }
  if (policy) {
    steps.push({
      platform: 'shared',
      kind: 'install-policy',
      command: 'node',
      args: [],
      description: 'Sync the shared global policy for Claude Code and Codex.'
    })
  }
  return steps
}

function commandExists(command, spawn = spawnSync) {
  const lookup = process.platform === 'win32' ? 'where.exe' : 'which'
  const result = spawn(lookup, [command], { stdio: 'ignore' })
  return result.status === 0
}

function runExternal(command, args, { capture = false, spawn = spawnSync } = {}) {
  const options = capture
    ? { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    : { stdio: 'inherit' }
  if (process.platform === 'win32') options.shell = true
  const result = spawn(command, args, options)
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error
  }
}

function marketplacePresent(value, marketplaceName) {
  if (Array.isArray(value)) return value.some((item) => marketplacePresent(item, marketplaceName))
  if (!value || typeof value !== 'object') return false
  if (value.name === marketplaceName || value.marketplaceName === marketplaceName) return true
  return Object.values(value).some((item) => marketplacePresent(item, marketplaceName))
}

function marketplaceSourceType(value, marketplaceName) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = marketplaceSourceType(item, marketplaceName)
      if (result) return result
    }
    return null
  }
  if (!value || typeof value !== 'object') return null
  if (value.marketplaceName === marketplaceName && value.marketplaceSource?.sourceType) {
    return value.marketplaceSource.sourceType
  }
  for (const item of Object.values(value)) {
    const result = marketplaceSourceType(item, marketplaceName)
    if (result) return result
  }
  return null
}

function formatCommand(command, args) {
  return [command, ...args].join(' ')
}

function assertSuccess(result, command, args) {
  if (result.status === 0) return
  const detail = result.error?.message || result.stderr?.trim()
  throw new CliError(
    'Command failed (' + result.status + '): ' + formatCommand(command, args) +
    (detail ? '\n' + detail : '')
  )
}

async function ask(question, { input, output }) {
  const readline = createInterface({ input, output })
  const answer = await new Promise((resolve) => readline.question(question, resolve))
  readline.close()
  return answer.trim()
}

async function choose(question, choices, dependencies) {
  dependencies.output.write('\n' + question + '\n')
  choices.forEach((choice, index) => {
    dependencies.output.write('  ' + (index + 1) + ') ' + choice.label + '\n')
  })
  while (true) {
    const answer = await ask('Choose 1-' + choices.length + ': ', dependencies)
    const selected = Number.parseInt(answer, 10)
    if (selected >= 1 && selected <= choices.length) return choices[selected - 1].value
    dependencies.output.write('Please choose one of the listed numbers.\n')
  }
}

async function confirm(question, dependencies, defaultValue = true) {
  const suffix = defaultValue ? ' [Y/n] ' : ' [y/N] '
  const answer = (await ask(question + suffix, dependencies)).toLowerCase()
  if (!answer) return defaultValue
  return answer === 'y' || answer === 'yes'
}

export async function resolveOptions(parsed, {
  input = process.stdin,
  output = process.stdout
} = {}) {
  const dependencies = { input, output }
  const interactive = Boolean(input.isTTY && output.isTTY)
  if (!interactive && !parsed.yes && !parsed.dryRun) {
    throw new CliError('This command needs a terminal or --yes with explicit options.')
  }

  let platform = parsed.platform
  if (!platform) {
    if (!interactive) throw new CliError('Choose a platform with --platform claude, codex, or both.')
    platform = await choose('Where should Agent OS be installed?', [
      { value: 'codex', label: 'Codex' },
      { value: 'claude', label: 'Claude Code' },
      { value: 'both', label: 'Both' }
    ], dependencies)
  }

  let method = parsed.method
  if (!method) {
    method = interactive && !parsed.yes
      ? await choose('How should Agent OS be installed?', [
        { value: 'direct', label: 'Direct skills (recommended; no host CLI required)' },
        { value: 'plugin', label: 'Native plugin marketplace' }
      ], dependencies)
      : 'direct'
  }

  let scope = parsed.scope || 'user'
  if (!parsed.scope && interactive && !parsed.yes) {
    if (method === 'direct') {
      scope = await choose('Where should the skill files live?', [
        { value: 'user', label: 'User (recommended; available across projects)' },
        { value: 'project', label: 'Project (stored in this repository)' }
      ], dependencies)
    } else if (platform !== 'codex') {
      scope = await choose('What Claude Code plugin scope should be used?', [
        { value: 'user', label: 'User (recommended; available across projects)' },
        { value: 'project', label: 'Project (shared through this repository)' },
        { value: 'local', label: 'Local (this repository for you only)' }
      ], dependencies)
    }
  }
  if (method === 'direct' && scope === 'local') {
    throw new CliError('Local scope is available only with --method plugin. Use user or project.')
  }

  let policy = parsed.policy
  if (policy === null) {
    policy = interactive && !parsed.yes
      ? await confirm('Also sync the shared global policy files?', dependencies, true)
      : true
  }

  let pkg = parsed.package
  // An update keeps the packages already installed; executeInstall reads them from the manifest.
  if (!pkg && parsed.command !== 'update') {
    pkg = interactive && !parsed.yes
      ? await choose('Which Agent OS packages should be installed?', [
        { value: 'all', label: 'Core and dev (recommended for software work)' },
        { value: 'core', label: 'Core only (intent, planning, and evidence disciplines without code delivery)' }
      ], dependencies)
      : 'all'
  }

  return { ...parsed, platform, method, scope, policy, package: pkg }
}

function packagedPolicyPath() {
  return path.join(packageRoot, 'policy.md')
}

// Returns [{ name, dir, package }] for the selected packages, sorted by skill name.
export function listPackagedSkills(packages = ['core', 'dev'], fsImpl = fs, root = packageRoot) {
  const skills = []
  for (const key of packages) {
    const sourceRoot = path.join(root, PACKAGES[key].skills)
    if (!fsImpl.existsSync(sourceRoot)) {
      throw new CliError('Packaged skills directory is missing: ' + sourceRoot)
    }
    for (const entry of fsImpl.readdirSync(sourceRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && fsImpl.existsSync(path.join(sourceRoot, entry.name, 'SKILL.md'))) {
        skills.push({ name: entry.name, dir: path.join(sourceRoot, entry.name), package: key })
      }
    }
  }
  if (skills.length === 0) throw new CliError('No packaged skills were found in ' + root)
  return skills.sort((left, right) => left.name.localeCompare(right.name))
}

function managedCommandHooks(value, marker, matches = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => managedCommandHooks(item, marker, matches))
    return matches
  }
  if (!value || typeof value !== 'object') return matches
  if (typeof value.command === 'string' && value.command.includes(marker)) {
    matches.push(value)
  }
  Object.entries(value).forEach(([key, item]) => {
    if (key !== 'command') managedCommandHooks(item, marker, matches)
  })
  return matches
}

function containsMarker(value, marker) {
  if (typeof value === 'string') return value.includes(marker)
  if (Array.isArray(value)) return value.some((item) => containsMarker(item, marker))
  if (value && typeof value === 'object') return Object.values(value).some((item) => containsMarker(item, marker))
  return false
}

function removeManagedHook(groups, entry) {
  for (const group of groups) {
    if (Array.isArray(group?.hooks)) group.hooks = group.hooks.filter((hook) => hook !== entry)
  }
  return groups.filter((group) => !Array.isArray(group?.hooks) || group.hooks.length > 0)
}

// entries: [{ event, marker, command, matcher?, remove? }]. Each marker owns exactly one command hook
// per event; unrelated hooks and settings are preserved byte-for-byte in meaning.
export function planManagedHooks(content, entries, target = 'Agent OS hook configuration') {
  let config
  if (!content.trim()) {
    config = {}
  } else {
    try {
      config = JSON.parse(content)
    } catch (cause) {
      throw new CliError('Cannot read ' + target + ': ' + cause.message + '; no files were changed.')
    }
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new CliError('Refusing to merge the Agent OS hook into malformed ' + target + '; no files were changed.')
  }
  const hadHooks = config.hooks !== undefined
  if (config.hooks === undefined) config.hooks = {}
  if (!config.hooks || typeof config.hooks !== 'object' || Array.isArray(config.hooks)) {
    throw new CliError('Refusing to merge the Agent OS hook into malformed ' + target + '.hooks; no files were changed.')
  }

  const markers = [...new Set(entries.map((entry) => entry.marker))]
  for (const marker of markers) {
    const events = entries.filter((entry) => entry.marker === marker).map((entry) => entry.event)
    let found = 0
    for (const [event, value] of Object.entries(config.hooks)) {
      const matches = managedCommandHooks(value, marker)
      if (matches.length && !events.includes(event)) {
        throw new CliError('Refusing to update an Agent OS hook outside hooks.' + events.join('/hooks.') + ' in ' + target + '; no files were changed.')
      }
      found += matches.length
    }
    if (containsMarker(config, marker) && found === 0) {
      throw new CliError('Refusing to update an ambiguous Agent OS hook marker in ' + target + '; no files were changed.')
    }
  }

  let changed = false
  let added = false
  for (const entry of entries) {
    if (config.hooks[entry.event] === undefined) {
      if (entry.remove) continue
      config.hooks[entry.event] = []
    }
    if (!Array.isArray(config.hooks[entry.event])) {
      throw new CliError('Refusing to merge the Agent OS hook into malformed ' + target + '.hooks.' + entry.event + '; no files were changed.')
    }
    const managed = managedCommandHooks(config.hooks[entry.event], entry.marker)
    if (managed.length > 1) {
      throw new CliError('Refusing to update multiple Agent OS hook entries in ' + target + '; no files were changed.')
    }
    if (managed.length === 1 && managed[0].type !== 'command') {
      throw new CliError('Refusing to update a malformed Agent OS command hook in ' + target + '; no files were changed.')
    }
    if (entry.remove) {
      if (managed.length === 1) {
        config.hooks[entry.event] = removeManagedHook(config.hooks[entry.event], managed[0])
        if (config.hooks[entry.event].length === 0) delete config.hooks[entry.event]
        changed = true
      }
      continue
    }
    if (managed.length === 1) {
      const hook = managed[0]
      if (hook.command !== entry.command || hook.timeout !== HOOK_TIMEOUT_SECONDS) {
        hook.command = entry.command
        hook.timeout = HOOK_TIMEOUT_SECONDS
        changed = true
      }
      const group = config.hooks[entry.event].find((item) => Array.isArray(item?.hooks) && item.hooks.includes(hook))
      if (entry.matcher && group && group.matcher !== entry.matcher) {
        group.matcher = entry.matcher
        changed = true
      }
      continue
    }
    config.hooks[entry.event].push({
      ...(entry.matcher ? { matcher: entry.matcher } : {}),
      hooks: [{ type: 'command', command: entry.command, timeout: HOOK_TIMEOUT_SECONDS }]
    })
    changed = true
    added = true
  }
  if (!hadHooks && Object.keys(config.hooks).length === 0) delete config.hooks
  if (!changed) return { changed: false, status: 'OK', content }
  return {
    changed: true,
    status: added ? 'ADDED' : 'UPDATED',
    content: JSON.stringify(config, null, 2) + '\n'
  }
}

function readInstallManifest(root, fsImpl = fs) {
  const manifestPath = path.join(root, INSTALL_MANIFEST)
  if (!fsImpl.existsSync(manifestPath)) return null
  let manifest
  try {
    manifest = JSON.parse(fsImpl.readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    throw new CliError('Cannot read Agent OS install manifest at ' + manifestPath + ': ' + error.message)
  }
  if (manifest.package !== PACKAGE_NAME || !Array.isArray(manifest.skills) ||
      ![1, 2].includes(manifest.schemaVersion ?? 1)) {
    throw new CliError('Refusing to use an unrecognized install manifest at ' + manifestPath)
  }
  return manifest
}

function directTargets(options, { homeDir, cwd }) {
  return selectedPlatforms(options.platform).map((platform) => ({
    platform,
    scope: options.scope,
    root: targetSkillRoot(platform, options.scope, { homeDir, cwd }),
    hookPath: hookConfigPath(platform, options.scope, { homeDir, cwd })
  }))
}

function prepareHookPlans(options, { homeDir, cwd, fsImpl = fs }) {
  const dev = selectedPackages(options.package ?? 'all').includes('dev')
  return directTargets(options, { homeDir, cwd }).map((target) => {
    const entries = managedHookEntries(target.root).map((entry) => (dev ? entry : { ...entry, remove: true }))
    const current = fsImpl.existsSync(target.hookPath)
      ? fsImpl.readFileSync(target.hookPath, 'utf8')
      : ''
    return {
      ...target,
      command: entries[0].command,
      ...planManagedHooks(current, entries, target.hookPath)
    }
  })
}

function writeFileAtomic(target, content, fsImpl = fs) {
  const directory = path.dirname(target)
  const temporary = path.join(
    directory,
    '.' + path.basename(target) + '.agent-os-' + randomUUID() + '.tmp'
  )
  fsImpl.mkdirSync(directory, { recursive: true })
  try {
    fsImpl.writeFileSync(temporary, content)
    fsImpl.renameSync(temporary, target)
  } finally {
    if (fsImpl.existsSync(temporary)) fsImpl.rmSync(temporary, { force: true })
  }
}

function applyHookPlans(plans, { output, fsImpl = fs }) {
  const applied = []
  try {
    for (const plan of plans) {
      if (plan.changed) {
        const previous = fsImpl.existsSync(plan.hookPath)
          ? fsImpl.readFileSync(plan.hookPath, 'utf8')
          : null
        applied.push({ ...plan, previous })
        writeFileAtomic(plan.hookPath, plan.content, fsImpl)
      }
      output.write(plan.status.padEnd(7) + plan.hookPath + '\n')
    }
    if (plans.some((plan) => plan.changed && plan.platform === 'codex')) output.write(CODEX_HOOK_TRUST_NOTICE + '\n')
  } catch (cause) {
    let rollbackFailure = null
    for (const plan of applied.reverse()) {
      try {
        if (plan.previous === null) fsImpl.rmSync(plan.hookPath, { force: true })
        else writeFileAtomic(plan.hookPath, plan.previous, fsImpl)
      } catch (rollbackCause) {
        rollbackFailure ??= rollbackCause
      }
    }
    throw new CliError('Failed to update Agent OS hook configuration: ' + cause.message +
      (rollbackFailure ? '; rollback also failed: ' + rollbackFailure.message : ''))
  }
}

function preflightDirectTarget(target, skillNames, fsImpl = fs) {
  const manifest = readInstallManifest(target.root, fsImpl)
  const managed = new Set(manifest?.skills || [])
  const conflicts = skillNames.filter((name) => {
    const destination = path.join(target.root, name)
    return fsImpl.existsSync(destination) && !managed.has(name)
  })
  if (conflicts.length > 0) {
    throw new CliError(
      'Refusing to overwrite unmanaged skills in ' + target.root + ': ' + conflicts.join(', ') +
      '. Move or remove them, then rerun the installer.'
    )
  }
  return manifest
}

function replaceManagedSkills(target, sources, skillNames, previousManifest, fsImpl = fs, packages = ['core', 'dev']) {
  fsImpl.mkdirSync(target.root, { recursive: true })
  const token = randomUUID()
  const stageRoot = path.join(target.root, '.agent-os-stage-' + token)
  const backupRoot = path.join(target.root, '.agent-os-backup-' + token)
  const previousNames = previousManifest?.skills || []
  const namesToBackup = [...new Set([...previousNames, ...skillNames])]
    .filter((name) => fsImpl.existsSync(path.join(target.root, name)))
  const installed = []
  const backedUp = []
  const manifestPath = path.join(target.root, INSTALL_MANIFEST)
  const previousManifestText = fsImpl.existsSync(manifestPath)
    ? fsImpl.readFileSync(manifestPath, 'utf8')
    : null

  try {
    fsImpl.mkdirSync(stageRoot, { recursive: true })
    for (const name of skillNames) {
      fsImpl.cpSync(sources[name], path.join(stageRoot, name), { recursive: true })
    }
    // The init-agent-os policy script needs the policy source outside a checkout or plugin root.
    const policySource = packagedPolicyPath()
    if (skillNames.includes('init-agent-os') && fsImpl.existsSync(policySource)) {
      fsImpl.copyFileSync(policySource, path.join(stageRoot, 'init-agent-os', 'policy.md'))
    }

    if (namesToBackup.length > 0) fsImpl.mkdirSync(backupRoot, { recursive: true })
    for (const name of namesToBackup) {
      fsImpl.renameSync(path.join(target.root, name), path.join(backupRoot, name))
      backedUp.push(name)
    }

    for (const name of skillNames) {
      fsImpl.renameSync(path.join(stageRoot, name), path.join(target.root, name))
      installed.push(name)
    }

    const manifest = {
      schemaVersion: 2,
      package: PACKAGE_NAME,
      version: VERSION,
      platform: target.platform,
      scope: target.scope,
      skills: skillNames,
      packages: packages.map((key) => PACKAGES[key].plugin),
      integrations: packages.includes('dev')
        ? {
            hooks: {
              configPath: target.hookPath,
              event: QUALITY_HOOK_EVENT,
              marker: QUALITY_HOOK_MARKER,
              guards: { events: ['SessionStart', 'PreToolUse'], marker: GUARDS_HOOK_MARKER }
            }
          }
        : {}
    }
    writeFileAtomic(manifestPath, JSON.stringify(manifest, null, 2) + '\n', fsImpl)
  } catch (error) {
    for (const name of installed.reverse()) {
      const destination = path.join(target.root, name)
      if (fsImpl.existsSync(destination)) fsImpl.rmSync(destination, { recursive: true, force: true })
    }
    for (const name of backedUp.reverse()) {
      const backup = path.join(backupRoot, name)
      if (fsImpl.existsSync(backup)) fsImpl.renameSync(backup, path.join(target.root, name))
    }
    if (previousManifestText === null) {
      if (fsImpl.existsSync(manifestPath)) fsImpl.rmSync(manifestPath, { force: true })
    } else {
      writeFileAtomic(manifestPath, previousManifestText, fsImpl)
    }
    throw new CliError('Failed to update managed skills in ' + target.root + ': ' + error.message)
  } finally {
    if (fsImpl.existsSync(stageRoot)) fsImpl.rmSync(stageRoot, { recursive: true, force: true })
    if (fsImpl.existsSync(backupRoot)) fsImpl.rmSync(backupRoot, { recursive: true, force: true })
  }
}

function prepareDirectInstall(options, {
  fsImpl,
  homeDir,
  cwd,
  sourceRoot
}) {
  const packages = selectedPackages(options.package ?? 'all')
  const skills = listPackagedSkills(packages, fsImpl, sourceRoot)
  const skillNames = skills.map((skill) => skill.name)
  const sources = Object.fromEntries(skills.map((skill) => [skill.name, skill.dir]))
  const targets = directTargets(options, { homeDir, cwd })
  const manifests = targets.map((target) => preflightDirectTarget(target, skillNames, fsImpl))
  return { skillNames, targets, manifests, sources, packages }
}

function prepareManagedSkillRollback(plan, fsImpl = fs) {
  const snapshots = []
  try {
    plan.targets.forEach((target, index) => {
      const previousNames = plan.manifests[index]?.skills || []
      const backupRoot = path.join(target.root, '.agent-os-transaction-' + randomUUID())
      const backedUpNames = previousNames.filter((name) =>
        fsImpl.existsSync(path.join(target.root, name)))
      const manifestPath = path.join(target.root, INSTALL_MANIFEST)
      const previousManifestText = fsImpl.existsSync(manifestPath)
        ? fsImpl.readFileSync(manifestPath, 'utf8')
        : null
      const snapshot = { target, backupRoot, previousNames, backedUpNames, previousManifestText }
      snapshots.push(snapshot)
      if (backedUpNames.length > 0) {
        fsImpl.mkdirSync(backupRoot, { recursive: true })
        for (const name of backedUpNames) {
          fsImpl.cpSync(path.join(target.root, name), path.join(backupRoot, name), { recursive: true })
        }
      }
    })
    return snapshots
  } catch (cause) {
    for (const snapshot of snapshots) {
      if (fsImpl.existsSync(snapshot.backupRoot)) {
        fsImpl.rmSync(snapshot.backupRoot, { recursive: true, force: true })
      }
    }
    throw new CliError('Failed to prepare managed skill rollback: ' + cause.message)
  }
}

function cleanupManagedSkillRollback(snapshots, fsImpl = fs) {
  for (const snapshot of snapshots) {
    if (fsImpl.existsSync(snapshot.backupRoot)) {
      fsImpl.rmSync(snapshot.backupRoot, { recursive: true, force: true })
    }
  }
}

function rollbackManagedSkills(plan, snapshots, fsImpl = fs) {
  let failure = null
  snapshots.slice().reverse().forEach((snapshot) => {
    try {
      const names = [...new Set([...plan.skillNames, ...snapshot.previousNames])]
      for (const name of names) {
        const destination = path.join(snapshot.target.root, name)
        if (fsImpl.existsSync(destination)) fsImpl.rmSync(destination, { recursive: true, force: true })
      }
      for (const name of snapshot.backedUpNames) {
        const backup = path.join(snapshot.backupRoot, name)
        if (fsImpl.existsSync(backup)) fsImpl.renameSync(backup, path.join(snapshot.target.root, name))
      }
      const manifestPath = path.join(snapshot.target.root, INSTALL_MANIFEST)
      if (snapshot.previousManifestText === null) fsImpl.rmSync(manifestPath, { force: true })
      else writeFileAtomic(manifestPath, snapshot.previousManifestText, fsImpl)
    } catch (cause) {
      failure ??= cause
    }
  })
  if (failure) throw new CliError('Failed to restore managed skills: ' + failure.message)
  cleanupManagedSkillRollback(snapshots, fsImpl)
}

function applyDirectInstall(options, plan, {
  output,
  fsImpl
}) {
  plan.targets.forEach((target, index) => {
    const config = PLATFORM_CONFIG[target.platform]
    output.write('\n[' + config.label + ']\n')
    output.write((options.command === 'update' ? 'Updating' : 'Installing') +
      ' ' + plan.skillNames.length + ' managed skills in ' + target.root + '...\n')
    replaceManagedSkills(target, plan.sources, plan.skillNames, plan.manifests[index], fsImpl, plan.packages)
    output.write('Done. Start a new ' + config.label + ' session to load the skills.\n')
  })
}

function isNotGitMarketplace(result) {
  return result.status !== 0 && /not configured as a Git marketplace/i.test(result.stderr || '')
}

function executePlugin(options, { output, execute, exists }) {
  const names = selectedPlatforms(options.platform)
  const missing = names.filter((name) => !exists(PLATFORM_CONFIG[name].command))
  if (missing.length > 0) {
    const details = missing.map((name) => {
      const config = PLATFORM_CONFIG[name]
      const hint = name === 'claude'
        ? 'npm install -g @anthropic-ai/claude-code'
        : 'npm install -g @openai/codex'
      return config.label + ': ' + hint
    })
    throw new CliError('Native plugin mode requires the selected host CLIs:\n' + details.join('\n'))
  }

  for (const name of names) {
    const config = PLATFORM_CONFIG[name]
    output.write('\n[' + config.label + ']\n')
    const listed = execute(config.command, ['plugin', 'marketplace', 'list', '--json'], { capture: true })
    let registered = false
    if (listed.status === 0) {
      try {
        registered = marketplacePresent(JSON.parse(listed.stdout), config.marketplace)
      } catch {
        registered = false
      }
    }
    if (!registered) {
      output.write('Registering the Agent OS marketplace...\n')
      assertSuccess(execute(config.command, config.installArgs), config.command, config.installArgs)
    } else {
      output.write('Agent OS marketplace is already registered.\n')
    }

    const packages = selectedPackages(options.package ?? 'all')
    if (name === 'claude') {
      // The single agent-os plugin from before the split, and agent-os-dev for a core-only choice.
      const stale = [
        ...(options.command === 'update' ? ['agent-os'] : []),
        ...(packages.includes('dev') ? [] : [PACKAGES.dev.plugin])
      ]
      for (const plugin of stale) {
        const args = ['plugin', 'uninstall', plugin + '@' + config.marketplace, '--scope', options.scope]
        if (execute(config.command, args, { capture: true }).status === 0) output.write('Removed ' + plugin + '.\n')
      }
    } else if (options.command === 'update' || !packages.includes('dev')) {
      output.write('If the single agent-os plugin from before the split' +
        (packages.includes('dev') ? '' : ', or agent-os-dev,') + ' is still installed, remove it in /plugins.\n')
    }

    if (options.command === 'update') {
      let sourceType = null
      if (name === 'codex' && registered) {
        const plugins = execute(config.command, ['plugin', 'list', '--json'], { capture: true })
        if (plugins.status === 0) {
          try {
            sourceType = marketplaceSourceType(JSON.parse(plugins.stdout), config.marketplace)
          } catch {
            sourceType = null
          }
        }
      }
      if (sourceType === 'local') {
        output.write('Local marketplace detected; skipping Git refresh.\n')
      } else {
        output.write('Refreshing the Agent OS marketplace...\n')
        const refreshed = execute(config.command, config.refreshArgs, { capture: name === 'codex' })
        if (isNotGitMarketplace(refreshed)) {
          output.write('Local marketplace detected; skipping Git refresh.\n')
        } else {
          assertSuccess(refreshed, config.command, config.refreshArgs)
        }
      }
    }

    for (const pluginArgs of config.pluginArgs(options.scope, selectedPackages(options.package ?? 'all'))) {
      output.write((options.command === 'update' ? 'Installing the current snapshot of ' : 'Installing ') +
        pluginArgs[2] + '...\n')
      assertSuccess(execute(config.command, pluginArgs), config.command, pluginArgs)
    }
    output.write('Done. ' + config.nextStep + '\n')
  }
}

function preparePolicyPlans({ fsImpl, homeDir, policyFile, platform, dev = true }) {
  const policy = composePolicy(fsImpl.readFileSync(policyFile, 'utf8'), { dev })
  return policyTargets(selectedPlatforms(platform), homeDir).map((target) => {
    const content = fsImpl.existsSync(target) ? fsImpl.readFileSync(target, 'utf8') : ''
    return { target, ...planPolicyUpdate(content, policy, VERSION) }
  })
}

function applyPolicyPlans(plans, { output, fsImpl }) {
  for (const plan of plans) {
    if (plan.changed) {
      fsImpl.mkdirSync(path.dirname(plan.target), { recursive: true })
      fsImpl.writeFileSync(plan.target, plan.content)
    }
    output.write(plan.status.padEnd(7) + plan.target + '\n')
  }
}

// The package choice of an earlier direct install: core when any selected target recorded only core.
export function installedPackage(options, { homeDir, cwd, fsImpl = fs }) {
  if (options.method === 'plugin') return 'all'
  for (const target of directTargets(options, { homeDir, cwd })) {
    const manifest = readInstallManifest(target.root, fsImpl)
    if (Array.isArray(manifest?.packages) && manifest.packages.length && !manifest.packages.includes(PACKAGES.dev.plugin)) {
      return 'core'
    }
  }
  return 'all'
}

export async function executeInstall(options, {
  output = process.stdout,
  spawn = spawnSync,
  execute = (command, args, runOptions) => runExternal(command, args, { ...runOptions, spawn }),
  exists = (command) => commandExists(command, spawn),
  fsImpl = fs,
  homeDir = os.homedir(),
  cwd = process.cwd(),
  sourceRoot = packageRoot,
  policyFile = packagedPolicyPath()
} = {}) {
  if (!options.package) {
    options = { ...options, package: installedPackage(options, { homeDir, cwd, fsImpl }) }
  }
  const policyPlans = options.policy
    ? preparePolicyPlans({
        fsImpl, homeDir, policyFile, platform: options.platform,
        dev: selectedPackages(options.package ?? 'all').includes('dev')
      })
    : null
  const directPlan = options.method === 'plugin'
    ? null
    : prepareDirectInstall(options, { fsImpl, homeDir, cwd, sourceRoot })
  const hookPlans = options.method === 'plugin'
    ? null
    : prepareHookPlans(options, { fsImpl, homeDir, cwd })

  if (options.method === 'plugin') {
    executePlugin(options, { output, execute, exists })
  } else {
    const rollback = prepareManagedSkillRollback(directPlan, fsImpl)
    try {
      applyDirectInstall(options, directPlan, { output, fsImpl })
      output.write('\n[Agent OS hooks]\n')
      applyHookPlans(hookPlans, { output, fsImpl })
    } catch (cause) {
      try {
        rollbackManagedSkills(directPlan, rollback, fsImpl)
      } catch (rollbackCause) {
        throw new CliError(cause.message + '; ' + rollbackCause.message)
      }
      throw cause
    }
    try {
      cleanupManagedSkillRollback(rollback, fsImpl)
    } catch (cause) {
      throw new CliError('Agent OS direct install committed, but failed to clean transaction backups: ' +
        cause.message + '. Installed skills and hooks were not rolled back.')
    }
  }

  if (options.policy) {
    output.write('\n[Shared policy]\nSyncing the global policy for the selected platforms...\n')
    applyPolicyPlans(policyPlans, { output, fsImpl })
  }
}

export function printHelp(output = process.stdout) {
  output.write(
    'Agent OS installer ' + VERSION + '\n\n' +
    'Usage:\n' +
    '  npx ' + PACKAGE_NAME + ' install\n' +
    '  npx ' + PACKAGE_NAME + ' update\n' +
    '  npx ' + PACKAGE_NAME + '@latest doctor   Report installed versions, drift, and fixes (read-only)\n' +
    '  npx ' + PACKAGE_NAME + ' lint-intents     Check intents/<id>/ intent, spec, and plan files\n\n' +
    'Direct installation is the default and does not require Codex or Claude Code CLI.\n\n' +
    'Agent OS ships two packages: agent-os-core (intent, planning, and evidence disciplines) and\n' +
    'agent-os-dev (delivery, review, and guard hooks for code). Both are installed unless you choose core.\n' +
    'With agent-os-dev, direct installation merges its Stop, SessionStart, and PreToolUse hooks without\n' +
    'replacing unrelated hooks.\n\n' +
    'Options:\n' +
    '  -p, --platform <name>  claude, codex, or both\n' +
    '  -m, --method <name>    direct (default) or plugin\n' +
    '  -s, --scope <name>     user or project; plugin mode also supports local\n' +
    '  --package <name>       all (default: core and dev) or core\n' +
    '  --policy               Sync the global policy file of each selected platform\n' +
    '  --no-policy            Leave global policy files unchanged\n' +
    '  -y, --yes              Accept defaults; useful in scripts\n' +
    '  --dry-run              Show the planned flow without running commands\n' +
    '  --offline              doctor: skip the npm lookup of the latest version\n' +
    '  -h, --help             Show this help\n' +
    '  -v, --version          Show the CLI version\n\n' +
    'Examples:\n' +
    '  npx ' + PACKAGE_NAME + ' install\n' +
    '  npx ' + PACKAGE_NAME + ' install --platform both --yes\n' +
    '  npx ' + PACKAGE_NAME + ' update --platform codex --no-policy\n' +
    '  npx ' + PACKAGE_NAME + ' install --platform codex --method plugin\n' +
    '  npm install --global ' + PACKAGE_NAME + '@latest\n'
  )
}

export function printPlan(options, output = process.stdout, pathOptions = {}) {
  output.write('Planned ' + options.command + ':\n')
  for (const step of buildPlan(options, pathOptions)) {
    const command = step.args.length ? formatCommand(step.command, step.args) : step.command
    output.write('  - ' + step.description + ' [' + command + ']\n')
  }
}

export function runLintIntents(argv, { output = process.stdout, cwd = process.cwd() } = {}) {
  const options = { root: cwd, dir: 'intents', base: null, allowUnchangedRev: false, strict: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--allow-unchanged-rev') options.allowUnchangedRev = true
    else if (argument === '--strict') options.strict = true
    else if (['--base', '--root', '--dir'].includes(argument)) {
      options[argument.slice(2)] = valueAfter(argv, index, argument)
      index += 1
    } else throw new CliError('Unknown lint-intents option "' + argument + '". Use --base <ref>, --allow-unchanged-rev, --strict, --root <dir>, or --dir <dir>.')
  }
  const problems = lintIntents(path.resolve(options.root), options)
  for (const problem of problems) {
    output.write((problem.level === 'error' ? 'ERROR ' : 'WARN  ') + problem.file + ': ' + problem.message + '\n')
  }
  const failing = problems.filter((problem) => problem.level === 'error' || options.strict)
  output.write(failing.length
    ? 'lint-intents: ' + failing.length + ' problem(s) must be fixed.\n'
    : 'lint-intents: intent files are consistent' + (problems.length ? ' (' + problems.length + ' warning(s))' : '') + '.\n')
  return failing.length ? 1 : 0
}

export async function run(argv = process.argv.slice(2), dependencies = {}) {
  if (argv[0] === 'lint-intents') return runLintIntents(argv.slice(1), dependencies)
  const parsed = parseArgs(argv)
  if (parsed.help || parsed.command === 'help') {
    printHelp(dependencies.output || process.stdout)
    return 0
  }
  if (parsed.version) {
    (dependencies.output || process.stdout).write(VERSION + '\n')
    return 0
  }
  if (parsed.command === 'doctor') {
    const fsImpl = dependencies.fsImpl || fs
    const latest = parsed.offline
      ? null
      : (dependencies.latestVersion || ((name) => latestPublishedVersion(name)))(PACKAGE_NAME)
    const result = collectDoctorReport({
      version: VERSION,
      packageName: PACKAGE_NAME,
      packagedSkills: listPackagedSkills(['core', 'dev'], fsImpl).map((skill) => skill.name),
      packageSkills: Object.fromEntries(Object.keys(PACKAGES).map((key) =>
        [PACKAGES[key].plugin, listPackagedSkills([key], fsImpl).map((skill) => skill.name)])),
      policy: fsImpl.readFileSync(packagedPolicyPath(), 'utf8'),
      homeDir: dependencies.homeDir,
      cwd: dependencies.cwd,
      fsImpl,
      latest
    })
    ;(dependencies.output || process.stdout).write(formatDoctorReport(result))
    return result.drift ? 1 : 0
  }
  const options = await resolveOptions(parsed, dependencies)
  if (options.dryRun) {
    printPlan(options, dependencies.output || process.stdout, {
      homeDir: dependencies.homeDir,
      cwd: dependencies.cwd
    })
    return 0
  }
  await executeInstall(options, dependencies)
  const output = dependencies.output || process.stdout
  output.write('\nAgent OS ' + options.command + ' completed.\n')
  output.write('To update later, use npx ' + PACKAGE_NAME + '@latest update.\n')
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then((code) => {
    process.exitCode = code
  }).catch((error) => {
    console.error('Agent OS installer: ' + error.message)
    process.exitCode = 1
  })
}
