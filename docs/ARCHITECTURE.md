# Architecture

This file is the source of truth for the contract. Phase 0 (codex/P0-contract.md) copies the types and schemas below into `shared/contract/` as code. After that, only Session A edits `shared/contract/`. Everyone else asks for changes through their status file (see codex/SESSIONS.md).

## 1. Folders (what the repo looks like by 17:00)

```
festive-prasthan/
  README.md  START-HERE.md  PROMPT-FOR-ANKITH.md  AGENTS.md (written in P0)
  STATUS.md                 # board rules (exists in prep; read-only on the day)
  status/A.md B.md C.md     # one status file per session; only that session edits it
  shared/contract/          # OWNER A. types.ts + schemas/*.json + examples/*.json
  services/api/             # OWNER A. Node 22 + TypeScript + Fastify. Sarvam, Flagsmith server, demand, alerts
  apps/mobile/              # OWNER B. Expo (React Native + TS). Android + Expo Web
  infra/k8s/                # OWNER C. manifests (from docs/K8S-TEMPLATES.md) + k3d-up.mjs, k3d-redeploy.mjs
  infra/load/               # OWNER C. rush load script
  scripts/                  # OWNER C. own package.json: flagsmith-import.ts, demo-break.mjs, demo-fix.mjs, check-env.ts
  infra/docker/             # OWNER C. api.Dockerfile (one image; ROLE env picks api or voice)
  config/flagsmith/flags.json  # flags to create (exists in prep)
  seed/                     # synthetic demo data (exists in prep). Read-only on the day
  docs/  codex/  ideas/     # prep docs (exist). Z-02 updates README only
  .github/workflows/ci.yml  # OWNER C (typecheck + tests). android-beta.yml optional, OWNER B
```

Why Fastify: small, typed, fast to test with `app.inject()` (no network in tests). Express is fine too if Codex prefers; pick one in P0 and write it in AGENTS.md.

## 2. Services

```
 phone / browser (Expo app)
        |  HTTPS/HTTP JSON (polls every alert_poll_seconds)
        v
 prasthan-api  (ROLE=api)  ---- Flagsmith (server SDK, local evaluation, refresh 5 s)
        |   \--- seed/*.json loaded at start + in-memory store (SQLite optional)
        |   \--- context.dev news search (only if live_data_source=context_dev)
        v  HTTP (VOICE_URL), timeout 8 s
 prasthan-voice (ROLE=voice) ---- Sarvam AI (STT, chat LLM, TTS, translate)

 k3d cluster on the laptop: both deployments + Prometheus scrape of /metrics
 NudgeBee Cloud agent in the cluster -> NudgeBee Cloud -> Slack alert + RCA + approval runbook
 runbook step -> Flagsmith Admin API (flip voice_fallback_offline) OR POST /v1/ops/fallback
```

- One codebase, one Docker image. `ROLE` env picks what the process serves: `all` (local dev), `api`, `voice`.
- The api never calls Sarvam directly. It calls the voice service. If voice is down or `voice_fallback_offline` is on, the api answers with the fallback path (rule-based parser + cached audio + text). This is what makes the NudgeBee break/fix moment real.
- Mock modes: `MOCK_ALL=1`, or per service `SARVAM_MODE=mock`, `FLAGSMITH_MODE=mock`, `CONTEXT_DEV_MODE=off`. The app has `EXPO_PUBLIC_APP_MOCK=1` (uses bundled seed, no API at all).

## 3. Data model

All ids are strings. Dates are `YYYY-MM-DD` (IST). Times are `HH:mm` (IST). Language codes are Sarvam BCP-47 style: `kn-IN ta-IN te-IN hi-IN od-IN bn-IN en-IN`.

```ts
type Lang = 'kn-IN'|'ta-IN'|'te-IN'|'hi-IN'|'od-IN'|'bn-IN'|'en-IN';
type Mode = 'bus'|'train'|'air';
type TimeWindow = 'morning'|'afternoon'|'evening'|'night'|'any';
type PartnerType = 'bus_operator'|'sweet_shop'|'quick_commerce';
type Source = 'live'|'mock'|'fallback'|'seeded'|'context_dev';

interface Traveller { id: string; displayName?: string; language: Lang; homeState?: string; homeTown?: string }

interface TripIntent {            // what the traveller said, structured
  id: string; travellerId: string;
  from: string;                   // 'Bengaluru' for the demo
  to: string | null;              // canonical town name from seed/routes.json
  routeId: string | null;         // e.g. 'BLR-HBL'
  dateFrom: string | null; dateTo: string | null;
  timeWindow: TimeWindow;
  mode: Mode | null;              // null = any
  people: number;                 // default 1
  boardingPoint: string | null;   // id from seed/boarding-points.json
  festivalId: string | null;
  gift: { itemId: string; qty: number; partnerId?: string } | null;
  needsFollowUp: Array<'to'|'date'|'mode'|'people'>;   // what to ask next
  language: Lang;
  transcript: string;
  confidence: number;             // 0..1
  parser: 'llm'|'rules';          // rules = fallback parser
}

interface Route { id: string; to: string; toLocal: string; aliases: string[]; state: string; homeLanguage: Lang; modes: Mode[]; boardingPoints: string[] }
interface BoardingPoint { id: string; name: string; nameKn: string; kind: string; lat: number; lng: number }

interface Partner {               // ONE model for every business
  id: string; type: PartnerType; name: string; styleOf?: string;
  routes?: string[];              // bus_operator
  boardingPoint?: string; items?: ShopItem[];   // sweet_shop
  serves?: string[]; cutFirst?: boolean;        // quick_commerce
}
interface ShopItem { id: string; name: string; nameLocal: string; unit: string; priceInr: number; readyInMinutes: number; dailyCapacity: number }

interface Service { id: string; routeId: string; partnerId: string; mode: Mode; date: string; departTime: string; boardingPoint: string; seats: number; special: boolean }

interface DemandCell {            // one row of the demand dashboard, same shape for every partner type
  key: string;                    // routeId|date|window  OR  zone|date|window
  label: string;                  // 'BLR -> Hubballi, Thu 14 Jan, night'
  date: string; window: string;
  want: number;                   // seats wanted / orders wanted / travellers leaving
  have: number;                   // seats existing / capacity / 0 if unknown
  gap: number;                    // max(0, want - have)
  suggestion: string | null;      // 'Add 38 buses' / 'Prepare 120 kg Mysore pak by 20:00'
  routeId?: string; zone?: string;
}

interface Alert { id: string; kind: 'special_bus'|'special_train'|'surge_warning'|'tout_warning'|'new_service'|'info'; routeId: string|null; date: string|null; text: string; textLocal?: Partial<Record<Lang,string>>; source: Source; sourceUrl?: string; createdAt: string }

interface GiftOrder { id: string; partnerId: string; travellerId: string; intentId?: string; itemId: string; qty: number; pickupPoint: string; pickupDate: string; readyBy: string; status: 'placed'|'ready'|'picked_up'|'cancelled'; payment: 'pay_at_pickup_demo' }

interface DeepLink { providerId: string; name: string; mode: Mode; url: string; kind: 'homepage'|'search' }

interface FlagsView {             // what /v1/config returns: flags already evaluated for this identity
  festival_mode: { festivalId: string; title: string; theme: string; greeting: Partial<Record<Lang,string>> };
  route_config: { enabledRoutes: string[]; featured: string[] };
  surge_warning: { warnAtMultiplier: number; rushNights: string[]; showToutWarning: boolean };
  special_service_announcements: Array<{ text: string; routeId?: string; date?: string }>;
  voice_enabled: boolean; voice_fallback_offline: boolean;
  tts_model: string; tts_speaker: Record<string,string>; stt_mode: string;
  gifting_enabled: boolean; operator_add_service: boolean; shop_orders_view: boolean; quick_commerce_view: boolean;
  live_data_source: 'seeded'|'context_dev';
  deep_link_providers: Record<Mode, string[]>;
  alert_poll_seconds: number; reply_style: 'warm'|'short';
}
```

Storage: in-memory store loaded from `seed/` at start, with an optional JSON-file snapshot in `data/` (git-ignored). SQLite only if time allows. Restarting the api resets the demo, which is good for rehearsals. `POST /v1/ops/reset` reloads seed.

## 4. API contract (v1)

Base: `http://localhost:8787`. JSON in and out unless noted. Every response has `"source"` where it matters, so the UI can show "live", "mock" or "offline fallback" honestly. Errors: `{ "error": { "code": "string", "message": "string" } }` with a 4xx/5xx status. No error ever contains a key.

Identity: every call from the app sends header `x-prasthan-identity: <travellerId or partnerId>` and, on `/v1/identify`, the traits. The api uses them for Flagsmith identity evaluation.

| # | Method + path | Purpose | Owner |
|---|---|---|---|
| 1 | GET /health | `{ok, role, version, modes:{sarvam,flagsmith,contextDev}}` | A |
| 2 | GET /metrics | Prometheus text (request count, latency histogram, voice_errors_total, fallback_active gauge) | A |
| 3 | POST /v1/identify | `{identity, traits}` -> `{identity, flags: FlagsView}` | A |
| 4 | GET /v1/config | -> `{identity, flags: FlagsView, festival, source}` | A |
| 5 | POST /v1/voice/intent | multipart `audio` + `language?` -> transcript + intent + spoken reply | A |
| 6 | POST /v1/intent/parse | `{text, language}` -> `{intent: TripIntent, reply}` (typed fallback, tests) | A |
| 7 | POST /v1/tts | `{text, language}` -> `{audioBase64|null, mime, source}` | A |
| 8 | GET /v1/options | `?routeId&date&mode&people` -> deep links + warnings | A |
| 9 | POST /v1/trips | `{intent}` -> `{trip:{id, intent, subscribed:true}}` | A |
| 10 | GET /v1/alerts | `?identity&since` -> `{alerts: Alert[], source}` | A |
| 11 | GET /v1/partners | `?type` -> `{partners: Partner[]}` | A |
| 12 | GET /v1/partners/:id/demand | `?date` -> `{partner, cells: DemandCell[], label:"Seeded demo data"}` | A |
| 13 | POST /v1/partners/:id/services | add a bus -> `{service, notified}` | A |
| 14 | POST /v1/gifts/orders | `{travellerId, partnerId, itemId, qty, pickupDate, readyBy}` -> `{order}` | A |
| 15 | GET /v1/partners/:id/orders | -> `{orders: GiftOrder[]}` | A |
| 16 | POST /v1/ops/fallback | header `x-ops-token`; `{on: boolean}` -> flips Flagsmith `voice_fallback_offline` via Admin API (mock: in-memory) | A |
| 17 | POST /v1/ops/reset | header `x-ops-token` -> reload seed | A |
| 18 | GET /v1/ops/state | -> `{fallbackActive, voiceHealthy, lastVoiceError?}` (dashboard banner) | A |
| 19 | POST /voice/stt, /voice/llm, /voice/tts, /voice/translate | INTERNAL (voice role only). Only the api calls them | A |
| 20 | GET /v1/audio/:key | cached offline clip (from apps/mobile/assets/audio/, read-only) | A |

Header `x-load-test: 1` (sent only by infra/load/rush.mjs): the request still goes through the voice service but uses the mock Sarvam client, so load tests never spend credits or hit the 60/min limit.

### Request/response examples (P0 turns each into a JSON Schema in `shared/contract/schemas/`)

`POST /v1/voice/intent` (multipart: `audio` file, `language` optional, `context` optional JSON string with the previous intent for follow-ups)
```json
{
  "transcript": "ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ ಹೋಗ್ತಾ ಇದ್ದೀನಿ, ಗುರುವಾರ ರಾತ್ರಿ, ಬಸ್ಸಲ್ಲಿ, ಇಬ್ರು",
  "language": "kn-IN",
  "intent": {
    "id": "int-7f3a", "travellerId": "trav-demo", "from": "Bengaluru", "to": "Hubballi", "routeId": "BLR-HBL",
    "dateFrom": "2027-01-14", "dateTo": "2027-01-14", "timeWindow": "night", "mode": "bus", "people": 2,
    "boardingPoint": null, "festivalId": "sankranti-2027", "gift": null, "needsFollowUp": [],
    "language": "kn-IN", "transcript": "...", "confidence": 0.86, "parser": "llm"
  },
  "reply": { "text": "ಸರಿ, ಗುರುವಾರ ರಾತ್ರಿ ಹುಬ್ಬಳ್ಳಿಗೆ ಇಬ್ಬರಿಗೆ ಬಸ್. ಇಲ್ಲಿವೆ ಆಯ್ಕೆಗಳು.", "language": "kn-IN", "audioBase64": "UklGR...", "mime": "audio/wav" },
  "source": { "stt": "live", "llm": "live", "tts": "live" }
}
```
In fallback: `"source": {"stt":"fallback","llm":"fallback","tts":"fallback"}`, `intent.parser = "rules"`, `reply.audioBase64` = a cached clip or `null` (the app then shows text big). When audio cannot be understood at all, the api returns 200 with `intent.needsFollowUp` set and a reply asking the question; it never returns 500 for bad audio.

`POST /v1/intent/parse`
```json
{ "text": "Going home to Hubli for Sankranti, Friday night", "language": "en-IN", "refDate": "2027-01-05" }
```
-> same `{intent, reply, source}` shape as above. `refDate` is optional (default: the demo date `2027-01-05`, set by `DEMO_TODAY` env); tests always pass it.

`GET /v1/options?routeId=BLR-HBL&date=2027-01-14&mode=bus&people=2`
```json
{
  "routeId": "BLR-HBL", "date": "2027-01-14", "mode": "bus",
  "links": [
    { "providerId": "ksrtc", "name": "KSRTC (Karnataka) booking", "mode": "bus", "url": "https://ksrtc.in/", "kind": "homepage" },
    { "providerId": "redbus", "name": "redBus", "mode": "bus", "url": "https://www.redbus.in/", "kind": "homepage" }
  ],
  "warnings": [
    { "kind": "rush_night", "text": "14 Jan is a rush night. Book early; fares on private buses often go up a lot.", "textLocal": { "kn-IN": "..." } },
    { "kind": "tout_warning", "text": "Book only on official apps or counters. Never pay an agent outside the bus stand." }
  ],
  "demand": { "want": 2400, "have": 880, "label": "Seeded demo data" },
  "source": "seeded"
}
```
No prices. No ranking by price. Order = `deep_link_providers` flag.

`POST /v1/partners/op-staterte/services`
```json
{ "routeId": "BLR-HBL", "date": "2027-01-14", "departTime": "22:30", "boardingPoint": "MAJESTIC", "seats": 40, "count": 6, "mode": "bus" }
```
->
```json
{ "services": [ { "id": "svc-9001", "routeId": "BLR-HBL", "partnerId": "op-staterte", "mode": "bus", "date": "2027-01-14", "departTime": "22:30", "boardingPoint": "MAJESTIC", "seats": 40, "special": true } ],
  "alert": { "id": "al-9001", "kind": "new_service", "routeId": "BLR-HBL", "date": "2027-01-14", "text": "Demo State RTC added 6 buses BLR -> Hubballi, 14 Jan 22:30 from Majestic", "textLocal": { "kn-IN": "..." }, "source": "live", "createdAt": "..." },
  "notified": 16,
  "demandAfter": { "want": 2400, "have": 1120, "gap": 1280 } }
```
`notified` = saved trips + seed intents with `wantsAlerts: true` that match routeId + date and mode bus (or any). With the seed: 15 on BLR-HBL 14 Jan, so 16 once Manjunath has subscribed. The traveller app sees the new alert on its next poll and plays it aloud in its language (TTS of `textLocal[lang]`, made by Sarvam translate in live mode, a template in fallback).

`GET /v1/partners/:id/demand` for each type:
- bus_operator: cells from `seed/demand-forecast.json` for the partner's routes + live trips added today. suggestion `Add N buses`.
- sweet_shop: cells = orders per pickup date + items, from `seed/gift-orders.json` + live orders. suggestion `Prepare X kg <item> by <readyBy>`.
- quick_commerce (CUT FIRST): cells from `seed/qc-demand.json`. suggestion `Stock gift boxes near <zone> 16:00-21:00`.

## 5. Voice pipeline (voice role)

1. STT: Sarvam `POST https://api.sarvam.ai/speech-to-text`, multipart `file`, `model=saaras:v4`, `mode=<stt_mode flag>`, header `api-subscription-key`. Max 30 s per request (push-to-talk, cap recording at 20 s). Audio from the app: web gives webm/opus, Android gives m4a/aac. UNVERIFIED which formats Sarvam REST accepts: test both at 10:00; if rejected, convert in the api with `ffmpeg-static` to 16 kHz mono WAV.
2. Intent: Sarvam chat `POST https://api.sarvam.ai/v1/chat/completions` (OpenAI-compatible), model `sarvam-105b`, system prompt = schema + route list + festival list + refDate; ask for JSON only; validate with the TripIntent schema; on invalid JSON retry once, then use the rule parser. Rule parser (also the fallback): alias match on `seed/routes.json`, weekday + festival words per language (small table in `services/api/src/intent/lexicon.json`), number words 1-6 per language.
3. Reply text: template per language (warm/short by `reply_style`), filled from the intent. LLM not needed for the reply (faster, safer).
4. TTS: `POST https://api.sarvam.ai/text-to-speech` with `text`, `target_language_code` (UNVERIFIED field name: kit says `language_code`; check the docs MCP), `speaker`, `model=<tts_model>`. Response `audios[0]` = base64 WAV. Max 2,500 chars.
5. Translate (alerts to the traveller's language): `sarvam-translate` / Mayura. Cache by text+lang.
6. Every call: timeout 8 s, 1 retry on 429/5xx with jitter, then fallback. Log `voice_errors_total{kind}`. Never log audio, transcripts with names, or keys.

Fault injection for the stage (C uses it): env `FAULT_MODE=none|crash_on_voice|slow_voice|bad_model`. `crash_on_voice` makes the voice process exit on the Nth request (OOM-like crash loop); `bad_model` uses a wrong model name so Sarvam returns 4xx. Off by default. Documented as a demo tool in the README.

## 6. Flagsmith usage (summary; details in SPONSORS.md)

- Server SDK `@flagsmith/nodejs` with `enableLocalEvaluation: true`, `environmentRefreshIntervalSeconds: 5`, a `defaultFlagHandler` that returns the coded default from `config/flagsmith/flags.json`. Identity flags = `getIdentityFlags(identity, traits)`.
- The app never holds a server key. It calls `/v1/config` (polls every `alert_poll_seconds`).
- Ops flip: Flagsmith Admin API with `FLAGSMITH_ADMIN_API_KEY` (only the api's `/v1/ops/fallback` and `scripts/` use it).
- NOTE (UNVERIFIED): with local evaluation, identity-level overrides may not be included in the environment document; we only use segment overrides and environment defaults, which are.

## 7. Env vars

See `.env.example` (names only). Rules: `.env` is git-ignored; `scripts/check-env.ts` prints only `SET` / `MISSING` per name, never values; k8s gets them via `kubectl create secret generic prasthan-env --from-env-file=.env` (never a YAML file with values).

## 8. context.dev (optional helper, not a sponsor)

Behind the Flagsmith flag `live_data_source`. Only the api calls it, only from `services/api/src/live/contextdev.ts`, with a 6 s timeout and a 10-minute cache. Uses: news search for "special buses Sankranti Bengaluru", "festival special train Bengaluru" -> extra `Alert`s with `source: "context_dev"` and `sourceUrl`. Details and limits in docs/CONTEXT-DEV.md.

## 9. Ports

- api: 8787. Expo web: 8081 (Metro default). Prometheus in cluster: 9090 (port-forward). k3d load balancer: 8080 -> api.
