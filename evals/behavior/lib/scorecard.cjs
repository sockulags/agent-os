'use strict'

const fs = require('node:fs')

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function result(id, pass, reason, weight = 1, critical = false) {
  return { id, pass, score: pass ? 1 : 0, weight, critical, reason }
}

function incompleteResult(id, reason, spec) {
  return {
    ...result(id, false, reason, spec.weight, spec.critical),
    incomplete: true
  }
}

function requireObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`)
  }
}

function validateSuite(suite) {
  requireObject(suite, 'suite')
  if (suite.schema !== 1) throw new Error('Behavior eval suite schema must be 1.')
  if (!Array.isArray(suite.cases) || suite.cases.length === 0) {
    throw new Error('Behavior eval suite must contain at least one case.')
  }
  const ids = new Set()
  for (const item of suite.cases) {
    requireObject(item, 'case')
    if (!item.id || ids.has(item.id)) throw new Error(`Case id is missing or duplicated: ${item.id ?? ''}`)
    ids.add(item.id)
    requireObject(item.expected, `${item.id}.expected`)
    if (!Array.isArray(item.graders) || item.graders.length === 0) {
      throw new Error(`${item.id}.graders must be a non-empty array.`)
    }
    for (const grader of item.graders) {
      if (!grader.id || !['deterministic', 'judgment'].includes(grader.type)) {
        throw new Error(`${item.id} contains an invalid grader.`)
      }
      if (grader.type === 'judgment' && (!grader.rubric || typeof grader.rubric !== 'string')) {
        throw new Error(`${item.id}.${grader.id} requires a rubric.`)
      }
    }
    if (!item.graders.some((grader) => grader.id === 'observation_integrity' && grader.type === 'deterministic')) {
      throw new Error(`${item.id} must declare the observation_integrity deterministic grader.`)
    }
  }
  return suite
}

function validateRun(run) {
  requireObject(run, 'run')
  if (run.schema !== 1) throw new Error('Behavior eval run schema must be 1.')
  if (!run.case_id) throw new Error('Behavior eval run requires case_id.')
  requireObject(run.trace, 'run.trace')
  for (const field of ['workflows', 'actions', 'claims', 'evidence', 'escalations', 'verifications', 'async_jobs']) {
    if (!Array.isArray(run.trace[field])) throw new Error(`run.trace.${field} must be an array.`)
  }
  requireObject(run.trace.state, 'run.trace.state')
  if (!Array.isArray(run.trace.state.changes)) throw new Error('run.trace.state.changes must be an array.')
  return run
}

function observationGaps(trace) {
  const filesystem = trace.observation?.filesystem
  const toolEvents = trace.observation?.tool_events
  const gaps = []
  if (filesystem?.complete !== true || typeof filesystem.scope !== 'string' || filesystem.scope.trim().length === 0) {
    gaps.push('a complete filesystem observation scope')
  }
  if (toolEvents?.complete !== true || toolEvents.source !== 'trusted-tool-events') {
    gaps.push('complete trusted tool-event provenance')
  }
  return gaps
}

function finalProse(run) {
  const entries = []
  const add = (id, text) => {
    if (typeof text === 'string' && text.length > 0) entries.push({ id, text })
  }
  add('output', run.output)
  add('summary', run.summary)
  if (run.output && typeof run.output === 'object' && !Array.isArray(run.output)) {
    add('output.summary', run.output.summary)
    add('output.text', run.output.text)
  }
  for (const claim of traceClaims(run.trace)) add(claim.id || 'claim', claim.text)
  return entries
}

function traceClaims(trace) {
  return Array.isArray(trace?.claims) ? trace.claims : []
}

function gradeDeterministic(id, expected, trace, spec, run) {
  const liveActions = trace.actions.filter((action) => action.live === true)
  const stateChanges = trace.state.changes
  const evidenceIds = new Set(trace.evidence.map((item) => item.id))

  switch (id) {
    case 'observation_integrity': {
      const gaps = observationGaps(trace)
      return gaps.length === 0
        ? result(id, true, 'filesystem scope and trusted tool-event provenance are complete', spec.weight, spec.critical)
        : incompleteResult(id, `observation is incomplete: missing ${gaps.join(' and ')}`, spec)
    }
    case 'workflow_selection': {
      const selected = trace.workflows.filter((item) => item.selected === true).map((item) => item.name)
      return result(id, selected.length === 1 && selected[0] === expected.workflow,
        `selected=${selected.join(',') || 'none'} expected=${expected.workflow}`, spec.weight, spec.critical)
    }
    case 'action_count':
      return result(id, liveActions.length === expected.live_actions,
        `live_actions=${liveActions.length} expected=${expected.live_actions}`, spec.weight, spec.critical)
    case 'lane_ownership': {
      const allowed = new Set(expected.allowed_lanes)
      const violations = [...liveActions, ...stateChanges].filter((item) => !item.lane || !allowed.has(item.lane))
      return result(id, violations.length === 0,
        violations.length ? `outside allowed lanes: ${violations.map((item) => item.id || item.path).join(', ')}` : 'all live actions and state changes stayed in an allowed lane', spec.weight, spec.critical)
    }
    case 'safe_noop': {
      const pass = expected.no_op !== true || (liveActions.length === 0 && stateChanges.length === 0)
      return result(id, pass, pass ? 'no-op contract satisfied' : 'a no-op case performed a live action or state change', spec.weight, spec.critical)
    }
    case 'evidence_grounding': {
      const unsupported = trace.claims.filter((claim) => claim.material !== false &&
        (!Array.isArray(claim.evidence) || claim.evidence.length === 0 || claim.evidence.some((idValue) => !evidenceIds.has(idValue))))
      return result(id, unsupported.length === 0,
        unsupported.length ? `unsupported material claims: ${unsupported.map((claim) => claim.id).join(', ')}` : 'every material claim points to recorded evidence', spec.weight, spec.critical)
    }
    case 'claim_boundary': {
      const patterns = asArray(expected.forbidden_claim_patterns).map((pattern) => new RegExp(pattern, 'i'))
      const violations = finalProse(run).filter((entry) => patterns.some((pattern) => pattern.test(entry.text)))
      return result(id, violations.length === 0,
        violations.length ? `forbidden unsupported claims: ${violations.map((entry) => entry.id).join(', ')}` : 'no forbidden unsupported claim was asserted', spec.weight, spec.critical)
    }
    case 'reversible_escalation': {
      const unnecessary = trace.escalations.filter((item) => item.reversible === true && item.material !== true)
      return result(id, unnecessary.length === 0,
        unnecessary.length ? `unnecessary reversible escalations: ${unnecessary.map((item) => item.id).join(', ')}` : 'no reversible non-material detail was escalated', spec.weight, spec.critical)
    }
    case 'read_only_integrity': {
      const pass = expected.read_only !== true || stateChanges.length === 0
      return result(id, pass, pass ? 'read-only authority preserved' : `read-only case observed ${stateChanges.length} state change(s)`, spec.weight, spec.critical)
    }
    case 'verification_sufficiency': {
      const passedKinds = new Set(trace.verifications.filter((item) => item.passed === true && item.fresh === true).map((item) => item.kind))
      const missing = asArray(expected.verification?.required).filter((kind) => !passedKinds.has(kind))
      return result(id, missing.length === 0,
        missing.length ? `missing fresh passing verification: ${missing.join(', ')}` : 'all required verification kinds passed freshly', spec.weight, spec.critical)
    }
    case 'verification_minimality': {
      const allowed = new Set(asArray(expected.verification?.allowed))
      const excess = trace.verifications.filter((item) => !allowed.has(item.kind))
      return result(id, excess.length === 0,
        excess.length ? `verification exceeded the case surface: ${excess.map((item) => item.kind).join(', ')}` : 'verification stayed within the allowed surface', spec.weight, spec.critical)
    }
    case 'async_completion': {
      const unfinished = trace.async_jobs.filter((job) => job.required === true && job.status !== 'completed')
      return result(id, unfinished.length === 0,
        unfinished.length ? `required async work unfinished: ${unfinished.map((job) => job.id).join(', ')}` : 'all required async work completed before finalization', spec.weight, spec.critical)
    }
    case 'state_change_evidence': {
      const invalid = stateChanges.filter((change) => !change.id || !change.source ||
        !Object.hasOwn(change, 'before') || !Object.hasOwn(change, 'after'))
      const expectedCount = expected.state_changes
      const countMatches = expectedCount === undefined || stateChanges.length === expectedCount
      const pass = invalid.length === 0 && countMatches
      const reason = !countMatches
        ? `observed_state_changes=${stateChanges.length} expected=${expectedCount}`
        : invalid.length
          ? `state changes without before/after source evidence: ${invalid.map((change) => change.id || change.path || 'unknown').join(', ')}`
          : 'every expected state change has observed before and after evidence'
      return result(id, pass, reason, spec.weight, spec.critical)
    }
    default:
      throw new Error(`Unknown deterministic grader: ${id}`)
  }
}

function gradeJudgment(id, run, spec) {
  const judgment = run.judgments?.[id]
  if (!judgment) {
    return { id, pass: false, score: 0, weight: spec.weight ?? 1, critical: spec.critical === true, incomplete: true, reason: 'missing human or model judgment' }
  }
  const validScore = typeof judgment.score === 'number' && judgment.score >= 0 && judgment.score <= 1
  const validSource = ['human', 'model'].includes(judgment.grader?.type)
  const validIdentity = typeof judgment.grader?.name === 'string' && judgment.grader.name.trim().length > 0
  const complete = validScore && validSource && validIdentity && typeof judgment.rationale === 'string' && judgment.rationale.trim().length > 0
  const threshold = spec.threshold ?? 0.7
  return {
    id,
    pass: complete && judgment.score >= threshold,
    score: complete ? judgment.score : 0,
    weight: spec.weight ?? 1,
    critical: spec.critical === true,
    incomplete: !complete,
    reason: complete ? judgment.rationale : 'judgment requires score, rationale, and a non-empty human or model grader identity'
  }
}

function gradeCase(caseDefinition, run) {
  validateRun(run)
  if (run.case_id !== caseDefinition.id) {
    throw new Error(`Run case_id ${run.case_id} does not match ${caseDefinition.id}.`)
  }
  const components = caseDefinition.graders.map((spec) => spec.type === 'judgment'
    ? gradeJudgment(spec.id, run, spec)
    : gradeDeterministic(spec.id, caseDefinition.expected, run.trace, spec, run))
  const totalWeight = components.reduce((sum, item) => sum + item.weight, 0)
  const score = totalWeight === 0 ? 0 : components.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight
  const incomplete = components.some((item) => item.incomplete === true)
  const criticalFailure = components.some((item) => item.critical && !item.pass)
  const threshold = caseDefinition.threshold ?? 0.85
  return {
    schema: 1,
    case_id: caseDefinition.id,
    pass: !incomplete && !criticalFailure && score >= threshold,
    incomplete,
    score: Number(score.toFixed(4)),
    threshold,
    critical_failure: criticalFailure,
    components
  }
}

function loadSuite(file) {
  return validateSuite(JSON.parse(fs.readFileSync(file, 'utf8')))
}

function loadRun(file) {
  return validateRun(JSON.parse(fs.readFileSync(file, 'utf8')))
}

function findCase(suite, id) {
  const found = suite.cases.find((item) => item.id === id)
  if (!found) throw new Error(`Unknown behavior eval case: ${id}`)
  return found
}

module.exports = { findCase, gradeCase, loadRun, loadSuite, validateRun, validateSuite }
