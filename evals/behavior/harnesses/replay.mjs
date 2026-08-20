#!/usr/bin/env node

import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

let input = ''
for await (const chunk of process.stdin) input += chunk
const payload = JSON.parse(input)
const replayRoot = process.env.AGENT_OS_EVAL_REPLAY_DIR
if (!replayRoot) throw new Error('AGENT_OS_EVAL_REPLAY_DIR is required.')
const root = path.resolve(replayRoot)
const requested = payload.record_file
  ? path.resolve(root, 'records', path.basename(payload.record_file))
  : path.resolve(root, `${payload.case_id}.json`)
if (!requested.startsWith(`${root}${path.sep}`)) throw new Error('Replay record escaped the replay root.')
const run = await fsp.readFile(requested, 'utf8')
process.stdout.write(run.trim())
