#!/usr/bin/env node

import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { findCase, gradeCase, loadRun, loadSuite } = require('../evals/behavior/lib/scorecard.cjs')

function argument(name, fallback) {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1]
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..')
const suiteFile = path.resolve(argument('--suite', path.join(root, 'evals/behavior/suite.json')))
const runFile = argument('--run')

if (!runFile) {
  console.error('Usage: node scripts/eval-agent-behavior.mjs --run <run.json> [--suite <suite.json>] [--json]')
  process.exit(2)
}

try {
  const suite = loadSuite(suiteFile)
  const run = loadRun(path.resolve(runFile))
  const scorecard = gradeCase(findCase(suite, run.case_id), run)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(scorecard, null, 2))
  } else {
    console.log(`${scorecard.pass ? 'PASS' : scorecard.incomplete ? 'INCOMPLETE' : 'FAIL'} ${scorecard.case_id} score=${scorecard.score}`)
    for (const component of scorecard.components) {
      console.log(`${component.pass ? 'PASS' : component.incomplete ? 'INCOMPLETE' : 'FAIL'} ${component.id}: ${component.reason}`)
    }
  }
  process.exitCode = scorecard.pass ? 0 : 1
} catch (error) {
  console.error(error.message)
  process.exitCode = 2
}
