# RESUME (read this first if you are a fresh session)

Updated: 25 Nov 2026, with every push. Builder so far: one session on Ankith's home laptop, working directly on `main`.

## Where we are
- Current phase: Z-02 done. LIVE: https://prasthan-ten.vercel.app. Done on main: P0, A-01, A-02, A-03, B-01, B-02, B-03, B-05 (+gifting card), C-02, Z-02.
- UI redesign (25 Nov ~13:30, home builder): airy, no cards, frosted glass panels only where grouping is needed, soft festival glow behind headers, pill buttons/chips (44-52 px), floating frosted tab bar on desktop. Colours unchanged. New files apps/mobile/src/ui/glass.ts + backdrop.tsx; Card replaced by Section/Glass in kit.tsx. Behaviour, api client and contracts untouched. Checked in headless Chrome at 430 px and 1280 px: type sample -> trip card -> links + warning -> Alert me -> Partners -> add 6 buses -> 16 notified -> Kannada alert -> About flags, 0 console errors. Screenshots: docs/img/ui-*.png. Redeployed to https://prasthan-ten.vercel.app.
- Last finished step (before redesign): clean clone in a temp folder: api install + check (57 tests) OK, app install + typecheck + jest (10) OK. Web app built against the real api (MOCK_ALL=1) verified in headless Chrome: speak -> alert me -> add 6 buses -> 16 notified -> Kannada alert, no console errors. Split ROLE=api/voice tested; killing voice -> traveller still answered (rules).
- Next exact step: Eight screenshots are in docs/img/ and linked from README. Ankith: record video, put VIDEO_URL in README, submit form by 16:45. Session C: C-01/C-03/C-04 on branch session-c (C-02 scripts already on main). Optional if time: A-04 context.dev.

## MIC TAP-TO-TALK + NATURAL SARVAM VOICE + HEADER/HAPTICS/SHARE (25 Nov ~15:45, voice agent; deployed)
- Why: on Ankith's phone hold-to-talk scrolled the page; reply voice sounded robotic.
- Mic (apps/mobile/src/lib/useRecorder.ts, screens/speak/MicButton.tsx): TAP to start, TAP to stop, auto-stop 12 s. States "Tap to speak" -> "Listening... tap to stop" + 0:04 / 0:12 timer + pulsing ring -> "Understanding...". Web calls getUserMedia first thing in the tap handler, then MediaRecorder (webm/opus or mp4/aac, unchanged). Mic area: touch-action none, user-select none, -webkit-touch-callout none, touchmove/contextmenu/selectstart preventDefault. Typed fallback unchanged.
- Playback (src/lib/speak.ts): one shared <audio> element unlocked inside the tap (silent WAV), Sarvam WAV played as-is (native rate). Order: reply audio -> clip -> fresh Sarvam /v1/tts -> browser speechSynthesis LAST. "Alert me" confirmation now also uses Sarvam (it went straight to the robot voice before). Header mute toggle respected.
- API TTS (services/api/src/sarvam/voices.ts + live.ts + voice/spoken.ts): bulbul:v4-flash (newest per docs.sarvam.ai, re-read 15:05) with a per-language persona: kn chaitra_kn_conversation, ta gokul_ta_narration, te kavitha_te_conversation, hi kavya_hi_conversational, bn roopa_bn_conversational, en simran_en_conversation; Odia -> bulbul:v3 (no v4 persona). Fallback on a 400/422: bulbul:v3 + the Flagsmith tts_speaker (priya). Every call: language_code, pace 1.0, speech_sample_rate 24000, enable_preprocessing true, temperature 0.6, one call per reply (no chunking). Text rewritten for speech first (drops BLR-HBL style ids, "->" arrows, "Rs 1,840" -> "1840 ರೂಪಾಯಿ", 19:30-21:30 -> "19:30 to 21:30"). Old: bulbul:v3/priya, 22050 Hz, no preprocessing. Debug header x-tts-voice on /v1/tts shows the voice used + Sarvam ms (v4 Kannada ~1.6-2.5 s at Sarvam).
- Voice upload: /v1/voice/intent strips ";codecs=..." from the file mime (cleanMime) before the allow-list (status/B.md request done).
- Header on every tab (src/ui/HeaderActions.tsx via kit Screen): mute toggle, (i) -> About, round avatar (profile initial) -> /profile. Speak: language chips row removed; language pill (e.g. "ಕನ್ನಡ ▾") opens a glassy bottom sheet with the 7 languages (src/screens/speak/LanguageSheet.tsx); picking saves profile.language + identity -> Flagsmith trait via /v1/identify.
- Haptics (src/lib/haptics.ts, navigator.vibrate; iOS + native = no-op, expo-haptics not installed): tick on Button/Chip/header taps, medium on mic start/stop, success on Alert me / order confirmed / buses added, warning on errors, notify pattern on a new bus alert.
- "Share on WhatsApp" under the trip card (src/lib/share.ts + screens/speak/ShareTrip.tsx): https://wa.me/?text=<summary in the traveller language + app link>.
- Checks: api check 82/82 (new test/spoken.test.ts), app typecheck OK, jest 53/53 (new __tests__/haptics.test.ts incl. share). Deployed API + web from a clean git worktree (../prasthan-deploy-wt) because other agents had uncommitted work in this folder.
- Verified on production (headless Chrome 430x932, fake mic fed a Sarvam Kannada WAV): tap -> "Listening... tap to stop | 0:01 / 0:12", scroll 0 -> 0; long-press + drag on the mic: scroll 0 -> 0; tap stop -> "Understanding..." -> trip card (Hubballi); /v1/tts 200 with x-tts-voice bulbul:v4-flash/chaitra_kn_conversation; 3 WAV plays ok, speechSynthesis calls 0; 0 console errors. NOTE: in that run /v1/voice/intent was aborted on the slow venue Wi-Fi and the app used its offline sample transcript; the same route checked directly with node: 200 in 12-17 s, stt/llm/tts all live, BLR-HBL. Venue Wi-Fi is ~17 KB/s, so the web bundle alone can take 60-90 s to load here.
- Old vs new Kannada WAVs (same sentence) in the session scratchpad: tts-old-kn.wav (v3/priya 22050 Hz 6.4 s) vs tts-new-kn.wav (v4-flash/chaitra 24000 Hz ~4.5 s).

## APP: SWEETS, NOTIFICATIONS, FONTS, MIC, LOGOS (25 Nov ~15:00, app agent; deployed + verified)
- LIVE https://prasthan-ten.vercel.app (live api + live Flagsmith). Verified in ONE headless Chrome at 430 px on production: guest profile -> typed "Hubli Thursday night, 2 kg Mysore pak" -> chip "understood by Sarvam AI" (parser sarvam-llm) -> Alert me (asks browser notification permission only now) -> "Take sweets home" opens by itself (gift in the intent): GET /v1/shops, Sihi Mane Sweets 4 min walk, 2 kg Mysore pak pre-filled, +1 Dharwad peda -> Rs 1,840, pickup 19:30-21:30 (before 22:00) -> Confirm -> one v2 order (items[]) "Order ord-90xx", Majestic, pay at pickup -> My orders lists it (status refreshed via GET /v1/gifts/orders/:id) -> Partners -> Sihi Mane Sweets "Incoming pre-orders" per pickup point + day, incl. this order -> Namma State Travels add 6 buses -> within one poll: browser Notification "New bus home - Prasthan" (Kannada body) + green in-app banner. 0 app console errors (one ERR_CONNECTION_RESET was the venue Wi-Fi). Screenshots: scratchpad only.
- Files: src/lib/gifts.ts (pure: slots, basket, shopsNear fallback, pickupCells, parserLabel), src/screens/speak/GiftFlow.tsx (replaces GiftCard), src/state/orders.ts (My orders on device), app/orders.tsx, src/lib/notify.ts (web Notification after Alert me; poll <= 15 s; banner in kit Screen on every platform), api client: shops/order/pickups + mock twins.
- Fonts: Noto Sans Kannada/Tamil/Telugu/Devanagari/Oriya/Bengali, regular + bold only, deep imports (web export 15 font files, dist 4.8 MB). tokens.fontFor(lang) / fontForText(text).
- Mic (web): MediaRecorder format picked per browser (webm/opus on Chrome, mp4/aac on Safari iOS), upload named + re-typed from the real blob (clip.webm / clip.m4a, clean mime); denied mic -> clear "allow the mic for this site" message.
- Logos: booking + quick-commerce favicons fetched once (apps/mobile/scripts/fetch-logos.mjs via Google s2 favicons) into apps/mobile/assets/logos, bundled; KSRTC + IRCTC had no usable icon -> mode icon. Fictional partners: round monograms (src/ui/logos.tsx). "Demo data" tag once per tab header; repeated demo chips removed.
- Checks: typecheck OK, jest 35/35 (new __tests__/gifts.test.ts).
- Flagsmith client key for the export: read from the live bundle (public client key) - it is not in any file in the repo; keep using the deploy command above with it.

## API CHANGES FOR APP (api agent, 25 Nov afternoon; contract v2, see shared/contract/CHANGELOG.md)
1. Intent: /v1/intent/parse and /v1/voice/intent now try Sarvam's chat model first (sarvam-105b, reasoning off, JSON mode, ajv-validated, 15 s deadline) and fall back to rules. `intent.parser` is now `"sarvam-llm"` or `"rules"` (old `"llm"` stays in the type only for compatibility). App: change the chip check in app/(tabs)/index.tsx from `=== 'llm'` to `!== 'rules'` (or `=== 'sarvam-llm'`). New optional fields: `intent.travellingWith` ('alone'|'family'|'elders'|'kids'|'friends'|'partner'|null) and `intent.gift.unit` ('kg'|'box'|...).
2. Partner names: "Demo State RTC" -> "Namma State Travels", "Demo TN Express" -> "Kaveri Express", "Demo Intercity Coaches" -> "Deccan Intercity", sweet shops lose "(demo)", quick commerce = "QuickCart" / "DashBasket" / "HomeTown Cart". IDS UNCHANGED (op-staterte etc.). Alerts built from them now say e.g. "Namma State Travels added 6 buses...". App hardcodes of the old names (partners.tsx, DemoSwitches.tsx, GiftCard.tsx, motifs.tsx) are the app agent's to update.

3. Sweets pre-order (no payment, pay at pickup; types in shared/contract/src/types.ts):
   - `GET /v1/shops?boardingPoint=MAJESTIC` -> `{shops: [{partner (with items + priceInr), boardingPoint, atBoardingPoint, distanceKm, walkMinutes}], boardingPoint, label}` nearest first.
   - `POST /v1/gifts/orders` `{travellerId, partnerId, pickupDate, readyBy "HH:MM", departTime? "HH:MM", pickupPoint?, items: [{itemId, qty}]}` (old single itemId+qty still works) -> `{order}` with `id, status "placed", totalInr, items[]`. 400 if readyBy is less than 15 min before departTime, unknown item/shop/point, qty <= 0 or > 50.
   - `GET /v1/gifts/orders/:id` -> `{order}` (status); `GET /v1/gifts/orders?travellerId=` -> `{orders}`.
   - Shop side: `POST /v1/gifts/orders/:id/status {status: placed|ready|picked_up|cancelled}`; `GET /v1/partners/:id/pickups?date=` -> `{cells: [{pickupPoint, pickupDate, orders, firstReadyBy, items: [{itemId, name, unit, qty}], totalInr}]}`. Existing `/v1/partners/:id/demand` now counts every line of multi-item orders.

4. Notifications polling: `GET /v1/alerts?identity=<guest id>&since=<serverTime from the previous response>&onlyMine=1` -> `{alerts, source, serverTime}`. First call without `since` (full list) and keep `serverTime`; then poll every 10-20 s with it; anything returned is new -> raise a browser Notification. `since` uses the api's demo clock (2027-01-05T<IST time>), so never pass the device clock. `onlyMine=1` = only routes this traveller saved a trip for (+ route-less announcements).
5. Shared storage: `/health` now has `store: "memory" | "upstash"`. With Upstash connected, trips / alerts / buses / orders / profile traits are shared across all serverless instances (no more "notified" miscounts or lost alerts between instances).

## UPSTASH REDIS FOR THE LIVE API (ANKITH, 2 minutes, free; until then the api uses memory per instance)
1. vercel.com -> project **prasthan-api** -> **Storage** tab (or Integrations -> Marketplace) -> **Upstash** -> **Upstash for Redis** -> Create (free plan, region close to iad1 / Washington is fine) -> name `prasthan-store`.
2. **Connect** it to project prasthan-api (Production + Preview). It injects the env vars itself (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, or `KV_REST_API_URL` + `KV_REST_API_TOKEN`; the api accepts both pairs). Nothing to copy by hand.
3. Deployments -> latest -> ... -> **Redeploy** (env vars apply only after a redeploy).
4. Check https://prasthan-api.vercel.app/health -> `"store":"upstash"`. If Redis ever fails, each request carries on from memory (logged as a warning, no crash).
- To clear demo state on stage: `POST /v1/ops/reset` with the ops token (also clears the Redis document).
- Limit: one JSON document, last-writer-merge; two writes in the same ~100 ms on different instances could reuse an id. Fine for a demo.

## FINAL DOCS PASS (25 Nov ~14:30, docs agent; text only, no code)
- README.md rewritten for judges: live links (web + /health, checked live: sarvam live, flagsmith live), 60-second try-it, 4 screenshots incl. ui-430-00-profile.png + About flags, current architecture (Vercel web + Vercel API; k3d marked planned), sponsor section with honest status (Sarvam STT/TTS/translate live, intent = rules; Flagsmith 17 flags / 7 segments live; NudgeBee NOT verified, Docker unavailable per session-c status/C.md), setup mock + live (env var names only), limits, privacy, AI use (Codex + Claude Code). `<VIDEO_URL>` placeholder kept.
- New docs/SUBMIT-TEXT.md: title + tagline, form description, 30 s pitch, 2 min talk track, 10 judge Q&A, final checklist.
- Next exact step: Ankith puts the video link in README.md + docs/SUBMIT-TEXT.md (`<VIDEO_URL>`), submits by 16:45. If NudgeBee recovery gets verified in status/C.md, update the README NudgeBee status line and talk track 1:45.

## PROFILE + GUEST LOGIN + ROUTE DEEP LINKS (25 Nov ~14:20, profile agent)
- Code committed (apps/mobile): first launch -> app/welcome.tsx ("Continue as guest", no OTP) -> app/profile.tsx (one screen: name, language, home state + town from seed routes, work city Bengaluru, boarding point from seed/boarding-points.json filtered by mode, usual mode, travelling with, OPTIONAL age group + gender, privacy line). Tabs layout redirects to /welcome while no profile is saved.
- Store: src/state/profile.ts (parse/validate + subscribe; localStorage on web, memory on native via src/lib/storage.ts). Profile entry: "Name - profile" chip on Speak + "View or edit profile" in About (edit, reset).
- Flagsmith: identity = guest id (guest-xxxxxx), traits from src/lib/profileUse.ts profileTraits (role, language, home_state, home_town, travel_mode, travelling_with; age/gender never sent). identity.ts travellerTraits() and flags.tsx readLive use them, so Tamil Nadu -> Pongal segment applies.
- Trips: "My usual trip home" chip builds a trip from the profile; parsed trips get empty town/mode/boarding point/people filled from it (fillFromProfile). Reply language starts from the profile language.
- Hints (Options.tsx "WHEN YOU BOOK"): 60+ or with elders -> lower berth / ask about senior concession; woman -> ladies' seats / quota, "ask at booking". Bus/train only.
- Deep links: src/lib/deepLinks.ts. redBus route pages https://www.redbus.in/bus-tickets/bangalore-to-<slug>, checked 25 Nov (200 + route title) for 9 of 10 routes; Kolkata has no page -> homepage. Other providers stay on the homepage.
- Checks: typecheck OK, jest 22/22 (new __tests__/profile.test.ts).
- Next exact step: when the live-API web deploy commit is on origin/main, rebase, run the live-API export command from that section, redeploy prasthan-ten, verify welcome -> profile -> speak at 430 px, screenshot docs/img/ui-430-00-profile.png.

## WEB APP ON THE LIVE API (25 Nov ~14:10, verified in production)
- https://prasthan-ten.vercel.app now calls https://prasthan-api.vercel.app (health: sarvam live, flagsmith live). Rollback target (offline build): promote prasthan-p1hup864s-ankith-ms-projects-8b28c506.vercel.app.
- Build + deploy (web, live api + live flags), from apps/mobile:
  `EXPO_PUBLIC_API_URL=https://prasthan-api.vercel.app EXPO_PUBLIC_APP_MOCK=0 EXPO_PUBLIC_FLAGSMITH_ENV_KEY=<client env key> npx expo export --platform web && node scripts/prepare-vercel.mjs && cd dist && (vercel link --project prasthan --yes) && vercel deploy --prod --yes`
- Verified in headless Chrome at 430 px: welcome -> guest profile -> typed Kannada trip -> /v1/intent/parse 200 (BLR-HBL, reply audio audio/wav from Sarvam) -> Alert me (/v1/trips 200) -> Partners -> Demo State RTC -> Add 6 buses (/v1/partners/op-staterte/services 200, "15 waiting travellers notified") -> Kannada alert listed -> /v1/tts 200 live audio/wav (~570 KB base64) -> About "flags: live from Flagsmith". 19 api calls, all 200, 0 console errors, 0 CORS errors, app never fell back to offline data. Profile flow script: 0 errors, screenshot docs/img/ui-430-00-profile.png.
- Direct api checks: /v1/tts returns JSON {audioBase64, mime: audio/wav, source: live} (contract shape, not a raw audio body), ~190-540 KB WAV, 3-10 s for Kannada. /v1/voice/intent with a Sarvam-synthesised Kannada WAV -> transcript "ನಮಸ್ಕಾರ, ಶುಕ್ರವಾರ ರಾತ್ರಿ Hubballi-ಗೆ bus ಇದೆ." -> BLR-HBL, 2027-01-08 (live Sarvam STT; intent parser = rules).
- Real now: Sarvam STT + TTS (reply voice), Flagsmith flags (app SDK + api), api over HTTPS. Still synthetic: demand, partners, routes, alerts store (seeded demo data, in memory per serverless instance). Intent understanding shows "rules".
- Resilience (app): Alert me / add buses / demand board failures show a friendly message, never a crash; the operator's new alert is kept locally so a poll on a fresh api instance cannot drop it; 25 s api timeout (a cold start took 21.6 s once); slow TTS falls back to the browser voice and never flips the app to offline data; after a fallback the app retries live after 20 s and switches back.
- Known risk: serverless cold starts (up to ~20 s) and in-memory state per instance: a trip saved on one instance may not count in "notified" on another. Warm the api (open /health) a minute before the demo.

## LIVE API ON VERCEL: https://prasthan-api.vercel.app (project "prasthan-api") - DEPLOYED + VERIFIED (keys added 25 Nov: sarvam live, flagsmith live)
- Owner: api agent (services/api + this section). Do NOT touch apps/mobile or the "prasthan" web project from here.
- Code (committed): services/api/api/index.ts (Fastify app built once per warm instance, `app.server.emit('request')`),
  services/api/vercel.json (all paths -> /api/index, maxDuration 60, includeFiles seed/, config/flagsmith/, apps/mobile/assets/audio/),
  repo-root .vercelignore (only matters when deploying from the repo root), CORS_ORIGINS support in src/app.ts
  (entry defaults it to https://prasthan-ten.vercel.app; localhost always allowed).
- Vercel project prasthan-api CREATED (team ankith-ms-projects-8b28c506). Repo root is linked to it (.vercel/ is gitignored).
- Project settings DONE (via API): Root Directory = services/api, include files outside root = on, Framework = Other.
- Verified from the deployed URL (node fetch, Origin https://prasthan-ten.vercel.app): /health 200 (sarvam mock, flagsmith mock),
  /v1/config 200, /v1/intent/parse 200, /v1/tts 200 (mock: no audio), /v1/voice/intent multipart 200 KB WAV 200,
  /v1/partners 200, CORS preflight 204 with ACAO = web origin; other origins get no ACAO. No audio clips exist in apps/mobile/assets/audio (404 is expected).
- Deploy (from the REPO ROOT, not services/api): `vercel link --yes --project prasthan-api` (once) then `vercel deploy --prod --yes`
- Verify: `curl https://prasthan-api.vercel.app/health` ; `curl -X POST https://prasthan-api.vercel.app/v1/intent/parse -H 'content-type: application/json' -d '{"text":"Mysore ge Friday raatri bus beku","language":"kn-IN"}'`
- No secrets set by the agent. ANKITH, to make Sarvam REAL:
  1. vercel.com -> project prasthan-api -> Settings -> Environment Variables
  2. Add SARVAM_API_KEY = <your Sarvam key>, environments: Production (+ Preview). Optional: FLAGSMITH_SERVER_KEY = <Flagsmith server-side env key>.
  3. Deployments tab -> latest -> ... -> Redeploy (env vars only apply after a redeploy).
  4. Check: open https://prasthan-api.vercel.app/health -> modes should say sarvam live (flagsmith live if key added).
- Web app switch (other agent / Codex does this, NOT the api agent), in the "prasthan" web build env:
  `EXPO_PUBLIC_API_URL=https://prasthan-api.vercel.app` and `EXPO_PUBLIC_APP_MOCK=0`, then rebuild + redeploy the web project.
- Limits: Vercel request body 4.5 MB (api multipart cap is 2 MB audio, fine); function 60 s. Store is in-memory per instance
  (alerts/buses added in the demo can reset on a cold start; the demo flow on one warm instance is fine).

## LIVE FLAGSMITH IN WEB APP (25 Nov, verified in production)
- Merged origin/session-c into main (8325618; scripts tests 5/5 pass).
- Web app now reads REAL Flagsmith flags with the JS client SDK (`flagsmith@10.0.0`) when EXPO_PUBLIC_FLAGSMITH_ENV_KEY is set at export time (client-side key, public by design; NOT the `ser.` key). Files: apps/mobile/src/api/liveFlags.ts, flagView.ts, state/flags.tsx (polls 10 s + on focus), screens/LiveFlags.tsx (About: read-only live values), ui/kit.tsx (header note "flags: live from Flagsmith" / "flags: offline defaults"). Identity + traits (role, home_state, language, partner_type) go to Flagsmith so segments apply (Tamil -> Pongal mode).
- Build + deploy (web, offline data + live flags):
  `cd apps/mobile && EXPO_PUBLIC_APP_MOCK=1 EXPO_PUBLIC_FLAGSMITH_ENV_KEY=<client env key, Flagsmith project 55990 Development> npx expo export --platform web && node scripts/prepare-vercel.mjs && cd dist && (vercel link --project prasthan --yes) && vercel deploy --prod --yes`
- Production verified in headless Chromium at /about. The live badge appeared with zero page errors. Flagsmith Edge agreed for trav-demo on festival, voice settings, gifting, TTS/STT models, reply style, data source and poll interval. Gifting is on and reply style is short for this identity; environment defaults are off and warm.
- On stage: Flagsmith dashboard -> project Prasthan -> Development -> Features -> toggle `voice_fallback_offline` (banner appears) or edit `festival_mode` value; app follows within ~10 s.

## Commands
- app checks: `cd apps/mobile && npm install && npm run typecheck && npm test`
- app offline web: `cd apps/mobile && EXPO_PUBLIC_APP_MOCK=1 npx expo start --web`
- api checks: `cd services/api && npm install && npm run check`
- api dev (offline): `MOCK_ALL=1 npm --prefix services/api run dev` (port 8787)

## C-02 (done on main by the home builder; Session C: copy this into status/C.md when you merge)
- C-02 (home builder): infra/load/rush.mjs (no dependencies, plain fetch; autocannon skipped to keep installs lean on flaky Wi-Fi):
  --url --minutes --connections; mix 50% alerts / 25% config / 20% options / 5% voice (silent WAV, header x-load-test: 1 so
  the api uses the mock Sarvam client but still goes through the voice service); p50/p95/p99 + errors per route every 10 s.
  Check: 15 s, 10 connections vs MOCK_ALL api: ~21k requests, 0 errors, p95 11-19 ms.
- scripts/demo-break.mjs (FAULT_MODE=crash_on_voice or --oom 64Mi, rush, 5 s timeline: voice pods + "traveller answers: OK|FAIL"),
  scripts/demo-fix.mjs (manual NudgeBee runbook: ops fallback on -> FAULT_MODE=none -> rollout status -> fallback off),
  scripts/demo-reset.mjs; shared helpers in scripts/demo-lib.mjs. All print commands before running; OPS_TOKEN only SET/MISSING.
  Env: PRASTHAN_URL (default http://localhost:8080 = k3d LB), PRASTHAN_NS (default prasthan). All have --help.
- .github/workflows/ci.yml: api (npm ci + check), app (typecheck + jest), scripts (--help smoke; runs scripts/package.json tests if C adds one).
- No scripts/package.json created on purpose, so C-01 can add its own without a conflict.

## What is mocked
- Everything (no sponsor keys on the home laptop): `MOCK_ALL=1` on the api, `EXPO_PUBLIC_APP_MOCK=1` on the app.

## Known failures
- none

## Venue Codex sessions: what to paste next
- Session C (Ankith, venue laptop, branch `session-c`): owns C-01, C-03, C-04 (Flagsmith import, Docker/k3d, NudgeBee) + infra/docker, infra/k8s, config/flagsmith scripts, docs/NUDGEBEE-RUNBOOK.md. The home builder merges origin/session-c into main when it merges cleanly and checks pass.
- Sessions A and B: being built on the home laptop (no venue session needed). Home builder continues B-02 -> B-03 -> B-05 + Vercel web deploy -> C-02 (only if C has not started it) -> Z-02 README.

Before starting: `git pull origin main`, then create your worktree/branch from it (codex/SESSIONS.md "Folder setup").

## For the final README phase (Z-02)
README must have an "AI use" section (hackathon rule 7): built with OpenAI Codex + Claude Code assistance; prep docs, prompts and synthetic seed data were written before the event; all code was written during the event (from 11:30 IST, 25 Nov). Ankith must be able to explain the code, so it stays simple.
Rule 8: public repo + README with setup instructions + demo video. Rule 5: all three sponsors for 1st; 2nd = best Flagsmith use.

## Venue handoff (25 Nov)
- Verified in the live Flagsmith project: 17 flags, 7 segments, 6 overrides. Live Kannada translation, synthesis and transcription passed. The full chat prompt reached its completion limit; rules recovered BLR-HBL on 2027-01-15. Details in status/C.md.
- C-03 manifests and helpers are on session-c. Cluster acceptance awaits the local Docker engine. Production web flags verified. Next: enable Docker, rehearse cluster recovery and record the final video.

- Repository made public with owner approval after a redacted full-history Gitleaks scan and an exact private-credential check across 503 reachable objects. Anonymous GitHub API verified public visibility. Mobile typecheck and 14 tests passed; API typecheck and 57 tests passed. Docker startup awaits Ankith. Video and submission are pending.

- A 52-second screen recording with synchronized Kannada audio is in docs/img/voice-and-traveller-flow.mp4 and linked from README. It uses a synthesized Kannada sentence as microphone input, live Sarvam transcription and spoken reply, rules for intent, seeded demand, and live Flagsmith. The recording shows alert registration, adding six buses, the traveller alert and the flags view. Next: capture live NudgeBee recovery when Docker is ready, assemble the full submission video and upload unlisted.

- Vercel handoff: the production API returned HTTP 200 with Sarvam and Flagsmith in mock mode. The venue checkout has a prepared apps/mobile/dist export targeting https://prasthan-api.vercel.app, with the Flagsmith client key and zero matches for configured private credentials across 49 files. Vercel CLI reports logged out. Next exact step: Ankith signs into the Vercel account with access to both Prasthan projects on this laptop. Then configure the API production secret, redeploy the API, verify live speech, and deploy and verify the web export. Docker remains on hold until Ankith confirms.

## HANDOFF IF CLAUDE GOES OFFLINE (25 Nov ~15:35) - Codex: read this first
Claude (home laptop) may run out of credits any minute. Codex on the venue laptop finishes everything from here.
1. Pull main. Three Claude helpers may still push until ~16:00 (header/haptics/language sheet; festival calendar + region onboarding; partner portal). Merge origin/session-c into main if not merged.
2. At 16:05: `cd apps/mobile`, typecheck + jest; if green, export + deploy web with the live-API command in "WEB APP ON THE LIVE API" (EXPO_PUBLIC_API_URL=https://prasthan-api.vercel.app EXPO_PUBLIC_APP_MOCK=0 EXPO_PUBLIC_FLAGSMITH_ENV_KEY=<public client key, see LIVE FLAGSMITH section>), `node scripts/prepare-vercel.mjs`, deploy dist to Vercel project "prasthan" (needs `vercel login` on the venue laptop). If anything is red, keep the current live deploy.
3. VIDEO (16:05-16:25): recorder scripts are in video/recorder/ (record.js drives the live site in headless Chrome via the DevTools screencast with captions; build.js encodes with ffmpeg: `node video/recorder/record.js` then `node video/recorder/build.js prasthan-demo.mp4`). Update the step list in record.js to the final app (welcome -> traveller profile with region -> tap mic/type Kannada -> Sarvam reply -> trip card + route links -> Alert me -> sweets order -> Calendar -> switch to Partner: operator demand graph + add buses -> sweet shop orders -> About live Flagsmith flags -> NudgeBee screenshot docs/img/nudgebee-*.png as a still). Warm https://prasthan-api.vercel.app/health first. Then mux the Sarvam voiceover: `ffmpeg -i prasthan-demo.mp4 -i video/voiceover/full.wav -c:v copy -c:a aac -shortest prasthan-demo-vo.mp4` (align scene lengths to video/voiceover/durations.json; pad with silence if needed). Keep it 2:30-3:00. Ankith uploads to YouTube (unlisted).
4. SUBMIT by 16:40: replace <VIDEO_URL> in README.md and docs/SUBMIT-TEXT.md, confirm repo is public (private-window check), Ankith submits the form with repo + https://prasthan-ten.vercel.app + video link. Text is in docs/SUBMIT-TEXT.md; update it for the partner portal, calendar, haptics and NudgeBee rehearsal (CrashLoopBackOff in 44 s, API stayed 200, recovered) if helpers finished.
5. Never print keys; never force-push main; plain commits as Ankith-m1006.
