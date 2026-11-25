# Session B status

Phase: B-03 done (alerts + partner demand board). B-01..B-03 complete. Next: B-05 polish + web deploy.
Branch: main (single builder on the home laptop)
Contract version I built against: 1
Last merged to main: B-03

## Done
- B-01: Expo SDK 58 (React Native 0.88, React 19.3), expo-router tabs (Speak, Alerts, Partners, About), web on (react-native-web).
  metro.config.js watches ../../shared and ../../seed; contract types via `@contract` (type-only imports), seed JSON via relative imports.
  Tokens (docs/DESIGN.md palette, festival accents, contrast helper), own SVG motifs (KolamGrid, TempleLine, Toran, Diya, RouteLine),
  own line icons (no icon package), UI kit (Screen, Card, Button 48 px, Chip, Banner).
  Fonts: Mukta, Tiro Kannada, Noto Sans Kannada (others use the system font; 2.5 s timeout so fonts never block).
  src/api: typed HttpClient (EXPO_PUBLIC_API_URL, identity header, 10 s timeout) + MockClient (whole api on bundled seed) +
  auto switch to mock after 2 failed calls ("Offline demo data" chip). useFlags() polls /v1/config every alert_poll_seconds.
  Mock flags = coded defaults + same segment rules + demo switches (festival / fallback / gifting) for the offline web demo.
- B-02: Speak screen: festival greeting (flag), 7 language chips (POST /v1/identify with language + home_state), hold-to-talk mic (expo-audio, 400 ms min, 20 s cap, timer), "or type" box + sample sentences, reply card with source chips (live/demo/offline voice, LLM/rules), editable trip card (town, day, time, mode, people), official links (no prices), rush + tout warnings with seeded demand line, Alert me (diya) -> POST /v1/trips. Reply audio: Sarvam WAV, else cached clip, else browser voice, else big text. Jest 6/6. Checked in headless Chrome on the mock web build: typed sample -> Hubballi Fri 15 Jan night, KSRTC/redBus links, warnings.
- B-03: Alerts tab (toran, newest/live first, new ones glow + are spoken in the traveller language via /v1/tts or the browser voice, tab badge, source chip + link). Partners tab: picker grouped by type (sets partner identity + traits via /v1/identify), one DemandBoard for all types (want/have bar, kumkum gap, suggestion, Seeded demo data, date chips 12-17 Jan, two columns on wide screens), Add buses sheet only when flag operator_add_service (count/time/boarding point) -> toast "6 buses added. 16 waiting travellers notified.", sweet-shop pre-orders when shop_orders_view, quick-commerce board when quick_commerce_view + roadmap card. Jest 10/10. Verified in headless Chrome on the mock web build: Alert me -> Demo State RTC -> Add 6 buses -> "16 waiting travellers notified" -> Alerts shows the Kannada new-bus alert.

## Working on now
- B-05 polish + Vercel web deploy

## Blocked / broken
-

## REQUESTS TO OTHERS
-

## ANSWERS (to requests from others)
-

## How to run what I built
- `cd apps/mobile && npm install && npm run typecheck && npm test`
- Offline: `EXPO_PUBLIC_APP_MOCK=1 npx expo start --web` (port 8081)
- With the api: `EXPO_PUBLIC_API_URL=http://localhost:8787 npx expo start --web` (api: `MOCK_ALL=1 npm --prefix services/api run dev`)
- Web build: `EXPO_PUBLIC_APP_MOCK=1 npx expo export --platform web` -> apps/mobile/dist (git-ignored)
