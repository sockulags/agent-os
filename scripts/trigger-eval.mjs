#!/usr/bin/env node
// Builds a `claude plugin eval` trigger suite from the case tables in evals/cases/*.md and
// summarizes its aggregate-result.json files per skill.
//
//   node scripts/trigger-eval.mjs build
//   claude plugin eval . --eval-dir evals/trigger-suite --trust-plugin --model <model> --json <file>
//   node scripts/trigger-eval.mjs summarize <result.json> [<baseline.json>]
//
// A table row becomes a trigger case when its prompt cell is a literal quoted prompt and its
// Expected cell starts with "Trigger `<skill>`" (positive) or "Do not trigger" (negative). Rows
// that describe scenarios or expected behavior without a trigger verdict are not trigger cases.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const suiteDir = path.join(root, 'evals/trigger-suite')
export const automaticSkills = [
  'check-work',
  'diagnose-before-fix',
  'notice-lesson',
  'plain-voice',
  'proportional-testing',
  'quality-ratchet',
  'scope-guard',
  'verify-before-done'
]

const slug = (text) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function triggerCases(skill, markdown) {
  const cases = []
  for (const line of markdown.split(/\r?\n/)) {
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length !== 3) continue
    const [name, promptCell, expected] = cells
    const quoted = promptCell.match(/^["“](.+)["”]$/)
    if (!quoted) continue
    const positive = expected.match(new RegExp(`^Trigger \`${skill}\`[;.,]?\\s*(.*)$`))
    const negative = /^Do not trigger\b/.test(expected)
    if (!positive && !negative) continue
    const polarity = positive ? 'positive' : 'negative'
    const set = /\bEN\d*\b/.test(name) ? 'english' : 'existing'
    cases.push({
      skill,
      name,
      id: [skill, polarity, set, slug(name)].join('--'),
      prompt: quoted[1],
      polarity,
      set,
      behavior: positive && set === 'english' && positive[1] ? positive[1] : ''
    })
  }
  return cases
}

function build() {
  fs.rmSync(suiteDir, { recursive: true, force: true })
  const all = []
  for (const skill of automaticSkills) {
    all.push(...triggerCases(skill, fs.readFileSync(path.join(root, 'evals/cases', `${skill}.md`), 'utf8')))
  }
  for (const item of all) {
    const dir = path.join(suiteDir, item.id)
    fs.mkdirSync(path.join(dir, 'graders'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'prompt.md'), [
      '---',
      `name: ${item.id}`,
      `tags: [${item.skill}, ${item.polarity}, ${item.set}]`,
      'max_turns: 4',
      'timeout_seconds: 240',
      '---',
      item.prompt,
      ''
    ].join('\n'))
    fs.writeFileSync(path.join(dir, 'graders', 'trigger.md'), [
      '---',
      'type: tool_used',
      'tool: Skill',
      `input_match: '"skill"\\s*:\\s*"(?:[\\w-]+:)?${item.skill}"'`,
      ...(item.polarity === 'positive' ? ['min: 1'] : ['min: 0', 'max: 0']),
      '---',
      `${item.polarity === 'positive' ? 'Fires' : 'Does not fire'} ${item.skill}.`,
      ''
    ].join('\n'))
    if (item.behavior) {
      fs.writeFileSync(path.join(dir, 'graders', 'behavior.md'), [
        '---',
        'type: llm',
        '---',
        `Pass only if the agent's final reply satisfies this expectation: ${item.behavior}`,
        'The workspace is empty, so judge how the agent handles the request, not whether files changed.',
        ''
      ].join('\n'))
    }
  }
  const count = (filter) => all.filter(filter).length
  console.log(`Wrote ${all.length} cases to ${path.relative(root, suiteDir)}: ` +
    `${count((c) => c.polarity === 'positive')} positive, ${count((c) => c.polarity === 'negative')} negative, ` +
    `${count((c) => c.set === 'english')} new English.`)
}

function grade(run, name) {
  return run.graders.find((grader) => grader.name === name)?.passed
}

function tally(result) {
  const skills = {}
  for (const item of result.cases) {
    const [skill, polarity, set] = item.name.split('--')
    const entry = skills[skill] ??= { positive: [0, 0], negative: [0, 0], english: [0, 0], existing: [0, 0], with: [0, 0], without: [0, 0] }
    for (const run of item.arms.with) {
      const correct = grade(run, 'trigger') === true ? 1 : 0
      entry[polarity][0] += correct
      entry[polarity][1] += 1
      entry[set][0] += correct
      entry[set][1] += 1
    }
    for (const arm of ['with', 'without']) {
      for (const run of item.arms[arm] ?? []) {
        const behavior = grade(run, 'behavior')
        if (behavior === undefined) continue
        entry[arm][0] += behavior ? 1 : 0
        entry[arm][1] += 1
      }
    }
  }
  return skills
}

const ratio = ([hit, total]) => (total ? `${hit}/${total}` : 'n/a')
const share = ([hit, total]) => (total ? hit / total : null)

function summarize(resultFile, baselineFile) {
  const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'))
  const skills = tally(result)
  const baseline = baselineFile ? tally(JSON.parse(fs.readFileSync(baselineFile, 'utf8'))) : null
  console.log(`claude ${result.claudeVersion}, model ${result.suite.modelOverride ?? 'default'}, ` +
    `plugin ${result.suite.plugins.map((p) => `${p.name}@${p.version}`).join(', ')}, ` +
    `ablation ${result.suite.ablation}, started ${result.startedAt}, cost $${result.costUsd.toFixed(2)}`)
  console.log('')
  console.log('| Skill | Positive runs fired | Negative runs silent | Existing cases | New English cases | Trigger accuracy |' +
    (baseline ? ' Baseline accuracy |' : '') + ' Behavior with | Behavior without |')
  console.log('|---|---:|---:|---:|---:|---:|' + (baseline ? '---:|' : '') + '---:|---:|')
  const totals = { positive: [0, 0], negative: [0, 0], english: [0, 0], existing: [0, 0], with: [0, 0], without: [0, 0] }
  const baseTotal = [0, 0]
  for (const skill of automaticSkills) {
    const entry = skills[skill]
    if (!entry) continue
    for (const key of Object.keys(totals)) totals[key] = totals[key].map((value, index) => value + entry[key][index])
    const accuracy = [entry.positive[0] + entry.negative[0], entry.positive[1] + entry.negative[1]]
    const base = baseline?.[skill]
    const baseAccuracy = base ? [base.positive[0] + base.negative[0], base.positive[1] + base.negative[1]] : null
    if (baseAccuracy) baseAccuracy.forEach((value, index) => { baseTotal[index] += value })
    const without = baseline && !entry.without[1] ? base?.without ?? entry.without : entry.without
    console.log(`| ${skill} | ${ratio(entry.positive)} | ${ratio(entry.negative)} | ${ratio(entry.existing)} | ` +
      `${ratio(entry.english)} | ${ratio(accuracy)} (${(share(accuracy) * 100).toFixed(0)}%) |` +
      (baseline ? ` ${baseAccuracy ? ratio(baseAccuracy) : 'n/a'} |` : '') +
      ` ${ratio(entry.with)} | ${ratio(without)} |`)
  }
  const accuracy = [totals.positive[0] + totals.negative[0], totals.positive[1] + totals.negative[1]]
  console.log(`| **Total** | ${ratio(totals.positive)} | ${ratio(totals.negative)} | ${ratio(totals.existing)} | ` +
    `${ratio(totals.english)} | ${ratio(accuracy)} (${(share(accuracy) * 100).toFixed(0)}%) |` +
    (baseline ? ` ${ratio(baseTotal)} |` : '') + ` ${ratio(totals.with)} | ${ratio(totals.without)} |`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'build') build()
  else if (command === 'summarize' && args[0]) summarize(args[0], args[1])
  else {
    console.error('Usage: node scripts/trigger-eval.mjs build | summarize <result.json> [<baseline.json>]')
    process.exit(1)
  }
}
