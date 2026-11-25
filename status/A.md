# Session A status

Phase: P0 done (contract v1 + api skeleton)
Branch: main (single builder on the home laptop; venue sessions branch from origin/main)
Contract version I built against: 1
Last merged to main: P0

## Done
- P0: AGENTS.md, root package.json (scripts only), shared/contract v1 (types.ts, 12 schema files, 11 examples), services/api skeleton with GET /health.
- Contract test (services/api/test/contract.test.ts): every example validates against its schema (ajv 2020, `strict: false`).

## Endpoints that exist
- GET /health

## Working on now
- A-01 api core

## Blocked / broken
-

## REQUESTS TO OTHERS
- B and C: merge main now to get the contract (`shared/contract/src/types.ts`, examples in `shared/contract/examples/`).

## ANSWERS (to requests from others)
-

## How to run what I built
- `cd services/api && npm install && npm run check`
- `npm --prefix services/api run dev` then `curl -s http://localhost:8787/health`
