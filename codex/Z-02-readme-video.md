# Z-02: README + submission + video checklist (any free session, 15:30-16:15)

Takes ownership of README.md for this phase only (tell the others in your status file).

## Paste into Codex

````
README PHASE. Read docs/SUBMISSION.md, docs/PRODUCT.md, docs/SPONSORS.md, docs/ARCHITECTURE.md, all status files. `git merge main`. You own README.md (this phase only) and your status file.

GOAL: a README a stranger can set up from in 5 minutes, that also wins the "how well each sponsor is used" question.

WRITE README.md with these sections, short and plain:
1. Prasthan - one line + 3-line problem (from docs/PRODUCT.md) + "Demo video: <VIDEO_URL>" placeholder at the top.
2. What it does: traveller flow, partner flow (bus operators, sweet shops, quick commerce = roadmap), with 3 screenshots placeholders (docs/img/*.png; Ankith adds them).
3. Quick start (offline, no keys): prerequisites (Node 22, npm, git); clone; cp .env.example .env; set MOCK_ALL=1 and EXPO_PUBLIC_APP_MOCK=0; npm --prefix services/api install; npm --prefix apps/mobile install; npm run dev; open http://localhost:8081. Test exactly these commands from a clean clone in a temp folder before writing "works".
4. Live setup: Sarvam key; Flagsmith (project, keys, `npm --prefix scripts run flags:import`); NudgeBee + k3d (`node infra/k8s/k3d-up.mjs`, agent install, runbook in docs/NUDGEBEE-RUNBOOK.md); optional context.dev.
5. Architecture: mermaid diagram (app -> api -> voice -> Sarvam; api -> Flagsmith; k3d + NudgeBee agent -> NudgeBee Cloud -> Slack -> runbook -> Flagsmith). Link docs/ARCHITECTURE.md for the API.
6. How we use each sponsor (what breaks without it): Sarvam (Saaras v4, sarvam-105b, Bulbul, translate), Flagsmith (list every flag + segment from config/flagsmith/flags.json in one table: flag, type, what it changes, who it targets), NudgeBee (cluster watch, RCA in Slack, approved runbook flipping Flagsmith). Plus "context.dev: optional live news alerts behind a flag (not a sponsor)".
7. Demo data: all partner, demand and order data is synthetic (seed/), labelled in the app. Real brands appear only as text links; no logos; no scraping; no prices.
8. Limits (honest): from all status files' gaps + docs/RISKS.md.
9. Roadmap: operator pilots, WhatsApp voice notes, quick-commerce partners, train waitlist-aware alerts.
10. AI use: paste the disclosure from docs/SUBMISSION.md.
11. Credits + licences: fonts (OFL), icons (MIT/ISC), "Powered by Sarvam AI".
12. Built at Festive Hacks, 25 Nov 2026, BIEC Bengaluru.

ALSO
- Fill docs/SUBMISSION.md checkboxes you can verify; list the rest for Ankith.
- Print the video shot list (from docs/DEMO-SCRIPT.md "Video") for Ankith.
- Run the secrets check from docs/SUBMISSION.md and paste the (empty) result.

FINISH: commit "Z-02: README + submission checklist", Merge steps. Report what Ankith still has to do by hand (video, screenshots, form, repo public).
````
