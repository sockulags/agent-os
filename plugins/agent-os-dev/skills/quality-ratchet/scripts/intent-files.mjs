// Reads and checks intents/<id>/{intent,spec,plan}.md. Shared by the guard hooks and the
// `agent-os lint-intents` command, so both read the files the same way.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const INTENTS_DIR = 'intents'
export const INTENT_FILES = ['intent.md', 'spec.md', 'plan.md']
export const ID_PATTERN = /^\d{4}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/
export const STATUSES = {
  'intent.md': ['accepted', 'done', 'superseded'],
  'spec.md': ['accepted', 'superseded'],
  'plan.md': ['accepted', 'done', 'superseded']
}
const UPSTREAM = { 'spec.md': 'intent', 'plan.md': 'spec' }
const UNIT_LINE = /^-\s+\[([A-Za-z0-9][A-Za-z0-9._/-]*)\]\s+(.+)$/
const DEPENDS = /^depends on\s+(.+)$/i
const BLOCKED = /^blocked:\s*(.+)$/i

// Frontmatter is a flat `key: value` block between two `---` lines; values stay strings.
export function parseFrontmatter(text) {
  const normalized = String(text).replace(/\r\n/g, '\n')
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized)
  if (!match) return null
  const data = {}
  for (const line of match[1].split('\n')) {
    const entry = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*?)\s*$/.exec(line)
    if (entry) data[entry[1]] = entry[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return { data, body: normalized.slice(match[0].length) }
}

export function parseRev(value) {
  return /^[1-9]\d*$/.test(String(value ?? '')) ? Number(value) : null
}

export function parseBuiltOn(value, kind) {
  const match = new RegExp(`^${kind}@([1-9]\\d*)$`).exec(String(value ?? ''))
  return match ? Number(match[1]) : null
}

// Unit lines: `- [KEY] title`, optionally ` — depends on A, B` and ` — blocked: reason`.
export function parseUnits(body) {
  const lines = String(body).replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((line) => /^##\s+Units\s*$/.test(line))
  if (start < 0) return null
  const units = []
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break
    const match = UNIT_LINE.exec(line.trim())
    if (!match) continue
    const [title, ...notes] = match[2].split(/\s+(?:—|--)\s+/)
    const unit = { key: match[1], title: title.trim(), depends: [], blocked: null }
    for (const note of notes) {
      const depends = DEPENDS.exec(note.trim())
      const blocked = BLOCKED.exec(note.trim())
      if (depends) unit.depends.push(...depends[1].split(',').map((key) => key.trim()).filter(Boolean))
      else if (blocked) unit.blocked = blocked[1].trim()
    }
    units.push(unit)
  }
  return units
}

export function unitSections(body) {
  return new Set([...String(body).replace(/\r\n/g, '\n').matchAll(/^###\s+(\S+)/gm)].map((match) => match[1]))
}

function readFile(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

export function readIntent(root, id, dir = INTENTS_DIR) {
  const folder = { id, path: path.join(root, dir, id), files: {} }
  for (const name of INTENT_FILES) {
    const text = readFile(path.join(folder.path, name))
    if (text === null) continue
    folder.files[name] = { name, relative: `${dir}/${id}/${name}`, text, ...(parseFrontmatter(text) ?? { data: null, body: text }) }
  }
  return folder
}

export function listIntents(root, dir = INTENTS_DIR) {
  const base = path.join(root, dir)
  if (!fs.existsSync(base)) return []
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readIntent(root, entry.name, dir))
    .filter((folder) => Object.keys(folder.files).length > 0)
    .sort((a, b) => a.id.localeCompare(b.id))
}

// A spec built on an older intent revision, or a plan built on an older spec revision, is stale.
export function staleness(folder) {
  const stale = []
  for (const name of ['spec.md', 'plan.md']) {
    const file = folder.files[name]
    const kind = UPSTREAM[name]
    const upstream = folder.files[`${kind}.md`]
    if (!file?.data || !upstream?.data) continue
    const builtOn = parseBuiltOn(file.data.built_on, kind)
    const current = parseRev(upstream.data.rev)
    if (builtOn !== null && current !== null && builtOn < current) {
      stale.push({ file: file.relative, kind, builtOn, current })
    }
  }
  return stale
}

function checkFile(folder, name, ids, problems) {
  const file = folder.files[name]
  if (!file) return
  const error = (message) => problems.push({ level: 'error', file: file.relative, message })
  if (!file.data) return error('missing frontmatter between --- lines')
  const { data } = file
  if (name === 'intent.md' && data.id !== folder.id) error(`id "${data.id ?? ''}" must equal the folder name "${folder.id}"`)
  if (name !== 'intent.md' && data.intent !== folder.id) error(`intent "${data.intent ?? ''}" must equal the folder name "${folder.id}"`)
  if (!STATUSES[name].includes(data.status)) error(`status must be one of ${STATUSES[name].join(', ')}`)
  if (parseRev(data.rev) === null) error('rev must be a positive integer')
  if (name === 'intent.md' && data.supersedes && data.supersedes !== 'null' && !ids.has(data.supersedes)) {
    error(`supersedes "${data.supersedes}" is not an intent in this repository`)
  }
  if (name !== 'intent.md') {
    const kind = UPSTREAM[name]
    const builtOn = parseBuiltOn(data.built_on, kind)
    const upstream = folder.files[`${kind}.md`]
    const current = parseRev(upstream?.data?.rev)
    if (builtOn === null) error(`built_on must look like ${kind}@<rev>`)
    else if (!upstream) error(`built_on names ${kind}@${builtOn}, but ${kind}.md is missing`)
    else if (current !== null && builtOn > current) error(`built_on ${kind}@${builtOn} is newer than ${kind}.md rev ${current}`)
  }
  if (name === 'plan.md') {
    if (!['files', 'issues'].includes(data.source)) error('source must be files or issues')
    const units = parseUnits(file.body)
    if (!units || units.length === 0) return error('needs a "## Units" section with at least one "- [KEY] title" line')
    const keys = new Set()
    for (const unit of units) {
      if (keys.has(unit.key)) error(`unit key ${unit.key} appears twice`)
      keys.add(unit.key)
    }
    if (data.source === 'files') {
      const sections = unitSections(file.body)
      for (const unit of units) {
        for (const dependency of unit.depends) {
          if (!keys.has(dependency)) error(`unit ${unit.key} depends on unknown unit ${dependency}`)
        }
        if (!sections.has(unit.key)) error(`unit ${unit.key} needs a "### ${unit.key} <title>" section with its contract`)
      }
    }
  }
}

function gitShow(root, ref, relative) {
  const result = spawnSync('git', ['-C', root, 'show', `${ref}:${relative}`], { encoding: 'utf8' })
  return result.status === 0 ? result.stdout : null
}

function changedFiles(root, base, dir) {
  const result = spawnSync('git', ['-C', root, 'diff', '--name-only', `${base}...HEAD`, '--', dir], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git diff against ${base} failed: ${(result.stderr || '').trim()}`)
  return result.stdout.split('\n').map((line) => line.trim()).filter((line) => line.endsWith('.md'))
}

// Changing the text of an accepted file needs a higher rev; frontmatter-only edits such as a status
// change or a confirmed built_on do not.
function checkRevisions(root, base, dir, allowUnchangedRev, problems) {
  for (const relative of changedFiles(root, base, dir)) {
    const before = gitShow(root, base, relative)
    const afterText = readFile(path.join(root, relative))
    if (before === null || afterText === null) continue
    const old = parseFrontmatter(before)
    const now = parseFrontmatter(afterText)
    if (!old?.data || !now?.data || old.data.status !== 'accepted') continue
    const oldRev = parseRev(old.data.rev)
    const newRev = parseRev(now.data.rev)
    if (oldRev !== null && newRev !== null && newRev < oldRev) {
      problems.push({ level: 'error', file: relative, message: `rev went down from ${oldRev} to ${newRev}` })
    } else if (old.body.trim() !== now.body.trim() && oldRev !== null && newRev === oldRev && !allowUnchangedRev) {
      problems.push({
        level: 'error',
        file: relative,
        message: `an accepted file changed without raising rev ${oldRev}; raise it and add a decision log line, or mark a pure wording fix as allowed`
      })
    }
  }
}

export function lintIntents(root, { dir = INTENTS_DIR, base = null, allowUnchangedRev = false } = {}) {
  const problems = []
  const base_ = path.join(root, dir)
  if (fs.existsSync(base_)) {
    for (const entry of fs.readdirSync(base_, { withFileTypes: true })) {
      if (entry.isDirectory() && !ID_PATTERN.test(entry.name)) {
        problems.push({ level: 'error', file: `${dir}/${entry.name}`, message: 'folder name must be <YYYY-MM>-<slug> in lowercase kebab-case' })
      }
    }
  }
  const folders = listIntents(root, dir)
  const ids = new Set(folders.map((folder) => folder.id))
  for (const folder of folders) {
    if (!folder.files['intent.md']) {
      problems.push({ level: 'error', file: `${dir}/${folder.id}`, message: 'intent.md is missing' })
    }
    for (const name of INTENT_FILES) checkFile(folder, name, ids, problems)
    for (const item of staleness(folder)) {
      problems.push({
        level: 'warning',
        file: item.file,
        message: `stale: built on ${item.kind}@${item.builtOn}, but ${item.kind}.md is at rev ${item.current}`
      })
    }
  }
  if (base) checkRevisions(root, base, dir, allowUnchangedRev, problems)
  return problems
}
