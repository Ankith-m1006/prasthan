# Codex sessions: how 2 or 3 sessions build Prasthan in parallel

## Can Codex sessions talk to each other?

**No, not as far as is publicly documented (checked 24-25 Nov 2026).**
- OpenAI's Codex docs describe **subagents / multi-agent**: one Codex session can spawn helper agents in parallel and collect their results. That is orchestration inside ONE session, not messaging between separate sessions. Config has limits like `max_threads` and `max_depth`.
  - https://developers.openai.com/codex/subagents
  - https://developers.openai.com/codex/multi-agent
- A Codex session can also be run as an MCP server and driven by another program (Agents SDK): https://developers.openai.com/codex/guides/agents-sdk
- Separate sessions do not share context; users ask for cross-session messaging as a feature, which suggests it does not exist: https://community.openai.com/t/cross-device-codex-communication-and-agent-handoffs/1403978 , https://github.com/openai/codex/discussions/3898
- The Codex app keeps parallel agents apart with **worktrees** (third-party write-up quoting the launch post).
- Caveat: our direct fetch of the docs pages failed tonight; the above comes from search-result summaries of those pages. If Codex has a new feature tomorrow, ignore it; the git method below works anyway.

So we coordinate through **the git repo**: contract first, one owner per file, a status board, small merges.

## The method (5 rules)

1. **Contract first.** Phase 0 (Session A, 25 min) writes `shared/contract/` (types, JSON schemas, example JSONs) from docs/ARCHITECTURE.md. Everyone builds against the examples, not against each other's code.
2. **One owner per file.** No two sessions edit the same file. Ownership table below. If you need a change in someone else's file, write a request in your status file.
3. **One worktree per session.** Same repo, separate folders, separate branches. No shared working tree.
4. **Status board.** `STATUS.md` (rules) + `status/A.md`, `status/B.md`, `status/C.md`. Each session writes only its own file and reads the others from `main`.
5. **Small merges, fast-forward only.** At the end of each phase: merge `main` into your branch, run checks, then fast-forward `main` to your branch. Git's own lock stops two merges colliding; if it fails, repeat.

## Folder setup (Ankith, once, at 11:30, after the prep commit exists)

```
cd festive-prasthan                      # main checkout: NOBODY edits here; it only receives merges
git worktree add ../prasthan-A -b a/api
git worktree add ../prasthan-B -b b/app
git worktree add ../prasthan-C -b c/ops   # skip for the 2-session split
```
Open Codex session A in `../prasthan-A`, B in `../prasthan-B`, C in `../prasthan-C`. Copy `.env` into each worktree folder (git ignores it). Never paste keys into Codex chat.

## Merge steps (every session, end of every phase; also in AGENTS.md)

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

## File ownership

| Path | Owner |
|---|---|
| `shared/contract/**` | A |
| `services/api/**` | A |
| root `package.json` (scripts only, no deps, no workspaces), `AGENTS.md`, `README.md` | A (Z-02 edits README) |
| `apps/mobile/**` | B |
| `.github/workflows/android-beta.yml` | B (optional) |
| `scripts/**` (own `package.json`), `infra/load/**` | C |
| `infra/docker/**`, `infra/k8s/**` (incl. k3d-up.mjs) | C |
| `config/flagsmith/flags.json` | C |
| `.github/workflows/ci.yml` | C |
| `docs/NUDGEBEE-RUNBOOK.md` (new) | C |
| `seed/**`, `docs/**` (other files), `codex/**`, `ideas/**` | nobody (read-only prep; Z-02 may fix docs) |
| `status/A.md` / `B.md` / `C.md` | A / B / C |

Why no npm workspaces: one shared `package-lock.json` at the root would be edited by every session and conflict all day. Each package has its own `package.json` + lockfile. The app imports the contract types by relative path (`../../shared/contract/src`), with Metro `watchFolders` set in B-01.

## (a) 3-session split (preferred if the laptop can take it)

| Time | Session A (api) | Session B (app) | Session C (ops) |
|---|---|---|---|
| 11:30 | P0 contract + scaffold | B-01 Expo scaffold, tokens, nav (no contract needed yet) | C-01 Flagsmith import + check-env |
| 11:55 | A-01 api core (seed, store, options, trips, alerts, partners, demand, ops, metrics) | B-01 then merge main (contract) | C-01 |
| 12:15 | A-01 | B-02 Speak + trip card + options (against contract examples / mock client) | C-02 load script, break/fix scripts, CI |
| 12:50 | A-02 voice: Sarvam STT/LLM/TTS, rule parser, fallback, fault injection | B-02 | C-02 |
| 13:00-14:00 | lunch at the desk; sessions keep running | | C-03 Dockerfile + k3d deploy (needs A-01 on main) |
| 13:20 | A-02 | B-03 alerts + partner dashboard (operator, shop) | C-03 |
| 13:50 | A-03 Flagsmith server (identify/config, segments, ops flip) | B-03 | C-04 NudgeBee: agent, Prometheus, runbook, rehearsal |
| **14:30 CUT LINE** | Z-01 integration (A drives) | B-04 gifting + quick commerce (CUT FIRST) or polish | C-04 rehearsal |
| 15:00 | A-04 context.dev (stretch, only if green) | B-05 polish + web export | C-04 timing the break/fix |
| 15:30 | fixes from rehearsal | Z-02 README + video checklist | fixes |
| 16:15-16:45 | record video, push, submit (Ankith) | | |

B-06 (Android release workflow) is optional: only after 15:30 and only if B is idle. Z-02 owns README.md for its phase; nobody else edits README then.

## (b) 2-session split (if the laptop is slow or Ankith wants less to watch)

Session 1 = A prompts + C-03 + C-04 + Z-01. Session 2 = B prompts + C-01 + C-02 + Z-02. Each session owns the paths listed under the table (never by the letter alone).

| Time | Session 1 (`../prasthan-A`, branch a/api) | Session 2 (`../prasthan-B`, branch b/app) |
|---|---|---|
| 11:30 | P0 | B-01 |
| 11:55 | A-01 | C-01 (Flagsmith import; owns scripts/ + config/flagsmith for now) |
| 12:30 | A-02 voice | B-02 |
| 13:30 | A-03 Flagsmith server | B-03 |
| 13:50 | C-03 Docker + k3d | C-02 load + break/fix scripts + CI |
| **14:30 CUT LINE** | C-04 NudgeBee (lighter: agent + one alert + runbook or manual flip) | B-05 polish |
| 15:00 | Z-01 integration | B-05 |
| 15:30 | fixes | Z-02 README |

Ownership in the 2-session split:
- Session 1 (status/A.md): everything A owns + `infra/docker/**`, `infra/k8s/**`, `docs/NUDGEBEE-RUNBOOK.md`.
- Session 2 (status/B.md): everything B owns + `scripts/**`, `infra/load/**`, `config/flagsmith/flags.json`, `.github/workflows/ci.yml`.
- When a prompt says "status/C.md", write in your own session's status file instead.
Cut in 2-session mode: B-04 (gifting + quick commerce) and A-04 (context.dev) are skipped unless both sessions are green at 14:30.

## How a session knows what the others did (without talking)

- Start of every phase: `git merge main`, then `git show main:status/A.md`, `...B.md`, `...C.md`.
- Contract version: `cat shared/contract/VERSION`. If it changed, re-read `shared/contract/CHANGELOG.md`.
- Before the api exists, B uses its mock client (contract examples + seed). C tests scripts with `--dry-run`.
- If blocked on another session: write `BLOCKED on A: ...` in your status, switch to the next task in your own phase (every phase lists a "while waiting" task), and tell Ankith in your final report.

## Ankith's loop (every 30-40 min)

1. Read each session's last report. If its acceptance checks passed and it merged: paste the next prompt.
2. Glance at `STATUS.md` + status files in the main folder for REQUESTS / BLOCKED.
3. If a session drifts: "Re-read AGENTS.md, codex/SESSIONS.md and your phase file. Stay inside the files you own. Redo the acceptance checks."
4. Never paste keys into Codex. If Codex asks for a key: "It's in .env; read it from process.env; never print it."
