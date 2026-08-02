#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fs from 'node:fs'

const packagePath = fileURLToPath(new URL('../package.json', import.meta.url))
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

export const VERSION = packageJson.version
export const PACKAGE_NAME = packageJson.name
export const MARKETPLACE_SOURCE = 'sockulags/agent-os'

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
    nextStep: 'Start a new Codex session so the refreshed plugin cache is loaded.'
  })
})

const PLATFORM_VALUES = ['claude', 'codex', 'both']
const SCOPE_VALUES = ['user', 'project', 'local']

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

export function buildPlan({ command, platform, scope = 'user', policy = true }) {
  const steps = []
  for (const name of selectedPlatforms(platform)) {
    const config = PLATFORM_CONFIG[name]
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
        description: 'Refresh the Agent OS marketplace.'
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
      command: 'powershell',
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

  let scope = parsed.scope || 'user'
  if (platform !== 'codex' && !parsed.scope && interactive && !parsed.yes) {
    scope = await choose('What Claude Code installation scope should be used?', [
      { value: 'user', label: 'User (recommended; available across projects)' },
      { value: 'project', label: 'Project (shared through this repository)' },
      { value: 'local', label: 'Local (this repository for you only)' }
    ], dependencies)
  }

  let policy = parsed.policy
  if (policy === null) {
    policy = interactive && !parsed.yes
      ? await confirm('Also sync the shared global policy files?', dependencies, true)
      : true
  }

  return { ...parsed, platform, scope, policy }
}

function findPowerShell(spawn) {
  for (const command of ['pwsh', 'powershell']) {
    if (commandExists(command, spawn)) return command
  }
  return null
}

function policyScriptPath() {
  return fileURLToPath(new URL('../skills/init-agent-os/scripts/policy-block.ps1', import.meta.url))
}

export async function executeInstall(options, {
  output = process.stdout,
  spawn = spawnSync,
  execute = (command, args, runOptions) => runExternal(command, args, { ...runOptions, spawn }),
  exists = (command) => commandExists(command, spawn)
} = {}) {
  const names = selectedPlatforms(options.platform)
  const powershell = options.policy ? findPowerShell(spawn) : null
  if (options.policy && !powershell) {
    throw new CliError(
      'PowerShell was not found, so the shared policy could not be synced. ' +
      'Run the policy script manually or rerun with --no-policy.'
    )
  }
  for (const name of names) {
    const config = PLATFORM_CONFIG[name]
    if (!exists(config.command)) {
      const installHint = name === 'claude'
        ? 'Install Claude Code first: npm install -g @anthropic-ai/claude-code'
        : 'Install Codex first: npm install -g @openai/codex'
      throw new CliError(config.label + ' CLI was not found on PATH.\n' + installHint)
    }

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
      output.write('Refreshing the Agent OS marketplace...\n')
      assertSuccess(execute(config.command, config.refreshArgs), config.command, config.refreshArgs)
    }

    const pluginArgs = config.pluginArgs(options.scope)
    output.write(options.command === 'update' ? 'Installing the current plugin snapshot...\n' : 'Installing the plugin...\n')
    assertSuccess(execute(config.command, pluginArgs), config.command, pluginArgs)
    output.write('Done. ' + config.nextStep + '\n')
  }

  if (options.policy) {
    const policyArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', policyScriptPath()]
    output.write('\n[Shared policy]\nSyncing the global Claude Code and Codex policy files...\n')
    assertSuccess(execute(powershell, policyArgs), powershell, policyArgs)
  }
}

export function printHelp(output = process.stdout) {
  output.write(
    'Agent OS installer ' + VERSION + '\n\n' +
    'Usage:\n' +
    '  npx ' + PACKAGE_NAME + ' install\n' +
    '  npx ' + PACKAGE_NAME + ' update\n\n' +
    'Guided install asks where to install Agent OS and whether to sync the shared policy.\n\n' +
    'Options:\n' +
    '  -p, --platform <name>  claude, codex, or both\n' +
    '  -s, --scope <name>     Claude scope: user, project, or local\n' +
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
    '  npm install --global ' + PACKAGE_NAME + '@latest\n'
  )
}

export function printPlan(options, output = process.stdout) {
  output.write('Planned ' + options.command + ':\n')
  for (const step of buildPlan(options)) {
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
    printPlan(options, dependencies.output || process.stdout)
    return 0
  }
  await executeInstall(options, dependencies)
  const output = dependencies.output || process.stdout
  output.write('\nAgent OS ' + options.command + ' completed.\n')
  output.write('To update the CLI itself later, use npx ' + PACKAGE_NAME + '@latest or npm install --global ' + PACKAGE_NAME + '@latest.\n')
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then((code) => {
    process.exitCode = code
  }).catch((error) => {
    console.error('Agent OS installer: ' + error.message)
    process.exitCode = 1
  })
}
