# Namma Habba (backup idea, one page)

Copied from hacktober-2026/hackathons/upcoming/festive-hacks.md, section "LOCKED 24 Nov (Ankith): Namma Habba" (finalist #1 then; Prasthan was locked after it). Use this if Ankith chooses to build it himself instead of Prasthan. The Prasthan prompts in codex/ do not cover it.

## Concept
Your festival, done your region's way and your family's way. South Indian, curated per state + region + family tradition (not generic).

## Layers
1. **Roots:** pick roots (state > region > tradition) -> curated guide (steps, samagri, timings, regional specials) in that language.
2. **Ajji layer:** an elder records the family's own variation by voice (Sarvam STT -> steps), merged into the guide, played back in her voice; "aaytu" moves to the next step.
3. **Jothe layer:** festival-morning call to parents alone at home, puja together, warm summary to the kids abroad.

## Sponsors
- **Flagsmith:** region / tradition / language segments decide the flow (deep; the 2nd-prize case) + an offline fallback switch.
- **Sarvam:** Kannada / Tamil / Telugu voice both ways + narration -> steps.
- **NudgeBee:** festival morning must not fail: break it live, NudgeBee finds the cause, Flagsmith flips to offline audio.

## Stage MVP
1 festival (Sankranti or Deepavali), 3 regions (Old Mysuru, North Karnataka, Madurai), 2 languages (Kannada, Tamil), Ajji recording + guided flow; the elder call as a short bonus.

## Risks
- Ritual accuracy: content must be checked by real people; mark anything unverified as "community draft".
- Scope.

## Tonight's prep (notes only, no code)
- Record Ajji/Amma for 2 min.
- Write the 3 regional versions and get them checked.
- Create Flagsmith / NudgeBee / Sarvam accounts + keys.

## Reuse from this repo if switching
- docs/SPONSORS.md (all setup steps and limits), docs/DESIGN.md (palette, motifs), docs/RISKS.md, docs/SUBMISSION.md, docs/K8S-TEMPLATES.md, codex/SESSIONS.md (the coordination method), `.env.example`.
- Flagsmith idea mapping: traits `home_state`, `region`, `tradition`, `language`; flags `festival_mode` (JSON), `guide_variant` per segment, `voice_fallback_offline`, `ajji_layer_enabled` (staged rollout).
- Sankranti 2027 = Fri 15 Jan (verified, seed/festivals.json).
