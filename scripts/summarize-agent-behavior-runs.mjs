#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { findCase, gradeCase, loadSuite } = require('../evals/behavior/lib/scorecard.cjs')

const runsIndex = process.argv.indexOf('--runs')
const repetitionsIndex = process.argv.indexOf('--repetitions')
if (runsIndex === -1 || repetitionsIndex === -1) {
  console.error('Usage: node scripts/summarize-agent-behavior-runs.mjs --runs <directory> --repetitions <count>')
  process.exit(2)
}

const root = path.resolve(process.argv[runsIndex + 1])
const expectedRepetitions = Number(process.argv[repetitionsIndex + 1])
const suite = loadSuite(path.resolve('evals/behavior/suite.json'))
const recordsDir = path.join(root, 'records')
const rows = fs.readdirSync(recordsDir)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => {
    const run = JSON.parse(fs.readFileSync(path.join(recordsDir, file), 'utf8'))
    const scorecard = gradeCase(findCase(suite, run.case_id), run)
    return {
      file,
      run_id: run.metadata?.run_id,
      case_id: run.case_id,
      score: scorecard.score,
      pass: scorecard.pass,
      failed_components: scorecard.components.filter((item) => !item.pass).map((item) => item.id)
    }
  })

const accepted = []
const rejected = []
for (const caseDefinition of suite.cases) {
  const caseRows = rows.filter((row) => row.case_id === caseDefinition.id)
  const passing = caseRows.filter((row) => row.pass).slice(-expectedRepetitions)
  const selected = new Set(passing.map((row) => row.file))
  accepted.push(...passing)
  rejected.push(...caseRows.filter((row) => !selected.has(row.file)))
}

const groups = Object.fromEntries(suite.cases.map((item) => {
  const matches = accepted.filter((row) => row.case_id === item.id)
  return [item.id, {
    accepted: matches.length,
    scores: matches.map((row) => row.score),
    minimum_score: matches.length ? Math.min(...matches.map((row) => row.score)) : 0
  }]
}))
const complete = Object.values(groups).every((group) => group.accepted === expectedRepetitions)
const report = {
  schema: 1,
  suite: suite.name,
  expected_repetitions: expectedRepetitions,
  complete,
  accepted,
  rejected,
  groups
}
fs.writeFileSync(path.join(root, 'accepted-records.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
process.exitCode = complete ? 0 : 1
