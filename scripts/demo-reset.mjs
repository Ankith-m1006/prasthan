#!/usr/bin/env node
// Stage tool: back to a clean demo. POST /v1/ops/reset (reload seed), fallback off, FAULT_MODE=none.
import { API, NS, flag, kubectl, ops, stamp } from './demo-lib.mjs';

if (flag(process.argv.slice(2), '--help')) {
  console.log(`node scripts/demo-reset.mjs [--no-k8s]
  POST ${API}/v1/ops/reset, POST ${API}/v1/ops/fallback {"on":false}, kubectl -n ${NS} set env deploy/prasthan-voice FAULT_MODE=none`);
  process.exit(0);
}
await ops('/v1/ops/reset');
await ops('/v1/ops/fallback', { on: false });
if (!flag(process.argv.slice(2), '--no-k8s')) kubectl(['-n', NS, 'set', 'env', 'deploy/prasthan-voice', 'FAULT_MODE=none']);
stamp('reset done.');
