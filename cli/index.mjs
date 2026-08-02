#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const packagePath = path.join(packageRoot, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

export const VERSION = packageJson.version
export const PACKAGE_NAME = packageJson.name
export const MARKETPLACE_SOURCE = 'sockulags/agent-os'
export const INSTALL_MANIFEST = '.agent-os-install.json'

const BEGIN_MARKER = '<!-- BEGIN AGENT OS -->'
const END_MARKER = '<!-- END AGENT OS -->'
const PLATFORM_VALUES = ['claude', 'codex', 'both']
const METHOD_VALUES = ['direct', 'plugin']
const SCOPE_VALUES = ['user', 'project', 'local']

export const PLATFORM_CONFIG = Object.freeze({
  claude: Object.freeze({
    label: 'Claude Code',
    command: 'claude',
    marketplace: 'agent-os-marketplace',
    installArgs: ['plugin', 'marketplace', 'add', MARKETPLACE_SOURCE],
    refreshArgs: ['plugin', 'marketplace', 'update', 'agent-os-marketplace'],
    pluginArgs: (scope) => ['plugin', 'install', 'agent-os@agent-os-marketplace', '--scope', scope],
    nextStep: 'Restart Claude Code or run /reload-plugins.'
  }),
  codex: Object.freeze({
    label: 'Codex',
    command: 'codex',
    marketplace: 'agent-os',
    installArgs: ['plugin', 'marketplace', 'add', MARKETPLACE_SOURCE],
    refreshArgs: ['plugin', 'marketplace', 'upgrade', 'agent-os'],
    pluginArgs: () => ['plugin', 'add', 'agent-os@agent-os'],
    nextStep: 'Start a new Codex session so the refreshed plugin is loaded.'
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

export function parseArgs(argv) {
  const result = {
    command: 'install',
    platform: null,
    method: null,
    scope: null,
    policy: null,
    yes: false,
    dryRun: false,
    help: false,
    version: false
  }

  let index = 0
  if (argv[0] && !argv[0].startsWith('-')) {
    result.command = argv[0].toLowerCase()
    index = 1
  }

  if (result.command === 'upgrade') result.command = 'update'
  if (!['install', 'update', 'help'].includes(result.command)) {
    throw new CliError('Unknown command "' + result.command + '". Use install or update.')
  }

  while (index < argv.length) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      result.help = true
    } else if (argument === '--version' || argument === '-v') {
      result.version = true
    } else if (argument === '--yes' || argument === '-y') {
      result.yes = true
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

export function buildPlan(options, pathOptions = {}) {
  const { command, platform, method = 'direct', scope = 'user', policy = true } = options
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
          ' Agent OS managed skills for ' + config.label + '.'
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
    steps.push({
      platform: name,
      kind: 'install-plugin',
      command: config.command,
      args: config.pluginArgs(scope),
      description: command === 'update'
        ? 'Install the current Agent OS plugin snapshot.'
        : 'Install the Agent OS plugin.'
    })
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

  return { ...parsed, platform, method, scope, policy }
}

function packagedSkillsPath() {
  return path.join(packageRoot, 'skills')
}

function packagedPolicyPath() {
  return path.join(packageRoot, 'policy.md')
}

function listPackagedSkills(sourceRoot, fsImpl = fs) {
  if (!fsImpl.existsSync(sourceRoot)) {
    throw new CliError('Packaged skills directory is missing: ' + sourceRoot)
  }
  const entries = fsImpl.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fsImpl.existsSync(path.join(sourceRoot, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort()
  if (entries.length === 0) throw new CliError('No packaged skills were found in ' + sourceRoot)
  return entries
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
  if (manifest.package !== PACKAGE_NAME || !Array.isArray(manifest.skills)) {
    throw new CliError('Refusing to use an unrecognized install manifest at ' + manifestPath)
  }
  return manifest
}

function directTargets(options, { homeDir, cwd }) {
  return selectedPlatforms(options.platform).map((platform) => ({
    platform,
    scope: options.scope,
    root: targetSkillRoot(platform, options.scope, { homeDir, cwd })
  }))
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

function replaceManagedSkills(target, sourceRoot, skillNames, previousManifest, fsImpl = fs) {
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
      fsImpl.cpSync(path.join(sourceRoot, name), path.join(stageRoot, name), { recursive: true })
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
      schemaVersion: 1,
      package: PACKAGE_NAME,
      version: VERSION,
      platform: target.platform,
      scope: target.scope,
      skills: skillNames
    }
    fsImpl.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
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
      fsImpl.writeFileSync(manifestPath, previousManifestText)
    }
    throw new CliError('Failed to update managed skills in ' + target.root + ': ' + error.message)
  } finally {
    if (fsImpl.existsSync(stageRoot)) fsImpl.rmSync(stageRoot, { recursive: true, force: true })
    if (fsImpl.existsSync(backupRoot)) fsImpl.rmSync(backupRoot, { recursive: true, force: true })
  }
}

function executeDirect(options, {
  output,
  fsImpl,
  homeDir,
  cwd,
  sourceRoot
}) {
  const skillNames = listPackagedSkills(sourceRoot, fsImpl)
  const targets = directTargets(options, { homeDir, cwd })
  const manifests = targets.map((target) => preflightDirectTarget(target, skillNames, fsImpl))

  targets.forEach((target, index) => {
    const config = PLATFORM_CONFIG[target.platform]
    output.write('\n[' + config.label + ']\n')
    output.write((options.command === 'update' ? 'Updating' : 'Installing') +
      ' ' + skillNames.length + ' managed skills in ' + target.root + '...\n')
    replaceManagedSkills(target, sourceRoot, skillNames, manifests[index], fsImpl)
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

    const pluginArgs = config.pluginArgs(options.scope)
    output.write(options.command === 'update'
      ? 'Installing the current plugin snapshot...\n'
      : 'Installing the plugin...\n')
    assertSuccess(execute(config.command, pluginArgs), config.command, pluginArgs)
    output.write('Done. ' + config.nextStep + '\n')
  }
}

function countOccurrences(content, value) {
  return content.split(value).length - 1
}

export function planPolicyUpdate(content, policy) {
  const normalizedPolicy = policy.trimEnd()
  const block = BEGIN_MARKER + '\n' + normalizedPolicy + '\n' + END_MARKER
  const beginCount = countOccurrences(content, BEGIN_MARKER)
  const endCount = countOccurrences(content, END_MARKER)

  if (beginCount === 0 && endCount === 0) {
    const separator = content.length === 0 ? '' : content.endsWith('\n') ? '\n' : '\n\n'
    return { changed: true, status: 'ADDED', content: content + separator + block + '\n' }
  }

  const start = content.indexOf(BEGIN_MARKER)
  const endStart = content.indexOf(END_MARKER)
  if (beginCount !== 1 || endCount !== 1 || start >= endStart) {
    throw new CliError(
      'Malformed Agent OS policy markers (begin=' + beginCount + ' end=' + endCount + '); no files were changed.'
    )
  }

  const end = endStart + END_MARKER.length
  const current = content.slice(start, end)
  if (current === block) return { changed: false, status: 'OK', content }
  return {
    changed: true,
    status: 'UPDATED',
    content: content.slice(0, start) + block + content.slice(end)
  }
}

function preparePolicyPlans({ fsImpl, homeDir, policyFile }) {
  const policy = fsImpl.readFileSync(policyFile, 'utf8')
  const targets = [
    path.join(homeDir, '.claude', 'CLAUDE.md'),
    path.join(homeDir, '.codex', 'AGENTS.md')
  ]
  return targets.map((target) => {
    const content = fsImpl.existsSync(target) ? fsImpl.readFileSync(target, 'utf8') : ''
    return { target, ...planPolicyUpdate(content, policy) }
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

export async function executeInstall(options, {
  output = process.stdout,
  spawn = spawnSync,
  execute = (command, args, runOptions) => runExternal(command, args, { ...runOptions, spawn }),
  exists = (command) => commandExists(command, spawn),
  fsImpl = fs,
  homeDir = os.homedir(),
  cwd = process.cwd(),
  sourceRoot = packagedSkillsPath(),
  policyFile = packagedPolicyPath()
} = {}) {
  const policyPlans = options.policy
    ? preparePolicyPlans({ fsImpl, homeDir, policyFile })
    : null

  if (options.method === 'plugin') {
    executePlugin(options, { output, execute, exists })
  } else {
    executeDirect(options, { output, fsImpl, homeDir, cwd, sourceRoot })
  }

  if (options.policy) {
    output.write('\n[Shared policy]\nSyncing the global Claude Code and Codex policy files...\n')
    applyPolicyPlans(policyPlans, { output, fsImpl })
  }
}

export function printHelp(output = process.stdout) {
  output.write(
    'Agent OS installer ' + VERSION + '\n\n' +
    'Usage:\n' +
    '  npx ' + PACKAGE_NAME + ' install\n' +
    '  npx ' + PACKAGE_NAME + ' update\n\n' +
    'Direct installation is the default and does not require Codex or Claude Code CLI.\n\n' +
    'Options:\n' +
    '  -p, --platform <name>  claude, codex, or both\n' +
    '  -m, --method <name>    direct (default) or plugin\n' +
    '  -s, --scope <name>     user or project; plugin mode also supports local\n' +
    '  --policy               Sync ~/.claude/CLAUDE.md and ~/.codex/AGENTS.md\n' +
    '  --no-policy            Leave global policy files unchanged\n' +
    '  -y, --yes              Accept defaults; useful in scripts\n' +
    '  --dry-run              Show the planned flow without running commands\n' +
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

export async function run(argv = process.argv.slice(2), dependencies = {}) {
  const parsed = parseArgs(argv)
  if (parsed.help || parsed.command === 'help') {
    printHelp(dependencies.output || process.stdout)
    return 0
  }
  if (parsed.version) {
    (dependencies.output || process.stdout).write(VERSION + '\n')
    return 0
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
