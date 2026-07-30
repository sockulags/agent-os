#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function json(file, diagnostics, code) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    diagnostics.push({ code, message: `${path.basename(file)}: ${error.message}` })
    return null
  }
}

function filesUnder(root, predicate = () => true) {
  if (!fs.existsSync(root)) return []
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name)
    if (entry.isDirectory() && ['node_modules', 'cache', 'dist'].includes(entry.name)) return []
    return entry.isDirectory() ? filesUnder(target, predicate) : predicate(target) ? [target] : []
  })
}

function frontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return null
  const values = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator > 0) values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return values
}

function sortedEqual(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
}

function stripFencedCode(content) {
  return content.replace(/```[\s\S]*?```/g, '')
}

function linkExists(source, rawTarget, root) {
  const target = rawTarget.split('#')[0].split('?')[0]
  if (!target || /^(https?:|mailto:|tel:)/.test(target)) return true

  let resolved
  if (target.startsWith('/')) {
    resolved = target === '/logo.svg'
      ? path.join(root, 'docs-site/public/logo.svg')
      : path.join(root, 'docs-site', target.slice(1))
  } else {
    resolved = path.resolve(path.dirname(source), decodeURIComponent(target))
  }

  const candidates = [
    resolved,
    `${resolved}.md`,
    path.join(resolved, 'index.md')
  ]
  return candidates.some((candidate) => fs.existsSync(candidate))
}

function checkContains(diagnostics, file, required, code) {
  const content = read(file)
  for (const token of required) {
    if (!content.includes(token)) {
      diagnostics.push({ code, message: `${path.relative(path.dirname(scriptDir), file)} missing ${JSON.stringify(token)}` })
    }
  }
}

function skillTable(content) {
  const rows = new Map()
  const pattern = /^\| (?:\[`([^`]+)`\]\([^)]*\)|`([^`]+)`) \| (workflow|discipline|meta) \| (manual|automatic) \| ([^|]+?) \|$/gm
  for (const match of content.matchAll(pattern)) {
    rows.set(match[1] ?? match[2], {
      bucket: match[3],
      invocation: match[4],
      summary: match[5].trim()
    })
  }
  return rows
}

export function validate(root = path.resolve(scriptDir, '..')) {
  const diagnostics = []
  const fail = (code, message) => diagnostics.push({ code, message })
  const skillsRoot = path.join(root, 'skills')
  const docsSkillsRoot = path.join(root, 'docs-site/skills')
  const skillNames = fs.existsSync(skillsRoot)
    ? fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsRoot, entry.name, 'SKILL.md')))
      .map((entry) => entry.name)
      .sort()
    : []
  const docsSkillNames = fs.existsSync(docsSkillsRoot)
    ? fs.readdirSync(docsSkillsRoot)
      .filter((name) => name.endsWith('.md') && name !== 'index.md')
      .map((name) => name.slice(0, -3))
      .sort()
    : []
  const documentedSkills = new Map()

  if (!skillNames.length) fail('SKILL_NONE', 'No skills found.')

  for (const name of skillNames) {
    const skillFile = path.join(skillsRoot, name, 'SKILL.md')
    const skillText = read(skillFile)
    const meta = frontmatter(skillText)
    if (!meta) {
      fail('SKILL_FRONTMATTER', `${name}: missing bounded frontmatter.`)
      continue
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || meta.name !== name) {
      fail('SKILL_NAME', `${name}: folder and frontmatter name must match kebab-case.`)
    }
    if (!meta.description) fail('SKILL_DESCRIPTION', `${name}: description is required.`)

    const docFile = path.join(docsSkillsRoot, `${name}.md`)
    if (!fs.existsSync(docFile)) {
      fail('SKILL_DOC_MISSING', `${name}: docs-site/skills/${name}.md is required.`)
      continue
    }
    const docText = read(docFile)
    const docMeta = frontmatter(docText)
    const docBody = docText.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trimStart()
    if (!docBody.startsWith(`# ${name}\n`) && !docBody.startsWith(`# ${name}\r\n`)) {
      fail('SKILL_DOC_HEADING', `${name}: documentation H1 must equal the skill name.`)
    }
    if (docMeta?.['skill-description'] !== meta.description) {
      fail('SKILL_DOC_DESCRIPTION', `${name}: skill-description must equal SKILL.md frontmatter description.`)
    }
    if (!docMeta?.summary) {
      fail('SKILL_DOC_SUMMARY', `${name}: documentation frontmatter summary is required.`)
    }
    const contract = docText.match(/\*\*Bucket:\*\*\s*(workflow|discipline|meta)\s*·\s*\*\*Invocation:\*\*\s*(manual|automatic)/)
    if (!contract) {
      fail('SKILL_DOC_CONTRACT', `${name}: documentation must declare Bucket and Invocation.`)
      continue
    }
    const [, bucket, invocation] = contract
    documentedSkills.set(name, { bucket, invocation, summary: docMeta?.summary })
    const shouldBeManual = bucket === 'workflow' || bucket === 'meta'
    if ((invocation === 'manual') !== shouldBeManual) {
      fail('SKILL_INVOCATION_CLASS', `${name}: ${bucket} must use ${shouldBeManual ? 'manual' : 'automatic'} invocation.`)
    }

    const claudeManual = meta['disable-model-invocation'] === 'true'
    const codexGate = path.join(skillsRoot, name, 'agents/openai.yaml')
    const normalizedCodexGate = fs.existsSync(codexGate)
      ? read(codexGate).replace(/\r\n/g, '\n').trim()
      : ''
    const codexManual = normalizedCodexGate === 'policy:\n  allow_implicit_invocation: false'
    if (invocation === 'manual' && (!claudeManual || !codexManual)) {
      fail('SKILL_MANUAL_GATE', `${name}: both Claude and Codex manual invocation gates are required.`)
    }
    if (invocation === 'automatic' && (claudeManual || fs.existsSync(codexGate))) {
      fail('SKILL_AUTOMATIC_GATE', `${name}: automatic skills must not carry manual invocation gates.`)
    }
  }

  if (!sortedEqual(skillNames, docsSkillNames)) {
    fail('SKILL_DOC_PARITY', `Skill sources and documentation pages differ: skills=${skillNames.join(',')} docs=${docsSkillNames.join(',')}.`)
  }

  for (const [surface, rows] of [
    ['README.md', skillTable(read(path.join(root, 'README.md')))],
    ['docs-site/skills/index.md', skillTable(read(path.join(root, 'docs-site/skills/index.md')))]
  ]) {
    if (!sortedEqual(skillNames, [...rows.keys()])) {
      fail('SKILL_OVERVIEW_PARITY', `${surface}: skill table differs from distributed skills.`)
      continue
    }
    for (const name of skillNames) {
      const row = rows.get(name)
      const contract = documentedSkills.get(name)
      if (!contract || row.bucket !== contract.bucket || row.invocation !== contract.invocation ||
          row.summary !== contract.summary) {
        fail('SKILL_OVERVIEW_DRIFT', `${surface}: ${name} disagrees with its documentation contract.`)
      }
    }
  }

  const claudeManifest = json(path.join(root, '.claude-plugin/plugin.json'), diagnostics, 'MANIFEST_CLAUDE_JSON')
  const codexManifest = json(path.join(root, '.codex-plugin/plugin.json'), diagnostics, 'MANIFEST_CODEX_JSON')
  if (claudeManifest && codexManifest) {
    for (const key of ['name', 'description', 'version', 'homepage', 'repository', 'keywords']) {
      if (JSON.stringify(claudeManifest[key]) !== JSON.stringify(codexManifest[key])) {
        fail('MANIFEST_PARITY', `${key} differs between plugin manifests.`)
      }
    }
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(claudeManifest.version ?? '')) {
      fail('MANIFEST_VERSION', 'Plugin version must be stable numeric X.Y.Z without leading zeros.')
    }
    if (codexManifest.skills !== './skills/') fail('MANIFEST_SKILLS_PATH', 'Codex skills path must be ./skills/.')
    if (codexManifest.homepage !== codexManifest.interface?.websiteURL) {
      fail('MANIFEST_HOMEPAGE', 'Codex homepage and interface.websiteURL must match.')
    }
    const config = read(path.join(root, 'docs-site/.vitepress/config.mjs'))
    if (!config.includes(`text: 'v${claudeManifest.version}'`)) {
      fail('MANIFEST_DOCS_VERSION', 'Documentation navigation version does not match manifests.')
    }
    const manifestDocs = read(path.join(root, 'docs-site/reference/plugin-manifests.md'))
    const documentedVersions = [...manifestDocs.matchAll(/"version":\s*"([^"]+)"/g)].map((match) => match[1])
    if (documentedVersions.length < 2 || documentedVersions.some((version) => version !== claudeManifest.version)) {
      fail('MANIFEST_DOCS_VERSION', 'Documented manifest examples do not match the release version.')
    }
  }

  const claudeMarketplace = json(path.join(root, '.claude-plugin/marketplace.json'), diagnostics, 'MARKETPLACE_CLAUDE_JSON')
  const codexMarketplace = json(path.join(root, '.agents/plugins/marketplace.json'), diagnostics, 'MARKETPLACE_CODEX_JSON')
  if (claudeMarketplace?.plugins?.[0]?.name !== 'agent-os' || claudeMarketplace?.plugins?.[0]?.source !== './') {
    fail('MARKETPLACE_CLAUDE', 'Claude marketplace must expose agent-os from ./.')
  }
  const codexPlugin = codexMarketplace?.plugins?.[0]
  if (codexPlugin?.name !== 'agent-os' || codexPlugin?.source?.source !== 'local' || codexPlugin?.source?.path !== './') {
    fail('MARKETPLACE_CODEX', 'Codex marketplace must expose local agent-os from ./.')
  }

  const evalManifestFile = path.join(root, 'evals/cases/manifest.json')
  const evalManifest = json(evalManifestFile, diagnostics, 'EVAL_MANIFEST_JSON')
  if (evalManifest) {
    if (evalManifest.schema !== 1) fail('EVAL_MANIFEST_SCHEMA', 'Eval manifest schema must be 1.')
    const evalSkills = Object.keys(evalManifest.skills ?? {}).sort()
    if (!sortedEqual(skillNames, evalSkills)) {
      fail('EVAL_SKILL_PARITY', `Eval manifest and skills differ: skills=${skillNames.join(',')} evals=${evalSkills.join(',')}.`)
    }
    for (const name of skillNames) {
      const cases = evalManifest.skills?.[name]
      for (const polarity of ['positive', 'negative']) {
        const refs = cases?.[polarity]
        if (!Array.isArray(refs) || new Set(refs).size < 2) {
          fail('EVAL_CASE_COUNT', `${name}: at least two unique ${polarity} cases are required.`)
          continue
        }
        for (const reference of refs) {
          const separator = reference.indexOf('#')
          const fileName = separator >= 0 ? reference.slice(0, separator) : reference
          const caseName = separator >= 0 ? reference.slice(separator + 1) : ''
          const caseFile = path.join(root, 'evals/cases', fileName)
          const fileOwner = fileName === `${name}.md` || fileName.startsWith(`${name}-`)
          const positiveName = /^Positive(?:\s|$)/.test(caseName) || /-P\d/.test(caseName)
          const negativeName = /^Negative(?:\s|$)/.test(caseName) || /-N\d/.test(caseName)
          if (!fileOwner) {
            fail('EVAL_CASE_OWNER', `${name}: ${reference} is not owned by this skill.`)
          }
          if ((polarity === 'positive' && !positiveName) || (polarity === 'negative' && !negativeName)) {
            fail('EVAL_CASE_POLARITY', `${name}: ${reference} does not match ${polarity} polarity.`)
          }
          if (!caseName || !fs.existsSync(caseFile) || !read(caseFile).includes(`| ${caseName} |`)) {
            fail('EVAL_CASE_REF', `${name}: unresolved ${polarity} case ${reference}.`)
          }
        }
      }
    }
  }

  checkContains(diagnostics, path.join(root, 'skills/deliver-work/workflow.md'), [
    '**Outcome:**',
    '**Boundaries:**',
    '**Ground truth:**',
    'An implementation request authorizes in-scope repository edits.',
    'The record is working memory,',
    'Add independent review when'
  ], 'DELIVER_CONTRACT')

  checkContains(diagnostics, path.join(root, 'skills/chart-work/references/map.md'),
    ['The map orients.', 'Identity is', 'Origin map:', 'Branch key:', 'Search before creating'],
    'CHART_HANDOFF_CONTRACT')

  checkContains(diagnostics, path.join(root, 'skills/batch-work/references/manifest.md'), [
    'agent_os_batch: 2',
    'Statuses are `planned`, `running`, `reconciling`, `verifying`, `ready`, `delivered`, and `blocked`.',
    'manifest_hash: ""',
    '```json batch-plan',
    '```json batch-task',
    '```json batch-runtime',
    'Identity is `(batch_id, task_key)`',
    'Hashes detect definition drift; they do not represent human approval.',
    'Worker-local checks are useful context but are not proof'
  ], 'BATCH_MANIFEST_CONTRACT')
  checkContains(diagnostics, path.join(root, 'skills/batch-work/SKILL.md'), [
    'The request defines whether',
    'A planning-only request stops here;',
    'Each worker gets',
    'Individual worker checks never substitute for aggregate verification.'
  ], 'BATCH_WORKFLOW_CONTRACT')
  checkContains(diagnostics, path.join(root, 'skills/deliver-work/workflow.md'), [
    'The coordinator owns integration and aggregate verification.'
  ], 'BATCH_DELIVERY_BOUNDARY')
  for (const script of ['manifest-hash.mjs', 'test-manifest-hash.mjs']) {
    if (!fs.existsSync(path.join(root, 'skills/batch-work/scripts', script))) {
      fail('BATCH_HASH_SCRIPT', `skills/batch-work/scripts/${script} is required.`)
    }
  }
  checkContains(diagnostics, path.join(root, '.github/workflows/validate.yml'), [
    'node skills/batch-work/scripts/test-manifest-hash.mjs'
  ], 'BATCH_HASH_SCRIPT')
  if (!read(path.join(root, 'evals/cases/workflow-non-invocation.md')).includes('| W7 |') ||
      !read(path.join(root, 'evals/cases/workflow-non-invocation.md')).includes('| batch-work |')) {
    fail('BATCH_NON_INVOCATION', 'batch-work must retain an explicit non-invocation case.')
  }

  const markdownRoots = [
    path.join(root, 'README.md'),
    path.join(root, 'policy.md'),
    ...filesUnder(path.join(root, 'skills'), (file) => file.endsWith('.md')),
    ...filesUnder(path.join(root, 'docs-site'), (file) =>
      file.endsWith('.md') && !file.includes(`${path.sep}.vitepress${path.sep}`)),
    ...filesUnder(path.join(root, 'evals/cases'), (file) => file.endsWith('.md'))
  ]
  for (const file of markdownRoots) {
    const content = stripFencedCode(read(file))
    for (const match of content.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
      if (!linkExists(file, match[1], root)) {
        fail('LINK_BROKEN', `${path.relative(root, file)} -> ${match[1]}`)
      }
    }
  }

  return diagnostics.sort((a, b) => a.code.localeCompare(b.code) || a.message.localeCompare(b.message))
}

function main() {
  const args = process.argv.slice(2)
  if (args.length > 2 || (args.length === 2 && args[0] !== '--root') || args.length === 1) {
    console.error('Usage: node scripts/validate-agent-os.mjs [--root <repository>]')
    process.exitCode = 2
    return
  }
  const root = args.length === 2 ? path.resolve(args[1]) : path.resolve(scriptDir, '..')
  try {
    const diagnostics = validate(root)
    if (diagnostics.length) {
      for (const diagnostic of diagnostics) console.error(`${diagnostic.code}: ${diagnostic.message}`)
      console.error(`agent-os validation failed with ${diagnostics.length} violation(s).`)
      process.exitCode = 1
    } else {
      console.log('agent-os validation passed.')
    }
  } catch (error) {
    console.error(`VALIDATOR_INTERNAL: ${error.stack ?? error.message}`)
    process.exitCode = 2
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
