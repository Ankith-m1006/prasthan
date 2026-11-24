# C-02: rush load script, demo break/fix scripts, CI (Session C, 35 min)

## Paste into Codex

````
Session C. Read AGENTS.md, docs/K8S-TEMPLATES.md (Break / fix), docs/DEMO-SCRIPT.md (2:10 NudgeBee part). `git merge main`; read status/A.md.

GOAL: repeatable stage tools: a "special buses just opened" rush, a break, a fix, and CI.

FILES YOU OWN: infra/load/**, scripts/**, .github/workflows/ci.yml, status/C.md.

STEPS
1. infra/load/rush.mjs (Node, autocannon as a dependency in scripts/package.json or infra/load/package.json): args --url (default http://localhost:8080), --minutes, --connections. Mix: 50% GET /v1/alerts, 25% GET /v1/config, 20% GET /v1/options?routeId=BLR-HBL&date=2027-01-14&mode=bus, 5% POST /v1/voice/intent with a tiny bundled silent WAV (made in code) so the voice service is hit. Prints p50/p95/p99 + errors per route every 10 s. It must NOT cause live Sarvam calls at scale: the voice requests carry header x-load-test: 1 and A's api answers those via the mock path (write a REQUEST to A in status/C.md for this header if A hasn't done it).
2. scripts/demo-break.mjs: (a) kubectl -n prasthan set env deploy/prasthan-voice FAULT_MODE=crash_on_voice, (b) start rush for 2 min, (c) print a timeline every 5 s: voice pod status/restarts (kubectl get pods) AND a traveller check: POST /v1/intent/parse with shared/contract/examples/intent-parse.request.json -> print "traveller answers: OK" (HTTP 200 with an intent) or "traveller answers: FAIL". This line proves on stage that nobody is stranded. Flags: --no-rush, --oom (patch memory limit to 64Mi instead). Uses child_process with kubectl; prints commands before running.
3. scripts/demo-fix.mjs: the manual version of the NudgeBee runbook: (a) POST /v1/ops/fallback {on:true} with x-ops-token from env OPS_TOKEN (never print it), (b) kubectl set env FAULT_MODE=none (or restore the memory limit), (c) kubectl rollout status, (d) after ready, fallback off (flag --keep-fallback to skip). Prints each step with time.
4. scripts/demo-reset.mjs: POST /v1/ops/reset, fallback off, FAULT_MODE=none.
5. .github/workflows/ci.yml: on push/PR: setup-node 22; services/api: npm ci && npm run check; scripts: npm ci && npm test; apps/mobile: npm ci && npm run typecheck && npm test. MOCK_ALL=1. No secrets needed. Cache npm.

ACCEPTANCE CHECKS
- node infra/load/rush.mjs --url http://localhost:8787 --minutes 0.25 against A's api in MOCK_ALL=1 -> prints stats, errors 0
- node scripts/demo-break.mjs --help, node scripts/demo-fix.mjs --help (dry descriptions)
- ci.yml is valid YAML (npx --yes yaml-lint or a careful read)

FINISH: status/C.md, commit "C-02: rush load, break/fix scripts, CI", Merge steps. Report.
````
