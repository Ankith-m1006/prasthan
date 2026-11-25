# RESUME (read this first if you are a fresh session)

Updated: 25 Nov 2026, with every push. Builder so far: one session on Ankith's home laptop, working directly on `main`.

## Where we are
- Current phase: Z-02 done. LIVE: https://prasthan-ten.vercel.app. Done on main: P0, A-01, A-02, A-03, B-01, B-02, B-03, B-05 (+gifting card), C-02, Z-02.
- UI redesign (25 Nov ~13:30, home builder): airy, no cards, frosted glass panels only where grouping is needed, soft festival glow behind headers, pill buttons/chips (44-52 px), floating frosted tab bar on desktop. Colours unchanged. New files apps/mobile/src/ui/glass.ts + backdrop.tsx; Card replaced by Section/Glass in kit.tsx. Behaviour, api client and contracts untouched. Checked in headless Chrome at 430 px and 1280 px: type sample -> trip card -> links + warning -> Alert me -> Partners -> add 6 buses -> 16 notified -> Kannada alert -> About flags, 0 console errors. Screenshots: docs/img/ui-*.png. Redeployed to https://prasthan-ten.vercel.app.
- Last finished step (before redesign): clean clone in a temp folder: api install + check (57 tests) OK, app install + typecheck + jest (10) OK. Web app built against the real api (MOCK_ALL=1) verified in headless Chrome: speak -> alert me -> add 6 buses -> 16 notified -> Kannada alert, no console errors. Split ROLE=api/voice tested; killing voice -> traveller still answered (rules).
- Next exact step: Ankith: screenshots into docs/img/, record video, put VIDEO_URL in README, make repo public, submit form by 16:45. Session C: C-01/C-03/C-04 on branch session-c (C-02 scripts already on main). Optional if time: A-04 context.dev.

## LIVE FLAGSMITH IN WEB APP (25 Nov ~13:10, home builder agent; in progress)
- Merged origin/session-c into main (8325618; scripts tests 5/5 pass).
- Web app now reads REAL Flagsmith flags with the JS client SDK (`flagsmith@10.0.0`) when EXPO_PUBLIC_FLAGSMITH_ENV_KEY is set at export time (client-side key, public by design; NOT the `ser.` key). Files: apps/mobile/src/api/liveFlags.ts, flagView.ts, state/flags.tsx (polls 10 s + on focus), screens/LiveFlags.tsx (About: read-only live values), ui/kit.tsx (header note "flags: live from Flagsmith" / "flags: offline defaults"). Identity + traits (role, home_state, language, partner_type) go to Flagsmith so segments apply (Tamil -> Pongal mode).
- Build + deploy (web, offline data + live flags):
  `cd apps/mobile && EXPO_PUBLIC_APP_MOCK=1 EXPO_PUBLIC_FLAGSMITH_ENV_KEY=<client env key, Flagsmith project 55990 Development> npx expo export --platform web && node scripts/prepare-vercel.mjs && cd dist && (vercel link --project prasthan --yes) && vercel deploy --prod --yes`
- Next exact step: export -> deploy -> verify headless Chrome shows "flags: live from Flagsmith" on https://prasthan-ten.vercel.app and About values match `curl -H "X-Environment-Key: <key>" https://edge.api.flagsmith.com/api/v1/flags/`.
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
- C-03 manifests and helpers are on session-c. Cluster acceptance awaits the local Docker engine. Next: check the deployed web app against the live Flagsmith environment.
