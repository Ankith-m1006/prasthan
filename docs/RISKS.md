# Risks and fallbacks (every external service)

Rule: the main flow must run with zero network. `MOCK_ALL=1` on the api, `EXPO_PUBLIC_APP_MOCK=1` on the app. Test this at 14:30.

| Service | What can fail | Detect | Fallback (automatic) | Manual move on stage |
|---|---|---|---|---|
| Venue Wi-Fi | slow, blocks ports, dies | `/health` slow, npm install hangs | everything has mock mode | phone hotspot; switch to `MOCK_ALL=1` |
| Sarvam STT | timeout, 429, 402, audio format rejected | `source.stt != live` | text box + sample sentence picker; rule parser | "or type" button |
| Sarvam LLM (105B) | slow, bad JSON | schema validation fails | retry once, then rule parser (`parser: rules`) | none needed |
| Sarvam TTS | timeout, 429, no Odia voice | `audioBase64: null` | cached clips in `apps/mobile/assets/audio/` (recorded 10:30-11:15), else big text | read the line aloud yourself |
| Sarvam translate | timeout | — | per-language templates for alerts | — |
| Flagsmith | down, slow, wrong key | `/health modes.flagsmith != live` | `defaultFlagHandler` = coded defaults from flags.json | `FLAGSMITH_MODE=mock` + in-memory flag overrides via `/v1/ops/*` |
| Flagsmith import script | API paths differ | script errors | — | create flags by hand from flags.json (15 min) |
| NudgeBee agent | not connecting (Wi-Fi, k3d) | dashboard shows cluster inactive | — | show kubectl events + Prometheus; flip flag via `scripts/demo-fix.mjs`; say it honestly |
| NudgeBee alert late | detection takes minutes | timed at 14:45 | — | start break earlier; talk over it |
| NudgeBee runbook REST step | cannot send header / reach laptop | dry run at 14:45 | — | script step with curl, or Ankith flips the flag and says "this is the runbook step" |
| Slack | approval flow not set up | — | — | approve in the NudgeBee UI |
| k3d / Docker | RAM, image pull over bad Wi-Fi | pods Pending / ImagePullBackOff | run api locally (`npm run dev`) | demo NudgeBee part only from cluster; core flow from local |
| context.dev | key, docs, credits | `source: seeded` | seeded alerts | keep flag on `seeded` |
| Expo on phone | Expo Go version mismatch, LAN blocked | app can't reach API | `EXPO_PUBLIC_APP_MOCK=1` bundled seed | use Expo Web on laptop (guaranteed path) |
| Play internal testing | build fails, review delay | — | — | skip; web is the judge path |
| GitHub | github.com times out | push fails | — | hotspot; zip + upload as last resort |
| Mic in loud hall | bad transcripts | low confidence | trip card lets you fix fields | headset mic; type |
| Time | behind at 14:30 | START-HERE cut line | — | cut order below |

## Cut order (first to go)
1. Quick-commerce view (seeded view + roadmap only).
2. Play internal testing beta.
3. context.dev live alerts (A-05).
4. Gifting add-on (B-04 gift panel + gift orders).
5. `reply_style` A/B.
6. Sweet-shop dashboard (keep operator dashboard).
7. Android native build (Expo Web only).
Never cut: Kannada voice -> trip -> links; operator "add buses" -> traveller alert; at least 3 live Flagsmith flags with segments; NudgeBee watching the cluster with one real alert.

## Content risks
- Native-script sentences: Ankith checks Kannada; others are best effort, label them.
- Festival dates: Sankranti/Pongal 15 Jan 2027 verified (Drik Panchang, Hindutone); others marked in seed/festivals.json.
- Real names: partners and shops are invented ("demo"); real brands appear only as text links. No logos.
- Payments: none. Orders say "pay at pickup (demo)".
- Rules: no code before hacking starts. This prep has docs, prompts, synthetic data and config templates only. Ask organisers at check-in whether using it is OK.
