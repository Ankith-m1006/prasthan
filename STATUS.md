# STATUS board

Codex sessions cannot message each other. They coordinate through git:
- Each session writes ONLY its own file: `status/A.md`, `status/B.md`, `status/C.md`.
- Read the others from main: `git show main:status/B.md` (any session, any time).
- At the START of every phase: `git merge main`, then read all three status files.
- At the END of every phase: update your status file, commit, then merge into main (codex/SESSIONS.md "Merge steps").
- Need something from another session? Write it under "REQUESTS TO OTHERS" in YOUR file, e.g. `-> A: add field boardingPoint to /v1/options response`. The owner answers in THEIR file under "ANSWERS".
- The contract (`shared/contract/`) changes only by Session A. Every change bumps `shared/contract/VERSION` and is listed in status/A.md.

Ankith reads this board between phases and pastes the next prompt.

| Session | Owns | File |
|---|---|---|
| A | shared/contract, services/api, root README/AGENTS/package.json | status/A.md |
| B | apps/mobile, .github/workflows/android-beta.yml | status/B.md |
| C | scripts, infra, config/flagsmith, .github/workflows/ci.yml | status/C.md |
