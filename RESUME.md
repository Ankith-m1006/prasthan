# RESUME (read this first if you are a fresh session)

Updated: 25 Nov 2026, with every push. Builder so far: one session on Ankith's home laptop, working directly on `main`.

## Where we are
- Current phase: P0 done. Next: A-01 (api core).
- Last finished step: P0 acceptance checks passed (tsc + contract test 11/11, /health ok).
- Next exact step: A-01 — see `codex/A-01-api-core.md`.

## Commands
- api checks: `cd services/api && npm install && npm run check`
- api dev (offline): `MOCK_ALL=1 npm --prefix services/api run dev` (port 8787)

## What is mocked
- Everything (no sponsor keys on the home laptop): `MOCK_ALL=1` on the api, `EXPO_PUBLIC_APP_MOCK=1` on the app.

## Known failures
- none

## Venue Codex sessions: what to paste next
- Session A: (being built here) — check this file again after the next push.
- Session B: (being built here) — check this file again after the next push.
- Session C: `codex/C-01-flagsmith-import.md` (nothing of C is done here; k3d/NudgeBee are venue-only).

Before starting: `git pull origin main`, then create your worktree/branch from it (codex/SESSIONS.md "Folder setup").

## For the final README phase (Z-02)
README must have an "AI use" section (hackathon rule 7): built with OpenAI Codex + Claude Code assistance; prep docs, prompts and synthetic seed data were written before the event; all code was written during the event (from 11:30 IST, 25 Nov). Ankith must be able to explain the code, so it stays simple.
Rule 8: public repo + README with setup instructions + demo video. Rule 5: all three sponsors for 1st; 2nd = best Flagsmith use.
