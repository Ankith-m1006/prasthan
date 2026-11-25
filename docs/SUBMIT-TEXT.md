# Submit text (copy from here; Ankith says the final words in his own voice)

Live app: https://prasthan-ten.vercel.app
API health: https://prasthan-api.vercel.app/health
Repo: https://github.com/Ankith-m1006/prasthan
Video: `<VIDEO_URL>`

## (a) Title + tagline

**Prasthan (ಪ್ರಸ್ಥಾನ)**
Say your festival trip home in your own language; Prasthan gets you to the official booking page and shows bus operators the buses that are missing.

## (b) Description for the form (about 135 words)

Every festival, lakhs of people leave Bengaluru on the same two nights. Buses run out, fares jump 2-3x and touts fill the gap. Prasthan lets a traveller speak the trip in Kannada (or six other languages). Sarvam AI transcribes it and speaks the reply back. The app turns it into a trip card, warns about rush nights and touts, and links only to official booking pages (the redBus route page, KSRTC, IRCTC): no prices, no scraping. Travellers tap "Alert me". Operators see a demand board ("2,400 want, 880 seats") and add buses, and every waiting traveller hears the alert in their own language. Flagsmith runs the festival: 17 flags and 7 segments decide festival mode (Tamil Nadu gets Pongal), voice routing, partner tools and kill switches, with no deploy. NudgeBee recovery runbook and cluster manifests are prepared. Demand data is seeded.

## (c) 30-second spoken pitch

"Every Sankranti, lakhs of people leave Bengaluru on the same two nights. The buses run out, fares triple, and touts wait at Majestic. Prasthan lets you just say your trip, in Kannada. Sarvam hears it and answers in Kannada. We send you to the official booking page, warn you about the rush, and alert you when a new bus opens. And the operator sees 2,400 people want Hubballi on Thursday night, but only 880 seats exist. One tap adds buses, and every waiting traveller hears it. Flagsmith runs the festival: Pongal mode for Tamil travellers, partner tools, kill switches. redBus shows the buses that exist. We show operators the buses that are missing."

## (d) 2-minute demo talk track (matches the live app)

Before: open /health once (wakes the API), log in fresh in a private window, volume up.

- **0:00 Hook.** "Lakhs leave Bengaluru on the same two nights. Manjunath goes home to Hubballi. His parents speak only Kannada."
- **0:10 Profile.** Continue as guest -> profile: Kannada, Karnataka, Hubballi, Majestic, bus, with family. "No login, no phone number. Age and gender are optional and never leave the phone."
- **0:25 Speak (Sarvam).** Hold the mic, say the Kannada trip (or "or type" -> sample). Trip card: Hubballi, night, bus, 2. Reply plays in Kannada. "Sarvam Saaras heard Kannada, Bulbul answered in Kannada. The trip itself is read by a rule parser today."
- **0:45 Options.** Point at rush-night + tout warning and the links. Tap redBus: "the real route page, no prices, no scraping." Tap **Alert me**.
- **1:00 Operator.** Partners -> Demo State RTC. "Seven days before, the operator sees 2,400 want, 880 seats." Add buses -> "waiting travellers notified". "These demand numbers are seeded demo data."
- **1:15 Alert.** Alerts tab: Kannada alert plays. "redBus shows the buses that exist. We show operators the buses that are missing."
- **1:25 Flagsmith.** About tab: "flags: live from Flagsmith". Open the Flagsmith dashboard: festival_mode with the tamil_travellers override. Edit profile to Tamil Nadu: Pongal mode appears within about 10 s. Optionally toggle `voice_fallback_offline`: the banner appears. "17 flags, 7 segments, no deploy."
- **1:45 NudgeBee (honest).** "For the rush night we wrote the cluster, metrics, fault injection and a NudgeBee runbook that flips this same fallback flag. The cluster isn't running on this laptop yet, so I won't claim the recovery." (If it is verified in status/C.md by then, show it instead.)
- **1:55 Close.** "Prasthan. Say it in your language. Get home."

## (e) Likely judge questions

1. **Why not just redBus?** redBus lists buses that already exist and needs English and typing. We start from voice in your language, link back to redBus and the RTCs (we do not compete on tickets), and the new part is the demand signal: who wants which night, before the buses exist.
2. **How does Flagsmith matter?** It is the control panel for the festival. Festival mode per region (Tamil Nadu -> Pongal), which partner sees which tool, which booking links show, TTS model routing, poll rate, and the voice kill switch, all per identity with traits from the profile, changed live with no deploy. 17 flags, 7 segments, 6 overrides live.
3. **What's real vs mock?** Real: Sarvam speech to text, text to speech and translation; Flagsmith flags in the app and the API; both apps deployed on Vercel; redBus route links. Seeded: routes, demand, operators, shops, waiting travellers. The alert store is in memory. Trip understanding is a rule parser. NudgeBee recovery is not yet shown.
4. **How would operators get value?** A demand number 7 days before the rush: requests per route per night against seats. They add special buses where the gap is, fill them because the travellers are already waiting, and reach those travellers in their language. Next step is a pilot with a state RTC planning desk.
5. **Privacy?** Guest profile on the device, no phone or OTP. Age and gender are optional, stay on the device and are never sent. Flagsmith gets a random guest id and coarse traits. No payments, no personal data stored on the server.
6. **AI use?** Code was written with OpenAI Codex and Claude Code during the event. The docs, prompts and seed data were prepared before the event, and that prep commit has no code. I chose the problem, designed it, reviewed and ran it, and can walk through any file.
7. **Why a rule parser if you have Sarvam?** sarvam-105b is wired with a JSON schema, but on our full prompt it hit its completion limit. A rule parser is fast and predictable for town/day/mode, so it is the safe default. Tuning the LLM budget is next.
8. **What happens if voice fails on the rush night?** The `voice_fallback_offline` flag switches everyone to text + rules without a deploy. The NudgeBee runbook is designed to flip it after an approved alert. That end-to-end run is still pending on the cluster.
9. **Does it scale?** Stateless API and a separate voice service (`ROLE=api|voice`), a load test (about 21k requests in 15 s, 0 errors against the mock API), and an apps poll rate set by a flag. A persistent store is the obvious next step.
10. **What's next?** RTC pilot, WhatsApp voice notes as the input channel, a persistent store with real operator feeds, waitlist-aware train alerts, and quick-commerce gift pickup near boarding points.

## (f) Final checklist
- [ ] Repo is public: open https://github.com/Ankith-m1006/prasthan in a private window.
- [ ] README has setup, sponsor section, limits and AI use (done); replace `<VIDEO_URL>` in README.md and above with the real link.
- [ ] Video uploaded unlisted, link tested in a private window, no keys visible.
- [ ] Form: repo URL, video URL, live app URL, description (b), sponsors: Flagsmith, NudgeBee, Sarvam AI. Screenshot the confirmation.
- [ ] **Submit before 16:45 IST** (close is 17:00).
- [ ] 1 minute before judging: open https://prasthan-api.vercel.app/health (wakes the API; must say sarvam live, flagsmith live), then reload the web app.
- [ ] After 16:45: README fixes only, no code pushes.
