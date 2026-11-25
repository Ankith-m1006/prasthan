# Contract changelog

- v1: initial contract (types.ts, 10 JSON schemas, examples).
- v2 (25 Nov): TripIntent.parser adds 'sarvam-llm' (Sarvam chat model understood it; old 'llm' still accepted). New optional
  TripIntent.travellingWith ('alone'|'family'|'elders'|'kids'|'friends'|'partner'|null) and GiftAsk.unit (e.g. 'kg', 'box').
  Partner display names no longer carry "Demo"/"(demo)" (ids unchanged).
