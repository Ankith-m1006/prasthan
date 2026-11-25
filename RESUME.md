# RESUME (read this first if you are a fresh session)

Updated: 25 Nov 2026, with every push. Builder so far: one session on Ankith's home laptop, working directly on `main`.

## Where we are
- Current phase: B-03 done (P0, A-01..A-03, B-01..B-03 all done). Next: B-05 polish + mock web build deployed to Vercel.
- Last finished step: B-03: api 57 tests, app jest 10/10, full mock demo loop verified in headless Chrome (speak -> alert me -> operator adds 6 buses -> 16 notified -> Kannada alert).
- Next exact step: B-05 polish (demo switches on About for the offline Flagsmith story), then `EXPO_PUBLIC_APP_MOCK=1 npx expo export --platform web` and deploy apps/mobile/dist to Vercel.

## Commands
- app checks: `cd apps/mobile && npm install && npm run typecheck && npm test`
- app offline web: `cd apps/mobile && EXPO_PUBLIC_APP_MOCK=1 npx expo start --web`
- api checks: `cd services/api && npm install && npm run check`
- api dev (offline): `MOCK_ALL=1 npm --prefix services/api run dev` (port 8787)

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
