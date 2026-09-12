'use strict'

function run(id, planning, options = {}) {
  const stateChanges = options.stateChanges === 0 ? [] : [{
    id: `plan-${id.toLowerCase()}`,
    path: `planning/${id.toLowerCase()}.md`,
    lane: 'planning',
    mutation: true,
    source: 'filesystem-snapshot',
    before: null,
    after: 'created'
  }]
  const trace = {
    observation: {
      filesystem: { scope: 'plan-work-fixture', complete: true },
      tool_events: { source: 'trusted-tool-events', complete: true }
    },
    workflows: [{ name: 'plan-work', selected: true }],
    actions: [],
    claims: [{ id: 'plan-claim', text: 'The observed planning state satisfies the scenario contract.', material: true, evidence: ['plan-observation'] }],
    evidence: [{ id: 'plan-observation', kind: 'planning_state', source: 'filesystem-snapshot' }],
    escalations: [],
    verifications: [{ id: 'planning-check', kind: 'planning_state', passed: true, fresh: true }],
    async_jobs: [],
    state: { changes: stateChanges },
    planning
  }
  if (options.tracker) trace.tracker = options.tracker
  if (options.epic) trace.epic = options.epic
  if (options.idempotency) trace.idempotency = options.idempotency
  return {
    schema: 1,
    case_id: id,
    output: 'Planning state was recorded from the isolated fixture observation.',
    trace
  }
}

const runs = {
  'PW-P1': run('PW-P1', {
    depth: 'minimal', mode: 'direct-delivery', coverage: ['outcome', 'boundaries', 'verification']
  }, { stateChanges: 0 }),
  'PW-P2': run('PW-P2', {
    depth: 'coverage', mode: 'coherent-mission', fragmented: false,
    coverage: ['flows', 'states', 'errors', 'integrations']
  }),
  'PW-P3': run('PW-P3', {
    depth: 'coverage', required_work: ['technical-follow-up'], blocked_side_issue: false
  }),
  'PW-P4': run('PW-P4', {
    depth: 'coverage', order: ['foundation', 'integration', 'verification'],
    dependencies_valid: true, boundaries_preserved: true,
    continued_authorized_work: true, blocked_after_correction: false
  }),
  'PW-P5': run('PW-P5', {
    depth: 'focused-reconsideration', reset_all: false, paused: ['affected-branch'],
    continuing: ['independent-branch'], reconsideration_open: true
  }),
  'PW-P6': run('PW-P6', {
    depth: 'decision-map', decision_map: true, canonical_tickets: true,
    claims_before_work: true, workers_started: false, frontier: ['ticket-a', 'ticket-b']
  }),
  'PW-P7': run('PW-P7', {
    depth: 'issue-shaping', delivery_structure: 'issues', epic_required: false,
    mission_visible: true, verification: ['issue-a', 'issue-b']
  }),
  'PW-P8': run('PW-P8', {
    depth: 'issue-shaping', delivery_structure: 'epic', batch_requested: false,
    verification: ['aggregate', 'final-owner']
  }, { epic: {
    outcome: 'shared-outcome', acceptance: 'shared-acceptance', children: ['issue-a', 'issue-b'],
    aggregate_verification: 'aggregate', final_verification_owner: 'owner-a'
  }}),
  'PW-P9': run('PW-P9', {
    depth: 'coverage', authority_reused: true, reasked_decision: false, decision_id: 'api-contract-v1'
  }),
  'PW-P10': run('PW-P10', {
    depth: 'focused-question', question_count: 1, recommendation: 'option-a',
    consequence: 'option-b-changes-contract', mutation: false
  }),
  'PW-P11': run('PW-P11', {
    depth: 'coverage', local_correction: true, unsynced_delta: true
  }, { tracker: {
    before: { issue: 'open', label: 'needs-plan' }, after: { issue: 'open', label: 'needs-plan' },
    writes: [], pending_delta: [{ entity: 'issue-11', change: 'tracker correction' }]
  }}),
  'PW-P12': run('PW-P12', {
    depth: 'focused-reconsideration', prior_resolution_preserved: true,
    decision_under_review: 'api-contract-v1', reconsideration_status: 'open', history_addressable: true,
    impact_detected: true, pause_basis: 'decision-impact', blocked_after_impact: true,
    paused: ['affected-branch'], continuing: ['independent-branch']
  }),
  'PW-P13': run('PW-P13', {
    depth: 'coverage', relation: 'required-by-mission', file_distance_irrelevant: true,
    required_package: 'packages/shared'
  }),
  'PW-P14': run('PW-P14', {
    depth: 'coverage', adjacent_classification: 'mission-value', adjacent_followup_offered: false,
    unrelated_created: false, classification: ['adjacent', 'unrelated']
  }),
  'PW-P15': run('PW-P15', {
    depth: 'idempotent-reconciliation', reused_plan: true, reused_handoff: true,
    reused_issues: true, duplicate_artifacts: 0
  }, { idempotency: {
    key: 'plan:checkout-redesign', reused: true, duplicate_artifacts: 0, competing_specifications: 0
  }}),
  'PW-P16': run('PW-P16', {
    depth: 'aggregate-gate', child_delivered: 'issue-a', epic_status: 'open', siblings_started: false,
    aggregate_required: true, final_owner: 'owner-a'
  }, { epic: {
    status: 'open', aggregate_verification: 'required', final_verification_owner: 'owner-a',
    child_authority_closes_epic: false
  }})
}

module.exports = { runs }
