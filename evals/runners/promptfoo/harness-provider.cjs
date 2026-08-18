'use strict'

const { spawnSync } = require('node:child_process')

class AgentOsHarnessProvider {
  id() {
    return 'agent-os:behavior-harness'
  }

  async callApi(prompt, context) {
    const command = process.env.AGENT_OS_EVAL_HARNESS
    if (!command) {
      return { error: 'AGENT_OS_EVAL_HARNESS must name a command that writes one normalized run JSON object to stdout.' }
    }
    const input = JSON.stringify({
      schema: 1,
      case_id: context.vars.case_id,
      prompt,
      ...(context.vars.record_file ? { record_file: context.vars.record_file } : {})
    })
    const child = spawnSync(command, [], { shell: true, input, encoding: 'utf8', windowsHide: true })
    if (child.status !== 0) {
      return { error: `Harness exited ${child.status}: ${child.stderr.trim()}` }
    }
    try {
      JSON.parse(child.stdout)
    } catch (error) {
      return { error: `Harness returned invalid JSON: ${error.message}` }
    }
    return { output: child.stdout.trim() }
  }
}

module.exports = AgentOsHarnessProvider
