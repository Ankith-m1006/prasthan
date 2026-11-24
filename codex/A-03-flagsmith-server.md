# A-03: real Flagsmith in the api + ops flip (Session A, 40 min)

## Paste into Codex

````
Session A. Read AGENTS.md, docs/SPONSORS.md section 2, config/flagsmith/flags.json. `git merge main`; read status/C.md (C-01 says whether the flags exist in Flagsmith yet).

GOAL: flags come from Flagsmith per identity + traits; changes in the dashboard show in the app within ~10 s; ops can flip the fallback via the Admin API.

FILES YOU OWN: services/api/**, shared/contract/**, status/A.md.

STEPS
1. npm i @flagsmith/nodejs (NOT the deprecated flagsmith-nodejs). src/flags/flagsmith.ts: FlagsmithFlagsProvider implements FlagsProvider:
   new Flagsmith({ environmentKey: process.env.FLAGSMITH_SERVER_KEY, enableLocalEvaluation: true, environmentRefreshIntervalSeconds: 5, defaultFlagHandler: name => coded default from defaults.ts })
   getIdentityFlags(identity, traits) -> map each flag to FlagsView (parse JSON values safely; on parse error use the default and count flag_parse_errors_total).
   If FLAGSMITH_MODE=mock or MOCK_ALL=1 or no key: MockFlagsProvider (from A-01).
   Check the current SDK API on docs.flagsmith.com/clients/server-side before coding; note the doc URL in a comment.
2. Traits: from POST /v1/identify body {identity, traits:{role, language, home_state, home_town, partner_type, partner_id}}; remember per identity in the store; /v1/config uses them.
3. Ops flip: src/flags/admin.ts with the Flagsmith Admin API (header Authorization: Api-Key FLAGSMITH_ADMIN_API_KEY). setFeatureState(featureName, enabled, value?) for environment FLAGSMITH_ENVIRONMENT_API_KEY: find the feature id, find the env feature state, PATCH it. Check exact paths in the Swagger (api.flagsmith.com/api/v1/docs/) and note what you verified. POST /v1/ops/fallback {on} calls it (mock: in-memory override). Return {fallbackActive, via:"flagsmith"|"memory"}.
4. Model routing: voice code reads tts_model, tts_speaker, stt_mode, reply_style from the identity's FlagsView (odia_speakers segment -> bulbul:v3).
5. /health modes.flagsmith = live|mock; /v1/config response includes source.
6. Log flag evaluation errors without keys.

TESTS: provider maps JSON values; bad JSON -> default; mock provider applies segment overrides (tamil traveller -> festival_mode Pongal; odia -> tts v3; partner_type bus_operator -> operator_add_service true; others false); ops fallback in mock flips the value seen by /v1/config.

ACCEPTANCE CHECKS
- npm run check
- With real keys (FLAGSMITH_MODE=live):
  curl -s -X POST http://localhost:8787/v1/identify -H "content-type: application/json" -d "{\"identity\":\"trav-demo-ta\",\"traits\":{\"role\":\"traveller\",\"language\":\"ta-IN\",\"home_state\":\"Tamil Nadu\"}}"  -> festival_mode.title "Pongal mode" (if C-01 created the segment)
  Change festival_mode default in the Flagsmith dashboard, wait 10 s, curl /v1/config again -> changed.
  curl -s -X POST http://localhost:8787/v1/ops/fallback -H "x-ops-token: $OPS_TOKEN" -H "content-type: application/json" -d "{\"on\":true}"  -> dashboard shows voice_fallback_offline ON. Then turn it off.
  (Use the env var in the shell; never paste the token into the chat.)

MOCK MODE: MockFlagsProvider covers everything.
WHILE WAITING for C-01: test against the mock and a single flag you create by hand.

FINISH: status/A.md (flags live?, which flags verified in dashboard), commit "A-03: Flagsmith identities, segments, ops flip", Merge steps. Report.
````

## Done when
- Dashboard change visible in /v1/config within ~10 s; ops flip changes Flagsmith; mock still works.
