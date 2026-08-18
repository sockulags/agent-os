'use strict'

const path = require('node:path')
const fs = require('node:fs')
const suite = require('../../behavior/suite.json')
const manifest = process.env.AGENT_OS_EVAL_RECORD_MANIFEST
  ? JSON.parse(fs.readFileSync(process.env.AGENT_OS_EVAL_RECORD_MANIFEST, 'utf8'))
  : null
const casesById = new Map(suite.cases.map((item) => [item.id, item]))
const tests = manifest
  ? manifest.accepted.map((record) => {
      const item = casesById.get(record.case_id)
      return {
        description: record.run_id,
        vars: { case_id: item.id, prompt: item.prompt, record_file: record.file },
        assert: [{
          type: 'javascript',
          value: 'file://./scorecard-assertion.cjs',
          metric: 'agent-os-behavior',
          threshold: item.threshold,
          config: { case_id: item.id, suite: path.resolve(__dirname, '../../behavior/suite.json') }
        }]
      }
    })
  : suite.cases.map((item) => ({
      description: item.id,
      vars: { case_id: item.id, prompt: item.prompt },
      assert: [{
        type: 'javascript',
        value: 'file://./scorecard-assertion.cjs',
        metric: 'agent-os-behavior',
        threshold: item.threshold,
        config: { case_id: item.id, suite: path.resolve(__dirname, '../../behavior/suite.json') }
      }]
    }))

module.exports = {
  description: 'agent-os behavior scorecard',
  prompts: ['{{prompt}}'],
  providers: [{ id: 'file://./harness-provider.cjs', label: 'agent-os harness' }],
  tests
}
