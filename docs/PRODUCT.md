# Prasthan (ಪ್ರಸ್ಥಾನ, "setting out on a journey")

**One line:** Say your festival trip home in your own language. Prasthan understands it, sends you to the official booking sites, warns you about touts and fare surges, and tells you the moment a new bus or special train opens. And it shows bus operators the buses that are missing.

**Pitch line:** "redBus shows the buses that exist. We show operators the buses that are missing."

Not a price comparison. Not an aggregator. We never scrape, never show prices, never sell tickets. We deep-link to the official and public booking sites.

## Why (evidence from festive-ideas-research.md)
- Bengaluru "pretty much came to a standstill" on 17-18 Oct 2025 as people left for Deepavali (NewsBytes).
- Private bus fares go 2-3x on festival nights, some routes far more (Udupi AC Rs 1,000 -> up to Rs 3,500) (Siasat, The Hans India).
- Operators add "special buses" late, after the rush is already visible on the road. Travellers keep refreshing apps.

## Users

1. **Traveller** (hero): Manjunath, 27, works in Electronic City, home is Hubballi. Leaves Thursday night for Sankranti with his wife. His parents speak only Kannada; he prefers to speak too. Pain: no seats left, touts at Majestic, refreshing four apps.
2. **Bus operator**: the planning desk of a state RTC or an app-first bus brand. Pain: they find out about demand from crowded bus stands. They need it 7 days earlier.
3. **Sweet shop near a boarding point**: owner at Majestic. Pain: festive rush, guesswork on how much Mysore pak to make. Pre-orders tell him.
4. **Quick-commerce partner** (CUT FIRST, roadmap): a 10-minute delivery app (Blinkit, Zepto, Swiggy Instamart, Flipkart Minutes, Zomato are the kind; named in text only). Insight: where and when festive travellers leave and what gifts they want before departure (doorstep before leaving, or pickup near the boarding point), and the demand shift from the city to the hometown.

All business users are one model: `Partner { type: bus_operator | sweet_shop | quick_commerce }`. One demand dashboard serves all.

## Flows

### Traveller (must work by the 14:30 cut line)
1. Open app -> pick language (Kannada default) -> big mic button "Speak your trip".
2. Hold to talk: "ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ ಹೋಗ್ತಾ ಇದ್ದೀನಿ, ಗುರುವಾರ ರಾತ್ರಿ, ಬಸ್ಸಲ್ಲಿ, ಇಬ್ರು".
3. Trip card appears: Bengaluru -> Hubballi, Thu 14 Jan, night, bus, 2 people. Tap to fix any field. If something is missing, the app asks by voice ("Which day?").
4. Options: official booking links (KSRTC, redBus, AbhiBus, Zingbus, FlixBus; trains: IRCTC, ixigo). No prices.
5. Warnings: "14 Jan is a rush night" + tout warning, from Flagsmith thresholds.
6. "Tell me when a new bus opens" -> saved. Voice reply in Kannada confirms.
7. Later: alert arrives: "Demo State RTC added 6 buses, 22:30 from Majestic", spoken in Kannada.

### Gifting add-on (CUT FIRST after quick commerce)
"ಮತ್ತೆ ಮನೆಯವರಿಗೆ ಎರಡು ಕೆಜಿ ಮೈಸೂರು ಪಾಕ್" -> pre-order at a sweet shop 4 min from Majestic, ready by 20:00, pay at pickup (demo). Behind `gifting_enabled` (staged rollout).

### Bus operator (must work by 14:30)
1. Partner login (pick "Demo State RTC" from a list; no real auth).
2. Demand dashboard: rows per route + night: "BLR -> Hubballi, Thu 14 Jan: 2,400 want, 880 seats, add 38 buses". Bar per row. Label: "Seeded demo data".
3. Tap "Add buses" -> 6 buses, 22:30, Majestic -> confirm -> "16 waiting travellers notified" (15 seed travellers on that bus night + Manjunath).

### Sweet shop
Orders per pickup point and day; "Prepare 9 kg Mysore pak by 20:00, 14 Jan (7 kg seeded orders + Manjunath's 2 kg)".

### Quick commerce (CUT FIRST)
One view on seeded data: travellers leaving per zone and window + top asks; hometown demand on festival morning; text links to the partner sites; a roadmap card.

## Demo story (2-3 min, details in DEMO-SCRIPT.md)
1. Manjunath speaks in Kannada -> trip card -> official links + rush warning -> subscribes. (Sarvam)
2. Operator dashboard: 2,400 want vs 880 seats -> "Add 6 buses" -> Manjunath's phone speaks the alert in Kannada. (the product loop)
3. Flagsmith: flip `festival_mode` to Pongal for Tamil travellers / staged rollout of gifting / drop a broken booking link. Live, no deploy.
4. NudgeBee: "special buses just opened, everyone opens the app": rush + voice pod crash -> NudgeBee alert + RCA in Slack -> Approve -> Flagsmith fallback on -> travellers still get answers -> voice back.

## Pitch lines
- "Every festival, lakhs of people leave Bengaluru on the same two nights. The buses run out. Then the touts arrive."
- "Prasthan lets you just say it, in your language."
- "redBus shows the buses that exist. We show operators the buses that are missing."
- "Seven days before the rush, the operator knows: 2,400 people want Hubballi on Thursday night, 880 seats exist."
- "Flagsmith runs the festival: Sankranti mode, Pongal mode, who sees what, and the kill switch."
- "On the busiest night, the voice service fell over. NudgeBee told us why, and with one approval, Flagsmith switched everyone to the offline voice. Nobody was stranded."
- Honest: "The demand numbers are seeded demo data. The voice, the flags and the recovery are live."

## Not doing (say so if asked)
Ticket sales, payments, price comparison, scraping booking sites, real operator integrations, real shop orders.

## Roadmap slide (one slide / README section)
1. Real operator pilots (state RTC planning desk).
2. WhatsApp voice notes as the input channel.
3. Quick-commerce partners: departure-time gift delivery + hometown demand.
4. Trains: waitlist-aware alerts (deep links only).
