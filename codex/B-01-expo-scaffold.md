# B-01: Expo app scaffold, design tokens, navigation, API client (Session B, 40 min)

Starts at 11:30 in parallel with P0. Runs in `../prasthan-B` (branch `b/app`).

## Paste into Codex

````
You are Session B of 3 parallel Codex sessions building "Prasthan" (one-day hackathon, submit by 17:00). Sessions cannot talk; they coordinate via git, file ownership and status files. Read README.md, docs/PRODUCT.md, docs/DESIGN.md, docs/ARCHITECTURE.md, codex/SESSIONS.md, STATUS.md. AGENTS.md may not exist yet (Session A writes it in P0); when it lands on main, merge main and follow it.

GOAL: an Expo (React Native + TypeScript) app that runs on Android (Expo Go) and Expo Web, with the design tokens, navigation and a typed API client with a full mock mode.

FILES YOU OWN: apps/mobile/** and status/B.md. Touch nothing else.

STEPS
1. Create the app in apps/mobile with the current Expo SDK, TypeScript template, expo-router (tabs). Web support on (react-native-web, react-dom). Own package.json + lockfile (no workspaces).
2. metro.config.js: watchFolders includes ../../shared and ../../seed so the app can import shared/contract/src types and seed JSON. tsconfig path alias "@contract" -> ../../shared/contract/src (recent Expo SDKs resolve tsconfig paths in Metro; if yours does not, use relative imports instead of the alias). Import only types (`import type`) plus the JSON examples, so the app has no runtime dependency on the api package. Until P0 lands, create apps/mobile/src/contract-shim.ts with the types copied from docs/ARCHITECTURE.md section 3; delete the shim once main has shared/contract.
3. src/theme/tokens.ts: palette from docs/DESIGN.md (paper, ink, ink-soft, marigold, marigold-deep, kumkum, mango-leaf, turmeric, temple-stone, card), spacing, radii, type scale (body 18). Festival accent map (sankranti, pongal, republic). Fonts via @expo-google-fonts: Mukta, Noto Sans Kannada/Tamil/Telugu/Oriya/Bengali/Devanagari, Tiro Kannada (load lazily; fall back to system font if a font fails).
4. src/ui/: Button (48 px min), Card, Chip, Banner (ops banner), Screen (paper background, max width 1100 on web), and our own SVG motifs with react-native-svg: KolamGrid (generated 5x5 dot grid + looping path, 6% opacity), TempleLine (stepped divider), Toran (leaf row), Diya (icon + slow flicker, respects reduced motion). Draw them ourselves. No third-party illustrations. Icons: phosphor-react-native or lucide-react-native.
5. Tabs: "Speak" (traveller), "Alerts", "Partners", "About". About shows "Powered by Sarvam AI" (plain text), credits, and the AI-use line placeholder.
6. src/api/client.ts: typed client for every endpoint in docs/ARCHITECTURE.md section 4. Base URL = EXPO_PUBLIC_API_URL. Header x-prasthan-identity from a small identity store (default travellerId "trav-demo", language kn-IN, home_state Karnataka; partner identity when on the Partners tab). Timeout 10 s. MockClient (EXPO_PUBLIC_APP_MOCK=1, or automatic switch after 2 failed calls with a small "Offline demo data" chip): answers from bundled seed (seed/*.json via the metro watchFolder) + the contract examples, including a local rule-based parse for the sample sentences in seed/utterances.json.
7. src/state/flags.ts: useFlags() polls GET /v1/config every flags.alert_poll_seconds (default 5) and exposes FlagsView; theme accent follows festival_mode.theme; Banner shows when voice_fallback_offline is true.
8. Scripts in apps/mobile/package.json: start, android, web, typecheck (tsc --noEmit), test (jest-expo, a few pure tests: tokens contrast helper, date label formatter "Thu 14 Jan").

ACCEPTANCE CHECKS (run, paste output)
- cd apps/mobile && npm install && npm run typecheck && npm test
- EXPO_PUBLIC_APP_MOCK=1 npx expo start --web -> the 4 tabs render on paper background with the kolam header (describe what you see or take a screenshot if you can)
- npx expo export --platform web (must succeed; output dir git-ignored)

MOCK MODE: EXPO_PUBLIC_APP_MOCK=1 = no API needed.
WHILE WAITING for P0: keep the contract shim; build UI components.

FINISH: when main has shared/contract (check `git log main --oneline`), `git merge main` and switch imports to @contract. Update status/B.md, commit "B-01: Expo scaffold, tokens, motifs, API client", Merge steps from codex/SESSIONS.md. Report.
````

## Done when
- Web export works; tabs render; mock client returns seed data.

## If something goes wrong
- Expo Go on the phone is a different SDK version: use Expo Web for now, fix later or skip native.
- Font loading slow on venue Wi-Fi: keep system fonts; fonts are polish.
