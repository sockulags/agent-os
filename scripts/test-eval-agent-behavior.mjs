import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { findCase, gradeCase, loadRun, loadSuite } = require('../evals/behavior/lib/scorecard.cjs')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const suite = loadSuite(path.join(root, 'evals/behavior/suite.json'))
const inspectAdapter = fs.readFileSync(path.join(root, 'evals/runners/inspect/agent_os_behavior.py'), 'utf8')
assert.equal((inspectAdapter.match(/text=True,\s+encoding="utf-8"/g) || []).length, 2,
  'Inspect harness and scorer subprocesses must decode UTF-8 explicitly on Windows')

const passing = loadRun(path.join(root, 'evals/behavior/fixtures/pass.json'))
const passScorecard = gradeCase(findCase(suite, passing.case_id), passing)
assert.equal(passScorecard.pass, true)
assert.equal(passScorecard.score, 1)
assert.equal(passScorecard.components.every((item) => item.pass), true)

const withoutJudgment = structuredClone(passing)
delete withoutJudgment.judgments
const incompleteScorecard = gradeCase(findCase(suite, withoutJudgment.case_id), withoutJudgment)
assert.equal(incompleteScorecard.pass, false)
assert.equal(incompleteScorecard.incomplete, true)

const withoutObservation = structuredClone(passing)
delete withoutObservation.trace.observation
const observationIncomplete = gradeCase(findCase(suite, withoutObservation.case_id), withoutObservation)
assert.equal(observationIncomplete.pass, false)
assert.equal(observationIncomplete.incomplete, true)
assert.equal(observationIncomplete.components.find((item) => item.id === 'observation_integrity')?.incomplete, true)

const blankObservation = structuredClone(passing)
blankObservation.trace.observation.filesystem.complete = false
const blankObservationScorecard = gradeCase(findCase(suite, blankObservation.case_id), blankObservation)
assert.equal(blankObservationScorecard.incomplete, true)

const missingJudgmentIdentity = structuredClone(passing)
delete missingJudgmentIdentity.judgments.behavior_quality.grader.name
const missingIdentityScorecard = gradeCase(findCase(suite, missingJudgmentIdentity.case_id), missingJudgmentIdentity)
assert.equal(missingIdentityScorecard.pass, false)
assert.equal(missingIdentityScorecard.incomplete, true)

const blankJudgmentIdentity = structuredClone(passing)
blankJudgmentIdentity.judgments.behavior_quality.grader.name = '   '
const blankIdentityScorecard = gradeCase(findCase(suite, blankJudgmentIdentity.case_id), blankJudgmentIdentity)
assert.equal(blankIdentityScorecard.pass, false)
assert.equal(blankIdentityScorecard.incomplete, true)

const criticalJudgmentCase = structuredClone(findCase(suite, passing.case_id))
criticalJudgmentCase.graders.find((item) => item.id === 'behavior_quality').critical = true
const lowJudgment = structuredClone(passing)
lowJudgment.judgments.behavior_quality.score = 0.5
const criticalJudgmentScorecard = gradeCase(criticalJudgmentCase, lowJudgment)
assert.equal(criticalJudgmentScorecard.pass, false)
assert.equal(criticalJudgmentScorecard.critical_failure, true)

const claimTrap = findCase(suite, 'unsupported-production-claim-trap')
const unsupportedClaimRun = structuredClone(passing)
unsupportedClaimRun.case_id = claimTrap.id
unsupportedClaimRun.trace.claims[0].text = 'The production deployment is healthy.'
const claimTrapScorecard = gradeCase(claimTrap, unsupportedClaimRun)
assert.equal(claimTrapScorecard.pass, false)
assert.equal(claimTrapScorecard.components.find((item) => item.id === 'claim_boundary').pass, false)

const outputOnlyForbiddenClaim = structuredClone(passing)
outputOnlyForbiddenClaim.case_id = claimTrap.id
outputOnlyForbiddenClaim.trace.claims = []
outputOnlyForbiddenClaim.output = 'The production deployment is healthy.'
const outputClaimScorecard = gradeCase(claimTrap, outputOnlyForbiddenClaim)
assert.equal(outputClaimScorecard.pass, false)
assert.equal(outputClaimScorecard.components.find((item) => item.id === 'claim_boundary')?.pass, false)

const summaryOnlyForbiddenClaim = structuredClone(passing)
summaryOnlyForbiddenClaim.case_id = claimTrap.id
summaryOnlyForbiddenClaim.trace.claims = []
summaryOnlyForbiddenClaim.output = 'The dispatch completed.'
summaryOnlyForbiddenClaim.summary = 'The production deployment is healthy.'
const summaryClaimScorecard = gradeCase(claimTrap, summaryOnlyForbiddenClaim)
assert.equal(summaryClaimScorecard.pass, false)
assert.equal(summaryClaimScorecard.components.find((item) => item.id === 'claim_boundary')?.pass, false)

const passingNoop = loadRun(path.join(root, 'evals/behavior/fixtures/pass-noop.json'))
const noopScorecard = gradeCase(findCase(suite, passingNoop.case_id), passingNoop)
assert.equal(noopScorecard.pass, true)
assert.equal(noopScorecard.score, 1)

const unexpectedReadOnlyChange = structuredClone(passingNoop)
unexpectedReadOnlyChange.trace.state.changes.push({
  id: 'unexpected-file',
  path: 'unexpected.txt',
  lane: 'backend',
  mutation: false,
  source: 'filesystem-snapshot',
  before: null,
  after: 'created'
})
const unexpectedChangeScorecard = gradeCase(findCase(suite, unexpectedReadOnlyChange.case_id), unexpectedReadOnlyChange)
assert.equal(unexpectedChangeScorecard.pass, false)
assert.equal(unexpectedChangeScorecard.components.find((item) => item.id === 'safe_noop')?.pass, false)
assert.equal(unexpectedChangeScorecard.components.find((item) => item.id === 'read_only_integrity')?.pass, false)
assert.equal(unexpectedChangeScorecard.components.find((item) => item.id === 'state_change_evidence')?.pass, false)

const failing = loadRun(path.join(root, 'evals/behavior/fixtures/fail.json'))
const failScorecard = gradeCase(findCase(suite, failing.case_id), failing)
assert.equal(failScorecard.pass, false)
assert.equal(failScorecard.critical_failure, true)
for (const id of [
  'workflow_selection', 'action_count', 'lane_ownership', 'safe_noop', 'evidence_grounding',
  'reversible_escalation', 'read_only_integrity', 'verification_sufficiency',
  'verification_minimality', 'async_completion', 'state_change_evidence', 'behavior_quality'
]) {
  assert.equal(failScorecard.components.find((item) => item.id === id)?.pass, false, `${id} should fail`)
}

const adapterRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-eval-adapter-'))
try {
  const harnessFile = path.join(adapterRoot, 'harness.cjs')
  fs.writeFileSync(harnessFile, `process.stdin.resume(); process.stdin.on('end', () => process.stdout.write(${JSON.stringify(JSON.stringify(passing))}));\n`)
  process.env.AGENT_OS_EVAL_HARNESS = `"${process.execPath}" "${harnessFile}"`
  const HarnessProvider = require('../evals/runners/promptfoo/harness-provider.cjs')
  const providerResponse = await new HarnessProvider().callApi('Dispatch the next safe task.', {
    vars: { case_id: passing.case_id }
  })
  assert.deepEqual(JSON.parse(providerResponse.output), passing)

  const promptfooAssertion = require('../evals/runners/promptfoo/scorecard-assertion.cjs')
  const assertionResult = promptfooAssertion(providerResponse.output, {
    config: { case_id: passing.case_id, suite: path.join(root, 'evals/behavior/suite.json') }
  })
  assert.equal(assertionResult.pass, true)
  assert.equal(assertionResult.componentResults.length, passScorecard.components.length)
} finally {
  delete process.env.AGENT_OS_EVAL_HARNESS
  fs.rmSync(adapterRoot, { recursive: true, force: true })
}

console.log('behavior eval scorecard suite passed.')
