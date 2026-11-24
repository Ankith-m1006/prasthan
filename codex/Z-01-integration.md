# Z-01: integration + full demo run (Session A drives, 14:30-15:15)

Other sessions keep working only on their own polish; A fixes integration bugs in its own files and writes requests for the rest.

## Paste into Codex (Session A)

````
Session A. INTEGRATION PHASE. Read AGENTS.md, docs/DEMO-SCRIPT.md, docs/RISKS.md, all status files on main. `git merge main`.

GOAL: the DEMO-SCRIPT runs end to end from a clean start, twice: once live (keys), once fully offline (MOCK_ALL=1 + EXPO_PUBLIC_APP_MOCK=1).

FILES YOU OWN: services/api/**, shared/contract/**, root package.json, status/A.md. For bugs elsewhere: write an exact REQUEST (file, symptom, expected) to B or C in status/A.md, merge to main, and tell Ankith in your report which session must pick it up.

STEPS
1. From the MAIN folder (../festive-prasthan, read-only for you; run only): npm --prefix services/api ci; npm --prefix apps/mobile ci; `npm run dev`. Open the web app.
2. Walk DEMO-SCRIPT.md: speak/type the Kannada hero line -> trip card -> links -> Alert me -> Partners Demo State RTC -> Add buses -> traveller alert plays -> change festival_mode for a Tamil identity -> gifting rollout -> ops fallback on/off.
3. For every failure: find the cause; fix if in your files; else request.
4. Contract drift check: run a script (in services/api/test) that hits every endpoint on a running server and validates against shared/contract/schemas.
5. Offline run: MOCK_ALL=1 for api; EXPO_PUBLIC_APP_MOCK=1 for app; repeat step 2 (Flagsmith steps show mock state).
6. Secrets check: git grep for key patterns (docs/SUBMISSION.md command); `git ls-files .env` empty; no key in web build output.
7. Write a "Demo readiness" list in status/A.md: each DEMO-SCRIPT step = OK / FLAKY / BROKEN, with the fallback move.

ACCEPTANCE CHECKS
- Both runs pass, or every non-OK step has a fallback move written down.
- npm test green in services/api; CI green on the latest main (if pushed).

FINISH: commit "Z-01: integration fixes + demo readiness", Merge steps. Report the readiness list.
````
