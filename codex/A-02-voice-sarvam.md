# A-02: voice service with Sarvam + rule fallback + fault injection (Session A, 60 min)

## Paste into Codex

````
Session A. Read AGENTS.md, docs/ARCHITECTURE.md section 5, docs/SPONSORS.md section 1. `git merge main`, read status/B.md + status/C.md.

GOAL: speak a trip in Kannada (or 6 other languages) -> TripIntent + spoken reply. Live with Sarvam, and a full offline fallback.

FILES YOU OWN: services/api/**, shared/contract/**, status/A.md.

STEPS
1. src/sarvam/client.ts: a SarvamClient interface { stt(audio, mime, mode, lang?) ; chatJson(messages, schema) ; tts(text, lang, model, speaker) ; translate(text, from, to) }. LiveSarvamClient uses fetch with header api-subscription-key from process.env.SARVAM_API_KEY:
   - STT: POST https://api.sarvam.ai/speech-to-text multipart file + model=saaras:v4 + mode (+ language_code if known).
   - Chat: POST https://api.sarvam.ai/v1/chat/completions model sarvam-105b, JSON-only system prompt.
   - TTS: POST https://api.sarvam.ai/text-to-speech {text, target_language_code (check docs; kit wrote language_code), speaker, model}; response audios[0] base64 WAV.
   - Translate: POST https://api.sarvam.ai/translate (check docs for exact path/fields; model sarvam-translate or mayura).
   Before coding each call, check the exact request/response fields on docs.sarvam.ai (or the Sarvam docs MCP if available). Write what you verified in a comment at the top of the file with the doc URL.
   Timeout 8 s, 1 retry on 429/5xx with jitter; 402 = credits gone -> throw typed error. MockSarvamClient: stt returns the closest seed/utterances.json text (by file name hint or language), chat uses the rule parser, tts returns null audio, translate uses templates.
2. src/intent/rules.ts (the fallback parser, pure, heavily tested): alias match on seed/routes.json (incl. local-script names), weekday + festival + "tonight/tomorrow" words per language in src/intent/lexicon.json (kn, ta, te, hi, od, bn, en + Roman Kannada), numbers 1-6 per language for people, mode words (bus/bassu/train/rail/flight), time-window words (night/raatri/raathiri/raat...). Festival word + weekday = that weekday in the festival week (ARCHITECTURE + seed/utterances.json notes). Missing to/date -> needsFollowUp.
3. src/intent/llm.ts: prompt sarvam-105b with the TripIntent JSON schema, the route list (id, to, aliases), festivals, refDate; parse; validate with ajv; on invalid retry once with the validation error; then fall back to rules. Mark parser "llm" or "rules".
4. src/voice/reply.ts: reply text templates per language, warm/short by reply_style flag; follow-up questions per language ("Which town?" "Which day?").
5. Roles: if ROLE=voice, mount internal routes POST /voice/stt, /voice/llm, /voice/tts, /voice/translate. If ROLE=api, the api calls VOICE_URL for those (8 s timeout). If ROLE=all, call in-process. Implement this as a VoiceGateway interface with InProcess and Http implementations.
6. Public routes: POST /v1/voice/intent (multipart audio, cap 20 s / 2 MB), POST /v1/intent/parse, POST /v1/tts. Flow: if flags.voice_fallback_offline or voice_enabled=false or gateway error -> fallback path (rules parser + cached audio lookup by reply key + text). Response `source` says live|mock|fallback per step. Never 500 for bad audio; return needsFollowUp with a polite reply. Requests with header x-load-test: 1 (C's rush script) always use the mock Sarvam client so a load test never burns credits or hits the 60/min limit, but they still go through the voice service (so the crash under load is real). Increment voice_errors_total{kind} and set fallback_active.
7. Audio formats: accept audio/webm, audio/ogg, audio/mp4, audio/m4a, audio/wav, audio/mpeg. If Sarvam rejects a format (test once with a real key if SARVAM_API_KEY is set and SARVAM_MODE=live), convert with ffmpeg-static to 16 kHz mono WAV. Keep conversion behind a function so it can be turned off.
8. FAULT_MODE env (demo tool, default none): crash_on_voice (voice role process.exit(1) on the 3rd /voice/* request), slow_voice (add 9 s delay), bad_model (use model "saaras:v0-broken"). Document in a comment that it exists for the NudgeBee demo.
9. Cached audio: GET /v1/audio/:key serves files from apps/mobile/assets/audio/ if present (read-only; B owns those files). Fallback reply includes audioUrl when a clip exists.

TESTS: rules parser passes every seed/utterances.json `expect` (people/date/routeId/mode/festivalId, refDate 2027-01-05), including the ambiguous one -> needsFollowUp ["to","date"]; LLM invalid JSON -> retry -> rules; voice/intent with gateway throwing -> fallback 200; fallback flag on -> no Sarvam call (spy); no key value appears in any log line (capture logger output, assert it doesn't contain process.env.SARVAM_API_KEY when set to a dummy).

ACCEPTANCE CHECKS
- cd services/api && npm run check
- MOCK_ALL=1 npm run dev; curl -s -X POST http://localhost:8787/v1/intent/parse -H "content-type: application/json" -d @../../shared/contract/examples/intent-parse.request.json  -> routeId BLR-HBL, dateFrom 2027-01-15, parser rules
- If SARVAM_API_KEY is set: SARVAM_MODE=live, send one short Kannada clip (record with the phone or use any wav): curl -s -F audio=@sample.wav -F language=kn-IN http://localhost:8787/v1/voice/intent | head -c 600  (do NOT print headers; never echo the key)

MOCK MODE: MockSarvamClient + rules parser = whole flow offline.
WHILE WAITING (e.g. no key yet): finish rules parser coverage.

FINISH: status/A.md (voice live/mock state, verified Sarvam field names, known gaps), commit "A-02: voice via Sarvam with offline fallback", Merge steps. Report.
````

## Done when
- Seed utterances parse correctly offline; a real Kannada clip round-trips with a key; fallback works with the flag.
