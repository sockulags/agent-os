'use strict'

const { findCase, gradeCase, loadSuite, validateRun } = require('../../behavior/lib/scorecard.cjs')

module.exports = (output, context) => {
  try {
    const suite = loadSuite(context.config.suite)
    const run = validateRun(typeof output === 'string' ? JSON.parse(output) : output)
    if (run.case_id !== context.config.case_id) throw new Error(`Expected ${context.config.case_id}, got ${run.case_id}.`)
    const scorecard = gradeCase(findCase(suite, run.case_id), run)
    return {
      pass: scorecard.pass,
      score: scorecard.score,
      reason: scorecard.pass ? 'Behavior scorecard passed.' : `Behavior scorecard failed: ${scorecard.components.filter((item) => !item.pass).map((item) => item.id).join(', ')}`,
      componentResults: scorecard.components.map((item) => ({ pass: item.pass, score: item.score, reason: `${item.id}: ${item.reason}` }))
    }
  } catch (error) {
    return { pass: false, score: 0, reason: error.message }
  }
}
