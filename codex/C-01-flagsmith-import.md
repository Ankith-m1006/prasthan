# C-01: Flagsmith import script + env check (Session C, 45 min)

Starts at 11:30 in parallel with P0. Runs in `../prasthan-C` (branch `c/ops`). In the 2-session split, Session 2 runs this after B-01.

## Paste into Codex

````
You are Session C of 3 parallel Codex sessions building "Prasthan" (one-day hackathon, submit by 17:00). Sessions cannot talk; they coordinate via git, file ownership and status files. Read README.md, docs/SPONSORS.md, docs/ARCHITECTURE.md, codex/SESSIONS.md, STATUS.md, config/flagsmith/flags.json. AGENTS.md lands on main after P0; merge main then and follow it.

GOAL: one command creates every Flagsmith flag, segment and segment override from config/flagsmith/flags.json; one command checks which env vars are set without printing them.

FILES YOU OWN: scripts/** (own package.json + lockfile), config/flagsmith/flags.json, status/C.md.

STEPS
1. scripts/package.json (type module; deps: dotenv; dev: typescript, tsx, vitest, @types/node). Scripts: "check-env", "flags:import", "flags:import:dry", "test".
2. scripts/check-env.ts: load ../.env (dotenv), print each name from .env.example as "NAME: SET" or "NAME: MISSING". NEVER print values, lengths or prefixes. Exit 0 always.
3. scripts/flagsmith-import.ts using the Flagsmith Admin API (header Authorization: Api-Key FLAGSMITH_ADMIN_API_KEY; project FLAGSMITH_PROJECT_ID; environment FLAGSMITH_ENVIRONMENT_API_KEY). First read the Swagger at https://api.flagsmith.com/api/v1/docs/ (or docs.flagsmith.com Admin API pages) and write the verified paths at the top of the file. Then, idempotently:
   - list existing features; create missing ones (boolean -> STANDARD with default_enabled; remote_config -> STANDARD with initial_value = string or JSON.stringify(value); multivariate -> MULTIVARIATE with variants + weights if the API supports it, else STANDARD + note).
   - list segments; create missing ones from the "segments" section (rules: EQUAL on traits; the 20% pilot uses the PERCENTAGE_SPLIT operator).
   - create segment overrides from each flag's segmentOverrides (in the target environment).
   - print a summary table: created / existed / failed per item. No secrets in output.
   --dry-run prints what it would do without calling the API.
   If an endpoint fails, continue with the rest and list what Ankith must do by hand in the dashboard.
4. Unit tests (vitest) for the mapping flags.json -> API payloads (no network).
5. Write docs for Ankith in status/C.md: exact commands, and the manual fallback list.

ACCEPTANCE CHECKS
- cd scripts && npm install && npm test && npm run flags:import:dry
- npm run check-env  -> only SET/MISSING lines
- With keys: npm run flags:import  -> summary shows all flags; open the Flagsmith dashboard and confirm festival_mode, voice_fallback_offline, gifting_enabled and the tamil_travellers segment exist.

MOCK MODE: --dry-run.
WHILE WAITING for keys: dry run + tests.

FINISH: status/C.md (what exists in Flagsmith now; what is manual), commit "C-01: Flagsmith import + env check", Merge steps from codex/SESSIONS.md. Report.
````

## If something goes wrong
- 12:15 and still failing: stop. Ankith creates the flags by hand from flags.json (15 min). Move to C-02.
