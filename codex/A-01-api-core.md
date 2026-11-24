# A-01: api core, seed, deep links, alerts, partners, demand (Session A, 55 min)

## Paste into Codex

````
Session A. Read AGENTS.md, docs/ARCHITECTURE.md (sections 3-4), codex/SESSIONS.md. Start with `git merge main` and read status/B.md + status/C.md for requests.

GOAL: every non-voice endpoint works on seed data, in mock mode, with tests.

FILES YOU OWN: services/api/**, shared/contract/** (bump VERSION if you change it), status/A.md.

STEPS
1. src/config.ts: read env once (PORT, ROLE, MOCK_ALL, SARVAM_MODE, FLAGSMITH_MODE, CONTEXT_DEV_MODE, OPS_TOKEN, VOICE_URL, DEMO_TODAY default "2027-01-05"). Export a `modes()` helper. Never expose values in logs; `logEnvPresence()` prints NAME: SET|MISSING.
2. src/seed.ts: load ../../seed/*.json (resolve from repo root via import.meta.url; allow SEED_DIR override for Docker) into typed objects. Fail fast with a clear message if a file is missing.
3. src/store.ts: in-memory store (trips, alerts, services, orders) initialised from seed; reset(); optional JSON snapshot to data/store.json (git-ignored) behind STORE_SNAPSHOT=1.
4. src/flags/defaults.ts: coded defaults for every flag in config/flagsmith/flags.json (read that file at start) and a `FlagsProvider` interface { getFlags(identity, traits): Promise<FlagsView> }. Implement MockFlagsProvider (defaults + segment logic for traits role/language/home_state/partner_type, matching the segmentOverrides in flags.json, plus in-memory overrides set by ops). A-03 adds the real Flagsmith provider later; routes depend only on the interface.
5. Routes (Fastify plugins, one file each under src/routes/):
   - GET /v1/config, POST /v1/identify (identity from header x-prasthan-identity or body; traits in body)
   - GET /v1/options: deep links from seed/deep-links.json filtered by mode and ordered by flag deep_link_providers; homepage unless useTemplate=true; warnings: rush night (from surge_warning.rushNights + festivals.json), tout warning (if showToutWarning), demand {want, have, label:"Seeded demo data"} from demand-forecast.json + live services. NO prices anywhere.
   - POST /v1/trips (saves intent, subscribed true), GET /v1/alerts?identity&since (seed alerts + live alerts + special_service_announcements flag, newest first; match the traveller's saved trips' routeId first)
   - GET /v1/partners?type, GET /v1/partners/:id/demand (bus_operator from demand-forecast + live services; sweet_shop from gift-orders + live orders, grouped by pickupDate+item; quick_commerce from qc-demand.json), each cell has a suggestion string (ARCHITECTURE section 4)
   - POST /v1/partners/:id/services: only for bus_operator partners whose routes include routeId; creates `count` services, creates a new_service Alert (text from a per-language template in src/i18n/templates.ts for kn-IN, ta-IN, te-IN, hi-IN, od-IN, bn-IN, en-IN), returns {services, alert, notified, demandAfter}. notified = saved trips + seed intents with wantsAlerts and matching routeId+date and mode bus or null.
   - POST /v1/gifts/orders, GET /v1/partners/:id/orders
   - POST /v1/ops/fallback {on}, POST /v1/ops/reset, GET /v1/ops/state (require header x-ops-token === OPS_TOKEN; if OPS_TOKEN is empty, allow only from localhost and log a warning). In this phase /v1/ops/fallback sets an in-memory override; A-03 makes it flip Flagsmith.
   - GET /metrics: prom-client default metrics + http_requests_total{route,status}, http_request_duration_seconds histogram, voice_errors_total{kind}, fallback_active gauge.
6. Error handler: always {error:{code,message}}; never include env values or stack traces in responses.
7. Validate every response in tests against shared/contract/schemas with ajv.
8. CORS on for the Expo web origin (allow all in dev).

TESTS (vitest + fastify.inject, no network): options returns links in flag order and no "price" key anywhere (deep search); add-services on BLR-HBL 2027-01-14 returns notified 15 before any trip and 16 after saving one trip for that night; demand for op-staterte has the BLR-HBL 2027-01-14 cell with want 2400; sweet shop demand groups orders; ops endpoints reject a wrong token; alerts include the new_service alert after adding buses.

ACCEPTANCE CHECKS (run, paste output)
- cd services/api && npm run check
- MOCK_ALL=1 npm run dev, then:
  curl -s "http://localhost:8787/v1/options?routeId=BLR-HBL&date=2027-01-14&mode=bus&people=2"
  curl -s -X POST http://localhost:8787/v1/partners/op-staterte/services -H "content-type: application/json" -d "{\"routeId\":\"BLR-HBL\",\"date\":\"2027-01-14\",\"departTime\":\"22:30\",\"boardingPoint\":\"MAJESTIC\",\"seats\":40,\"count\":6,\"mode\":\"bus\"}"
  curl -s http://localhost:8787/metrics | head -5

MOCK MODE: this whole phase runs without any key.
WHILE WAITING on anything: write more tests.

FINISH: update status/A.md (endpoints live, how to run, contract version), commit "A-01: api core on seed data", Merge steps from AGENTS.md. Report.
````

## Done when
- All endpoints except voice/identify-live answer on seed data; tests green; main updated.
