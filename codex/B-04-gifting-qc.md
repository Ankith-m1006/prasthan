# B-04: gifting add-on + quick-commerce view (Session B, 30 min, CUT FIRST)

Run only if the 14:30 cut line is green. Quick commerce is cut before gifting.

## Paste into Codex

````
Session B. Read AGENTS.md, docs/PRODUCT.md (Gifting, Quick commerce). `git merge main`; read status/A.md.

GOAL: (1) "and 2 kg Mysore pak for the family" -> pre-order at a sweet shop near the boarding point, ready before departure; (2) one quick-commerce dashboard view on seeded data + text links + roadmap card.

FILES YOU OWN: apps/mobile/**, status/B.md.

STEPS
1. Gifting (only if flags.gifting_enabled): on the trip card, a "Take sweets home" panel. If the intent has gift, prefill; else a voice/typed follow-up ("ಮತ್ತೆ ಮನೆಯವರಿಗೆ ಎರಡು ಕೆಜಿ ಮೈಸೂರು ಪಾಕ್"). Show the nearest shop for the boarding point (seed partners: boardingPoint + walkMinutes), item, qty, "ready by 20:00", "pay at pickup (demo, no payment)". Confirm -> POST /v1/gifts/orders. Spoken confirmation.
2. Staged rollout demo: if gifting_enabled is off for this identity, the panel is hidden. (Flagsmith segment gifting_pilot_20pct; on stage Ankith flips it to everyone.)
3. Quick commerce view (Partners tab, quick_commerce partners, only if flags.quick_commerce_view): DemandBoard on qc cells (zone, window, travellersLeaving / travellersArriving, top asks, fulfilment: doorstep before departure / pickup near boarding point / hometown). A card "City-out vs hometown demand" with two numbers. Text-only links to Blinkit, Zepto, Swiggy Instamart, Flipkart Minutes, Zomato homepages (seed/deep-links.json quickCommerce). No logos, no APIs. Roadmap card: "Partner pilots: departure-time gift delivery".
4. Label everything "Seeded demo data".

ACCEPTANCE CHECKS
- npm run typecheck && npm test
- Traveller with gifting on -> order placed -> Partners -> Sihi Mane Sweets (demo) shows +2 kg Mysore pak on 14 Jan.
- Partners -> Demo QuickCart shows zones Majestic/Satellite/... for 13-14 Jan.

FINISH: status/B.md, commit "B-04: gifting add-on + quick-commerce view (seeded)", Merge steps. Report.
````
