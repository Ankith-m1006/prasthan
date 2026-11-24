# Sponsors: exact use, setup, limits

Facts come from FESTIVE-HACKS-KIT.md (researched 18 Nov 2026, with sources there). [UNVERIFIED] = not checked; test it at 10:00 on the day.
Judged on "how well it uses EACH sponsor tool". 1st (Berlin) needs all three. 2nd = best Flagsmith use. So: all three real, Flagsmith deepest.

The one sentence that ties them together:
**Sarvam lets every traveller speak in their language. Flagsmith decides, live, how the app behaves for each festival, region, language and partner. NudgeBee keeps it up on the rush night, and when the voice service falls over, it finds why and flips Flagsmith to the offline fallback, so nobody is stranded.**

---

## 1. Sarvam AI (voice in and out, every Indian language)

What we use, and why each is load-bearing:
| Feature | Sarvam API | Where |
|---|---|---|
| Traveller speaks the trip | Saaras v4 STT (`saaras:v4`, mode from flag `stt_mode`, default `codemix`) | voice role `/voice/stt` |
| Turn speech into a trip | `sarvam-105b` chat (OpenAI-compatible) -> TripIntent JSON | `/voice/llm` |
| Answer in their language | Bulbul TTS (`tts_model` flag: `bulbul:v3` default, `bulbul:v4-flash` after a test) | `/voice/tts` |
| New bus alert in their language | sarvam-translate / Mayura, then Bulbul | alerts |
| Operator sees English | translate the transcript for the dashboard (optional) | partner view |

Setup (tonight / 09:30):
1. dashboard.sarvam.ai -> sign up -> verify -> Rs 100 free credits (never expire).
2. Create an API key -> put it in `.env` as `SARVAM_API_KEY`. Never paste it in chat, prompts, screenshots or the video.
3. Pick voices on the Voices page for `kn-IN` and `ta-IN`; write the speaker ids into the `tts_speaker` flag.
4. Optional for Codex: Sarvam docs MCP `https://docs.sarvam.ai/_mcp/server` [UNVERIFIED that Codex can add a remote HTTP MCP; if not, Codex reads docs.sarvam.ai pages].

Limits:
- Credits: Rs 100. STT Rs 0.49/min; TTS v3 Rs 3 per 1,000 chars, v4 Flash Rs 1; translate Rs 2 per 1,000 chars; 105B Rs 10 in / Rs 25 out per 1M tokens. A full day of testing is well under Rs 100 [GUESS]. `402` = credits gone.
- Rate limits: 60/min each for STT REST, TTS, LLM. `429` = slow down. The rush load test must NOT hit Sarvam (load hits `/v1/options`, `/v1/alerts`, `/v1/config`, and `/v1/intent/parse` in mock mode). Say this honestly if asked.
- STT REST max 30 s per clip. TTS REST max 2,500 chars. Bulbul v4 Flash has no Odia/Malayalam yet (kit). Use native script for TTS input.
- Prize: each placing team also gets $1,000 Sarvam credits.

Attribution: show "Powered by Sarvam AI" as plain text next to the mic and on the About screen. Do not use Sarvam's logo or art unless their team at the venue says yes (see DESIGN.md).

Fallback: see RISKS.md. Short version: typed text box + sample-sentence picker + rule parser + cached audio clips.

---

## 2. Flagsmith (the 2nd-prize case: make it deep)

Every flag does real work. Full list: `config/flagsmith/flags.json`.

What judges should see:
1. **Festival modes as remote config.** `festival_mode` JSON drives theme, greeting, which festival's dates count as rush nights. Flip "Sankranti mode" -> "Republic Day weekend" live; the app re-themes within 5 s.
2. **Segments from identity traits.** Traits `role`, `language`, `home_state`, `home_town`, `partner_type`, `partner_id`. Tamil travellers get "Pongal mode" from the same code. Odia speakers get TTS routed to `bulbul:v3` (model routing by segment).
3. **Route + surge config.** `route_config`, `surge_warning` (thresholds, rush nights, tout warning on/off), `deep_link_providers` (order of booking links; drop a broken one live).
4. **Announcements as remote config.** `special_service_announcements`: ops push "special train to Patna" without a deploy.
5. **Partner feature flags.** `operator_add_service` only for `bus_operators`, `shop_orders_view` for `sweet_shops`, `quick_commerce_view` for `quick_commerce`. One app, different tools per business.
6. **Kill switches.** `voice_enabled` (master), `voice_fallback_offline` (the ops switch NudgeBee flips), `live_data_source` (context.dev vs seeded).
7. **Staged rollout.** `gifting_enabled` on for the `gifting_pilot_20pct` segment (percentage split), then 100% on stage.
8. Optional: `reply_style` multivariate A/B (warm vs short), with our own event log (Experimentation is beta and maybe not on Free).

How the code uses it:
- api: `@flagsmith/nodejs`, local evaluation, refresh every 5 s, `defaultFlagHandler` from the coded defaults (so Flagsmith down = app still works with defaults).
- app: no Flagsmith key at all; gets `FlagsView` from `/v1/config`. (Option, not needed: Flagsmith JS/React Native SDK with the client key for true realtime. Skip unless ahead.)
- ops: Admin API flips `voice_fallback_offline` (from `/v1/ops/fallback` or straight from the NudgeBee runbook).

Setup (tonight / 09:30, dashboard work is config, not code):
1. app.flagsmith.com -> sign up -> project `prasthan` -> environments `development` and `production`.
2. Copy: server-side env key -> `FLAGSMITH_SERVER_KEY`; client key -> `FLAGSMITH_ENV_KEY_CLIENT`; Organisation API key (Organisation settings -> API keys) -> `FLAGSMITH_ADMIN_API_KEY`; project id -> `FLAGSMITH_PROJECT_ID`; env API key -> `FLAGSMITH_ENVIRONMENT_API_KEY`.
3. At 11:30+ Session C runs `scripts/flagsmith-import.ts` (creates flags + segments + overrides from flags.json via the Admin API). If it fails by 12:15, create the flags by hand in the dashboard from flags.json (about 15 min).

Admin API (check exact paths in Swagger `https://api.flagsmith.com/api/v1/docs/` [UNVERIFIED paths below]):
- header `Authorization: Api-Key <FLAGSMITH_ADMIN_API_KEY>`
- create feature: `POST /api/v1/projects/{project_id}/features/` `{name, type, initial_value, default_enabled, description}`
- create segment: `POST /api/v1/projects/{project_id}/segments/` with rules
- feature states in an env: `GET /api/v1/environments/{env_api_key}/featurestates/?feature=<id>` then `PATCH .../featurestates/{id}/` `{enabled, feature_state_value}`
- segment overrides: via the dashboard if the API path takes longer than 10 min.

Limits:
- Free: 50,000 requests/month, 1 team member, unlimited flags/environments/identities/segments. A/B testing and integrations are NOT on Free.
- Local evaluation polling every 5 s = 720 requests/hour per api pod. Two pods for 6 hours = about 8,600. Fine for the day; set the interval to 60 s after the event.
- [UNVERIFIED] identity overrides with local evaluation. We use segment overrides only.

---

## 3. NudgeBee (AI SRE: keep the rush night up)

What it is (kit): an agentic ops platform. Task Bees (Alert Triager, Root Cause Analyzer, Workload Rightsizer), Persona Bees (AI-SRE etc.) in Slack/Teams, approval-gated runbooks (steps can be REST calls, scripts, MCP tools). Open-source assistant Nubi. NudgeBee Cloud free trial: up to 2 clusters. `nbctl` CLI with token `sk-nb-...`.

What we use:
1. Prasthan runs on Kubernetes: k3d cluster on the laptop, two deployments (`prasthan-api`, `prasthan-voice`) + Prometheus.
2. The NudgeBee agent is installed in the cluster (Helm command from NudgeBee Settings -> Integrations -> Kubernetes).
3. The story: "Special buses to Hubballi just opened. 20,000 people open the app at once." Load script fires the rush. Then the voice pod crashes (fault injection `FAULT_MODE=crash_on_voice`, or a bad memory limit that OOMs).
4. NudgeBee sees the crash loop / alert, and in Slack the Alert Triager + RCA explain: "prasthan-voice OOMKilled / CrashLoopBackOff since 15:42, cause ...".
5. Runbook with an approval gate: step 1 REST call to Flagsmith Admin API (or to `POST /v1/ops/fallback` with `x-ops-token`) to turn `voice_fallback_offline` on; step 2 restart/scale the voice deployment. Ankith taps Approve. Travellers keep getting answers (text + cached audio) the whole time.
6. After recovery: flag back off. Optional: rightsizer view ("the January bill").

Setup (tonight; infra, not project code; confirm with organisers at check-in):
1. app.nudgebee.com/signup -> Cloud free trial.
2. Settings -> API Tokens -> create `sk-nb-...` -> `.env` `NUDGEBEE_API_TOKEN` (laptop only).
3. Settings -> Integrations -> Slack: connect a Slack workspace + channel `#prasthan-ops`.
4. Docker Desktop running; `k3d cluster create prasthan --agents 1 -p "8080:80@loadbalancer"`; install the NudgeBee agent with the Helm command from Settings -> Integrations -> Kubernetes; wait till it shows active.
5. Install Prometheus if the agent does not bring one [UNVERIFIED]: `helm install prom prometheus-community/prometheus -n monitoring --create-namespace` (small values).
6. Install `nbctl` (`go install github.com/nudgebee/nbctl@latest`) and test `nbctl events list --account-id <id>`.
7. Build the runbook in the NudgeBee UI tonight if allowed (it is ops config). If a REST step cannot send custom headers [UNVERIFIED], point it at `/v1/ops/fallback` through a tunnel, or use a script step that runs `curl`, or as the last resort Ankith flips the flag by hand and says so.

Limits / unknowns:
- Free trial: 2 clusters. No metered AI credits (kit).
- [UNVERIFIED] the agent works on k3d (it says self-managed K8s is supported).
- [UNVERIFIED] how fast it raises the alert. Rehearse once at 14:45 and time it. If it takes more than 2 min, start the break earlier in the demo and talk over it.
- Needs outbound internet from the laptop. Venue Wi-Fi can fail: keep the phone hotspot ready.
- No documented REST endpoint to push events into NudgeBee from our app (kit). We let it watch the cluster instead, which is the honest use.

Honest line for judges: "The crash is injected on purpose for the demo. The detection, explanation and approved fix are NudgeBee's."

---

## 4. context.dev (optional helper, NOT a sponsor)

Ankith's own web data API (about 11,000 credits). Used only behind the `live_data_source` flag to add real news items ("KSRTC special buses for Sankranti") to the alerts feed. Never on the stage path unless tested that day. Details: docs/CONTEXT-DEV.md.
