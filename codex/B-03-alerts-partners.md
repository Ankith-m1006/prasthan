# B-03: Alerts screen + partner demand dashboard (Session B, 55 min)

## Paste into Codex

````
Session B. Read AGENTS.md, docs/DESIGN.md (Screens 3-5), docs/PRODUCT.md (operator + sweet shop flows), shared/contract. `git merge main`; read status/A.md.

GOAL: (1) travellers hear new-bus alerts in their language; (2) partners see one demand dashboard (any partner type) and operators can add buses.

FILES YOU OWN: apps/mobile/**, status/B.md.

STEPS
1. Alerts tab: toran header; list from GET /v1/alerts?identity&since polled every alert_poll_seconds; a new item glows once and auto-plays its text in the user's language (POST /v1/tts with textLocal[lang] or text; if audio null, show big text). Badge on the tab. Source chip: seeded / live / context_dev with link if sourceUrl.
2. Partners tab: partner picker (GET /v1/partners) grouped by type (bus operators, sweet shops, quick commerce). Picking one sets the partner identity (POST /v1/identify with role partner, partner_type, partner_id) so flags apply.
3. One DemandBoard component for all partner types: rows of DemandCell (label, want vs have bar, gap in kumkum, suggestion). Header label "Seeded demo data" always visible. Date filter chips (12-17 Jan).
4. Bus operator: "Add buses" button only if flags.operator_add_service. Sheet: count (default 6), time 22:30, boarding point (from route), seats 40 -> POST /v1/partners/:id/services -> toast "6 buses added. 16 waiting travellers notified." -> board refreshes (demandAfter).
5. Sweet shop: if flags.shop_orders_view: orders per pickup date + item totals ("Prepare 9 kg Mysore pak by 20:00") from demand + GET /v1/partners/:id/orders.
6. Quick commerce: if flags.quick_commerce_view show the same board on qc cells; else a small "Coming soon" card. (B-04 adds the full view; CUT FIRST.)
7. Ops banner on every screen when voice_fallback_offline (from useFlags).
8. Web layout: on wide screens, Partners shows the board in two columns; easy to show next to the traveller window on stage.

TESTS: DemandBoard renders gap + suggestion; add-buses sheet builds the right request; alerts list sorts newest first and marks unseen.

ACCEPTANCE CHECKS
- npm run typecheck && npm test
- api running: Partners -> Demo State RTC -> 14 Jan shows BLR -> Hubballi 2,400 vs 880 -> Add buses -> toast notified 16 (after saving one trip for BLR-HBL Thu 14 Jan, e.g. the Kannada hero line from seed/utterances.json; without it, 15) -> Alerts tab (traveller) shows and plays the new alert within 5 s.
- EXPO_PUBLIC_APP_MOCK=1: same flow on bundled seed.

FINISH: status/B.md, commit "B-03: alerts + partner demand board", Merge steps. Report.
````
