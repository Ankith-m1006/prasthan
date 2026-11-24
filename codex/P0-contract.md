# P0: contract + scaffold (Session A, first, 25 min)

Runs in `../prasthan-A` (branch `a/api`). B-01 and C-01 can start at the same time; they don't need the contract yet.

## Paste into Codex

````
You are Session A of 3 parallel Codex sessions building "Prasthan" at a one-day hackathon (Festive Hacks, 25 Nov 2026, submit by 17:00). Sessions cannot talk to each other; they coordinate through git, file ownership and status files.

Read fully first: README.md, docs/PRODUCT.md, docs/ARCHITECTURE.md, codex/SESSIONS.md, STATUS.md, docs/SPONSORS.md. Then do this phase only.

GOAL: write the shared contract and the repo skeleton so all sessions build against the same shapes.

FILES YOU OWN in this phase (create/edit only these): AGENTS.md, package.json (root), shared/contract/**, services/api/package.json + tsconfig + src/index.ts placeholder, status/A.md.

STEPS
1. AGENTS.md at the root (Codex reads it every time). Include:
   - Product in 3 lines; link docs/ARCHITECTURE.md as the source of truth.
   - File ownership table from codex/SESSIONS.md, and "edit only files you own".
   - Merge steps from codex/SESSIONS.md, word for word.
   - Quality bar: TypeScript strict, no `any`, small modules (<200 lines), functions <40 lines, dependency injection for every external client (Sarvam, Flagsmith, context.dev, clock), every network call has a timeout + 1 retry with jitter + a fallback, validate all LLM output against JSON schema.
   - Secrets: keys only from process.env; never print, log, commit or echo them; logs show only SET/MISSING; never send keys to the app bundle (only EXPO_PUBLIC_* names reach the app and none of them are secrets).
   - Mock mode: MOCK_ALL=1 or per-service *_MODE=mock must make every feature work offline.
   - Tests: vitest for api + contract, no network in tests, `npm test` under 30 s.
   - Honesty: seed data is synthetic; label it in UI ("Seeded demo data"); any shortcut goes into README "Limits".
   - Commits: plain messages, no AI/co-author trailers.
2. Root package.json: name "prasthan", private, NO dependencies, NO workspaces. Scripts only:
   "dev": "npx --yes concurrently -n api,web \"npm --prefix services/api run dev\" \"npm --prefix apps/mobile run web\"",
   "test": "npm --prefix services/api test", "check": "npm --prefix services/api run check".
3. shared/contract/:
   - src/types.ts: every TypeScript type from docs/ARCHITECTURE.md section 3 (Lang, Mode, TimeWindow, PartnerType, Source, Traveller, TripIntent, Route, BoardingPoint, Partner, ShopItem, Service, DemandCell, Alert, GiftOrder, DeepLink, FlagsView) plus request/response types for every endpoint in section 4 (e.g. VoiceIntentResponse, IntentParseRequest, OptionsResponse, AddServicesRequest/Response, DemandResponse, ConfigResponse, OpsStateResponse, ApiError).
   - src/index.ts re-exporting types + `CONTRACT_VERSION`.
   - schemas/*.json: JSON Schema (draft 2020-12) for TripIntent, FlagsView, VoiceIntentResponse, OptionsResponse, AddServicesRequest, AddServicesResponse, DemandResponse, Alert, GiftOrder, ApiError.
   - examples/*.json: one valid example per schema, using the JSON examples in docs/ARCHITECTURE.md and the seed ids (BLR-HBL, op-staterte, shop-majestic, MAJESTIC, sankranti-2027). Include examples/intent-parse.request.json = {"text":"Going home to Hubli for Sankranti, Friday night","language":"en-IN","refDate":"2027-01-05"}.
   - VERSION file containing 1 and CHANGELOG.md ("v1: initial contract").
   - tests: services/api/test/contract.test.ts validates every example against its schema with ajv (+ ajv-formats). (ajv is a normal dependency because A-02 validates LLM output at runtime.)
4. services/api skeleton only: package.json (type module; scripts dev = tsx watch src/index.ts, test = vitest run, check = tsc --noEmit && vitest run), tsconfig (strict, path to ../../shared/contract/src), src/index.ts that starts Fastify on PORT (default 8787) with GET /health returning {ok:true, role, version:"0.1.0", modes:{sarvam:"mock",flagsmith:"mock",contextDev:"off"}}. Deps: fastify, @fastify/cors, @fastify/multipart, dotenv, tsx (a runtime dependency on purpose: the Docker image runs `tsx src/index.ts`, so the tsconfig path to shared/contract needs no build step), ajv, ajv-formats; dev: typescript, vitest, @types/node. Add script "start": "tsx src/index.ts".
5. Update status/A.md: phase P0 done, contract version 1, list the endpoints that exist (only /health), "B and C: merge main now to get the contract".

ACCEPTANCE CHECKS (run them, paste output)
- cd services/api && npm install && npm run check   -> tsc passes, contract test passes (every example valid)
- npm --prefix services/api run dev, then curl -s http://localhost:8787/health -> ok:true (stop the server after)
- git status shows no .env, no node_modules staged

MOCK MODE: nothing external yet.

FINISH: commit "P0: contract v1 + api skeleton", then follow the Merge steps in AGENTS.md to fast-forward main. Report: files created, check output, anything unclear in the docs.
````

## Done when
- `main` has AGENTS.md, shared/contract v1 with schemas + examples, api /health, status/A.md updated.

## If something goes wrong
- ajv strict-mode errors on schemas: set `strict: false` once and note it; don't burn 10 min.
- If Fastify won't start on Windows, check the port; use `PORT=8788`.
