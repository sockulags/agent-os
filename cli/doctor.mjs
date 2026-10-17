// Read-only installation report: which Agent OS versions this machine and project run, whether
// they match this CLI, and whether the managed policy blocks and hooks are current. It never
// writes; every fix is an `update` the developer runs.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { planPolicyUpdate, policyBlockVersion } from '../skills/init-agent-os/scripts/policy-block.mjs'

const INSTALL_MANIFEST = '.agent-os-install.json'
const HOOK_MARKER = '--agent-os-hook=quality-ratchet'

function compareVersions(left, right) {
  const parts = (value) => String(value).split(/[.+-]/).slice(0, 3).map((part) => Number.parseInt(part, 10) || 0)
  const [a, b] = [parts(left), parts(right)]
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
  return 0
}

function readJson(file, fsImpl) {
  try {
    return JSON.parse(fsImpl.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function directRoots(homeDir, cwd) {
  return [
    { platform: 'claude', scope: 'user', root: path.join(homeDir, '.claude', 'skills'), hookPath: path.join(homeDir, '.claude', 'settings.json') },
    { platform: 'codex', scope: 'user', root: path.join(homeDir, '.codex', 'skills'), hookPath: path.join(homeDir, '.codex', 'hooks.json') },
    { platform: 'claude', scope: 'project', root: path.join(cwd, '.claude', 'skills'), hookPath: path.join(cwd, '.claude', 'settings.json') },
    { platform: 'codex', scope: 'project', root: path.join(cwd, '.agents', 'skills'), hookPath: path.join(cwd, '.codex', 'hooks.json') }
  ]
}

function checkDirectInstall(target, { version, packagedSkills, fsImpl, report }) {
  const manifest = readJson(path.join(target.root, INSTALL_MANIFEST), fsImpl)
  if (!manifest) return null
  const label = `${target.platform} direct ${target.scope} (${target.root})`
  const update = `npx @sockulags/agent-os@latest update --platform ${target.platform} --scope ${target.scope}`
  if (manifest.version === version) report('ok', label, `version ${version}`)
  else report('drift', label, `installed ${manifest.version ?? 'unknown'}, this CLI is ${version}. Run: ${update}`)

  const managed = Array.isArray(manifest.skills) ? manifest.skills : []
  const retired = managed.filter((name) => !packagedSkills.includes(name) &&
    fsImpl.existsSync(path.join(target.root, name, 'SKILL.md')))
  if (retired.length) report('drift', label, `retired skills still installed: ${retired.join(', ')}. Run: ${update}`)
  const missing = packagedSkills.filter((name) => !fsImpl.existsSync(path.join(target.root, name, 'SKILL.md')))
  if (missing.length) report('drift', label, `skills missing: ${missing.join(', ')}. Run: ${update}`)

  const hooks = fsImpl.existsSync(target.hookPath) ? fsImpl.readFileSync(target.hookPath, 'utf8') : ''
  if (!hooks.includes(HOOK_MARKER)) report('drift', label, `quality-ratchet Stop hook missing from ${target.hookPath}. Run: ${update}`)
  else if (target.platform === 'codex') {
    report('info', label, 'Codex runs this hook only after you trust it in /hooks; trust it again after an update changes it.')
  }
  return manifest
}

function checkClaudePlugin(homeDir, { version, fsImpl, report }) {
  const installed = readJson(path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json'), fsImpl)
  const entries = Object.entries(installed?.plugins ?? {}).filter(([key]) => key.startsWith('agent-os@'))
  for (const [key, installs] of entries) {
    for (const install of Array.isArray(installs) ? installs : []) {
      const label = `claude plugin ${key} (${install.scope ?? 'unknown scope'})`
      if (install.version === version) report('ok', label, `version ${version}`)
      else {
        report('drift', label, `recorded version ${install.version ?? 'unknown'}, this CLI is ${version}. ` +
          `Run: claude plugin marketplace update ${key.split('@')[1]} && claude plugin update ${key}. ` +
          'A marketplace added from a local directory loads in place and may keep an old recorded version.')
      }
    }
  }
  return entries.length > 0
}

function checkCodexPlugin(homeDir, { version, fsImpl, report }) {
  const cache = path.join(homeDir, '.codex', 'plugins', 'cache')
  if (!fsImpl.existsSync(cache)) return false
  let found = false
  for (const marketplace of fsImpl.readdirSync(cache)) {
    const pluginRoot = path.join(cache, marketplace, 'agent-os')
    if (!fsImpl.existsSync(pluginRoot)) continue
    for (const installed of fsImpl.readdirSync(pluginRoot)) {
      found = true
      const label = `codex plugin agent-os@${marketplace}`
      if (installed === version || installed === 'local') report('ok', label, `version ${installed}`)
      else report('drift', label, `cached version ${installed}, this CLI is ${version}. Run: codex plugin marketplace upgrade ${marketplace}, then reinstall the plugin.`)
    }
  }
  return found
}

function checkPolicy(homeDir, { version, policy, fsImpl, report }) {
  for (const [platform, segments] of [['claude', ['.claude', 'CLAUDE.md']], ['codex', ['.codex', 'AGENTS.md']]]) {
    if (!fsImpl.existsSync(path.join(homeDir, segments[0]))) continue
    const target = path.join(homeDir, ...segments)
    const label = `${platform} global policy (${target})`
    const content = fsImpl.existsSync(target) ? fsImpl.readFileSync(target, 'utf8') : ''
    let plan
    try {
      plan = planPolicyUpdate(content, policy, version)
    } catch (error) {
      report('drift', label, error.message)
      continue
    }
    const update = `npx @sockulags/agent-os@latest update --platform ${platform} --policy`
    if (plan.status === 'ADDED') report('warn', label, `no Agent OS block. Run: ${update}`)
    else if (plan.changed) {
      const installed = policyBlockVersion(content)
      report('drift', label, `${installed ? `block is version ${installed}` : 'block has no version line, so an older installer wrote it'} ` +
        `and differs from this CLI's ${version}. Run: ${update}`)
    }
    else report('ok', label, `version ${version}`)
  }
}

export function latestPublishedVersion(packageName, { spawn = spawnSync } = {}) {
  if (!/^@?[a-z0-9][a-z0-9._/-]*$/.test(packageName)) return null
  // npm is a .cmd shim on Windows, which needs a shell; one fixed command string avoids argument joining.
  const result = spawn(`npm view ${packageName} version`, {
    encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'], shell: true
  })
  const value = result.status === 0 ? result.stdout.trim() : ''
  return /^[0-9][0-9A-Za-z.+-]*$/.test(value) ? value : null
}

export function collectDoctorReport({
  version, packageName, packagedSkills, policy, homeDir = os.homedir(), cwd = process.cwd(),
  fsImpl = fs, latest = null
}) {
  const entries = []
  const report = (level, area, message) => entries.push({ level, area, message })

  if (latest && compareVersions(latest, version) > 0) {
    report('warn', 'installer', `this CLI is ${version}, the latest published version is ${latest}. Run: npx ${packageName}@latest doctor`)
  } else if (latest) {
    report('ok', 'installer', `version ${version} is the latest published version`)
  } else {
    report('info', 'installer', `version ${version}; the latest published version was not checked`)
  }

  const direct = directRoots(homeDir, cwd)
    .map((target) => ({ target, manifest: checkDirectInstall(target, { version, packagedSkills, fsImpl, report }) }))
  const claudePlugin = checkClaudePlugin(homeDir, { version, fsImpl, report })
  const codexPlugin = checkCodexPlugin(homeDir, { version, fsImpl, report })

  const directPlatforms = new Set(direct.filter(({ manifest }) => manifest).map(({ target }) => target.platform))
  if (claudePlugin && directPlatforms.has('claude')) {
    report('warn', 'claude', 'both the plugin and a direct install are present, so every skill appears twice (/agent-os:<skill> and /<skill>). Keep one.')
  }
  if (codexPlugin && directPlatforms.has('codex')) {
    report('warn', 'codex', 'both the plugin and a direct install are present, so Codex lists every skill twice. Keep one.')
  }
  const agentsRoot = path.join(homeDir, '.agents', 'skills')
  const strays = packagedSkills.filter((name) => fsImpl.existsSync(path.join(agentsRoot, name, 'SKILL.md')))
  if (strays.length) {
    report('warn', `codex ${agentsRoot}`, `Agent OS skills outside the managed install: ${strays.join(', ')}. ` +
      'Codex may list them next to the managed copies. Remove the copies you did not install with this CLI.')
  }
  if (!direct.some(({ manifest }) => manifest) && !claudePlugin && !codexPlugin) {
    report('warn', 'install', `no Agent OS installation found. Run: npx ${packageName}@latest install`)
  }

  checkPolicy(homeDir, { version, policy, fsImpl, report })
  return { entries, drift: entries.some((entry) => entry.level === 'drift') }
}

export function formatDoctorReport({ entries, drift }) {
  const lines = entries.map((entry) => `${entry.level.toUpperCase().padEnd(6)}${entry.area}: ${entry.message}`)
  lines.push(drift
    ? 'Agent OS installations differ from this CLI. Run the listed commands, then start a new host session.'
    : 'No version drift found.')
  return lines.join('\n') + '\n'
}
