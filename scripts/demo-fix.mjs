#!/usr/bin/env node
// Stage tool: the MANUAL version of the NudgeBee runbook (use it if the runbook can't reach the laptop).
// 1. POST /v1/ops/fallback {on:true} (flips Flagsmith voice_fallback_offline via the api)  2. FAULT_MODE=none (or restore
// the memory limit with --oom)  3. kubectl rollout status  4. fallback off again (skip with --keep-fallback).
import { API, NS, flag, kubectl, ops, stamp, travellerCheck } from './demo-lib.mjs';

const argv = process.argv.slice(2);
if (flag(argv, '--help')) {
  console.log(`node scripts/demo-fix.mjs [--oom] [--keep-fallback]
  1. POST ${API}/v1/ops/fallback {"on":true}   (header x-ops-token from env OPS_TOKEN, never printed)
  2. kubectl -n ${NS} set env deploy/prasthan-voice FAULT_MODE=none   (--oom: set resources --limits=memory=256Mi)
  3. kubectl -n ${NS} rollout status deploy/prasthan-voice --timeout=120s
  4. POST ${API}/v1/ops/fallback {"on":false}  (skipped with --keep-fallback)`);
  process.exit(0);
}

await ops('/v1/ops/fallback', { on: true });
stamp(await travellerCheck());
if (flag(argv, '--oom')) kubectl(['-n', NS, 'set', 'resources', 'deploy/prasthan-voice', '--limits=memory=256Mi']);
else kubectl(['-n', NS, 'set', 'env', 'deploy/prasthan-voice', 'FAULT_MODE=none']);
kubectl(['-n', NS, 'rollout', 'status', 'deploy/prasthan-voice', '--timeout=120s']);
if (!flag(argv, '--keep-fallback')) await ops('/v1/ops/fallback', { on: false });
stamp(await travellerCheck());
stamp('fixed.');
