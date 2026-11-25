# Submission checklist (submit by 16:45; close is 17:00)

Official (Luma page): submit via the Festive Hacks page: public repo + README someone else can set up from + demo video. Judged on the problem, whether the main flow works, how well it uses EACH sponsor tool. AI use must be disclosed (kit, Rules page).

Status 25 Nov ~12:15 (home builder): [x] = verified; the rest is for Ankith.
Live web demo: https://prasthan-ten.vercel.app

## Repo
- [x] Public GitHub repository. Verified anonymously after checking repository history for secrets.
- [x] `git log` shows work from 11:30 onward. The prep commit is labelled "prep: docs, prompts, synthetic seed data (made before hacking; no code)".
- [x] No secrets: run `git grep -nE "sk-nb-[A-Za-z0-9]|ser\.[A-Za-z0-9]{10,}|api-subscription-key: [A-Za-z0-9]{8,}|(SARVAM_API_KEY|FLAGSMITH_[A-Z_]*KEY|NUDGEBEE_API_TOKEN|CONTEXT_DEV_API_KEY|OPS_TOKEN)=[^ #]+"` -> must show nothing except `.env.example` names with empty values. Check `.env` is not tracked: `git ls-files .env` prints nothing.
- [x] No node_modules, builds, APKs or big audio in git (`git count-objects -vH` under 10 MB).

## README (Z-02 writes it; a stranger must run it in 5 minutes)
- [x] One-line pitch + the problem in 3 lines.
- [ ] Demo video link (YouTube unlisted) at the top.
- [x] Quick start: prerequisites (Node 22, npm), `cp .env.example .env`, `npm --prefix services/api install`, `npm --prefix apps/mobile install`, `npm run dev` (api + web), open http://localhost:8081. Works with ALL keys empty (`MOCK_ALL=1`).
- [x] Live setup: how to get each key; Flagsmith import command; k3d + NudgeBee steps (link docs/SPONSORS.md).
- [x] Architecture diagram (mermaid) + API list (link docs/ARCHITECTURE.md).
- [x] "How we use each sponsor" section: Sarvam, Flagsmith, NudgeBee, each with what breaks without it.
- [x] "Demo data" note: seed is synthetic.
- [x] "Limits" (honest list) + "Roadmap" (operators pilot, WhatsApp voice notes, quick commerce).
- [x] "AI use" disclosure (below).
- [x] Credits: fonts, icons (with licences), "Powered by Sarvam AI".

## AI-use disclosure (paste into README, adjust)
> AI use: This project was built during Festive Hacks on 25 Nov 2026. Code was written with OpenAI Codex (several parallel sessions) following prompts and docs Ankith prepared the night before (in `docs/` and `codex/`). Ankith chose the problem, designed the product and architecture, reviewed and ran the code, and can explain every part. Seed data is synthetic. Prep docs were also drafted with AI help.

## Video (2-3 min)
- [ ] Shows: Kannada voice -> trip -> links + warning -> operator adds buses -> alert in Kannada -> Flagsmith flip -> NudgeBee break/fix.
- [ ] Audio of the Kannada reply is audible.
- [ ] No keys visible anywhere.
- [ ] YouTube unlisted (or Drive with "anyone with link"). Link tested in a private window.

## Form
- [ ] Repo URL, video URL, team name, short description (use PRODUCT.md one line), sponsors used: Flagsmith, NudgeBee, Sarvam AI.
- [ ] Screenshot the confirmation.

## After submit
- [ ] Keep the k3d cluster, api and web running for judges.
- [ ] Rehearse DEMO-SCRIPT.md once.
- [ ] Do not push risky changes after 16:45. Small README fixes only.
