# START HERE - Wed 25 Nov 2026, BIEC Bengaluru

Official: hacking 11:30-17:00 (lunch 13:00-14:00, the clock runs). Submit by 17:00 on the Festive Hacks page: public repo + README + demo video. Aim to submit at 16:45. 1st needs Flagsmith + NudgeBee + Sarvam. 2nd = best Flagsmith use.

## Tonight / before 09:00 (accounts and infra are not code)
- [ ] Sarvam: account, verify (Rs 100 credits), API key into `.env`.
- [ ] Flagsmith: project `prasthan`, envs development + production, all 5 keys/ids into `.env` (see docs/SPONSORS.md).
- [ ] NudgeBee: Cloud signup, API token, Slack connected (`#prasthan-ops`).
- [ ] Docker Desktop + k3d + kubectl + helm installed. Node 22. Git. Expo Go on the phone.
- [ ] context.dev key into `.env` (optional).
- [ ] Charge laptop + phone; hotspot data; headset with mic.

## 09:00-09:30 Check-in
- Wi-Fi + hotspot test (open github.com, api.sarvam.ai, app.flagsmith.com, app.nudgebee.com).
- Ask organisers: (1) is this prep repo (docs/prompts/data, no code) OK? (2) exact submit link + close time (3) AI-use disclosure format (4) demo slot? (5) can the cluster + NudgeBee agent be set up before 11:30?

## 09:30-11:15 Setup (no app code)
- 09:30 Open each URL in seed/deep-links.json on the laptop; fix any wrong homepage in that file now (it is data, not code). Leave searchTemplate null unless you confirmed a working search URL.
- 09:45 `k3d cluster create prasthan --agents 1 -p "8080:80@loadbalancer"`; install the NudgeBee agent (Helm command from NudgeBee Settings -> Integrations -> Kubernetes); wait till active. Prometheus if needed (docs/K8S-TEMPLATES.md).
- 10:15 Sarvam dashboard: pick the kn-IN and ta-IN voices; write the ids in flags.json `tts_speaker`.
- 10:30 Record offline-fallback clips in your own voice (phone, mp3, short): "Sari, Guruvaara raatri Hubballige bassu. Illive aayke." / new-bus alert / "Yaava dina?" Save for `apps/mobile/assets/audio/` after 11:30.
- 10:50 Create worktrees (codex/SESSIONS.md "Folder setup"); copy `.env` into each; open 3 Codex sessions (or 2).
- 11:10 Read DEMO-SCRIPT.md once. Say the pitch out loud.

## 11:30 HACKING STARTS
- Session A: paste PROMPT-FOR-ANKITH.md, then P0. Session B: B-01. Session C: C-01.
- Then follow the timetable in codex/SESSIONS.md. Every 30-40 min: read reports, check status files, paste next prompt.
- 13:00-14:00 eat at the desk; sessions keep running.

## 14:30 CUT LINE (check honestly)
Must work: Kannada voice (or typed) -> trip card -> booking links + warning; operator Add buses -> traveller alert spoken; 3+ Flagsmith flags with segments flipping live; cluster watched by NudgeBee.
If not: cut in this order: quick commerce, Play beta, context.dev, gifting, A/B, sweet-shop view, native Android. Then Z-01.

## 14:30-15:30 Integration + NudgeBee rehearsal
- Z-01 (Session A). C-04 rehearsal: time break -> alert -> approve -> recovery.

## 15:30-16:45 Ship
- 15:30 Z-02 README. 15:45-16:15 record video (DEMO-SCRIPT.md "Video"), upload unlisted.
- 16:15 Make repo public, push (hotspot if needed). Secrets check (docs/SUBMISSION.md).
- 16:30 Fill the form. **16:45 SUBMITTED.**
- 17:00+ keep the demo warm; rehearse.
