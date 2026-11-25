# RESUME (read this first if you are a fresh session)

Updated: 25 Nov 2026, with every push. Builder so far: one session on Ankith's home laptop, working directly on `main`.

## Where we are
- Current phase: Z-02 done. LIVE: https://prasthan-ten.vercel.app. Done on main: P0, A-01, A-02, A-03, B-01, B-02, B-03, B-05 (+gifting card), C-02, Z-02.
- UI redesign (25 Nov ~13:30, home builder): airy, no cards, frosted glass panels only where grouping is needed, soft festival glow behind headers, pill buttons/chips (44-52 px), floating frosted tab bar on desktop. Colours unchanged. New files apps/mobile/src/ui/glass.ts + backdrop.tsx; Card replaced by Section/Glass in kit.tsx. Behaviour, api client and contracts untouched. Checked in headless Chrome at 430 px and 1280 px: type sample -> trip card -> links + warning -> Alert me -> Partners -> add 6 buses -> 16 notified -> Kannada alert -> About flags, 0 console errors. Screenshots: docs/img/ui-*.png. Redeployed to https://prasthan-ten.vercel.app.
- Last finished step (before redesign): clean clone in a temp folder: api install + check (57 tests) OK, app install + typecheck + jest (10) OK. Web app built against the real api (MOCK_ALL=1) verified in headless Chrome: speak -> alert me -> add 6 buses -> 16 notified -> Kannada alert, no console errors. Split ROLE=api/voice tested; killing voice -> traveller still answered (rules).
- Next exact step: Eight screenshots are in docs/img/ and linked from README. Ankith: record video, put VIDEO_URL in README, submit form by 16:45. Session C: C-01/C-03/C-04 on branch session-c (C-02 scripts already on main). Optional if time: A-04 context.dev.

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
