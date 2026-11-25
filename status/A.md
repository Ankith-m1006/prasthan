# Session A status

Phase: A-03 done (Flagsmith provider + Admin API ops flip). A phases A-01..A-03 complete. Next for A: Z-01 integration (or A-04 context.dev if green).
Branch: main (single builder on the home laptop; venue sessions branch from origin/main)
Contract version I built against: 1
Last merged to main: A-03

## Done
- P0: AGENTS.md, root package.json, shared/contract v1 (types, 12 schemas, 11 examples), contract test.
- A-01: config (env read once, SET/MISSING logging), seed loader, in-memory store + demo clock (DEMO_TODAY at the real IST time),
  MockFlagsProvider (defaults from config/flagsmith/flags.json + segment rules + ops overrides), Prometheus metrics,
  all non-voice routes, error handler `{error:{code,message}}`, CORS open.
- Tests: 35 green (contract, api core incl. notified 15 -> 16, demand 2400/880, sweet shop 9 kg, ops token, metrics; rule parser).

- A-02: SarvamClient (live + mock), VoiceGateway (in-process for ROLE=all, HTTP to VOICE_URL for ROLE=api), internal /voice/* routes (ROLE=voice|all), rule parser (all 11 seed utterances pass), sarvam-105b JSON parsing with ajv + 1 retry + rules fallback, reply templates in 7 languages, FAULT_MODE demo tool, x-load-test -> mock client. 46 tests green.
- A-03: FlagsmithFlagsProvider (@flagsmith/nodejs 9.5, local evaluation, 5 s refresh, defaultFlagHandler = coded defaults; JSON/number values parsed safely, bad JSON -> default + flag_parse_errors_total), traits stored per identity from /v1/identify, Admin API flip (find feature -> env feature state -> PATCH) with memory fallback; voice reads tts_model/tts_speaker/stt_mode/reply_style per identity. 57 tests green.

## Flagsmith state
- No Flagsmith keys on the home laptop: live provider tested with a fake SDK source only; Admin API tested with a fake fetch.
- Goes live when FLAGSMITH_SERVER_KEY is set and FLAGSMITH_MODE!=mock and MOCK_ALL!=1. Ops flip goes to Flagsmith when FLAGSMITH_ADMIN_API_KEY + FLAGSMITH_PROJECT_ID + FLAGSMITH_ENVIRONMENT_API_KEY are set; otherwise in-memory (response says via:"memory").
- Venue check (needs keys): POST /v1/identify as trav-demo-ta (Tamil Nadu) -> Pongal mode; change festival_mode in the dashboard, /v1/config changes within ~10 s; POST /v1/ops/fallback {on:true} -> dashboard shows voice_fallback_offline ON.

## Voice state
- No SARVAM_API_KEY on the home laptop: live path is tested only with a fake client. With a key + SARVAM_MODE=live it goes live.
- Verified on docs.sarvam.ai today: TTS POST /text-to-speech {text, language_code, model, speaker} -> audios[0] (we retry once with target_language_code on 400/422); STT /speech-to-text model saaras:v4, modes transcribe|translate|verbatim|translit|codemix, accepts webm/ogg/mp4/m4a/wav/mp3, so NO ffmpeg conversion is needed. UNVERIFIED: STT multipart field names (file, language_code) and response (transcript, language_code); /translate fields; chat model id sarvam-105b.
- Fallback: flag voice_fallback_offline on OR voice_enabled off OR the voice service failing -> rules + cached clip + text. Audio cannot be understood offline, so /v1/voice/intent then answers 200 with a polite "please type" reply.
- Offline clips (B owns apps/mobile/assets/audio/): name them kn-confirm-hero.mp3, kn-ask-date.mp3, kn-ask-to.mp3, kn-offline.mp3, kn-confirm.mp3 (same pattern for ta/te/hi/od/bn/en). Served at GET /v1/audio/<file>.
- FAULT_MODE=crash_on_voice|slow_voice|bad_model (default none) for the NudgeBee demo.

## Endpoints live (mock mode)
GET /health, GET /metrics, POST /v1/identify, GET /v1/config, GET /v1/options, POST /v1/trips, GET /v1/alerts,
GET /v1/partners, GET /v1/partners/:id/demand, POST /v1/partners/:id/services, POST /v1/gifts/orders,
GET /v1/partners/:id/orders, POST /v1/ops/fallback, POST /v1/ops/reset, GET /v1/ops/state,
POST /v1/voice/intent (multipart audio + language + context), POST /v1/intent/parse, POST /v1/tts, GET /v1/audio/:key, internal POST /voice/stt|llm|tts|translate.

## Notes for B
- `want` in demand is the seeded forecast only (saved trips do not change it), so the board keeps "2,400 want".
- Add buses enforces the Flagsmith flag `operator_add_service` for that partner (403 `flag_off` if off).
- Alerts: live alerts (new buses) come first, then announcements + seed alerts (traveller's routes first). `since` filters by createdAt.

## Working on now
- (A phases done here; builder moved to B-01)

## Blocked / broken
-

## REQUESTS TO OTHERS
- B and C: merge main to get the contract.

## ANSWERS (to requests from others)
-

## How to run what I built
- `cd services/api && npm install && npm run check`
- `MOCK_ALL=1 npm --prefix services/api run dev` (port 8787; reads ../../.env if present)
