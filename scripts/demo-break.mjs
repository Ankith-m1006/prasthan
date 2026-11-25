#!/usr/bin/env node
// Stage tool: break the voice service under a rush, and show every 5 s that travellers still get answers.
// Default: FAULT_MODE=crash_on_voice on deploy/prasthan-voice + a 2-minute rush. --oom: 64Mi memory limit instead.
// --no-rush: skip the load. Env: PRASTHAN_URL (default http://localhost:8080), PRASTHAN_NS (default prasthan).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { API, NS, flag, kubectl, stamp, travellerCheck, voicePods } from './demo-lib.mjs';

const argv = process.argv.slice(2);
if (flag(argv, '--help')) {
  console.log(`node scripts/demo-break.mjs [--oom] [--no-rush] [--minutes 2]
  1. kubectl -n ${NS} set env deploy/prasthan-voice FAULT_MODE=crash_on_voice   (--oom: set resources --limits=memory=64Mi)
  2. node infra/load/rush.mjs --url ${API} --minutes 2                         (skipped with --no-rush)
  3. every 5 s: voice pod status/restarts + "traveller answers: OK|FAIL" (POST /v1/intent/parse)`);
  process.exit(0);
}
const minutes = Number(argv[argv.indexOf('--minutes') + 1]) || 2;

if (flag(argv, '--oom')) kubectl(['-n', NS, 'set', 'resources', 'deploy/prasthan-voice', '--limits=memory=64Mi']);
else kubectl(['-n', NS, 'set', 'env', 'deploy/prasthan-voice', 'FAULT_MODE=crash_on_voice']);

let child = null;
if (!flag(argv, '--no-rush')) {
  const rush = fileURLToPath(new URL('../infra/load/rush.mjs', import.meta.url));
  stamp(`$ node infra/load/rush.mjs --url ${API} --minutes ${minutes}`);
  child = spawn(process.execPath, [rush, '--url', API, '--minutes', String(minutes), '--connections', '30'], { stdio: ['ignore', 'ignore', 'inherit'] });
}

const end = Date.now() + minutes * 60_000;
while (Date.now() < end) {
  stamp(`${voicePods()}  ||  ${await travellerCheck()}`);
  await new Promise((r) => setTimeout(r, 5000));
}
child?.kill();
stamp('break window over. Run `node scripts/demo-fix.mjs` (or approve the NudgeBee runbook).');
