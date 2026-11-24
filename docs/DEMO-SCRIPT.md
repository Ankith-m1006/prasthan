# Demo script (stage, about 3 min) + video (2-3 min)

Setup on the laptop before going up:
- Window 1: Expo Web app (traveller) at left, partner dashboard at right (two browser windows). Or: traveller on the Android phone (mirrored with scrcpy) + dashboard on the laptop.
- Window 2: Flagsmith dashboard, project `prasthan`, env `production`, `festival_mode` open.
- Window 3: Slack `#prasthan-ops` (NudgeBee).
- Window 4: terminal with `scripts/demo-break.mjs` ready (do not show keys; `clear` the screen).
- `POST /v1/ops/reset` done. Volume up. Headset mic as backup if the hall is loud.
- Backup: the recorded video, open in a tab.

## 0:00 Hook (no screen)
"Every Sankranti, lakhs of people leave Bengaluru on the same two nights. The buses run out, fares jump three times, and touts wait at Majestic. My friend Manjunath goes home to Hubballi. His parents speak only Kannada. So does he, when he is tired."

## 0:20 Sarvam: speak the trip
- Hold the mic. Say (Kannada): "ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ ಹೋಗ್ತಾ ಇದ್ದೀನಿ, ಗುರುವಾರ ರಾತ್ರಿ, ಬಸ್ಸಲ್ಲಿ, ಇಬ್ರು".
- Trip card: Hubballi, Thu 14 Jan, night, bus, 2. Reply plays in Kannada.
- Say: "Sarvam's Saaras heard Kannada, Sarvam 105B turned it into a trip, Bulbul answered in Kannada."
- Point at the links: "No prices, no scraping. Straight to the official sites." Point at the rush-night + tout warning.
- Tap "Alert me".

## 0:55 The missing buses (the product loop)
- Switch to the operator dashboard (Demo State RTC). "Seven days before, the operator sees this: 2,400 people want Hubballi on Thursday night. 880 seats exist."
- Tap "Add buses": 6, 22:30, Majestic. "16 waiting travellers notified."
- Back to the traveller: the alert arrives and plays in Kannada.
- Line: "redBus shows the buses that exist. We show operators the buses that are missing."
- Honest: "These demand numbers are seeded demo data. Everything you just heard is live."

## 1:35 Flagsmith: the festival runs on flags
- In Flagsmith, show the `festival_mode` segment override for `tamil_travellers`. Switch the traveller identity to a Tamil traveller (language chip ta-IN, home state Tamil Nadu): app becomes "Pongal mode", Tamil greeting, Tamil voice.
- Turn `gifting_enabled` from the 20% pilot to 100%: the gift add-on appears. (If cut, skip.)
- Optional: remove a booking provider in `deep_link_providers`: it disappears in 5 s.
- Line: "Festival modes, regions, languages, partner tools, model routing, kill switches. Same code. No deploy."

## 2:10 NudgeBee: the rush night
- "Now the special buses are announced, and everyone opens the app at once." Run `scripts/demo-break.mjs` (rush load + voice pod crash).
- Traveller app: the ops banner shows "Offline voice mode" OR the first try fails softly (text reply).
- Slack: NudgeBee alert + root cause ("prasthan-voice CrashLoopBackOff / OOMKilled ..."). Read one line of it.
- Tap Approve on the runbook: Flagsmith `voice_fallback_offline` on + voice deployment restarted.
- Speak again: answer comes (offline voice, cached audio + text). Then voice back to live; flag off.
- Honest line: "We crashed it on purpose. NudgeBee found it, explained it, and with my approval, Flagsmith moved everyone to the offline voice. Nobody was stranded."

## 2:45 Close
"Prasthan. Say it in your language. Get home. Built today with Sarvam, Flagsmith and NudgeBee, each doing a job the product cannot live without." Show the repo URL.

## If something breaks on stage
- Mic or Sarvam fails: tap "or type" and pick the sample sentence; say "venue Wi-Fi; here's the same flow typed" and keep going.
- Flagsmith slow: the flip shows within `alert_poll_seconds` + 5 s refresh; talk for 10 s. If dead: say so, show the dashboard state, move on.
- NudgeBee alert late: keep talking about the runbook; if over 90 s, flip the flag from the terminal (`scripts/demo-fix.mjs`) and say "this is the step the runbook does".
- Everything down: play the video.

## Honest notes (say only if asked, never hide)
- Demand forecasts and partner data are synthetic seed data.
- The crash is injected (`FAULT_MODE`).
- The rush load does not call Sarvam (rate limit 60/min); it hits the api.
- Booking links are homepages unless a search URL was verified that day.
- AI coding tools (OpenAI Codex) wrote much of the code; Ankith designed and directed it and can explain it.

## Video (record 15:45-16:15)
Same order, 2-3 min, screen recording + voice. Show the Kannada reply with audio. Show the Slack NudgeBee message clearly. Never show `.env`, terminal history with keys, or the Flagsmith keys page. One backup take. Upload unlisted to YouTube; link in README and the form.
