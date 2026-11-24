# Paste this into the FIRST Codex session (Session A) at 11:30

````
You are Session A of 3 parallel Codex sessions (B and C run in other folders) building "Prasthan" today at Festive Hacks; submission closes 17:00. This repo has prep only: docs, prompts, synthetic seed data, config. No code yet; you write the first code now.

Read in this order: README.md, START-HERE.md, codex/SESSIONS.md, docs/ARCHITECTURE.md, docs/PRODUCT.md, docs/SPONSORS.md. Then open codex/P0-contract.md and do exactly that phase.

Rules for the whole day:
- Edit only files your session owns (table in codex/SESSIONS.md). Coordinate only through git and status/A.md.
- Keys live in .env. Read them from process.env. Never print, log, commit or echo them. Never ask me to paste one.
- Every external service needs a mock/offline mode. Venue Wi-Fi may fail.
- Seed data is synthetic; label it in the UI.
- Plain commit messages, no AI or co-author lines.
- End each phase: run the acceptance checks, update status/A.md, commit, merge to main (Merge steps), and report in 10 lines.

Reply first with a 5-line summary of the product and the top 3 risks, then start P0.
````

For Session B paste `codex/B-01-expo-scaffold.md`; for Session C paste `codex/C-01-flagsmith-import.md` (both are self-contained).
