# Session A status

Phase: A-01 done (api core on seed data). Next: A-02 voice (code mostly written, not yet mounted).
Branch: main (single builder on the home laptop; venue sessions branch from origin/main)
Contract version I built against: 1
Last merged to main: A-01

## Done
- P0: AGENTS.md, root package.json, shared/contract v1 (types, 12 schemas, 11 examples), contract test.
- A-01: config (env read once, SET/MISSING logging), seed loader, in-memory store + demo clock (DEMO_TODAY at the real IST time),
  MockFlagsProvider (defaults from config/flagsmith/flags.json + segment rules + ops overrides), Prometheus metrics,
  all non-voice routes, error handler `{error:{code,message}}`, CORS open.
- Tests: 35 green (contract, api core incl. notified 15 -> 16, demand 2400/880, sweet shop 9 kg, ops token, metrics; rule parser).

## Endpoints live (mock mode)
GET /health, GET /metrics, POST /v1/identify, GET /v1/config, GET /v1/options, POST /v1/trips, GET /v1/alerts,
GET /v1/partners, GET /v1/partners/:id/demand, POST /v1/partners/:id/services, POST /v1/gifts/orders,
GET /v1/partners/:id/orders, POST /v1/ops/fallback, POST /v1/ops/reset, GET /v1/ops/state.

## Notes for B
- `want` in demand is the seeded forecast only (saved trips do not change it), so the board keeps "2,400 want".
- Add buses enforces the Flagsmith flag `operator_add_service` for that partner (403 `flag_off` if off).
- Alerts: live alerts (new buses) come first, then announcements + seed alerts (traveller's routes first). `since` filters by createdAt.

## Working on now
- A-02 voice (Sarvam client + rule parser + fallback + fault injection).

## Blocked / broken
-

## REQUESTS TO OTHERS
- B and C: merge main to get the contract.

## ANSWERS (to requests from others)
-

## How to run what I built
- `cd services/api && npm install && npm run check`
- `MOCK_ALL=1 npm --prefix services/api run dev` (port 8787; reads ../../.env if present)
