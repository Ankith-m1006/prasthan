# AGENTS.md (read every time)

## Product (3 lines)
Prasthan: say your festival trip home in your own language; Sarvam AI understands it and replies aloud.
We deep-link to official booking sites (no prices, no scraping), warn about rush nights and touts, and alert you when a new bus opens.
Bus operators see the demand that has no seats yet and add buses with one tap. Flagsmith runs the festival config; NudgeBee keeps it up.

Source of truth for shapes and endpoints: `docs/ARCHITECTURE.md` and `shared/contract/` (v see `shared/contract/VERSION`).
Server framework: **Fastify 5** (TypeScript, run with `tsx`, no build step).

## Edit only files you own

| Path | Owner |
|---|---|
| `shared/contract/**` | A |
| `services/api/**` | A |
| root `package.json` (scripts only, no deps, no workspaces), `AGENTS.md`, `README.md`, `RESUME.md` | A (Z-02 edits README) |
| `apps/mobile/**` | B |
| `.github/workflows/android-beta.yml` | B (optional) |
| `scripts/**` (own `package.json`), `infra/load/**` | C |
| `infra/docker/**`, `infra/k8s/**` (incl. k3d-up.mjs) | C |
| `config/flagsmith/flags.json` | C |
| `.github/workflows/ci.yml` | C |
| `docs/NUDGEBEE-RUNBOOK.md` (new) | C |
| `seed/**`, `docs/**` (other files), `codex/**`, `ideas/**` | nobody (read-only prep; Z-02 may fix docs) |
| `status/A.md` / `B.md` / `C.md` | A / B / C |

If you need a change in a file you do not own, write a request under "REQUESTS TO OTHERS" in your own status file.

## Merge steps (every session, end of every phase)

```
git add -A && git commit -m "<phase id>: <what>"
git merge main                       # bring in the others' work
# conflict in a file you own: fix it. conflict in a file you DON'T own: git merge --abort, write it in your status file, stop.
<run your phase's acceptance checks again>
git -C ../festive-prasthan merge --ff-only <your-branch>
# "Not possible to fast-forward" = someone merged first: run `git merge main` again, re-check, retry.
# "index.lock exists" = someone is merging right now: wait 20 s, retry.
```
Status file update goes in the same commit (before the ff merge).

Note (25 Nov): the first part of the build (P0, A-01..A-03, B-01..B-03) was done directly on `main` in the main folder by a single builder. Venue sessions: pull `origin/main` first, then create your worktrees/branches from it. Read `RESUME.md`.

## Quality bar
- TypeScript strict, no `any`. Small modules (< 200 lines), functions < 40 lines.
- Dependency injection for every external client (Sarvam, Flagsmith, context.dev, clock).
- Every network call: timeout + 1 retry with jitter + a fallback.
- Validate all LLM output against JSON schema (ajv).

## Secrets
- Keys only from `process.env`. Never print, log, commit or echo them. Logs show only `NAME: SET|MISSING`.
- Never send keys to the app bundle. Only `EXPO_PUBLIC_*` names reach the app and none of them are secrets.

## Mock mode
`MOCK_ALL=1` (api) or per service `SARVAM_MODE=mock`, `FLAGSMITH_MODE=mock`, `CONTEXT_DEV_MODE=off`; `EXPO_PUBLIC_APP_MOCK=1` (app). Every feature must work offline in mock mode.

## Tests
vitest for api + contract, no network in tests, `npm test` under 30 s. The app uses jest-expo for pure tests.

## Honesty
Seed data is synthetic: label it in the UI ("Seeded demo data"). Any shortcut goes into README "Limits".

## Commits
Plain messages. No AI or co-author trailers.
