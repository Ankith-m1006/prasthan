# B-05: polish the 5 demo screens + web build + offline audio (Session B, 40 min)

## Paste into Codex

````
Session B. Read AGENTS.md, docs/DESIGN.md, docs/DEMO-SCRIPT.md. `git merge main`; read status/A.md and status/C.md.

GOAL: the screens judges see look festive, Indian and clean; Expo Web is the guaranteed judge path; offline audio clips are wired.

FILES YOU OWN: apps/mobile/**, status/B.md.

STEPS
1. Walk DEMO-SCRIPT.md step by step on Expo Web and fix every rough edge on: Speak, Trip card + options, Alerts, Partner board, Ops banner. Big type, native script rendering (check Kannada, Tamil, Odia glyphs), spacing, empty states, loading states, error toasts that say what to do.
2. Festival themes: sankranti / pongal / republic accents switch live from festival_mode (test by changing the flag).
3. Offline audio: if Ankith recorded clips into apps/mobile/assets/audio/ (names like reply_trip_ok_kn.mp3, alert_new_bus_kn.mp3, followup_which_day_kn.mp3), map reply keys to clips; keep each clip under 300 KB. If no clips: text-only fallback stays.
4. Reduced motion respected; tap targets >= 48 px; color contrast per DESIGN.md.
5. Web build: `npx expo export --platform web` and a script `npm run serve-web` (npx serve dist) so the built site runs without Metro. Note the URL in status/B.md.
6. Remove dead code and console logs; no keys anywhere in the bundle (grep dist for key patterns).

ACCEPTANCE CHECKS
- npm run typecheck && npm test && npx expo export --platform web
- grep -rE "sk-nb-[A-Za-z0-9]|ser\.[A-Za-z0-9]{10,}|api-subscription-key" dist  -> nothing
- Full DEMO-SCRIPT run on web against the api: no console errors.

FINISH: status/B.md (demo-ready? known glitches), commit "B-05: demo polish + web build", Merge steps. Report.
````
