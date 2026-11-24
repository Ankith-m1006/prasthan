# B-02: Speak screen, trip card, booking links, alert me (Session B, 65 min)

## Paste into Codex

````
Session B. Read AGENTS.md, docs/DESIGN.md (Screens 1-2), docs/PRODUCT.md (Traveller flow), shared/contract. `git merge main`; read status/A.md (which endpoints are live).

GOAL: the traveller main flow: hold to talk -> trip card -> official booking links + warnings -> "Alert me".

FILES YOU OWN: apps/mobile/**, status/B.md.

STEPS
1. Speak screen: greeting from festival_mode.greeting[lang]; language chips (kn-IN default, ta-IN, te-IN, hi-IN, od-IN, bn-IN, en-IN) that update identity traits via POST /v1/identify (language + home_state guess from language); giant marigold hold-to-talk mic.
2. Recording: expo-audio (current Expo SDK API) on Android; on web use the same API if it works, else MediaRecorder. Hold to record, release to send, max 20 s, show a timer, ignore taps under 400 ms (no accidental sends). Upload multipart to POST /v1/voice/intent with language. Show "Listening...", "Understanding..." states.
3. "or type" link: text box + a picker of seed/utterances.json sentences in the chosen language -> POST /v1/intent/parse. This is the stage fallback; make it one tap.
4. Trip card: route line motif Bengaluru -> town (local script + English), date chip "Thu 14 Jan", time window, mode icon, people stepper; every field tappable to fix (simple pickers). If intent.needsFollowUp is not empty, show the question big and play reply audio; the next recording sends `context` = current intent.
5. Play reply: reply.audioBase64 (WAV) via expo-audio; else audioUrl; else show the text big with a speaker icon disabled. Show source chips small: "live voice" / "offline voice" (honesty).
6. Options: GET /v1/options -> big text buttons per provider ("KSRTC (Karnataka) booking - opens official site") opening with expo-linking / window.open. No prices, no ranking. Warnings card (kumkum edge): rush night + tout warning (+ demand line "2,400 want, 880 seats - seeded demo data").
7. "Alert me when a new bus opens" diya toggle -> POST /v1/trips. Confirmation reply in the user's language (POST /v1/tts with a template; or text).
8. "Powered by Sarvam AI" under the mic.
9. Accessibility: labels on mic and buttons; text scales; works one-handed.

TESTS: jest for the trip-card formatter (date labels in en + kn), the hold-to-talk debounce logic (pure function), options rendering has no "price" text.

ACCEPTANCE CHECKS
- npm run typecheck && npm test
- With A's api running (MOCK_ALL=1 npm --prefix ../prasthan-A/services/api run dev, or the main folder): Expo web -> type the sample "Going home to Hubli for Sankranti, Friday night" -> trip card Hubballi Fri 15 Jan night -> links open -> Alert me saves (check curl http://localhost:8787/v1/alerts?identity=trav-demo).
- EXPO_PUBLIC_APP_MOCK=1 -> same flow works with no api.
- If a key is set on the api: hold the mic, say the Kannada hero line from seed/utterances.json -> card shows BLR-HBL Thu 14 Jan, 2 people.

FINISH: status/B.md, commit "B-02: speak, trip card, booking links, alert me", Merge steps. Report with a screenshot description.
````
