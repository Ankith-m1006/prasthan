# Prasthan (ಪ್ರಸ್ಥಾನ, "setting out on a journey") - PREP REPO

**This repo has NO application code.** It holds docs, Codex prompts, synthetic seed data and config templates, made on 24 Nov 2026, before Festive Hacks (25 Nov 2026, BIEC Bengaluru). The rules say main coding starts when hacking starts (11:30). All code gets written on the day by OpenAI Codex sessions using these prompts. Ask the organisers at check-in whether using this prep is OK; if not, start a fresh repo and copy in only `seed/` and `docs/`.

## What Prasthan is
Say your festival trip home in your own language (Kannada, Tamil, Telugu, Hindi, Odia, Bengali, English). Prasthan understands it (Sarvam AI), sends you to the official booking sites (deep links only: no scraping, no prices, no comparison), warns about rush nights and touts, and speaks to you when a new bus or special train opens. Bus operators see the demand that has no seats yet and add buses with one tap; sweet shops near boarding points see pre-orders; quick-commerce partners (roadmap) see where and when travellers leave.

"redBus shows the buses that exist. We show operators the buses that are missing."

Sponsors: Sarvam AI (voice both ways), Flagsmith (festival modes, segments, kill switches, rollout), NudgeBee (keeps the rush night up, explains the crash, approved fix flips Flagsmith). Optional helper: context.dev (live news alerts behind a flag).

## Quick start for tomorrow
1. Read **START-HERE.md** (the day, minute by minute).
2. Paste **PROMPT-FOR-ANKITH.md** into the first Codex session.
3. Follow **codex/SESSIONS.md** for the 2- or 3-session split.

## What is in here
- `START-HERE.md` - order for 09:00-17:00, cut line 14:30
- `PROMPT-FOR-ANKITH.md` - the kickoff message for Codex
- `STATUS.md`, `status/` - the board Codex sessions use to coordinate
- `docs/` - PRODUCT, ARCHITECTURE (the API contract), SPONSORS, CONTEXT-DEV, DESIGN, DEMO-SCRIPT, SUBMISSION, RISKS, K8S-TEMPLATES
- `codex/` - SESSIONS.md + one ready-to-paste prompt per phase (P0, A-01..A-04, B-01..B-06, C-01..C-04, Z-01, Z-02)
- `seed/` - SYNTHETIC demo data: routes, boarding points, festivals (Sankranti/Pongal 2027 verified), partners, services, 200 intents, demand forecast, gift orders, quick-commerce demand, alerts, deep links, multilingual utterances
- `config/flagsmith/flags.json` - every flag, segment and trait to create
- `.env.example` - names only
- `ideas/NAMMA-HABBA.md` - the backup idea, one page

## Rules this repo keeps
- No keys anywhere. `.env` is git-ignored. Never print keys.
- Small: no node_modules, no builds, no audio. Zip and send to a phone as is.
- Seed data is synthetic and labelled. Real brands only as text links; no logos.
