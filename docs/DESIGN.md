# Design

Feel: festive, Indian, calm. Like a Sankranti morning doorstep: white kolam on a washed floor, marigold, a lit diya, a temple-border line. Light background (Ankith likes white, not template-looking UIs).

Ankith likes Sarvam AI's website look (Indian motifs, custom icons). **We do not copy it.** No Sarvam logos, illustrations, icons or SVGs, and nothing traced from them. Being a sponsor does not give us a licence. Everything below is our own or from a named open licence.

## Surfaces (25 Nov redesign: airy, no cards)

- No boxed cards and no hard borders. Content flows in sections with generous space; rows are separated by fading hairlines (`SoftRule`) or the dotted kolam rule (`MotifRule`).
- Frosted panels (`Glass` in `src/ui/kit.tsx`) only where grouping is truly needed: trip card, typing box, Add buses, demo switches. Tinted glass (`Glass tintColor`) for warnings, the gifting offer and the quick-commerce roadmap.
- Web: CSS `backdrop-filter` blur, soft radial glows and diffuse shadows (`src/ui/glass.ts`); native: translucent fills, no extra dependency.
- A warm festival-colour glow sits behind every header (`Backdrop`, follows the festival accent). Pill buttons (52 px) and pill chips (44 px); radius 28-32 on panels.
- Tab bar: frosted bar on phones, a floating frosted pill on wide screens.

## Palette (original; tokens for both app and web)

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FFF9F0` | background (rice-flour white) |
| `ink` | `#1E1A33` | main text (deep indigo-black) |
| `ink-soft` | `#5B5670` | secondary text |
| `marigold` | `#F29E1F` | primary action (mic button, CTA) |
| `marigold-deep` | `#C9740A` | pressed state, focus ring |
| `kumkum` | `#B3302B` | alerts, rush-night warning |
| `mango-leaf` | `#2F6B45` | success, "seats added", toran motif |
| `turmeric` | `#F4D35E` | highlight chips, festival badge |
| `temple-stone` | `#8C8173` | borders, temple-line motif |
| `card` | `#FFFFFF` | cards on paper |

Contrast: `ink` on `paper` and white on `kumkum` / `mango-leaf` pass WCAG AA for body text. `marigold` is for large buttons with `ink` text on it, not for small white text. Check with any contrast checker before 15:30.

Festival themes (from the `festival_mode.theme` flag): `sankranti` = marigold + sugarcane green accent; `pongal` = turmeric + kumkum accent; `republic` = a neutral variant (no flag colours as decoration). Only the accent changes; layout stays.

## Type (all SIL Open Font License, Google Fonts)

- UI and Latin: **Mukta** (Devanagari + Latin) or **Hind**.
- Indian scripts: **Noto Sans Kannada**, **Noto Sans Tamil**, **Noto Sans Telugu**, **Noto Sans Oriya**, **Noto Sans Bengali**, **Noto Sans Devanagari**.
- Display headings (one or two words, e.g. "Prasthan"): **Tiro Kannada** / **Tiro Devanagari Hindi** (OFL, Tiro Typeworks).
- Load with `@expo-google-fonts/*` packages. Check each font's licence line on fonts.google.com before 15:30; all listed here are OFL as far as we know [UNVERIFIED per font].
- Big type: body 18, trip card 22-28, the mic label 20. Elders and tired travellers read it.

## Motifs (we draw them ourselves, simple SVG with react-native-svg)

1. **Kolam dot grid**: a 5x5 dot grid with one continuous looping line around the dots, drawn as an SVG path, 6% opacity behind the header. Can be generated in code (dots + arcs), so it is ours.
2. **Temple-border line**: a stepped "gopuram" line (repeating small steps) as a 2 px divider under headers, `temple-stone`.
3. **Toran**: a row of 5-7 simple mango-leaf shapes (two arcs each) hanging from a line at the top of the alert screen, `mango-leaf` + `marigold` dots.
4. **Diya**: a small lamp icon (a bowl shape + a flame drop) for "alert on"; the flame flickers slowly (opacity animation, respects reduced-motion).
5. **Route line**: Bengaluru -> hometown drawn as a dotted kolam-style line with two dots, on the trip card.

Rules: thin lines, flat colours, no gradients-on-everything, no stock "AI" art, no emoji as icons.

## Icons and art from open sources (only these, with licences)

- **Phosphor Icons** (MIT) or **Lucide** (ISC): mic, bus, train, plane, bell, gift, map pin. Via `phosphor-react-native` or `lucide-react-native`.
- **Noto Emoji** is not used as icons.
- Illustrations: none needed. If one is wanted, **unDraw** (unDraw licence: free, no attribution) only, recoloured to our palette. Avoid Wikimedia Commons unless the file's own page says CC0/CC BY and we credit it in the README.
- Write every third-party asset and its licence in README "Credits".

## Sarvam attribution

- Plain text "Powered by Sarvam AI" under the mic button and on the About screen, wherever Sarvam speech/translation is used. Text only, our font, our colours.
- If Ankith wants Sarvam's logo or brand assets: ask the Sarvam team at the venue first, use only what they hand over, follow their rules, and note it in the README. Same for Flagsmith and NudgeBee logos on the README/video: text names unless their team says yes.
- No logos of redBus, IRCTC, KSRTC, Blinkit, Zepto, Swiggy, Flipkart, Zomato, etc. Names in text only.

## Screens (polish only these; they are what judges see)

1. **Speak** (traveller home): greeting from `festival_mode`, language chips, giant marigold mic (hold to talk), "or type" link, "Powered by Sarvam AI".
2. **Trip card + options**: route line, date chip, people, mode; booking links as large text buttons (provider name + "opens official site"); warnings in a kumkum-edged card; "Alert me" diya toggle.
3. **Alerts**: toran header, list of alerts with a play button (voice), new ones glow once.
4. **Partner dashboard**: partner switcher; rows per route+night with a bar (want vs have, kumkum gap), "Add buses" button (mango-leaf); "Seeded demo data" label in the header.
5. **Ops banner** (all screens): thin bar "Offline voice mode: answers are text + saved audio" when `voice_fallback_offline` is on. This is what the room sees during the NudgeBee moment.

Layout: one column on phones; on web (judges' laptop) max width 1100 px, dashboard as two columns. Tap targets >= 48 px.
