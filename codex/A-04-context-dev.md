# A-04: context.dev live alerts (Session A, STRETCH, 30 min, only if everything is green after 14:30)

## Paste into Codex

````
Session A. Read AGENTS.md and docs/CONTEXT-DEV.md. `git merge main`.

GOAL: when the Flagsmith flag live_data_source = "context_dev", /v1/alerts adds up to 5 recent real news items about festival special buses/trains, each with its source URL. Default stays "seeded".

FILES YOU OWN: services/api/src/live/**, services/api/test/live*.test.ts, status/A.md (and the alerts route only to call the new module).

STEPS
1. Find the context.dev API docs (docs site or SDK README). Confirm: the news/web search endpoint, auth header, the API key env var name. Use process.env.CONTEXT_DEV_API_KEY (if the SDK expects another name, map it in code and tell Ankith in the report to update .env.example). If you cannot reach the docs in 5 minutes, STOP this phase and report "skipped: docs unreachable".
2. src/live/contextdev.ts: searchFestivalNews(queries) with timeout 6 s, cache 10 min, max 5 results, last 30 days. Queries from docs/CONTEXT-DEV.md (KSRTC special buses Sankranti Bengaluru; special trains Sankranti Bengaluru; Pongal special trains Bengaluru Madurai; bus fares surge Sankranti Bengaluru). Map to Alert {kind: special_bus|special_train|surge_warning by keyword, text = headline (trimmed), source:"context_dev", sourceUrl}.
3. Alerts route: if flag = context_dev and CONTEXT_DEV_MODE=live, merge live items after seeded ones; on any error return seeded only, source "seeded".
4. Never log the key, the full response, or query results with personal data.

TESTS: fake client -> mapped alerts; error -> seeded only; flag seeded -> client never called.

ACCEPTANCE CHECKS
- npm run check
- CONTEXT_DEV_MODE=live with the key in .env; set live_data_source=context_dev in Flagsmith; curl -s "http://localhost:8787/v1/alerts?identity=trav-demo" -> items with sourceUrl
- Set the flag back to "seeded" for the stage.

FINISH: status/A.md, commit "A-04: optional context.dev news alerts behind a flag", Merge steps. Report credits used if the API shows them.
````
