// Read-only installation report: which Agent OS versions this machine and project run, whether
// they match this CLI, and whether the managed policy blocks and hooks are current. It never
// writes, and a broken or unexpected file becomes a finding instead of a crash.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { composePolicy, planPolicyUpdate, policyBlockVersion } from '../plugins/agent-os-dev/skills/init-agent-os/scripts/policy-block.mjs'

const INSTALL_MANIFEST = '.agent-os-install.json'
const HOOK_MARKER = '--agent-os-hook=quality-ratchet'
const GUARDS_MARKER = '--agent-os-hook=guards'
const CORE = 'agent-os-core'
const DEV = 'agent-os-dev'
// Before the core/dev split, one plugin named agent-os carried every skill.
const LEGACY_PLUGIN = 'agent-os'
const PLUGINS = [CORE, DEV, LEGACY_PLUGIN]

export function compareVersions(left, right) {
  const parts = (value) => String(value).split(/[.+-]/).slice(0, 3).map((part) => Number.parseInt(part, 10) || 0)
  const [a, b] = [parts(left), parts(right)]
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
  return 0
}

// absent: the path does not exist. invalid: it exists but is not a readable JSON file.
function readJson(file, fsImpl) {
  if (!fsImpl.existsSync(file)) return { state: 'absent' }
  try {
    return { state: 'ok', value: JSON.parse(fsImpl.readFileSync(file, 'utf8')) }
  } catch (error) {
    return { state: 'invalid', error: error.message }
  }
}

function readText(file, fsImpl) {
  if (!fsImpl.existsSync(file)) return { state: 'absent', text: '' }
  try {
    return { state: 'ok', text: fsImpl.readFileSync(file, 'utf8') }
  } catch (error) {
    return { state: 'invalid', error: error.message, text: '' }
  }
}

function directories(dir, fsImpl) {
  try {
    return fsImpl.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  } catch {
    return []
  }
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function directRoots(homeDir, cwd) {
  return [
    { platform: 'claude', scope: 'user', root: path.join(homeDir, '.claude', 'skills'), hookPath: path.join(homeDir, '.claude', 'settings.json') },
    { platform: 'codex', scope: 'user', root: path.join(homeDir, '.codex', 'skills'), hookPath: path.join(homeDir, '.codex', 'hooks.json') },
    { platform: 'claude', scope: 'project', root: path.join(cwd, '.claude', 'skills'), hookPath: path.join(cwd, '.claude', 'settings.json') },
    { platform: 'codex', scope: 'project', root: path.join(cwd, '.agents', 'skills'), hookPath: path.join(cwd, '.codex', 'hooks.json') }
  ]
}

// Manifests written before the split carry no packages field and held every skill.
function manifestPackages(manifest) {
  return Array.isArray(manifest.packages) && manifest.packages.length ? manifest.packages : [CORE, DEV]
}

function checkDirectInstall(target, { version, packageName, packagedSkills, packageSkills, fsImpl, report }) {
  const manifestPath = path.join(target.root, INSTALL_MANIFEST)
  const read = readJson(manifestPath, fsImpl)
  if (read.state === 'absent') return false
  const label = `${target.platform} direct ${target.scope} (${target.root})`
  const manifest = read.value
  const packages = isObject(manifest) ? manifestPackages(manifest) : [CORE, DEV]
  const update = `npx ${packageName}@latest update --platform ${target.platform} --scope ${target.scope}` +
    (packages.includes(DEV) ? '' : ' --package core')
  if (read.state === 'invalid' || !isObject(manifest) || manifest.package !== packageName || !Array.isArray(manifest.skills)) {
    report('drift', label, `${manifestPath} is not a readable Agent OS install manifest, so update refuses to use it. ` +
      `Move it aside, then run: ${update}`)
    return { packages: [] }
  }
  if (manifest.version === version) report('ok', label, `version ${version}`)
  else report('drift', label, `installed ${manifest.version ?? 'unknown'}, this CLI is ${version}. Run: ${update}`)

  const retired = manifest.skills.filter((name) => typeof name === 'string' && !packagedSkills.includes(name) &&
    fsImpl.existsSync(path.join(target.root, name, 'SKILL.md')))
  if (retired.length) report('drift', label, `retired skills still installed: ${retired.join(', ')}. Run: ${update}`)
  const expected = packages.flatMap((name) => packageSkills?.[name] ?? [])
  const missing = expected.filter((name) => !fsImpl.existsSync(path.join(target.root, name, 'SKILL.md')))
  if (missing.length) report('drift', label, `skills missing: ${missing.join(', ')}. Run: ${update}`)

  if (!packages.includes(DEV)) return { packages }
  const hooks = readText(target.hookPath, fsImpl)
  if (hooks.state === 'invalid') report('warn', label, `cannot read ${target.hookPath}: ${hooks.error}`)
  else if (!hooks.text.includes(HOOK_MARKER)) report('drift', label, `quality-ratchet Stop hook missing from ${target.hookPath}. Run: ${update}`)
  else if (!hooks.text.includes(GUARDS_MARKER)) report('drift', label, `guard hooks missing from ${target.hookPath}. Run: ${update}`)
  else if (target.platform === 'codex') {
    report('info', label, 'Codex runs these hooks only after you trust them in /hooks; trust them again after an update changes them.')
  }
  return { packages }
}

// A marketplace added from a local directory loads the plugin in place, so its recorded version can
// stay old while the code is current. Read the in-place manifest instead: plugins/<name>/ in a
// checkout, or the marketplace root for a single-plugin directory.
function localMarketplaceVersion(homeDir, marketplace, name, fsImpl) {
  const known = readJson(path.join(homeDir, '.claude', 'plugins', 'known_marketplaces.json'), fsImpl)
  const entry = known.state === 'ok' && isObject(known.value) ? known.value[marketplace] : null
  if (!isObject(entry) || !isObject(entry.source) || entry.source.source !== 'directory') return null
  const location = typeof entry.installLocation === 'string' ? entry.installLocation : entry.source.path
  if (typeof location !== 'string') return null
  for (const root of [path.join(location, 'plugins', name), location]) {
    const manifest = readJson(path.join(root, '.claude-plugin', 'plugin.json'), fsImpl)
    if (manifest.state === 'ok' && isObject(manifest.value) && manifest.value.name === name &&
        typeof manifest.value.version === 'string') {
      return { location: root, version: manifest.value.version }
    }
  }
  return null
}

function checkClaudePlugin(homeDir, { version, fsImpl, report }) {
  const file = path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json')
  const installed = readJson(file, fsImpl)
  if (installed.state === 'absent') return { keys: [], unknown: false }
  if (installed.state === 'invalid' || !isObject(installed.value)) {
    report('warn', 'claude plugins', `cannot read ${file}; plugin installs were not checked.`)
    return { keys: [], unknown: true }
  }
  const plugins = isObject(installed.value.plugins) ? installed.value.plugins : {}
  const keys = new Set()
  const names = new Set()
  for (const [key, installs] of Object.entries(plugins)) {
    const separator = key.indexOf('@')
    const name = separator > 0 ? key.slice(0, separator) : key
    if (!PLUGINS.includes(name)) continue
    const marketplace = key.slice(name.length + 1)
    const local = localMarketplaceVersion(homeDir, marketplace, name, fsImpl)
    for (const install of (Array.isArray(installs) ? installs : []).filter(isObject)) {
      keys.add(key)
      names.add(name)
      const scope = typeof install.scope === 'string' ? install.scope : 'user'
      const label = `claude plugin ${key} (${scope})`
      const scopeFlag = scope === 'user' ? '' : ` --scope ${scope}`
      if (name === LEGACY_PLUGIN) {
        report('drift', label, `the single agent-os plugin is replaced by ${CORE} and ${DEV}. ` +
          `Run: claude plugin marketplace update ${marketplace} && claude plugin uninstall ${key}${scopeFlag} && ` +
          `claude plugin install ${CORE}@${marketplace}${scopeFlag} && claude plugin install ${DEV}@${marketplace}${scopeFlag}`)
        continue
      }
      const current = local ? local.version : install.version
      const source = local ? `loaded in place from ${local.location}, version` : 'version'
      if (current === version) report('ok', label, `${source} ${version}`)
      else if (local) report('drift', label, `${source} ${current ?? 'unknown'}, this CLI is ${version}. Pull the latest release into ${local.location}, then run /reload-plugins.`)
      else {
        report('drift', label, `recorded version ${install.version ?? 'unknown'}, this CLI is ${version}. ` +
          `Run: claude plugin marketplace update ${marketplace} && claude plugin update ${key}${scopeFlag}`)
      }
    }
  }
  if (names.has(DEV) && !names.has(CORE)) {
    report('drift', 'claude plugins', `${DEV} is installed without ${CORE}, which it requires. Run: claude plugin install ${CORE}@agent-os-marketplace`)
  }
  return { keys: [...keys], names: [...names], unknown: false }
}

function checkCodexPlugin(homeDir, { version, fsImpl, report }) {
  const cache = path.join(homeDir, '.codex', 'plugins', 'cache')
  const names = new Set()
  for (const marketplace of directories(cache, fsImpl)) {
    for (const name of PLUGINS) {
      for (const installed of directories(path.join(cache, marketplace, name), fsImpl)) {
        names.add(name)
        const label = `codex plugin ${name}@${marketplace}`
        if (name === LEGACY_PLUGIN) {
          report('drift', label, `the single agent-os plugin is replaced by ${CORE} and ${DEV}. Run: codex plugin marketplace upgrade ${marketplace}, ` +
            `remove agent-os in /plugins, then run: codex plugin add ${CORE}@${marketplace} and codex plugin add ${DEV}@${marketplace}`)
        } else if (installed === version || installed === 'local') report('ok', label, `version ${installed}`)
        else report('drift', label, `cached version ${installed}, this CLI is ${version}. Run: codex plugin marketplace upgrade ${marketplace}, then reinstall the plugin.`)
      }
    }
  }
  return [...names]
}

// The CLI's update reinstalls skills, so a plugin-only user syncs the policy through the skill.
// An unreadable plugin record may hide a plugin install, so it never leads to install advice.
function policyFix(platform, { packageName, direct, plugin, unknown, dev }) {
  if (direct) return `npx ${packageName}@latest update --platform ${platform} --policy` + (dev ? '' : ' --package core')
  if (plugin && !dev) return `npx ${packageName}@latest install --platform ${platform} --method plugin --package core --policy`
  if (plugin || unknown) return platform === 'claude' ? 'run /agent-os-dev:init-agent-os global in Claude Code' : 'run $init-agent-os global in Codex'
  return `npx ${packageName}@latest install --platform ${platform}`
}

function checkPolicy(homeDir, { version, packageName, policy, installed, fsImpl, report }) {
  for (const [platform, segments] of [['claude', ['.claude', 'CLAUDE.md']], ['codex', ['.codex', 'AGENTS.md']]]) {
    if (!fsImpl.existsSync(path.join(homeDir, segments[0]))) continue
    const target = path.join(homeDir, ...segments)
    const label = `${platform} global policy (${target})`
    const fix = policyFix(platform, { packageName, ...installed[platform] })
    // A host without agent-os-dev gets the core policy; with no record of either, expect the full one.
    const expected = composePolicy(policy, { dev: installed[platform].dev || !installed[platform].core })
    const read = readText(target, fsImpl)
    if (read.state === 'invalid') {
      report('warn', label, `cannot read the file: ${read.error}`)
      continue
    }
    let plan
    try {
      plan = planPolicyUpdate(read.text, expected, version)
    } catch (error) {
      report('drift', label, `${error.message} Fix the markers by hand, then: ${fix}`)
      continue
    }
    if (plan.status === 'ADDED') report('warn', label, `no Agent OS block. To add it: ${fix}`)
    else if (plan.changed) {
      const block = policyBlockVersion(read.text)
      report('drift', label, `${block ? `block is version ${block}` : 'block has no version line, so an older installer wrote it'} ` +
        `and differs from this CLI's ${version}. To update it: ${fix}`)
    } else report('ok', label, `version ${version}`)
  }
}

export function latestPublishedVersion(packageName, { spawn = spawnSync } = {}) {
  if (!/^@?[a-z0-9][a-z0-9._/-]*$/.test(packageName)) return null
  // npm is a .cmd shim on Windows, which needs a shell; one fixed command string avoids argument joining.
  let result
  try {
    result = spawn(`npm view ${packageName} version`, {
      encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'], shell: true
    })
  } catch {
    return null
  }
  const value = result?.status === 0 ? String(result.stdout ?? '').trim() : ''
  return /^[0-9][0-9A-Za-z.+-]*$/.test(value) ? value : null
}

export function collectDoctorReport({
  version, packageName, packagedSkills, packageSkills, policy, homeDir = os.homedir(), cwd = process.cwd(),
  fsImpl = fs, latest = null
}) {
  const entries = []
  const report = (level, area, message) => entries.push({ level, area, message })

  if (!latest) report('info', 'installer', `version ${version}; the latest published version was not checked`)
  else if (compareVersions(latest, version) > 0) {
    report('warn', 'installer', `this CLI is ${version}, the latest published version is ${latest}. Run: npx ${packageName}@latest doctor`)
  } else if (compareVersions(latest, version) < 0) {
    report('info', 'installer', `this CLI is ${version}, newer than the published ${latest}`)
  } else report('ok', 'installer', `version ${version} is the latest published version`)

  const host = () => ({ direct: false, plugin: false, core: false, dev: false })
  const installed = { claude: host(), codex: host() }
  const mark = (platform, packages) => {
    if (packages.includes(CORE) || packages.includes(LEGACY_PLUGIN)) installed[platform].core = true
    if (packages.includes(DEV) || packages.includes(LEGACY_PLUGIN)) installed[platform].dev = true
  }
  for (const target of directRoots(homeDir, cwd)) {
    const direct = checkDirectInstall(target, { version, packageName, packagedSkills, packageSkills, fsImpl, report })
    if (direct) {
      installed[target.platform].direct = true
      mark(target.platform, direct.packages)
    }
  }
  const claudePlugin = checkClaudePlugin(homeDir, { version, fsImpl, report })
  installed.claude.plugin = claudePlugin.keys.length > 0
  installed.claude.unknown = claudePlugin.unknown
  mark('claude', claudePlugin.names ?? [])
  const codexPlugins = checkCodexPlugin(homeDir, { version, fsImpl, report })
  installed.codex.plugin = codexPlugins.length > 0
  mark('codex', codexPlugins)

  if (installed.claude.direct && installed.claude.plugin) {
    const uninstall = claudePlugin.keys.map((key) => `claude plugin uninstall ${key}`).join(' and ')
    report('warn', 'claude', 'both the plugin and a direct install are present, so every skill appears twice (/agent-os-core:<skill> or /agent-os-dev:<skill>, and /<skill>). ' +
      `Keep one: ${uninstall}, or delete the directories listed in the direct install manifest.`)
  }
  if (installed.codex.direct && installed.codex.plugin) {
    report('warn', 'codex', 'both the plugin and a direct install are present, so Codex lists every skill twice. ' +
      'Keep one: uninstall the plugin in /plugins, or delete the directories listed in the direct install manifest.')
  }
  const agentsRoot = path.join(homeDir, '.agents', 'skills')
  const strays = packagedSkills.filter((name) => fsImpl.existsSync(path.join(agentsRoot, name, 'SKILL.md')))
  if (strays.length) {
    report('warn', `codex ${agentsRoot}`, `Agent OS skills outside the managed install: ${strays.join(', ')}. ` +
      `Codex may list them next to the managed copies. Delete these directories from ${agentsRoot} if you did not install them on purpose.`)
  }
  if (!Object.values(installed).some((host) => host.direct || host.plugin || host.unknown)) {
    report('warn', 'install', `no Agent OS installation found. Run: npx ${packageName}@latest install`)
  }

  checkPolicy(homeDir, { version, packageName, policy, installed, fsImpl, report })
  return { entries, drift: entries.some((entry) => entry.level === 'drift') }
}

export function formatDoctorReport({ entries, drift }) {
  const lines = entries.map((entry) => `${entry.level.toUpperCase().padEnd(6)}${entry.area}: ${entry.message}`)
  lines.push(drift
    ? 'Agent OS installations differ from this CLI. Follow the listed fixes, then start a new host session.'
    : 'No version drift found.')
  return lines.join('\n') + '\n'
}
